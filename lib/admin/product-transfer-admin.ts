import "server-only";
import type { Prisma } from "@prisma/client";
import { getPrismaClient } from "@/lib/prisma";
import { PRODUCT_TRANSFER_COLUMNS } from "@/lib/product-transfer/columns";
import type {
  ImportAnalysis,
  ImportAnalysisRow,
  TransferValues,
} from "@/lib/product-transfer/types";
import { calculateBulkPrice } from "@/lib/product-transfer/domain";

export async function getProductTransferCenter(runId?: string) {
  const [categories, brands, products, transferData] = await Promise.all([
    getPrismaClient().category.findMany({
      select: { id: true, name: true, slug: true },
      orderBy: { sortOrder: "asc" },
    }),
    getPrismaClient().brand.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    getPrismaClient().product.findMany({
      select: {
        id: true,
        nameAr: true,
        sku: true,
        price: true,
        stockQuantity: true,
        availability: true,
        category: { select: { name: true } },
        brand: { select: { name: true } },
      },
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
      take: 2000,
    }),
    Promise.all([
      getPrismaClient().productImportRun.findMany({
        orderBy: { createdAt: "desc" },
        take: 30,
      }),
      runId
        ? getPrismaClient().productImportRun.findUnique({
            where: { id: runId },
          })
        : null,
    ])
      .then(([history, selectedRun]) => ({
        history,
        selectedRun,
        migrationReady: true,
      }))
      .catch((error: unknown) => {
        if (
          typeof error === "object" &&
          error &&
          "code" in error &&
          error.code === "P2021"
        ) {
          return { history: [], selectedRun: null, migrationReady: false };
        }
        throw error;
      }),
  ]);
  return {
    categories,
    brands,
    products: products.map((product) => ({
      ...product,
      price: product.price?.toNumber() ?? null,
    })),
    ...transferData,
  };
}

export async function createBulkPreview({
  adminEmail,
  productIds,
  action,
  value,
}: {
  adminEmail: string;
  productIds: string[];
  action: string;
  value: string;
}) {
  if (!productIds.length || productIds.length > 2000)
    throw new Error("اختر من 1 إلى 2000 منتج.");
  const allowedActions = new Set([
    "categorySlug",
    "brandName",
    "availability",
    "stockQuantity",
    "pricePercent",
    "priceAmount",
  ]);
  if (!allowedActions.has(action))
    throw new Error("إجراء التعديل الجماعي غير صالح.");
  const [products, category, brand] = await Promise.all([
    getPrismaClient().product.findMany({
      where: { id: { in: productIds } },
      include: {
        category: { select: { slug: true } },
        brand: { select: { name: true } },
      },
    }),
    action === "categorySlug"
      ? getPrismaClient().category.findUnique({
          where: { slug: value },
          select: { id: true },
        })
      : null,
    action === "brandName"
      ? getPrismaClient().brand.findUnique({
          where: { name: value },
          select: { id: true },
        })
      : null,
  ]);
  if (products.length !== new Set(productIds).size)
    throw new Error("بعض المنتجات المحددة غير موجودة.");
  if (action === "categorySlug" && !category)
    throw new Error("التصنيف المحدد غير موجود.");
  if (action === "brandName" && !brand)
    throw new Error("الماركة المحددة غير موجودة.");
  if (action === "availability" && !["IN_STOCK", "ON_REQUEST"].includes(value))
    throw new Error("قيمة التوفر غير صحيحة.");
  const labelByKey = new Map(
    PRODUCT_TRANSFER_COLUMNS.map(([key, label]) => [key, label]),
  );
  const rows: ImportAnalysisRow[] = products.map((product, index) => {
    const values: TransferValues = {};
    let field: keyof TransferValues;
    let before: string | number | boolean | null;
    let after: string | number | boolean | null;
    if (action === "categorySlug") {
      field = "categorySlug";
      before = product.category.slug;
      after = value;
    } else if (action === "brandName") {
      field = "brandName";
      before = product.brand.name;
      after = value;
    } else if (action === "availability") {
      field = "availability";
      before = product.availability;
      after = value;
    } else if (action === "stockQuantity") {
      field = "stockQuantity";
      before = product.stockQuantity;
      after = Math.max(0, Math.round(Number(value)));
    } else {
      field = "price";
      before = product.price?.toNumber() ?? null;
      if (before == null) after = null;
      else
        after = calculateBulkPrice(
          before,
          action === "pricePercent" ? "pricePercent" : "priceAmount",
          value,
        );
    }
    values[field] = after;
    const errors =
      !Number.isFinite(Number(after)) || (field === "price" && before == null)
        ? [
            field === "price"
              ? "المنتج بلا سعر ثابت؛ لم يُعدّل."
              : "القيمة غير صالحة.",
          ]
        : [];
    return {
      rowNumber: index + 1,
      status: errors.length
        ? "ERROR"
        : String(before) === String(after)
          ? "UNCHANGED"
          : "UPDATE",
      productId: product.id,
      sku: product.sku,
      nameAr: product.nameAr,
      values,
      changes:
        errors.length || String(before) === String(after)
          ? []
          : [{ field, label: labelByKey.get(field) ?? field, before, after }],
      errors,
      warnings: [],
    };
  });
  const analysis: ImportAnalysis = {
    version: 1,
    rows,
    availableZipFilenames: [],
  };
  const run = await getPrismaClient().productImportRun.create({
    data: {
      fileName: "Bulk Editor",
      checksum: crypto.randomUUID(),
      adminEmail,
      operation: "BULK",
      status: "ANALYZED",
      sourceRows: rows.length,
      updateCount: rows.filter((row) => row.status === "UPDATE").length,
      unchangedCount: rows.filter((row) => row.status === "UNCHANGED").length,
      errorCount: rows.filter((row) => row.status === "ERROR").length,
      analysis: analysis as unknown as Prisma.InputJsonValue,
    },
  });
  return run.id;
}
