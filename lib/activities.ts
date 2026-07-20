import "server-only";
import type { Prisma } from "@prisma/client";
import { unstable_cache } from "next/cache";
import { cache } from "react";
import { getPrismaClient } from "@/lib/prisma";
import type { Product } from "@/types";
import type { ActivityDetail, ActivitySummary } from "@/types/activity";

const activityProductSelect = {
  slug: true,
  nameAr: true,
  nameEn: true,
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
  brand: { select: { name: true } },
  category: { select: { slug: true, name: true } },
} satisfies Prisma.ProductSelect;

type ActivityPrismaProduct = Prisma.ProductGetPayload<{
  select: typeof activityProductSelect;
}>;

function mapProduct(product: ActivityPrismaProduct): Product {
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
    createdAt: product.sourceCreatedAt.toISOString().slice(0, 10),
    features: [],
    uses: [],
    specifications: [],
    technicalFile: null,
  };
}

function configured() {
  return Boolean(process.env.DATABASE_URL);
}

const readPublishedActivities = unstable_cache(
  async (): Promise<ActivitySummary[]> => {
    if (!configured()) return [];
    const activities = await getPrismaClient().activity.findMany({
      where: { published: true },
      select: {
        slug: true,
        name: true,
        heroTitle: true,
        heroDescription: true,
        image: true,
      },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });
    return activities;
  },
  ["published-activities-v1"],
  { revalidate: 300, tags: ["activities"] },
);

const readActivityBySlug = unstable_cache(
  async (slug: string): Promise<ActivityDetail | null> => {
    if (!configured()) return null;
    const activity = await getPrismaClient().activity.findFirst({
      where: { slug, published: true },
      select: {
        slug: true,
        name: true,
        eyebrow: true,
        heroTitle: true,
        heroDescription: true,
        introduction: true,
        image: true,
        primaryCtaText: true,
        seoTitle: true,
        seoDescription: true,
        canonicalUrl: true,
        seoIndexable: true,
        ogTitle: true,
        ogDescription: true,
        ogImage: true,
        seoImageAlt: true,
        productLinks: {
          select: {
            equipmentGroup: true,
            essential: true,
            sortOrder: true,
            product: { select: activityProductSelect },
          },
          orderBy: [{ sortOrder: "asc" }, { productId: "asc" }],
        },
      },
    });
    if (!activity) return null;
    return {
      slug: activity.slug,
      name: activity.name,
      eyebrow: activity.eyebrow,
      heroTitle: activity.heroTitle,
      heroDescription: activity.heroDescription,
      introduction: activity.introduction,
      image: activity.image,
      primaryCtaText: activity.primaryCtaText,
      seo: {
        title: activity.seoTitle,
        description: activity.seoDescription,
        canonicalUrl: activity.canonicalUrl,
        indexable: activity.seoIndexable,
        ogTitle: activity.ogTitle,
        ogDescription: activity.ogDescription,
        ogImage: activity.ogImage,
        imageAlt: activity.seoImageAlt,
      },
      products: activity.productLinks.map((link) => ({
        equipmentGroup: link.equipmentGroup,
        essential: link.essential,
        sortOrder: link.sortOrder,
        product: mapProduct(link.product),
      })),
    };
  },
  ["activity-by-slug-v1"],
  { revalidate: 300, tags: ["activities", "catalog"] },
);

const readComplementaryProducts = unstable_cache(
  async (productSlug: string, take: number): Promise<Product[]> => {
    if (!configured()) return [];
    const links = await getPrismaClient().activityProduct.findMany({
      where: {
        activity: { published: true },
        activityId: {
          in: (
            await getPrismaClient().activityProduct.findMany({
              where: { product: { slug: productSlug } },
              select: { activityId: true },
            })
          ).map((link) => link.activityId),
        },
        product: { slug: { not: productSlug } },
      },
      select: { product: { select: activityProductSelect } },
      orderBy: [{ essential: "desc" }, { sortOrder: "asc" }],
      distinct: ["productId"],
      take,
    });
    return links.map((link) => mapProduct(link.product));
  },
  ["activity-complementary-products-v1"],
  { revalidate: 300, tags: ["activities", "catalog"] },
);

export const getPublishedActivities = cache(async () => {
  try {
    return await readPublishedActivities();
  } catch {
    return [];
  }
});

export const getActivityBySlug = cache(async (slug: string) => {
  try {
    return await readActivityBySlug(slug);
  } catch {
    return null;
  }
});

export const getActivityComplementaryProducts = cache(
  async (productSlug: string, take = 4) => {
    try {
      return await readComplementaryProducts(productSlug, take);
    } catch {
      return [];
    }
  },
);
