import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import type { SeoMetadata } from "@/types";

function clean(value: string | null | undefined) {
  return value?.trim() || undefined;
}

export function absoluteSiteUrl(pathOrUrl: string) {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const path = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
  return `${siteConfig.url.replace(/\/$/, "")}${path}`;
}

export function buildSeoMetadata({
  seo,
  fallbackTitle,
  fallbackDescription,
  defaultPath,
  fallbackImage,
  fallbackImageAlt,
  forceNoIndex = false,
}: {
  seo?: SeoMetadata | null;
  fallbackTitle: string;
  fallbackDescription: string;
  defaultPath: string;
  fallbackImage?: string;
  fallbackImageAlt?: string;
  forceNoIndex?: boolean;
}): Metadata {
  const title = clean(seo?.title) ?? fallbackTitle;
  const description = clean(seo?.description) ?? fallbackDescription;
  const canonical = absoluteSiteUrl(clean(seo?.canonicalUrl) ?? defaultPath);
  const ogTitle = clean(seo?.ogTitle) ?? title;
  const ogDescription = clean(seo?.ogDescription) ?? description;
  const image = clean(seo?.ogImage) ?? fallbackImage;
  const index = !forceNoIndex && seo?.indexable !== false;

  return {
    title: { absolute: title },
    description,
    alternates: { canonical },
    robots: { index, follow: index },
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      url: canonical,
      images: image
        ? [
            {
              url: absoluteSiteUrl(image),
              alt: clean(seo?.imageAlt) ?? fallbackImageAlt ?? fallbackTitle,
            },
          ]
        : undefined,
    },
  };
}
