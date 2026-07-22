import "server-only";
import type { Prisma, ProductAvailability } from "@prisma/client";
import { getPrismaClient } from "@/lib/prisma";
import {
  buildProductWorkbook,
  workbookToBuffer,
} from "@/lib/product-transfer/workbook";
import type { ProductTransferRow } from "@/lib/product-transfer/columns";

export type ProductExportFilters = {
  categoryId?: string;
  brandId?: string;
  availability?: ProductAvailability;
  productIds?: string[];
  templateOnly?: boolean;
};

export async function exportProductsXlsx(filters: ProductExportFilters) {
  const where: Prisma.ProductWhereInput = {
    ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
    ...(filters.brandId ? { brandId: filters.brandId } : {}),
    ...(filters.availability ? { availability: filters.availability } : {}),
    ...(filters.productIds?.length ? { id: { in: filters.productIds } } : {}),
  };
  const products = filters.templateOnly
    ? []
    : await getPrismaClient().product.findMany({
        where,
        include: {
          category: { select: { name: true, slug: true } },
          brand: { select: { name: true } },
          specifications: { orderBy: { sortOrder: "asc" } },
          images: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] },
        },
        orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
      });
  const rows: ProductTransferRow[] = products.map((product) => {
    const additional = product.images
      .filter((image) => !image.isPrimary && image.path !== product.image)
      .map((image) => image.path);
    return {
      id: product.id,
      sku: product.sku,
      nameAr: product.nameAr,
      nameEn: product.nameEn,
      slug: product.slug,
      price: product.price?.toNumber() ?? null,
      stockQuantity: product.stockQuantity,
      availability: product.availability,
      categorySlug: product.category.slug,
      categoryName: product.category.name,
      subcategorySlug: product.subcategorySlug,
      brandName: product.brand.name,
      model: product.model,
      origin: product.origin,
      shortDescription: product.shortDescription,
      description: product.description,
      leadTime: product.leadTime,
      warranty: product.warranty,
      imageUrl: product.image,
      image1: additional[0] ?? null,
      image2: additional[1] ?? null,
      image3: additional[2] ?? null,
      imageFilename: null,
      features: product.features.join(" | "),
      uses: product.uses.join(" | "),
      specifications: JSON.stringify(
        product.specifications.map(({ label, value }) => ({ label, value })),
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
      sourceCreatedAt: product.sourceCreatedAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
    };
  });
  const workbook = await buildProductWorkbook(rows, {
    templateOnly: filters.templateOnly,
  });
  return workbookToBuffer(workbook);
}
