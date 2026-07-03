import "server-only";
import { ProductAvailability } from "@prisma/client";
import { unstable_cache } from "next/cache";
import { isSeoAiConfigured } from "@/lib/ai/seo-assistant";
import { getAdminMediaOptions } from "@/lib/admin/media-options";
import { ADMIN_PAGE_SIZE, normalizeAdminPage } from "@/lib/admin/pagination";
import { getPrismaClient } from "@/lib/prisma";
import type { SeoFormValues } from "@/types/seo";
import type { SiteMediaOption } from "@/types/site-settings";

export type AdminProductListItem = {
  id: string;
  nameAr: string;
  sku: string;
  category: string;
  price: number | null;
  stockQuantity: number;
  availability: "in-stock" | "on-request";
};

export type AdminProductFormValues = SeoFormValues & {
  id?: string;
  nameAr: string;
  nameEn: string;
  slug: string;
  sku: string;
  model: string;
  categoryId: string;
  brandId: string;
  origin: string;
  description: string;
  price: number | null;
  stockQuantity: number;
  warranty: string;
  image: string;
  specifications: Record<string, string>;
};

export type AdminProductInput = Omit<AdminProductFormValues, "id">;

export type AdminCategoryOption = { id: string; name: string };
export type AdminBrandOption = { id: string; name: string };

export type AdminCategoryRecord = SeoFormValues & {
  id: string;
  name: string;
  nameEn: string;
  slug: string;
  description: string;
  image: string;
  icon: string;
  sortOrder: number;
  productCount: number;
};

export type AdminCategoryInput = Omit<
  AdminCategoryRecord,
  "id" | "productCount"
>;

export type AdminBrandRecord = {
  id: string;
  name: string;
  origin: string | null;
  description: string | null;
  productCount: number;
};

export type AdminBrandInput = Pick<
  AdminBrandRecord,
  "name" | "origin" | "description"
>;

const setupMessage =
  "وضع القراءة مفعّل حالياً. ستظهر بيانات الكتالوج ويصبح التعديل متاحاً بعد ربط قاعدة بيانات الموقع.";

export function getAdminDatabaseConfigurationIssue() {
  if (!process.env.DATABASE_URL) {
    return setupMessage;
  }
  return null;
}

function connectionMessage() {
  return "تعذر الاتصال بقاعدة بيانات الموقع. ستبقى البيانات ظاهرة للقراءة فقط حتى استعادة الاتصال.";
}

async function readAdminCatalogStats() {
  const configurationIssue = getAdminDatabaseConfigurationIssue();
  if (configurationIssue) {
    return {
      productCount: 0,
      readOnly: true,
      message: configurationIssue,
    };
  }
  try {
    return {
      productCount: await getPrismaClient().product.count(),
      readOnly: false,
      message: null,
    };
  } catch {
    return {
      productCount: 0,
      readOnly: true,
      message: connectionMessage(),
    };
  }
}

export const getAdminCatalogStats = unstable_cache(
  readAdminCatalogStats,
  ["admin-catalog-stats"],
  { revalidate: 20 },
);

function mapSeoValues(record: SeoFormValues): SeoFormValues {
  return {
    seoTitle: record.seoTitle,
    seoDescription: record.seoDescription,
    canonicalUrl: record.canonicalUrl,
    seoIndexable: record.seoIndexable,
    ogTitle: record.ogTitle,
    ogDescription: record.ogDescription,
    ogImage: record.ogImage,
    seoImageAlt: record.seoImageAlt,
  };
}

export async function getAdminProducts(query = "", page: number | string = 1) {
  const safePage = normalizeAdminPage(page);
  const configurationIssue = getAdminDatabaseConfigurationIssue();
  if (configurationIssue) {
    return {
      products: [] as AdminProductListItem[],
      page: safePage,
      hasNext: false,
      readOnly: true,
      message: configurationIssue,
    };
  }

  try {
    const products = await getPrismaClient().product.findMany({
      where: query
        ? {
            OR: [
              { nameAr: { contains: query, mode: "insensitive" } },
              { nameEn: { contains: query, mode: "insensitive" } },
              { sku: { contains: query, mode: "insensitive" } },
              { model: { contains: query, mode: "insensitive" } },
              { category: { name: { contains: query, mode: "insensitive" } } },
            ],
          }
        : undefined,
      select: {
        id: true,
        nameAr: true,
        sku: true,
        price: true,
        stockQuantity: true,
        category: { select: { name: true } },
      },
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
      skip: (safePage - 1) * ADMIN_PAGE_SIZE,
      take: ADMIN_PAGE_SIZE + 1,
    });
    const hasNext = products.length > ADMIN_PAGE_SIZE;
    return {
      products: products.slice(0, ADMIN_PAGE_SIZE).map((product) => ({
        id: product.id,
        nameAr: product.nameAr,
        sku: product.sku,
        category: product.category.name,
        price: product.price?.toNumber() ?? null,
        stockQuantity: product.stockQuantity,
        availability:
          product.stockQuantity > 0
            ? ("in-stock" as const)
            : ("on-request" as const),
      })),
      page: safePage,
      hasNext,
      readOnly: false,
      message: null,
    };
  } catch {
    return {
      products: [] as AdminProductListItem[],
      page: safePage,
      hasNext: false,
      readOnly: true,
      message: connectionMessage(),
    };
  }
}

export async function getAdminProductEditor(productId?: string) {
  const configurationIssue = getAdminDatabaseConfigurationIssue();
  if (configurationIssue) {
    return {
      readOnly: true as const,
      message: configurationIssue,
      categories: [] as AdminCategoryOption[],
      brands: [] as AdminBrandOption[],
      media: [] as SiteMediaOption[],
      aiEnabled: isSeoAiConfigured(),
      product: null,
    };
  }

  try {
    const [categories, brands, media, product] = await Promise.all([
      getPrismaClient().category.findMany({
        select: { id: true, name: true },
        orderBy: { sortOrder: "asc" },
      }),
      getPrismaClient().brand.findMany({
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
      getAdminMediaOptions(),
      productId
        ? getPrismaClient().product.findUnique({
            where: { id: productId },
            select: {
              id: true,
              nameAr: true,
              nameEn: true,
              slug: true,
              sku: true,
              model: true,
              categoryId: true,
              brandId: true,
              origin: true,
              description: true,
              price: true,
              stockQuantity: true,
              warranty: true,
              image: true,
              seoTitle: true,
              seoDescription: true,
              canonicalUrl: true,
              seoIndexable: true,
              ogTitle: true,
              ogDescription: true,
              ogImage: true,
              seoImageAlt: true,
              specifications: { select: { label: true, value: true } },
            },
          })
        : null,
    ]);
    return {
      readOnly: false as const,
      message: null,
      categories,
      brands,
      media,
      aiEnabled: isSeoAiConfigured(),
      product: product
        ? {
            id: product.id,
            nameAr: product.nameAr,
            nameEn: product.nameEn,
            slug: product.slug,
            sku: product.sku,
            model: product.model,
            categoryId: product.categoryId,
            brandId: product.brandId,
            origin: product.origin,
            description: product.description,
            price: product.price?.toNumber() ?? null,
            stockQuantity: product.stockQuantity,
            warranty: product.warranty,
            image: product.image,
            specifications: Object.fromEntries(
              product.specifications.map((item) => [item.label, item.value]),
            ),
            ...mapSeoValues(product),
          }
        : null,
    };
  } catch {
    return {
      readOnly: true as const,
      message: connectionMessage(),
      categories: [] as AdminCategoryOption[],
      brands: [] as AdminBrandOption[],
      media: [] as SiteMediaOption[],
      aiEnabled: isSeoAiConfigured(),
      product: null,
    };
  }
}

function categorySubcategorySlug(value: unknown) {
  if (!Array.isArray(value)) return "uncategorized";
  const first = value[0];
  if (
    typeof first === "object" &&
    first !== null &&
    "slug" in first &&
    typeof first.slug === "string"
  ) {
    return first.slug;
  }
  return "uncategorized";
}

function specificationCreates(specifications: Record<string, string>) {
  return Object.entries(specifications)
    .filter(([, value]) => value.trim())
    .map(([label, value], sortOrder) => ({
      label,
      value: value.trim(),
      sortOrder,
    }));
}

async function categoryAndBrand(input: AdminProductInput) {
  const [category, brand] = await Promise.all([
    getPrismaClient().category.findUnique({
      where: { id: input.categoryId },
    }),
    getPrismaClient().brand.findUnique({
      where: { id: input.brandId },
    }),
  ]);
  if (!category) throw new Error("CATEGORY_NOT_FOUND");
  if (!brand) throw new Error("BRAND_NOT_FOUND");
  return { category, brand };
}

export async function createAdminProduct(input: AdminProductInput) {
  if (getAdminDatabaseConfigurationIssue()) throw new Error("READ_ONLY");
  const { category, brand } = await categoryAndBrand(input);
  const maximum = await getPrismaClient().product.aggregate({
    _max: { sortOrder: true },
  });
  return getPrismaClient().product.create({
    data: {
      nameAr: input.nameAr,
      nameEn: input.nameEn,
      slug: input.slug,
      sku: input.sku,
      model: input.model,
      categoryId: category.id,
      subcategorySlug: categorySubcategorySlug(category.subcategories),
      brandId: brand.id,
      origin: input.origin,
      shortDescription: input.description.slice(0, 220),
      description: input.description,
      price: input.price,
      stockQuantity: input.stockQuantity,
      availability:
        input.stockQuantity > 0
          ? ProductAvailability.IN_STOCK
          : ProductAvailability.ON_REQUEST,
      leadTime: "غير محدد",
      warranty: input.warranty,
      image: input.image,
      featured: false,
      sourceCreatedAt: new Date(),
      sortOrder: (maximum._max.sortOrder ?? -1) + 1,
      features: [],
      uses: [],
      ...mapSeoValues(input),
      specifications: { create: specificationCreates(input.specifications) },
      images: {
        create: {
          path: input.image,
          altText: `صورة المنتج ${input.nameAr}`,
          isPrimary: true,
          sortOrder: 0,
          mimeType: "image/unknown",
        },
      },
    },
  });
}

export async function updateAdminProduct(
  productId: string,
  input: AdminProductInput,
) {
  if (getAdminDatabaseConfigurationIssue()) throw new Error("READ_ONLY");
  const { category, brand } = await categoryAndBrand(input);
  const existing = await getPrismaClient().product.findUnique({
    where: { id: productId },
  });
  if (!existing) throw new Error("PRODUCT_NOT_FOUND");
  return getPrismaClient().$transaction(async (transaction) => {
    const product = await transaction.product.update({
      where: { id: productId },
      data: {
        nameAr: input.nameAr,
        nameEn: input.nameEn,
        slug: input.slug,
        sku: input.sku,
        model: input.model,
        categoryId: category.id,
        subcategorySlug:
          existing.categoryId === category.id
            ? existing.subcategorySlug
            : categorySubcategorySlug(category.subcategories),
        brandId: brand.id,
        origin: input.origin,
        shortDescription: input.description.slice(0, 220),
        description: input.description,
        price: input.price,
        stockQuantity: input.stockQuantity,
        availability:
          input.stockQuantity > 0
            ? ProductAvailability.IN_STOCK
            : ProductAvailability.ON_REQUEST,
        warranty: input.warranty,
        image: input.image,
        ...mapSeoValues(input),
        specifications: {
          deleteMany: {},
          create: specificationCreates(input.specifications),
        },
      },
    });
    if (existing.slug !== input.slug) {
      await transaction.slugRedirect.upsert({
        where: { sourcePath: `/products/${existing.slug}` },
        create: {
          sourcePath: `/products/${existing.slug}`,
          destinationPath: `/products/${input.slug}`,
        },
        update: { destinationPath: `/products/${input.slug}` },
      });
    }
    return { product, previousSlug: existing.slug };
  });
}

export async function deleteAdminProduct(productId: string) {
  if (getAdminDatabaseConfigurationIssue()) throw new Error("READ_ONLY");
  return getPrismaClient().product.delete({ where: { id: productId } });
}

export async function getAdminCategories() {
  const configurationIssue = getAdminDatabaseConfigurationIssue();
  if (configurationIssue) {
    return {
      records: [] as AdminCategoryRecord[],
      media: [] as SiteMediaOption[],
      aiEnabled: isSeoAiConfigured(),
      readOnly: true,
      message: configurationIssue,
    };
  }

  try {
    const [categories, media] = await Promise.all([
      getPrismaClient().category.findMany({
        select: {
          id: true,
          name: true,
          nameEn: true,
          slug: true,
          description: true,
          image: true,
          icon: true,
          sortOrder: true,
          seoTitle: true,
          seoDescription: true,
          canonicalUrl: true,
          seoIndexable: true,
          ogTitle: true,
          ogDescription: true,
          ogImage: true,
          seoImageAlt: true,
          _count: { select: { products: true } },
        },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      }),
      getAdminMediaOptions(),
    ]);
    return {
      records: categories.map((category) => ({
        id: category.id,
        name: category.name,
        nameEn: category.nameEn,
        slug: category.slug,
        description: category.description,
        image: category.image,
        icon: category.icon,
        sortOrder: category.sortOrder,
        ...mapSeoValues(category),
        productCount: category._count.products,
      })),
      media,
      aiEnabled: isSeoAiConfigured(),
      readOnly: false,
      message: null,
    };
  } catch {
    return {
      records: [] as AdminCategoryRecord[],
      media: [] as SiteMediaOption[],
      aiEnabled: isSeoAiConfigured(),
      readOnly: true,
      message: connectionMessage(),
    };
  }
}

export async function getAdminBrands() {
  const configurationIssue = getAdminDatabaseConfigurationIssue();
  if (configurationIssue) {
    return {
      records: [] as AdminBrandRecord[],
      readOnly: true,
      message: configurationIssue,
    };
  }

  try {
    const brands = await getPrismaClient().brand.findMany({
      select: {
        id: true,
        name: true,
        origin: true,
        description: true,
        _count: { select: { products: true } },
      },
      orderBy: { name: "asc" },
    });
    return {
      records: brands.map((brand) => ({
        id: brand.id,
        name: brand.name,
        origin: brand.origin,
        description: brand.description,
        productCount: brand._count.products,
      })),
      readOnly: false,
      message: null,
    };
  } catch {
    return {
      records: [] as AdminBrandRecord[],
      readOnly: true,
      message: connectionMessage(),
    };
  }
}

export async function createAdminCategory(input: AdminCategoryInput) {
  if (getAdminDatabaseConfigurationIssue()) throw new Error("READ_ONLY");
  return getPrismaClient().category.create({
    data: {
      name: input.name,
      nameEn: input.nameEn,
      slug: input.slug,
      description: input.description,
      image: input.image,
      sortOrder: input.sortOrder,
      icon: input.icon,
      ...mapSeoValues(input),
      subcategories: [],
    },
  });
}

export async function updateAdminCategory(
  categoryId: string,
  input: AdminCategoryInput,
) {
  if (getAdminDatabaseConfigurationIssue()) throw new Error("READ_ONLY");
  const existing = await getPrismaClient().category.findUnique({
    where: { id: categoryId },
  });
  if (!existing) throw new Error("CATEGORY_NOT_FOUND");
  return getPrismaClient().$transaction(async (transaction) => {
    const category = await transaction.category.update({
      where: { id: categoryId },
      data: input,
    });
    if (existing.slug !== input.slug) {
      await transaction.slugRedirect.upsert({
        where: { sourcePath: `/categories/${existing.slug}` },
        create: {
          sourcePath: `/categories/${existing.slug}`,
          destinationPath: `/categories/${input.slug}`,
        },
        update: { destinationPath: `/categories/${input.slug}` },
      });
    }
    return { category, previousSlug: existing.slug };
  });
}

export async function deleteAdminCategory(categoryId: string) {
  if (getAdminDatabaseConfigurationIssue()) throw new Error("READ_ONLY");
  const category = await getPrismaClient().category.findUnique({
    where: { id: categoryId },
    include: { _count: { select: { products: true } } },
  });
  if (!category) throw new Error("CATEGORY_NOT_FOUND");
  if (category._count.products > 0) throw new Error("CATEGORY_IN_USE");
  return getPrismaClient().category.delete({ where: { id: categoryId } });
}

export async function createAdminBrand(input: AdminBrandInput) {
  if (getAdminDatabaseConfigurationIssue()) throw new Error("READ_ONLY");
  return getPrismaClient().brand.create({ data: input });
}

export async function updateAdminBrand(
  brandId: string,
  input: AdminBrandInput,
) {
  if (getAdminDatabaseConfigurationIssue()) throw new Error("READ_ONLY");
  return getPrismaClient().brand.update({
    where: { id: brandId },
    data: input,
  });
}

export async function deleteAdminBrand(brandId: string) {
  if (getAdminDatabaseConfigurationIssue()) throw new Error("READ_ONLY");
  const brand = await getPrismaClient().brand.findUnique({
    where: { id: brandId },
    include: { _count: { select: { products: true } } },
  });
  if (!brand) throw new Error("BRAND_NOT_FOUND");
  if (brand._count.products > 0) throw new Error("BRAND_IN_USE");
  return getPrismaClient().brand.delete({ where: { id: brandId } });
}
