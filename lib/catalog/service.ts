import "server-only";
import { unstable_cache } from "next/cache";
import { cache } from "react";
import { prismaCatalogRepository } from "@/lib/catalog/prisma-repository";

export function isCatalogDatabaseConfigured() {
  return Boolean(process.env.DATABASE_URL);
}

async function readCatalog<T>(operation: () => Promise<T>, emptyValue: T) {
  // Runtime catalog reads are Prisma-only. CSV remains an import/seed input.
  if (!isCatalogDatabaseConfigured()) return emptyValue;
  try {
    return await operation();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[catalog:prisma] ${message}`);
    return emptyValue;
  }
}

const cacheOptions: { revalidate: number; tags: string[] } = {
  revalidate: 300,
  tags: ["catalog"],
};

const readCategories = unstable_cache(
  () => prismaCatalogRepository.getCategories(),
  ["catalog-categories-v3"],
  cacheOptions,
);
const readBrands = unstable_cache(
  () => prismaCatalogRepository.getBrands(),
  ["catalog-brands-v2"],
  cacheOptions,
);
const readProducts = unstable_cache(
  () => prismaCatalogRepository.getProducts(),
  ["catalog-products-v2"],
  cacheOptions,
);
const readOrderProducts = unstable_cache(
  () => prismaCatalogRepository.getOrderProducts(),
  ["catalog-order-products-v2"],
  cacheOptions,
);
const readCategoryBySlug = unstable_cache(
  (slug: string) => prismaCatalogRepository.getCategoryBySlug(slug),
  ["catalog-category-v3"],
  cacheOptions,
);
const readProductBySlug = unstable_cache(
  (slug: string) => prismaCatalogRepository.getProductBySlug(slug),
  ["catalog-product-v2"],
  cacheOptions,
);
const readProductsByCategory = unstable_cache(
  (categorySlug: string) =>
    prismaCatalogRepository.getProductsByCategory(categorySlug),
  ["catalog-products-by-category-v2"],
  cacheOptions,
);
const readSimilarProducts = unstable_cache(
  (categorySlug: string, excludeSlug: string, take: number) =>
    prismaCatalogRepository.getSimilarProducts(categorySlug, excludeSlug, take),
  ["catalog-similar-products-v2"],
  cacheOptions,
);
const readFeaturedProducts = unstable_cache(
  () => prismaCatalogRepository.getFeaturedProducts(),
  ["catalog-featured-products-v2"],
  cacheOptions,
);
const readBestSellingProducts = unstable_cache(
  () => prismaCatalogRepository.getBestSellingProducts(),
  ["catalog-best-selling-products-v2"],
  cacheOptions,
);

export const getCatalogCategories = cache(() =>
  readCatalog(() => readCategories(), []),
);

export const getCatalogBrands = cache(() =>
  readCatalog(() => readBrands(), []),
);

export const getCatalogProducts = cache(() =>
  readCatalog(() => readProducts(), []),
);

export const getCatalogOrderProducts = cache(() =>
  readCatalog(() => readOrderProducts(), []),
);

export const getCatalogCategoryBySlug = cache((slug: string) =>
  readCatalog(() => readCategoryBySlug(slug), undefined),
);

export const getCatalogProductBySlug = cache((slug: string) =>
  readCatalog(() => readProductBySlug(slug), undefined),
);

export const getCatalogProductsByCategory = cache((categorySlug: string) =>
  readCatalog(() => readProductsByCategory(categorySlug), []),
);

export const getCatalogSimilarProducts = cache(
  (categorySlug: string, excludeSlug: string, take = 3) =>
    readCatalog(() => readSimilarProducts(categorySlug, excludeSlug, take), []),
);

export const getCatalogFeaturedProducts = cache(() =>
  readCatalog(() => readFeaturedProducts(), []),
);

export const getCatalogBestSellingProducts = cache(() =>
  readCatalog(() => readBestSellingProducts(), []),
);
