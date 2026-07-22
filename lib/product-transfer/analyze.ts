import "server-only";
import { createHash } from "node:crypto";
import ExcelJS from "exceljs";
import JSZip from "jszip";
import type { Prisma } from "@prisma/client";
import { getPrismaClient } from "@/lib/prisma";
import {
  CLEARABLE_FIELDS,
  CLEAR_VALUE,
  PRODUCT_TRANSFER_COLUMNS,
  REQUIRED_NEW_FIELDS,
  type ProductTransferKey,
} from "@/lib/product-transfer/columns";
import type {
  ImportAnalysis,
  ImportAnalysisRow,
  TransferScalar,
  TransferValues,
} from "@/lib/product-transfer/types";
import {
  areImportValuesEquivalent,
  evaluateProductIdentity,
  isValidSpecificationsJson,
  validateImageReference,
  validateZipImageFilename,
  zipContainsFilename,
} from "@/lib/product-transfer/domain";

const MAX_XLSX_BYTES = 20 * 1024 * 1024;
const MAX_ZIP_BYTES = 50 * 1024 * 1024;
const MAX_COMBINED_BYTES = 60 * 1024 * 1024;
const MAX_ROWS = 10_000;
const ignoredImportFields = new Set<ProductTransferKey>([
  "categoryName",
  "updatedAt",
]);
const labels = new Map(
  PRODUCT_TRANSFER_COLUMNS.map(([key, label]) => [key, label]),
);

export class ProductTransferError extends Error {}

function cellValue(cell: ExcelJS.Cell): TransferScalar {
  const value = cell.value;
  if (value == null) return null;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object") {
    if ("result" in value && value.result != null) return String(value.result);
    if ("text" in value && value.text != null) return String(value.text);
    if ("richText" in value)
      return value.richText.map((part) => part.text).join("");
    return String(cell.text ?? "").trim();
  }
  return typeof value === "number" || typeof value === "boolean"
    ? value
    : String(value).trim();
}

function asString(value: TransferScalar | undefined) {
  return value == null ? "" : String(value).trim();
}

function normalizeBoolean(value: TransferScalar) {
  if (value === true || value === false) return value;
  const normalized = asString(value).toLowerCase();
  if (["true", "1", "yes", "نعم"].includes(normalized)) return true;
  if (["false", "0", "no", "لا"].includes(normalized)) return false;
  return value;
}

function normalizeValues(values: TransferValues): TransferValues {
  const normalized = { ...values };
  for (const key of ["price", "stockQuantity", "sortOrder"] as const) {
    const value = normalized[key];
    if (value !== null && value !== "" && value !== CLEAR_VALUE) {
      normalized[key] =
        typeof value === "number"
          ? value
          : Number(String(value).replace(/,/g, ""));
    }
  }
  for (const key of ["featured", "seoIndexable"] as const) {
    if (normalized[key] != null && normalized[key] !== "")
      normalized[key] = normalizeBoolean(normalized[key]);
  }
  if (normalized.availability)
    normalized.availability = asString(normalized.availability)
      .toUpperCase()
      .replace(/-/g, "_");
  return normalized;
}

async function readZipFilenames(zipFile?: File | null) {
  if (!zipFile || zipFile.size === 0) return [];
  if (zipFile.size > MAX_ZIP_BYTES)
    throw new ProductTransferError("ملف ZIP يتجاوز الحد الآمن 50MB.");
  const zip = await JSZip.loadAsync(await zipFile.arrayBuffer());
  return Object.values(zip.files)
    .filter((entry) => !entry.dir)
    .map((entry) => entry.name.split("/").pop() ?? "")
    .filter(Boolean);
}

export async function analyzeProductWorkbook({
  xlsxFile,
  zipFile,
  adminEmail,
}: {
  xlsxFile: File;
  zipFile?: File | null;
  adminEmail: string;
}) {
  if (!xlsxFile.name.toLowerCase().endsWith(".xlsx"))
    throw new ProductTransferError("ارفع ملف XLSX بالقالب الرسمي.");
  if (xlsxFile.size <= 0 || xlsxFile.size > MAX_XLSX_BYTES)
    throw new ProductTransferError("حجم ملف Excel غير صالح أو يتجاوز 20MB.");
  if (xlsxFile.size + (zipFile?.size ?? 0) > MAX_COMBINED_BYTES)
    throw new ProductTransferError(
      "الحجم الإجمالي لملفي Excel وZIP يتجاوز الحد الآمن 60MB.",
    );
  const bytes = Buffer.from(await xlsxFile.arrayBuffer());
  const checksum = createHash("sha256").update(bytes).digest("hex");
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(bytes as unknown as ExcelJS.Buffer);
  const sheet = workbook.getWorksheet("المنتجات");
  if (!sheet) throw new ProductTransferError("ورقة «المنتجات» غير موجودة.");

  const headerToKey = new Map<string, ProductTransferKey>(
    PRODUCT_TRANSFER_COLUMNS.map(([key, label]) => [label, key]),
  );
  const indexes = new Map<ProductTransferKey, number>();
  sheet.getRow(1).eachCell((cell, columnNumber) => {
    const key = headerToKey.get(asString(cellValue(cell)));
    if (key) indexes.set(key, columnNumber);
  });
  const missingColumns = PRODUCT_TRANSFER_COLUMNS.filter(
    ([key]) => !indexes.has(key),
  ).map(([, label]) => label);
  if (missingColumns.length > 0)
    throw new ProductTransferError(
      `أعمدة القالب مفقودة: ${missingColumns.slice(0, 8).join("، ")}`,
    );
  const sourceRows = Math.max(0, sheet.actualRowCount - 1);
  if (sourceRows > MAX_ROWS)
    throw new ProductTransferError(
      `الملف يتجاوز الحد الحالي ${MAX_ROWS.toLocaleString("ar-SA")} صف.`,
    );

  const rawRows: Array<{ rowNumber: number; values: TransferValues }> = [];
  for (let rowNumber = 2; rowNumber <= sheet.actualRowCount; rowNumber += 1) {
    const values: TransferValues = {};
    for (const [key, columnNumber] of indexes)
      values[key] = cellValue(sheet.getCell(rowNumber, columnNumber));
    if (Object.values(values).every((value) => value == null || value === ""))
      continue;
    rawRows.push({ rowNumber, values: normalizeValues(values) });
  }

  const ids = rawRows.map(({ values }) => asString(values.id)).filter(Boolean);
  const skus = rawRows
    .map(({ values }) => asString(values.sku))
    .filter(Boolean);
  const slugs = rawRows
    .map(({ values }) => asString(values.slug))
    .filter(Boolean);
  const [existingProducts, categories, brands, availableZipFilenames] =
    await Promise.all([
      getPrismaClient().product.findMany({
        where: {
          OR: [
            { id: { in: ids } },
            { sku: { in: skus } },
            { slug: { in: slugs } },
          ],
        },
        include: {
          category: { select: { name: true, slug: true } },
          brand: { select: { name: true } },
          specifications: { orderBy: { sortOrder: "asc" } },
          images: { orderBy: { sortOrder: "asc" } },
        },
      }),
      getPrismaClient().category.findMany({
        select: { id: true, slug: true, name: true },
      }),
      getPrismaClient().brand.findMany({ select: { id: true, name: true } }),
      readZipFilenames(zipFile),
    ]);
  const byId = new Map(
    existingProducts.map((product) => [product.id, product]),
  );
  const bySku = new Map(
    existingProducts.map((product) => [product.sku, product]),
  );
  const bySlug = new Map(
    existingProducts.map((product) => [product.slug, product]),
  );
  const categorySlugs = new Set(categories.map((category) => category.slug));
  const brandNames = new Set(brands.map((brand) => brand.name.toLowerCase()));
  const seenSku = new Map<string, number>();
  const seenSlug = new Map<string, number>();

  const rows: ImportAnalysisRow[] = rawRows.map(({ rowNumber, values }) => {
    const id = asString(values.id);
    const sku = asString(values.sku);
    const slug = asString(values.slug);
    const nameAr = asString(values.nameAr);
    const errors: string[] = [];
    const warnings: string[] = [];
    const existing = id ? byId.get(id) : undefined;
    if (sku && seenSku.has(sku))
      errors.push(`SKU مكرر داخل الملف مع الصف ${seenSku.get(sku)}.`);
    if (slug && seenSlug.has(slug))
      errors.push(`Slug مكرر داخل الملف مع الصف ${seenSlug.get(slug)}.`);
    if (sku) seenSku.set(sku, rowNumber);
    if (slug) seenSlug.set(slug, rowNumber);
    if (!existing) {
      for (const field of REQUIRED_NEW_FIELDS) {
        if (!asString(values[field]))
          errors.push(`الحقل «${labels.get(field)}» مطلوب للمنتج الجديد.`);
      }
      if (!asString(values.imageUrl) && !asString(values.imageFilename)) {
        errors.push(
          "المنتج الجديد يحتاج مرجع صورة رئيسية أو اسم صورة موجودة في ZIP.",
        );
      }
    }
    const categorySlug = asString(values.categorySlug);
    const brandName = asString(values.brandName);
    if (categorySlug && !categorySlugs.has(categorySlug))
      errors.push("التصنيف غير موجود؛ لن يُنشأ تلقائيًا.");
    if (brandName && !brandNames.has(brandName.toLowerCase()))
      errors.push("الماركة غير موجودة؛ لن تُنشأ تلقائيًا.");
    if (
      values.availability &&
      !["IN_STOCK", "ON_REQUEST"].includes(asString(values.availability))
    )
      errors.push("قيمة التوفر غير صحيحة.");
    for (const field of ["price", "stockQuantity", "sortOrder"] as const) {
      const value = values[field];
      if (typeof value === "number" && (!Number.isFinite(value) || value < 0))
        errors.push(`قيمة «${labels.get(field)}» غير صحيحة.`);
    }
    if (!isValidSpecificationsJson(values.specifications))
      errors.push("المواصفات يجب أن تكون JSON صالحًا من label وvalue.");
    for (const field of ["imageUrl", "image1", "image2", "image3"] as const) {
      const imageError = validateImageReference(values[field]);
      if (imageError) errors.push(`«${labels.get(field)}»: ${imageError}`);
    }
    const imageFilename = asString(values.imageFilename);
    const zipFilenameError = validateZipImageFilename(imageFilename);
    if (zipFilenameError)
      errors.push(`«${labels.get("imageFilename")}»: ${zipFilenameError}`);
    else if (
      imageFilename &&
      !zipContainsFilename(availableZipFilenames, imageFilename)
    )
      warnings.push(
        "صورة ZIP غير موجودة في الأرشيف المرفوع؛ يجب إعادة إرفاقها عند التأكيد.",
      );

    const skuOwner = sku ? bySku.get(sku) : undefined;
    const slugOwner = slug ? bySlug.get(slug) : undefined;
    const identity = evaluateProductIdentity({
      productId: id,
      existingProductId: existing?.id,
      skuOwnerId: skuOwner?.id,
      slugOwnerId: slugOwner?.id,
    });
    errors.push(...identity.errors);
    const changes = existing ? compareExistingProduct(existing, values) : [];
    const duplicate = identity.duplicate;
    return {
      rowNumber,
      status: errors.length
        ? duplicate
          ? "DUPLICATE"
          : "ERROR"
        : existing
          ? changes.length
            ? "UPDATE"
            : "UNCHANGED"
          : "NEW",
      productId: existing?.id ?? null,
      sku,
      nameAr,
      values,
      changes,
      errors,
      warnings,
    };
  });
  const analysis: ImportAnalysis = { version: 1, rows, availableZipFilenames };
  const counts = {
    sourceRows: rows.length,
    newCount: rows.filter((row) => row.status === "NEW").length,
    updateCount: rows.filter((row) => row.status === "UPDATE").length,
    unchangedCount: rows.filter((row) => row.status === "UNCHANGED").length,
    errorCount: rows.filter((row) => row.status === "ERROR").length,
    duplicateCount: rows.filter((row) => row.status === "DUPLICATE").length,
    missingImageCount: rows.filter((row) =>
      row.warnings.some((warning) => warning.includes("ZIP")),
    ).length,
  };
  const run = await getPrismaClient().productImportRun.create({
    data: {
      fileName: xlsxFile.name.slice(0, 255),
      checksum,
      adminEmail,
      ...counts,
      analysis,
      status: "ANALYZED",
    },
  });
  return run.id;
}

type ComparableProduct = Prisma.ProductGetPayload<{
  include: {
    category: { select: { name: true; slug: true } };
    brand: { select: { name: true } };
    specifications: true;
    images: true;
  };
}>;

function compareExistingProduct(
  product: ComparableProduct,
  values: TransferValues,
) {
  const additionalImages = product.images
    .filter((image) => !image.isPrimary && image.path !== product.image)
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .map((image) => image.path);
  const current: TransferValues = {
    sku: product.sku,
    nameAr: product.nameAr,
    nameEn: product.nameEn,
    slug: product.slug,
    price: product.price?.toNumber() ?? null,
    stockQuantity: product.stockQuantity,
    availability: product.availability,
    categorySlug: product.category.slug,
    brandName: product.brand.name,
    subcategorySlug: product.subcategorySlug,
    model: product.model,
    origin: product.origin,
    shortDescription: product.shortDescription,
    description: product.description,
    leadTime: product.leadTime,
    warranty: product.warranty,
    imageUrl: product.image,
    image1: additionalImages[0] ?? null,
    image2: additionalImages[1] ?? null,
    image3: additionalImages[2] ?? null,
    features: product.features.join(" | "),
    uses: product.uses.join(" | "),
    specifications: JSON.stringify(
      product.specifications.map(
        ({ label, value }: { label: string; value: string }) => ({
          label,
          value,
        }),
      ),
    ),
    technicalFile: product.technicalFile,
    badge: product.badge,
    featured: product.featured,
    sortOrder: product.sortOrder,
    seoTitle: product.seoTitle,
    seoDescription: product.seoDescription,
    canonicalUrl: product.canonicalUrl,
    seoIndexable: product.seoIndexable,
    ogTitle: product.ogTitle,
    ogDescription: product.ogDescription,
    ogImage: product.ogImage,
    seoImageAlt: product.seoImageAlt,
  };
  return PRODUCT_TRANSFER_COLUMNS.flatMap(([field, label]) => {
    if (
      ignoredImportFields.has(field) ||
      ["id", "imageFilename", "sourceCreatedAt"].includes(field)
    )
      return [];
    const incoming = values[field];
    if (incoming == null || incoming === "") return [];
    const after =
      incoming === CLEAR_VALUE && CLEARABLE_FIELDS.has(field) ? null : incoming;
    const before = current[field] ?? null;
    return areImportValuesEquivalent(before, after)
      ? []
      : [{ field, label, before, after }];
  });
}
