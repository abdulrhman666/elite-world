import "server-only";
import type { Prisma } from "@prisma/client";
import { cache } from "react";
import { isEditableContentPageSlug } from "@/data/content-pages";
import { getPrismaClient } from "@/lib/prisma";
import type { ContentPageData, ContentPageSection } from "@/types/content-page";

export function isContentPagesDatabaseConfigured() {
  return Boolean(process.env.DATABASE_URL);
}

export const getContentPage = cache(async function getContentPage(
  slug: string,
): Promise<ContentPageData | null> {
  if (!isEditableContentPageSlug(slug)) return null;
  if (!isContentPagesDatabaseConfigured()) return null;
  try {
    const record = await getPrismaClient().contentPage.findUnique({
      where: { slug },
    });
    if (!record) return null;
    return {
      slug: record.slug,
      title: record.title,
      eyebrow: record.eyebrow,
      heroTitle: record.heroTitle,
      heroDescription: record.heroDescription,
      heroImage: record.heroImage,
      sections: normalizeSections(record.sections),
      primaryCtaText: record.primaryCtaText,
      primaryCtaUrl: record.primaryCtaUrl,
      secondaryCtaText: record.secondaryCtaText,
      secondaryCtaUrl: record.secondaryCtaUrl,
    };
  } catch (error) {
    console.error("[content-pages:prisma] Content page query failed.", error);
    return null;
  }
});

export function sectionsToJson(sections: ContentPageSection[]) {
  return sections as unknown as Prisma.InputJsonValue;
}

function normalizeSections(value: Prisma.JsonValue) {
  if (!Array.isArray(value)) return [];
  const sections = value.filter(isContentPageSection);
  return sections;
}

function isContentPageSection(value: unknown): value is ContentPageSection {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const section = value as Record<string, unknown>;
  return (
    typeof section.id === "string" &&
    typeof section.title === "string" &&
    typeof section.description === "string" &&
    Array.isArray(section.items) &&
    section.items.every((item) => typeof item === "string") &&
    (section.image === null || typeof section.image === "string") &&
    new Set(["cards", "steps", "list"]).has(String(section.layout))
  );
}
