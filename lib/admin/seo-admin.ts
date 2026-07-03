import "server-only";
import { isSeoAiConfigured } from "@/lib/ai/seo-assistant";
import { getAdminDatabaseConfigurationIssue } from "@/lib/admin/catalog-admin";
import { getAdminMediaOptions } from "@/lib/admin/media-options";
import { getPrismaClient } from "@/lib/prisma";
import { getPageSeoRecords, publicPageDefinitions } from "@/lib/seo/page-seo";
import type { SeoFormValues } from "@/types/seo";
import type { SiteMediaOption } from "@/types/site-settings";

export type SeoAuditItem = {
  key: string;
  type: "منتج" | "قسم" | "صفحة";
  label: string;
  path: string;
  editHref: string;
  effectiveTitle: string;
  effectiveDescription: string;
  missing: string[];
  duplicateTitle: boolean;
  duplicateDescription: boolean;
};

type AuditDraft = Omit<SeoAuditItem, "duplicateTitle" | "duplicateDescription">;

const fallbackMessage = "إعدادات SEO للقراءة فقط حتى ربط قاعدة بيانات الموقع.";

function seoValues(record?: Partial<SeoFormValues> | null): SeoFormValues {
  return {
    seoTitle: record?.seoTitle ?? null,
    seoDescription: record?.seoDescription ?? null,
    canonicalUrl: record?.canonicalUrl ?? null,
    seoIndexable: record?.seoIndexable ?? true,
    ogTitle: record?.ogTitle ?? null,
    ogDescription: record?.ogDescription ?? null,
    ogImage: record?.ogImage ?? null,
    seoImageAlt: record?.seoImageAlt ?? null,
  };
}

function missingFields(seo: SeoFormValues) {
  const missing: string[] = [];
  if (!seo.seoTitle) missing.push("SEO Title تلقائي");
  if (!seo.seoDescription) missing.push("Meta Description تلقائي");
  if (!seo.canonicalUrl) missing.push("Canonical تلقائي");
  if (!seo.ogImage) missing.push("OG Image تلقائية");
  return missing;
}

function normalizeDuplicate(value: string) {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase("ar");
}

function finalizeAudit(drafts: AuditDraft[]): SeoAuditItem[] {
  const titleCounts = new Map<string, number>();
  const descriptionCounts = new Map<string, number>();
  for (const item of drafts) {
    const title = normalizeDuplicate(item.effectiveTitle);
    const description = normalizeDuplicate(item.effectiveDescription);
    titleCounts.set(title, (titleCounts.get(title) ?? 0) + 1);
    descriptionCounts.set(
      description,
      (descriptionCounts.get(description) ?? 0) + 1,
    );
  }
  return drafts.map((item) => ({
    ...item,
    duplicateTitle:
      (titleCounts.get(normalizeDuplicate(item.effectiveTitle)) ?? 0) > 1,
    duplicateDescription:
      (descriptionCounts.get(normalizeDuplicate(item.effectiveDescription)) ??
        0) > 1,
  }));
}

function pageFallbackDescription(label: string) {
  return `${label} في موقع ELITE WORLD لمعدات وحلول المطاعم والمخابز والكافيهات.`;
}

export async function getAdminSeoDashboard() {
  const configurationIssue = getAdminDatabaseConfigurationIssue();
  if (configurationIssue) return getReadOnlyDashboard();

  try {
    const [products, categories, pages, media] = await Promise.all([
      getPrismaClient().product.findMany({
        select: {
          id: true,
          nameAr: true,
          slug: true,
          shortDescription: true,
          seoTitle: true,
          seoDescription: true,
          canonicalUrl: true,
          seoIndexable: true,
          ogTitle: true,
          ogDescription: true,
          ogImage: true,
          seoImageAlt: true,
        },
        orderBy: { sortOrder: "asc" },
      }),
      getPrismaClient().category.findMany({
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          seoTitle: true,
          seoDescription: true,
          canonicalUrl: true,
          seoIndexable: true,
          ogTitle: true,
          ogDescription: true,
          ogImage: true,
          seoImageAlt: true,
        },
        orderBy: { sortOrder: "asc" },
      }),
      getPageSeoRecords(),
      getAdminMediaOptions(),
    ]);

    const drafts: AuditDraft[] = [
      ...products.map((product) => {
        const seo = seoValues(product);
        return {
          key: `product:${product.id}`,
          type: "منتج" as const,
          label: product.nameAr,
          path: `/products/${product.slug}`,
          editHref: `/admin/products/${product.id}/edit`,
          effectiveTitle: seo.seoTitle ?? product.nameAr,
          effectiveDescription: seo.seoDescription ?? product.shortDescription,
          missing: missingFields(seo),
        };
      }),
      ...categories.map((category) => {
        const seo = seoValues(category);
        return {
          key: `category:${category.id}`,
          type: "قسم" as const,
          label: category.name,
          path: `/categories/${category.slug}`,
          editHref: `/admin/categories#category-${category.id}`,
          effectiveTitle: seo.seoTitle ?? category.name,
          effectiveDescription: seo.seoDescription ?? category.description,
          missing: missingFields(seo),
        };
      }),
      ...pages.map((page) => {
        const seo = seoValues(page.seo);
        return {
          key: `page:${page.path}`,
          type: "صفحة" as const,
          label: page.label,
          path: page.path,
          editHref: `/admin/seo#page-${encodeURIComponent(page.path)}`,
          effectiveTitle: seo.seoTitle ?? page.label,
          effectiveDescription:
            seo.seoDescription ?? pageFallbackDescription(page.label),
          missing: missingFields(seo),
        };
      }),
    ];

    return {
      items: finalizeAudit(drafts),
      pages: pages.map((page) => ({ ...page, values: seoValues(page.seo) })),
      media,
      aiEnabled: isSeoAiConfigured(),
      readOnly: false,
      message: null,
    };
  } catch {
    return getReadOnlyDashboard(
      "تعذر قراءة جداول SEO. شغّل Migration المرحلة الثامنة؛ الموقع ما زال يستخدم القيم التلقائية بأمان.",
    );
  }
}

async function getReadOnlyDashboard(message = fallbackMessage) {
  const drafts: AuditDraft[] = publicPageDefinitions.map((page) => ({
    key: `page:${page.path}`,
    type: "صفحة" as const,
    label: page.label,
    path: page.path,
    editHref: "/admin/seo",
    effectiveTitle: page.label,
    effectiveDescription: pageFallbackDescription(page.label),
    missing: missingFields(seoValues()),
  }));
  return {
    items: finalizeAudit(drafts),
    pages: publicPageDefinitions.map((page) => ({
      ...page,
      seo: null,
      values: seoValues(),
    })),
    media: [] as SiteMediaOption[],
    aiEnabled: isSeoAiConfigured(),
    readOnly: true,
    message,
  };
}
