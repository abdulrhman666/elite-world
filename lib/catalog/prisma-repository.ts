import "server-only";
import type { Prisma } from "@prisma/client";
import type { CatalogRepository } from "@/lib/catalog/repository";
import { getPrismaClient } from "@/lib/prisma";
import type { CatalogOrderProduct, Category, Product } from "@/types";

const categorySelect = {
  slug: true,
  name: true,
  nameEn: true,
  description: true,
  image: true,
  icon: true,
  subcategories: true,
  seoTitle: true,
  seoDescription: true,
  canonicalUrl: true,
  seoIndexable: true,
  ogTitle: true,
  ogDescription: true,
  ogImage: true,
  seoImageAlt: true,
  _count: { select: { products: true } },
} satisfies Prisma.CategorySelect;

const productSummarySelect = {
  nameAr: true,
  nameEn: true,
  slug: true,
  sku: true,
  model: true,
  subcategorySlug: true,
  origin: true,
  shortDescription: true,
  price: true,
  stockQuantity: true,
  leadTime: true,
  warranty: true,
  image: true,
  badge: true,
  featured: true,
  sourceCreatedAt: true,
  seoImageAlt: true,
  _count: { select: { orderItems: true } },
  brand: { select: { name: true } },
  category: { select: { slug: true, name: true } },
} satisfies Prisma.ProductSelect;

const productDetailSelect = {
  ...productSummarySelect,
  description: true,
  seoTitle: true,
  seoDescription: true,
  canonicalUrl: true,
  seoIndexable: true,
  ogTitle: true,
  ogDescription: true,
  ogImage: true,
  features: true,
  uses: true,
  technicalFile: true,
  specifications: {
    select: { label: true, value: true, sortOrder: true },
    orderBy: { sortOrder: "asc" as const },
  },
  images: {
    select: {
      id: true,
      path: true,
      altText: true,
      isPrimary: true,
      sortOrder: true,
    },
    orderBy: { sortOrder: "asc" as const },
  },
} satisfies Prisma.ProductSelect;

type PrismaCategory = Prisma.CategoryGetPayload<{
  select: typeof categorySelect;
}>;

type PrismaProductSummary = Prisma.ProductGetPayload<{
  select: typeof productSummarySelect;
}>;

type PrismaProductDetail = Prisma.ProductGetPayload<{
  select: typeof productDetailSelect;
}>;

function mapCategory(category: PrismaCategory): Category {
  return {
    slug: category.slug,
    name: category.name,
    nameEn: category.nameEn,
    description: category.description,
    image: category.image,
    icon: category.icon as Category["icon"],
    subcategories: category.subcategories as Category["subcategories"],
    productCount: category._count.products,
    seo: {
      title: category.seoTitle,
      description: category.seoDescription,
      canonicalUrl: category.canonicalUrl,
      indexable: category.seoIndexable,
      ogTitle: category.ogTitle,
      ogDescription: category.ogDescription,
      ogImage: category.ogImage,
      imageAlt: category.seoImageAlt,
    },
  };
}

function mapProductSummary(product: PrismaProductSummary): Product {
  return {
    nameAr: product.nameAr,
    nameEn: product.nameEn,
    slug: product.slug,
    sku: product.sku,
    model: product.model,
    categorySlug: product.category.slug,
    categoryName: product.category.name,
    subcategorySlug: product.subcategorySlug,
    brand: product.brand.name,
    origin: product.origin,
    shortDescription: product.shortDescription,
    description: "",
    price: product.price?.toNumber() ?? null,
    stockQuantity: product.stockQuantity,
    availability: product.stockQuantity > 0 ? "in-stock" : "on-request",
    leadTime: product.leadTime,
    warranty: product.warranty,
    image: product.image,
    imageAlt: product.seoImageAlt ?? `صورة المنتج ${product.nameAr}`,
    badge: product.badge ?? undefined,
    featured: product.featured,
    salesCount: product._count.orderItems,
    createdAt: product.sourceCreatedAt.toISOString().slice(0, 10),
    features: [],
    uses: [],
    specifications: [],
    technicalFile: null,
  };
}

function mapProductDetail(product: PrismaProductDetail): Product {
  const orderedImages = [...product.images].sort(
    (first, second) => first.sortOrder - second.sortOrder,
  );
  const primaryImage =
    orderedImages.find((image) => image.isPrimary) ?? orderedImages[0];
  const additionalImages = orderedImages.filter(
    (image) => image.id !== primaryImage?.id,
  );
  return {
    nameAr: product.nameAr,
    nameEn: product.nameEn,
    slug: product.slug,
    sku: product.sku,
    model: product.model,
    categorySlug: product.category.slug,
    categoryName: product.category.name,
    subcategorySlug: product.subcategorySlug,
    brand: product.brand.name,
    origin: product.origin,
    shortDescription: product.shortDescription,
    description: product.description,
    price: product.price?.toNumber() ?? null,
    stockQuantity: product.stockQuantity,
    availability: product.stockQuantity > 0 ? "in-stock" : "on-request",
    leadTime: product.leadTime,
    warranty: product.warranty,
    image: primaryImage?.path ?? product.image,
    imageAlt:
      product.seoImageAlt ??
      primaryImage?.altText ??
      `صورة المنتج ${product.nameAr}`,
    additionalImages: additionalImages.map((image) => image.path),
    additionalImageAlts: Object.fromEntries(
      additionalImages.map((image) => [image.path, image.altText]),
    ),
    badge: product.badge ?? undefined,
    featured: product.featured,
    salesCount: product._count.orderItems,
    createdAt: product.sourceCreatedAt.toISOString().slice(0, 10),
    features: product.features,
    uses: product.uses,
    specifications: product.specifications
      .sort((first, second) => first.sortOrder - second.sortOrder)
      .map(({ label, value }) => ({ label, value })),
    technicalFile: product.technicalFile,
    seo: {
      title: product.seoTitle,
      description: product.seoDescription,
      canonicalUrl: product.canonicalUrl,
      indexable: product.seoIndexable,
      ogTitle: product.ogTitle,
      ogDescription: product.ogDescription,
      ogImage: product.ogImage,
      imageAlt: product.seoImageAlt,
    },
  };
}

export const prismaCatalogRepository: CatalogRepository = {
  async getCategories() {
    const categories = await getPrismaClient().category.findMany({
      select: categorySelect,
      orderBy: { sortOrder: "asc" },
    });
    return categories.map(mapCategory);
  },
  async getBrands() {
    const brands = await getPrismaClient().brand.findMany({
      select: { name: true },
      orderBy: { name: "asc" },
    });
    return brands.map((brand) => brand.name);
  },
  async getProducts() {
    const products = await getPrismaClient().product.findMany({
      select: productSummarySelect,
      orderBy: { sortOrder: "asc" },
    });
    return products.map(mapProductSummary);
  },
  async getOrderProducts(): Promise<CatalogOrderProduct[]> {
    const products = await getPrismaClient().product.findMany({
      select: {
        slug: true,
        nameAr: true,
        sku: true,
        model: true,
        image: true,
        price: true,
        stockQuantity: true,
      },
      orderBy: { sortOrder: "asc" },
    });
    return products.map((product) => ({
      ...product,
      price: product.price?.toNumber() ?? null,
    }));
  },
  async getCategoryBySlug(slug) {
    const category = await getPrismaClient().category.findUnique({
      where: { slug },
      select: categorySelect,
    });
    return category ? mapCategory(category) : undefined;
  },
  async getProductBySlug(slug) {
    const product = await getPrismaClient().product.findUnique({
      where: { slug },
      select: productDetailSelect,
    });
    return product ? mapProductDetail(product) : undefined;
  },
  async getProductsByCategory(categorySlug) {
    const products = await getPrismaClient().product.findMany({
      where: { category: { slug: categorySlug } },
      select: productSummarySelect,
      orderBy: { sortOrder: "asc" },
    });
    return products.map(mapProductSummary);
  },
  async getSimilarProducts(categorySlug, excludeSlug, take) {
    const products = await getPrismaClient().product.findMany({
      where: {
        category: { slug: categorySlug },
        slug: { not: excludeSlug },
      },
      select: productSummarySelect,
      orderBy: [
        { orderItems: { _count: "desc" } },
        { featured: "desc" },
        { sortOrder: "asc" },
      ],
      take,
    });
    return products.map(mapProductSummary);
  },
  async getFeaturedProducts() {
    const products = await getPrismaClient().product.findMany({
      select: productSummarySelect,
      orderBy: [
        { featured: "desc" },
        { orderItems: { _count: "desc" } },
        { sortOrder: "asc" },
      ],
      take: 8,
    });
    return products.map(mapProductSummary);
  },
  async getBestSellingProducts() {
    const products = await getPrismaClient().product.findMany({
      select: productSummarySelect,
      orderBy: [
        { orderItems: { _count: "desc" } },
        { featured: "desc" },
        { sortOrder: "asc" },
      ],
      take: 4,
    });
    return products.map(mapProductSummary);
  },
};
