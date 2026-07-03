import "server-only";
import { cache } from "react";
import {
  editableContentPageSlugs,
  type EditableContentPageSlug,
} from "@/data/content-pages";
import { placeholderPages } from "@/data/pages";
import { getPrismaClient } from "@/lib/prisma";
import { isSiteSettingsDatabaseConfigured } from "@/lib/site-settings";
import type { SeoMetadata } from "@/types";
import type { SeoFormValues } from "@/types/seo";

const contentPageLabels: Record<EditableContentPageSlug, string> = {
  about: "من نحن",
  brands: "العلامات التجارية",
  projects: "المشاريع السابقة",
  "project-solutions": "تجهيز المشاريع",
  stainless: "تصنيع الستانلس",
  maintenance: "الصيانة والضمان",
};

export const publicPageDefinitions = [
  { path: "/", label: "الصفحة الرئيسية" },
  { path: "/shop", label: "المتجر" },
  { path: "/categories", label: "الأقسام" },
  { path: "/quote", label: "طلب عرض سعر" },
  { path: "/blog", label: "المدونة" },
  ...editableContentPageSlugs.map((slug) => ({
    path: `/${slug}`,
    label: contentPageLabels[slug],
  })),
  ...Object.entries(placeholderPages).map(([slug, page]) => ({
    path: `/${slug}`,
    label: page.title,
  })),
];

function mapSeo(record: SeoFormValues | null | undefined): SeoMetadata | null {
  if (!record) return null;
  return {
    title: record.seoTitle,
    description: record.seoDescription,
    canonicalUrl: record.canonicalUrl,
    indexable: record.seoIndexable,
    ogTitle: record.ogTitle,
    ogDescription: record.ogDescription,
    ogImage: record.ogImage,
    imageAlt: record.seoImageAlt,
  };
}

export const getPageSeo = cache(async function getPageSeo(
  path: string,
): Promise<SeoMetadata | null> {
  if (!isSiteSettingsDatabaseConfigured()) return null;
  try {
    const record = await getPrismaClient().pageSeo.findUnique({
      where: { path },
    });
    return mapSeo(record);
  } catch {
    return null;
  }
});

export async function getPageSeoRecords() {
  if (!isSiteSettingsDatabaseConfigured()) {
    return publicPageDefinitions.map((page) => ({ ...page, seo: null }));
  }
  try {
    const records = await getPrismaClient().pageSeo.findMany();
    const byPath = new Map(records.map((record) => [record.path, record]));
    return publicPageDefinitions.map((page) => ({
      ...page,
      seo: byPath.get(page.path) ?? null,
    }));
  } catch {
    return publicPageDefinitions.map((page) => ({ ...page, seo: null }));
  }
}

export async function updatePageSeo(path: string, input: SeoFormValues) {
  if (!isSiteSettingsDatabaseConfigured()) throw new Error("READ_ONLY");
  const page = publicPageDefinitions.find((item) => item.path === path);
  if (!page) throw new Error("PAGE_NOT_FOUND");
  return getPrismaClient().pageSeo.upsert({
    where: { path },
    create: { path, label: page.label, ...input },
    update: input,
  });
}
