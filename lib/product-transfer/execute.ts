import "server-only";
import { isIP } from "node:net";
import { resolve4, resolve6 } from "node:dns/promises";
import path from "node:path";
import { ProductAvailability, type Prisma } from "@prisma/client";
import JSZip from "jszip";
import { getPrismaClient } from "@/lib/prisma";
import { getStorageAdapter } from "@/lib/storage";
import { MAX_IMAGE_SIZE_BYTES } from "@/lib/storage/storage-adapter";
import {
  CLEARABLE_FIELDS,
  CLEAR_VALUE,
  type ProductTransferKey,
} from "@/lib/product-transfer/columns";
import {
  validateImageReference,
  validateZipImageFilename,
} from "@/lib/product-transfer/domain";
import type {
  ImportAnalysis,
  ImportAnalysisRow,
  TransferScalar,
  TransferValues,
} from "@/lib/product-transfer/types";

const BATCH_SIZE = 50;
const MAX_ZIP_BYTES = 50 * 1024 * 1024;

type SnapshotRecord = {
  productId: string;
  created: boolean;
  before: SerializedProductSnapshot | null;
  postUpdatedAt: string;
};

type ProductWithSnapshotRelations = Prisma.ProductGetPayload<{
  include: { specifications: true; images: true };
}>;

type SerializedProductSnapshot = Omit<
  ProductWithSnapshotRelations,
  | "price"
  | "sourceCreatedAt"
  | "createdAt"
  | "updatedAt"
  | "specifications"
  | "images"
> & {
  price: string | null;
  sourceCreatedAt: string;
  createdAt: string;
  updatedAt: string;
  specifications: ProductWithSnapshotRelations["specifications"];
  images: Array<
    Omit<ProductWithSnapshotRelations["images"][number], "createdAt"> & {
      createdAt: string;
    }
  >;
};

export async function executeImportRun({
  runId,
  zipFile,
  adminEmail,
}: {
  runId: string;
  zipFile?: File | null;
  adminEmail: string;
}) {
  const run = await getPrismaClient().productImportRun.findUnique({
    where: { id: runId },
  });
  if (!run || run.adminEmail !== adminEmail)
    throw new Error("IMPORT_RUN_NOT_FOUND");
  if (run.status !== "ANALYZED") throw new Error("IMPORT_ALREADY_PROCESSED");
  if (run.errorCount > 0 || run.duplicateCount > 0)
    throw new Error("IMPORT_HAS_ERRORS");
  const analysis = run.analysis as unknown as ImportAnalysis;
  const actionable = analysis.rows.filter(
    (row) => row.status === "NEW" || row.status === "UPDATE",
  );
  const zip = await readZip(zipFile);
  const snapshots: SnapshotRecord[] = [];
  let applied = 0;

  await getPrismaClient().productImportRun.update({
    where: { id: runId },
    data: { status: "RUNNING", startedAt: new Date() },
  });
  try {
    for (let index = 0; index < actionable.length; index += BATCH_SIZE) {
      const batchRows = actionable.slice(index, index + BATCH_SIZE);
      const batch: Array<{ row: ImportAnalysisRow; values: TransferValues }> =
        [];
      for (const row of batchRows)
        batch.push({ row, values: await prepareImages(row.values, zip) });
      const nextApplied = applied + batch.length;
      await getPrismaClient().$transaction(
        async (transaction) => {
          const categories = await transaction.category.findMany({
            select: { id: true, slug: true },
          });
          const brands = await transaction.brand.findMany({
            select: { id: true, name: true },
          });
          const categoryBySlug = new Map(
            categories.map((item) => [item.slug, item.id]),
          );
          const brandByName = new Map(
            brands.map((item) => [item.name.toLowerCase(), item.id]),
          );
          for (const item of batch) {
            if (item.row.status === "UPDATE" && item.row.productId) {
              const before = await transaction.product.findUnique({
                where: { id: item.row.productId },
                include: { specifications: true, images: true },
              });
              if (!before)
                throw new Error(`PRODUCT_NOT_FOUND:${item.row.productId}`);
              const updated = await updateExistingProduct(
                transaction,
                before.id,
                item.values,
                categoryBySlug,
                brandByName,
              );
              snapshots.push({
                productId: before.id,
                created: false,
                before: serializeProduct(before),
                postUpdatedAt: updated.updatedAt.toISOString(),
              });
            } else {
              const created = await createNewProduct(
                transaction,
                item.values,
                categoryBySlug,
                brandByName,
              );
              snapshots.push({
                productId: created.id,
                created: true,
                before: null,
                postUpdatedAt: created.updatedAt.toISOString(),
              });
            }
          }
          await transaction.productImportRun.update({
            where: { id: runId },
            data: {
              snapshot: snapshots as unknown as Prisma.InputJsonValue,
              result: { applied: nextApplied, total: actionable.length },
            },
          });
        },
        { maxWait: 15_000, timeout: 30_000 },
      );
      applied = nextApplied;
    }
    await getPrismaClient().productImportRun.update({
      where: { id: runId },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        result: { applied, total: actionable.length },
      },
    });
  } catch (error) {
    await getPrismaClient().productImportRun.update({
      where: { id: runId },
      data: {
        status: applied > 0 ? "PARTIAL" : "FAILED",
        completedAt: new Date(),
        result: {
          applied,
          total: actionable.length,
          error:
            error instanceof Error ? error.message.slice(0, 500) : "UNKNOWN",
        },
      },
    });
    throw error;
  }
}

async function updateExistingProduct(
  transaction: Prisma.TransactionClient,
  productId: string,
  values: TransferValues,
  categoryBySlug: Map<string, string>,
  brandByName: Map<string, string>,
) {
  const data: Prisma.ProductUpdateInput = {};
  for (const key of scalarKeys) {
    const value = values[key];
    if (value == null || value === "") continue;
    const cleared = value === CLEAR_VALUE && CLEARABLE_FIELDS.has(key);
    if (key === "price")
      Object.assign(data, { price: cleared ? null : Number(value) });
    else if (key === "stockQuantity" || key === "sortOrder")
      Object.assign(data, { [key]: Number(value) });
    else if (key === "featured" || key === "seoIndexable")
      Object.assign(data, { [key]: Boolean(value) });
    else Object.assign(data, { [key]: cleared ? null : String(value) });
  }
  if (values.categorySlug)
    data.category = {
      connect: {
        id: requiredMap(
          categoryBySlug,
          String(values.categorySlug),
          "CATEGORY",
        ),
      },
    };
  if (values.brandName)
    data.brand = {
      connect: {
        id: requiredMap(
          brandByName,
          String(values.brandName).toLowerCase(),
          "BRAND",
        ),
      },
    };
  if (values.availability)
    data.availability = String(values.availability) as ProductAvailability;
  if (values.features) data.features = splitList(values.features);
  if (values.uses) data.uses = splitList(values.uses);
  const specifications = parseSpecifications(values.specifications);
  if (specifications)
    data.specifications = {
      deleteMany: {},
      create: specifications.map((item, index) => ({
        ...item,
        sortOrder: index,
      })),
    };
  if (values.imageUrl) data.image = String(values.imageUrl);
  const extraImages = uniqueImageValues([
    values.image1,
    values.image2,
    values.image3,
  ]);
  const updated = await transaction.product.update({
    where: { id: productId },
    data,
    select: { id: true, updatedAt: true, nameAr: true },
  });
  if (values.imageUrl) {
    const imagePath = String(values.imageUrl);
    await transaction.productImage.updateMany({
      where: { productId, isPrimary: true },
      data: { isPrimary: false },
    });
    await transaction.productImage.upsert({
      where: { productId_path: { productId, path: imagePath } },
      update: {
        isPrimary: true,
        sortOrder: 0,
        mimeType: imageMimeType(imagePath),
      },
      create: {
        productId,
        path: imagePath,
        altText: `صورة المنتج ${updated.nameAr}`,
        isPrimary: true,
        sortOrder: 0,
        mimeType: imageMimeType(imagePath),
      },
    });
  }
  if (extraImages.length) {
    await transaction.productImage.createMany({
      data: extraImages.map((imagePath, index) => ({
        productId,
        path: imagePath,
        altText: `صورة إضافية ${index + 1}`,
        sortOrder: 100 + index,
        mimeType: imageMimeType(imagePath),
      })),
      skipDuplicates: true,
    });
  }
  return updated;
}

async function createNewProduct(
  transaction: Prisma.TransactionClient,
  values: TransferValues,
  categoryBySlug: Map<string, string>,
  brandByName: Map<string, string>,
) {
  const image = String(values.imageUrl);
  const specifications = parseSpecifications(values.specifications) ?? [];
  const extraImages = uniqueImageValues([
    values.image1,
    values.image2,
    values.image3,
  ]).filter((item) => item !== image);
  return transaction.product.create({
    data: {
      sku: String(values.sku),
      nameAr: String(values.nameAr),
      nameEn: String(values.nameEn),
      slug: String(values.slug),
      price: numberOrNull(values.price),
      stockQuantity: Number(values.stockQuantity ?? 0),
      availability: (values.availability
        ? String(values.availability)
        : "ON_REQUEST") as ProductAvailability,
      categoryId: requiredMap(
        categoryBySlug,
        String(values.categorySlug),
        "CATEGORY",
      ),
      brandId: requiredMap(
        brandByName,
        String(values.brandName).toLowerCase(),
        "BRAND",
      ),
      subcategorySlug: String(values.subcategorySlug),
      model: String(values.model),
      origin: String(values.origin),
      shortDescription: String(values.shortDescription),
      description: String(values.description),
      leadTime: String(values.leadTime),
      warranty: String(values.warranty),
      image,
      features: splitList(values.features),
      uses: splitList(values.uses),
      technicalFile: optionalValue(values.technicalFile),
      badge: optionalValue(values.badge),
      featured: Boolean(values.featured ?? false),
      sortOrder: Number(values.sortOrder ?? 0),
      seoTitle: optionalValue(values.seoTitle),
      seoDescription: optionalValue(values.seoDescription),
      canonicalUrl: optionalValue(values.canonicalUrl),
      seoIndexable:
        values.seoIndexable == null ? true : Boolean(values.seoIndexable),
      ogTitle: optionalValue(values.ogTitle),
      ogDescription: optionalValue(values.ogDescription),
      ogImage: optionalValue(values.ogImage),
      seoImageAlt: optionalValue(values.seoImageAlt),
      sourceCreatedAt: values.sourceCreatedAt
        ? new Date(String(values.sourceCreatedAt))
        : new Date(),
      specifications: {
        create: specifications.map((item, index) => ({
          ...item,
          sortOrder: index,
        })),
      },
      images: {
        create: [
          {
            path: image,
            altText: `صورة المنتج ${String(values.nameAr)}`,
            isPrimary: true,
            sortOrder: 0,
            mimeType: imageMimeType(image),
          },
          ...extraImages.map((item, index) => ({
            path: item,
            altText: `صورة إضافية ${index + 1}`,
            isPrimary: false,
            sortOrder: index + 1,
            mimeType: imageMimeType(item),
          })),
        ],
      },
    },
    select: { id: true, updatedAt: true },
  });
}

const scalarKeys: ProductTransferKey[] = [
  "sku",
  "nameAr",
  "nameEn",
  "slug",
  "price",
  "stockQuantity",
  "subcategorySlug",
  "model",
  "origin",
  "shortDescription",
  "description",
  "leadTime",
  "warranty",
  "technicalFile",
  "badge",
  "featured",
  "sortOrder",
  "seoTitle",
  "seoDescription",
  "canonicalUrl",
  "seoIndexable",
  "ogTitle",
  "ogDescription",
  "ogImage",
  "seoImageAlt",
];

function requiredMap(map: Map<string, string>, key: string, label: string) {
  const value = map.get(key);
  if (!value) throw new Error(`${label}_NOT_FOUND:${key}`);
  return value;
}
function splitList(value: TransferScalar | undefined) {
  return value == null || value === ""
    ? []
    : String(value)
        .split("|")
        .map((item) => item.trim())
        .filter(Boolean);
}
function optionalValue(value: TransferScalar | undefined) {
  return value == null || value === "" || value === CLEAR_VALUE
    ? null
    : String(value);
}
function numberOrNull(value: TransferScalar | undefined) {
  return value == null || value === "" || value === CLEAR_VALUE
    ? null
    : Number(value);
}
function parseSpecifications(
  value: TransferScalar | undefined,
): Array<{ label: string; value: string }> | null {
  if (value == null || value === "") return null;
  if (value === CLEAR_VALUE) return [];
  return JSON.parse(String(value));
}
function imageMimeType(value: string) {
  const extension = path.extname(value).toLowerCase();
  return extension === ".png"
    ? "image/png"
    : extension === ".webp"
      ? "image/webp"
      : "image/jpeg";
}
function uniqueImageValues(values: Array<TransferScalar | undefined>) {
  return [
    ...new Set(
      values
        .filter(
          (value): value is string =>
            typeof value === "string" && value.trim().length > 0,
        )
        .map((value) => value.trim()),
    ),
  ];
}

async function readZip(file?: File | null) {
  if (!file || file.size === 0) return null;
  if (file.size > MAX_ZIP_BYTES) throw new Error("ZIP_TOO_LARGE");
  return JSZip.loadAsync(await file.arrayBuffer());
}

async function prepareImages(values: TransferValues, zip: JSZip | null) {
  const prepared = { ...values };
  for (const key of ["imageUrl", "image1", "image2", "image3"] as const) {
    const imageError = validateImageReference(values[key]);
    if (imageError) throw new Error(`IMAGE_REFERENCE_INVALID:${key}`);
  }
  const zipFilenameError = validateZipImageFilename(values.imageFilename);
  if (zipFilenameError) throw new Error("ZIP_IMAGE_FILENAME_INVALID");
  const zipFilename = values.imageFilename
    ? path.basename(String(values.imageFilename))
    : "";
  if (zipFilename) {
    if (!zip) throw new Error(`ZIP_REQUIRED:${zipFilename}`);
    const entry = Object.values(zip.files).find(
      (item) =>
        !item.dir &&
        path.basename(item.name).toLowerCase() === zipFilename.toLowerCase(),
    );
    if (!entry) throw new Error(`ZIP_IMAGE_MISSING:${zipFilename}`);
    const bytes = await entry.async("uint8array");
    if (bytes.byteLength > MAX_IMAGE_SIZE_BYTES)
      throw new Error(`IMAGE_TOO_LARGE:${zipFilename}`);
    prepared.imageUrl = await storeImage(
      bytes,
      zipFilename,
      imageMimeType(zipFilename),
    );
  } else if (
    typeof values.imageUrl === "string" &&
    /^https:\/\//i.test(values.imageUrl)
  ) {
    prepared.imageUrl = await downloadRemoteImage(values.imageUrl);
  }
  for (const key of ["image1", "image2", "image3"] as const) {
    const value = values[key];
    if (typeof value === "string" && /^https:\/\//i.test(value))
      prepared[key] = await downloadRemoteImage(value);
  }
  return prepared;
}

async function downloadRemoteImage(reference: string) {
  const url = new URL(reference);
  if (url.protocol !== "https:") throw new Error("IMAGE_URL_MUST_BE_HTTPS");
  if (url.username || url.password || (url.port && url.port !== "443"))
    throw new Error("IMAGE_URL_INVALID");
  await assertPublicHost(url.hostname);
  const response = await fetch(url, {
    redirect: "error",
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error("IMAGE_DOWNLOAD_FAILED");
  const contentType = response.headers.get("content-type")?.split(";")[0] ?? "";
  if (!new Set(["image/jpeg", "image/png", "image/webp"]).has(contentType))
    throw new Error("IMAGE_TYPE_INVALID");
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.byteLength > MAX_IMAGE_SIZE_BYTES)
    throw new Error("IMAGE_TOO_LARGE");
  return storeImage(
    bytes,
    path.basename(url.pathname) || "remote-image",
    contentType,
  );
}

async function storeImage(bytes: Uint8Array, name: string, type: string) {
  const file = new File([bytes as BlobPart], name, { type });
  return (await getStorageAdapter().saveImage(file)).path;
}

async function assertPublicHost(hostname: string) {
  if (hostname === "localhost" || hostname.endsWith(".local"))
    throw new Error("IMAGE_HOST_BLOCKED");
  const addresses = isIP(hostname)
    ? [hostname]
    : [
        ...(await resolve4(hostname).catch(() => [])),
        ...(await resolve6(hostname).catch(() => [])),
      ];
  if (!addresses.length || addresses.some(isPrivateAddress))
    throw new Error("IMAGE_HOST_BLOCKED");
}

function isPrivateAddress(address: string) {
  return (
    /^(127\.|10\.|192\.168\.|169\.254\.|0\.|::1$|::ffff:(127\.|10\.|192\.168\.|169\.254\.)|fc|fd|fe80)/i.test(
      address,
    ) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(address) ||
    /^::ffff:172\.(1[6-9]|2\d|3[01])\./i.test(address)
  );
}

function serializeProduct(
  product: ProductWithSnapshotRelations,
): SerializedProductSnapshot {
  return {
    ...product,
    price: product.price?.toString() ?? null,
    sourceCreatedAt: product.sourceCreatedAt.toISOString(),
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
    images: product.images.map((image) => ({
      ...image,
      createdAt: image.createdAt.toISOString(),
    })),
  };
}

export async function rollbackImportRun(runId: string, adminEmail: string) {
  const run = await getPrismaClient().productImportRun.findUnique({
    where: { id: runId },
  });
  if (
    !run ||
    run.adminEmail !== adminEmail ||
    !["COMPLETED", "PARTIAL"].includes(run.status) ||
    run.rolledBackAt
  )
    throw new Error("ROLLBACK_NOT_AVAILABLE");
  const snapshots = (run.snapshot ?? []) as unknown as SnapshotRecord[];
  const conflicts: string[] = [];
  for (const batchStart of Array.from(
    { length: Math.ceil(snapshots.length / BATCH_SIZE) },
    (_, index) => index * BATCH_SIZE,
  )) {
    const batch = snapshots.slice(batchStart, batchStart + BATCH_SIZE);
    await getPrismaClient().$transaction(
      async (transaction) => {
        for (const snapshot of batch) {
          const current = await transaction.product.findUnique({
            where: { id: snapshot.productId },
            include: {
              _count: {
                select: {
                  quoteItems: true,
                  orderItems: true,
                  wishlistItems: true,
                  cartItems: true,
                  activityLinks: true,
                },
              },
            },
          });
          if (
            !current ||
            current.updatedAt.toISOString() !== snapshot.postUpdatedAt
          ) {
            conflicts.push(snapshot.productId);
            continue;
          }
          if (snapshot.created) {
            const related = Object.values(current._count).some(
              (count) => count > 0,
            );
            if (related) {
              conflicts.push(snapshot.productId);
              continue;
            }
            const deleted = await transaction.product.deleteMany({
              where: {
                id: snapshot.productId,
                updatedAt: new Date(snapshot.postUpdatedAt),
                quoteItems: { none: {} },
                orderItems: { none: {} },
                wishlistItems: { none: {} },
                cartItems: { none: {} },
                activityLinks: { none: {} },
              },
            });
            if (deleted.count !== 1) conflicts.push(snapshot.productId);
          } else if (snapshot.before) {
            const claimed = await transaction.product.updateMany({
              where: {
                id: snapshot.productId,
                updatedAt: new Date(snapshot.postUpdatedAt),
              },
              data: { updatedAt: new Date() },
            });
            if (claimed.count !== 1) {
              conflicts.push(snapshot.productId);
              continue;
            }
            await restoreProduct(
              transaction,
              snapshot.productId,
              snapshot.before,
            );
          }
        }
      },
      { maxWait: 15_000, timeout: 30_000 },
    );
  }
  await getPrismaClient().productImportRun.update({
    where: { id: runId },
    data: {
      status: conflicts.length ? "ROLLBACK_PARTIAL" : "ROLLED_BACK",
      rolledBackAt: new Date(),
      result: { conflicts },
    },
  });
  return conflicts;
}

async function restoreProduct(
  transaction: Prisma.TransactionClient,
  productId: string,
  snapshot: SerializedProductSnapshot,
) {
  await transaction.product.update({
    where: { id: productId },
    data: {
      sku: snapshot.sku,
      nameAr: snapshot.nameAr,
      nameEn: snapshot.nameEn,
      slug: snapshot.slug,
      model: snapshot.model,
      subcategorySlug: snapshot.subcategorySlug,
      origin: snapshot.origin,
      shortDescription: snapshot.shortDescription,
      description: snapshot.description,
      price: snapshot.price,
      stockQuantity: snapshot.stockQuantity,
      availability: snapshot.availability,
      leadTime: snapshot.leadTime,
      warranty: snapshot.warranty,
      image: snapshot.image,
      badge: snapshot.badge,
      featured: snapshot.featured,
      sourceCreatedAt: new Date(snapshot.sourceCreatedAt),
      sortOrder: snapshot.sortOrder,
      features: snapshot.features,
      uses: snapshot.uses,
      technicalFile: snapshot.technicalFile,
      seoTitle: snapshot.seoTitle,
      seoDescription: snapshot.seoDescription,
      canonicalUrl: snapshot.canonicalUrl,
      seoIndexable: snapshot.seoIndexable,
      ogTitle: snapshot.ogTitle,
      ogDescription: snapshot.ogDescription,
      ogImage: snapshot.ogImage,
      seoImageAlt: snapshot.seoImageAlt,
      category: { connect: { id: snapshot.categoryId } },
      brand: { connect: { id: snapshot.brandId } },
      specifications: {
        deleteMany: {},
        create: snapshot.specifications.map((item) => ({
          label: item.label,
          value: item.value,
          sortOrder: item.sortOrder,
        })),
      },
      images: {
        deleteMany: {},
        create: snapshot.images.map((item) => ({
          path: item.path,
          altText: item.altText,
          isPrimary: item.isPrimary,
          sortOrder: item.sortOrder,
          mimeType: item.mimeType,
          width: item.width,
          height: item.height,
          sizeBytes: item.sizeBytes,
          createdAt: new Date(item.createdAt),
        })),
      },
    },
  });
}
