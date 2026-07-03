import "server-only";
import {
  defaultContentPages,
  editableContentPageSlugs,
  isEditableContentPageSlug,
} from "@/data/content-pages";
import { getAdminMediaOptions } from "@/lib/admin/media-options";
import {
  isContentPagesDatabaseConfigured,
  sectionsToJson,
} from "@/lib/content-pages";
import { getPrismaClient } from "@/lib/prisma";
import type { ContentPageData } from "@/types/content-page";
import type { SiteMediaOption } from "@/types/site-settings";

const setupMessage =
  "وضع القراءة مفعّل. صفحات المحتوى العامة تقرأ Prisma فقط، ويتاح الحفظ بعد ربط قاعدة بيانات الموقع.";
const connectionMessage =
  "تعذر الاتصال بمحتوى الصفحات المحفوظ في قاعدة البيانات.";

export async function getAdminContentPages() {
  if (!isContentPagesDatabaseConfigured()) {
    return {
      pages: editableContentPageSlugs.map((slug) => ({
        ...defaultContentPages[slug],
        customized: false,
      })),
      readOnly: true,
      message: setupMessage,
    };
  }
  try {
    const records = await getPrismaClient().contentPage.findMany({
      select: { slug: true },
    });
    const customized = new Set(records.map((record) => record.slug));
    return {
      pages: editableContentPageSlugs.map((slug) => ({
        ...defaultContentPages[slug],
        customized: customized.has(slug),
      })),
      readOnly: false,
      message: null,
    };
  } catch {
    return {
      pages: editableContentPageSlugs.map((slug) => ({
        ...defaultContentPages[slug],
        customized: false,
      })),
      readOnly: true,
      message: connectionMessage,
    };
  }
}

export async function getAdminContentPageEditor(slug: string) {
  if (!isEditableContentPageSlug(slug)) return null;
  const fallback = defaultContentPages[slug];
  if (!isContentPagesDatabaseConfigured()) {
    return {
      page: fallback,
      media: [] as SiteMediaOption[],
      readOnly: true,
      message: setupMessage,
    };
  }
  try {
    const [{ getContentPage }, media] = await Promise.all([
      import("@/lib/content-pages"),
      getAdminMediaOptions(),
    ]);
    const page = (await getContentPage(slug)) ?? fallback;
    return { page, media, readOnly: false, message: null };
  } catch {
    return {
      page: fallback,
      media: [] as SiteMediaOption[],
      readOnly: true,
      message: connectionMessage,
    };
  }
}

export async function updateAdminContentPage(input: ContentPageData) {
  if (!isContentPagesDatabaseConfigured()) throw new Error("READ_ONLY");
  if (!isEditableContentPageSlug(input.slug)) throw new Error("PAGE_NOT_FOUND");
  const data = {
    title: input.title,
    eyebrow: input.eyebrow,
    heroTitle: input.heroTitle,
    heroDescription: input.heroDescription,
    heroImage: input.heroImage,
    sections: sectionsToJson(input.sections),
    primaryCtaText: input.primaryCtaText,
    primaryCtaUrl: input.primaryCtaUrl,
    secondaryCtaText: input.secondaryCtaText,
    secondaryCtaUrl: input.secondaryCtaUrl,
  };
  return getPrismaClient().contentPage.upsert({
    where: { slug: input.slug },
    create: { slug: input.slug, ...data },
    update: data,
  });
}

export async function restoreDefaultContentPage(slug: string) {
  if (!isContentPagesDatabaseConfigured()) throw new Error("READ_ONLY");
  if (!isEditableContentPageSlug(slug)) throw new Error("PAGE_NOT_FOUND");
  const defaults = defaultContentPages[slug];
  const data = {
    title: defaults.title,
    eyebrow: defaults.eyebrow,
    heroTitle: defaults.heroTitle,
    heroDescription: defaults.heroDescription,
    heroImage: defaults.heroImage,
    sections: sectionsToJson(defaults.sections),
    primaryCtaText: defaults.primaryCtaText,
    primaryCtaUrl: defaults.primaryCtaUrl,
    secondaryCtaText: defaults.secondaryCtaText,
    secondaryCtaUrl: defaults.secondaryCtaUrl,
  };
  await getPrismaClient().contentPage.upsert({
    where: { slug },
    create: { slug, ...data },
    update: data,
  });
}
