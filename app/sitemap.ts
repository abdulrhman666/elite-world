import type { MetadataRoute } from "next";
import {
  getCatalogCategories,
  getCatalogProducts,
} from "@/lib/catalog/service";
import { getPageSeoRecords } from "@/lib/seo/page-seo";
import { absoluteSiteUrl } from "@/lib/seo/metadata";
import { getPublishedBlogPosts } from "@/lib/blog/service";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [catalogCategories, catalogProducts, pages, posts] = await Promise.all([
    getCatalogCategories(),
    getCatalogProducts(),
    getPageSeoRecords(),
    getPublishedBlogPosts(),
  ]);
  const now = new Date();
  return [
    ...pages
      .filter((page) => page.seo?.seoIndexable !== false)
      .map((page) => ({
        url: absoluteSiteUrl(page.seo?.canonicalUrl || page.path),
        lastModified: now,
        changeFrequency: "weekly" as const,
        priority: page.path === "/" ? 1 : 0.8,
      })),
    ...catalogCategories
      .filter((category) => category.seo?.indexable !== false)
      .map((category) => ({
        url: absoluteSiteUrl(
          category.seo?.canonicalUrl || `/categories/${category.slug}`,
        ),
        lastModified: now,
        changeFrequency: "weekly" as const,
        priority: 0.75,
      })),
    ...catalogProducts
      .filter((product) => product.seo?.indexable !== false)
      .map((product) => ({
        url: absoluteSiteUrl(
          product.seo?.canonicalUrl || `/products/${product.slug}`,
        ),
        lastModified: new Date(product.createdAt),
        changeFrequency: "monthly" as const,
        priority: 0.7,
      })),
    ...posts.map((post) => ({
      url: absoluteSiteUrl(`/blog/${post.slug}`),
      lastModified: post.createdAt,
      changeFrequency: "monthly" as const,
      priority: 0.65,
    })),
  ];
}
