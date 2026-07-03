import "server-only";
import { getAdminDatabaseConfigurationIssue } from "@/lib/admin/catalog-admin";
import { getPrismaClient } from "@/lib/prisma";
import { ImageStorageError } from "@/lib/storage/local-storage-adapter";
import { getStorageAdapter } from "@/lib/storage";
import {
  MAX_IMAGES_PER_UPLOAD,
  type StoredImage,
} from "@/lib/storage/storage-adapter";

export type AdminMediaRecord = {
  id: string;
  productId: string;
  productName: string;
  productSlug: string;
  path: string;
  altText: string;
  isPrimary: boolean;
  sortOrder: number;
  sizeBytes: number | null;
};

const connectionMessage =
  "تعذر الاتصال بقاعدة PostgreSQL. تُعرض الصور الحالية للقراءة فقط حتى استعادة الاتصال.";

export async function getAdminProductMedia(productId: string) {
  const configurationIssue = getAdminDatabaseConfigurationIssue();
  if (configurationIssue) {
    return {
      records: [] as AdminMediaRecord[],
      readOnly: true,
      message: configurationIssue,
    };
  }

  try {
    const product = await getPrismaClient().product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        nameAr: true,
        slug: true,
        images: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] },
      },
    });
    if (!product) throw new Error("PRODUCT_NOT_FOUND");
    return {
      records: product.images.map((image) => ({
        id: image.id,
        productId: product.id,
        productName: product.nameAr,
        productSlug: product.slug,
        path: image.path,
        altText: image.altText,
        isPrimary: image.isPrimary,
        sortOrder: image.sortOrder,
        sizeBytes: image.sizeBytes,
      })),
      readOnly: false,
      message: null,
    };
  } catch (error) {
    if (error instanceof Error && error.message === "PRODUCT_NOT_FOUND") {
      throw error;
    }
    return {
      records: [] as AdminMediaRecord[],
      readOnly: true,
      message: connectionMessage,
    };
  }
}

export async function getAdminMedia(query = "") {
  const configurationIssue = getAdminDatabaseConfigurationIssue();
  if (configurationIssue) {
    return {
      records: [] as AdminMediaRecord[],
      readOnly: true,
      message: configurationIssue,
    };
  }

  try {
    const records = await getPrismaClient().productImage.findMany({
      where: query
        ? {
            OR: [
              { path: { contains: query, mode: "insensitive" } },
              { altText: { contains: query, mode: "insensitive" } },
              {
                product: {
                  nameAr: { contains: query, mode: "insensitive" },
                },
              },
              {
                product: { sku: { contains: query, mode: "insensitive" } },
              },
            ],
          }
        : undefined,
      select: {
        id: true,
        productId: true,
        path: true,
        altText: true,
        isPrimary: true,
        sortOrder: true,
        sizeBytes: true,
        product: { select: { nameAr: true, slug: true } },
      },
      orderBy: [
        { product: { nameAr: "asc" } },
        { sortOrder: "asc" },
        { createdAt: "asc" },
      ],
    });
    return {
      records: records.map((image) => ({
        id: image.id,
        productId: image.productId,
        productName: image.product.nameAr,
        productSlug: image.product.slug,
        path: image.path,
        altText: image.altText,
        isPrimary: image.isPrimary,
        sortOrder: image.sortOrder,
        sizeBytes: image.sizeBytes,
      })),
      readOnly: false,
      message: null,
    };
  } catch {
    return {
      records: [] as AdminMediaRecord[],
      readOnly: true,
      message: connectionMessage,
    };
  }
}

function validateArabicAltText(value: string) {
  const altText = value.trim();
  if (!altText || !/[\u0621-\u064A]/.test(altText)) {
    throw new Error("ALT_TEXT_ARABIC_REQUIRED");
  }
  return altText.slice(0, 180);
}

export async function uploadProductImages({
  productId,
  files,
  altTexts,
  makeFirstPrimary,
}: {
  productId: string;
  files: File[];
  altTexts: string[];
  makeFirstPrimary: boolean;
}) {
  if (getAdminDatabaseConfigurationIssue()) throw new Error("READ_ONLY");
  if (files.length === 0 || files.length > MAX_IMAGES_PER_UPLOAD) {
    throw new Error("INVALID_FILE_COUNT");
  }
  const normalizedAlts = files.map((_, index) =>
    validateArabicAltText(altTexts[index] ?? ""),
  );
  const product = await getPrismaClient().product.findUnique({
    where: { id: productId },
    select: { id: true },
  });
  if (!product) throw new Error("PRODUCT_NOT_FOUND");

  const storage = getStorageAdapter();
  const stored: StoredImage[] = [];
  try {
    for (const file of files) {
      stored.push(await storage.saveImage(file));
    }
    const [count, maximum] = await Promise.all([
      getPrismaClient().productImage.count({ where: { productId } }),
      getPrismaClient().productImage.aggregate({
        where: { productId },
        _max: { sortOrder: true },
      }),
    ]);
    const primaryIndex = makeFirstPrimary || count === 0 ? 0 : -1;
    await getPrismaClient().$transaction(async (transaction) => {
      if (primaryIndex === 0) {
        await transaction.productImage.updateMany({
          where: { productId },
          data: { isPrimary: false },
        });
      }
      for (const [index, image] of stored.entries()) {
        await transaction.productImage.create({
          data: {
            productId,
            path: image.path,
            altText: normalizedAlts[index],
            isPrimary: index === primaryIndex,
            sortOrder: (maximum._max.sortOrder ?? -1) + index + 1,
            mimeType: image.mimeType,
            width: image.width,
            height: image.height,
            sizeBytes: image.sizeBytes,
          },
        });
      }
      if (primaryIndex === 0) {
        await transaction.product.update({
          where: { id: productId },
          data: { image: stored[0].path },
        });
      }
    });
  } catch (error) {
    await Promise.all(stored.map((image) => storage.deleteFile(image.path)));
    if (error instanceof ImageStorageError) throw error;
    throw error;
  }
}

export async function updateProductImageAlt(imageId: string, altText: string) {
  if (getAdminDatabaseConfigurationIssue()) throw new Error("READ_ONLY");
  return getPrismaClient().productImage.update({
    where: { id: imageId },
    data: { altText: validateArabicAltText(altText) },
  });
}

export async function setPrimaryProductImage(imageId: string) {
  if (getAdminDatabaseConfigurationIssue()) throw new Error("READ_ONLY");
  const image = await getPrismaClient().productImage.findUnique({
    where: { id: imageId },
  });
  if (!image) throw new Error("IMAGE_NOT_FOUND");
  await getPrismaClient().$transaction([
    getPrismaClient().productImage.updateMany({
      where: { productId: image.productId },
      data: { isPrimary: false },
    }),
    getPrismaClient().productImage.update({
      where: { id: image.id },
      data: { isPrimary: true },
    }),
    getPrismaClient().product.update({
      where: { id: image.productId },
      data: { image: image.path },
    }),
  ]);
}

export async function moveProductImage(
  imageId: string,
  direction: "up" | "down",
) {
  if (getAdminDatabaseConfigurationIssue()) throw new Error("READ_ONLY");
  const image = await getPrismaClient().productImage.findUnique({
    where: { id: imageId },
  });
  if (!image) throw new Error("IMAGE_NOT_FOUND");
  const neighbor = await getPrismaClient().productImage.findFirst({
    where: {
      productId: image.productId,
      sortOrder:
        direction === "up" ? { lt: image.sortOrder } : { gt: image.sortOrder },
    },
    orderBy: { sortOrder: direction === "up" ? "desc" : "asc" },
  });
  if (!neighbor) return;
  await getPrismaClient().$transaction([
    getPrismaClient().productImage.update({
      where: { id: image.id },
      data: { sortOrder: neighbor.sortOrder },
    }),
    getPrismaClient().productImage.update({
      where: { id: neighbor.id },
      data: { sortOrder: image.sortOrder },
    }),
  ]);
}

export async function deleteProductImage(imageId: string, confirmed: boolean) {
  if (getAdminDatabaseConfigurationIssue()) throw new Error("READ_ONLY");
  if (!confirmed) throw new Error("DELETE_CONFIRMATION_REQUIRED");
  const image = await getPrismaClient().productImage.findUnique({
    where: { id: imageId },
    select: {
      id: true,
      productId: true,
      path: true,
      isPrimary: true,
      product: { select: { category: { select: { image: true } } } },
    },
  });
  if (!image) throw new Error("IMAGE_NOT_FOUND");
  const replacement = image.isPrimary
    ? await getPrismaClient().productImage.findFirst({
        where: { productId: image.productId, id: { not: image.id } },
        select: { id: true, path: true },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      })
    : null;

  await getPrismaClient().$transaction(async (transaction) => {
    await transaction.productImage.delete({ where: { id: image.id } });
    if (image.isPrimary) {
      if (replacement) {
        await transaction.productImage.update({
          where: { id: replacement.id },
          data: { isPrimary: true },
        });
      }
      await transaction.product.update({
        where: { id: image.productId },
        data: {
          image: replacement?.path ?? image.product.category.image,
        },
      });
    }
  });

  const [imageReferences, productReferences] = await Promise.all([
    getPrismaClient().productImage.count({ where: { path: image.path } }),
    getPrismaClient().product.count({ where: { image: image.path } }),
  ]);
  if (imageReferences === 0 && productReferences === 0) {
    await getStorageAdapter().deleteFile(image.path);
  }
}
