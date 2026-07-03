import "server-only";
import { getPrismaClient } from "@/lib/prisma";
import type { SiteMediaOption } from "@/types/site-settings";

export async function getAdminMediaOptions(): Promise<SiteMediaOption[]> {
  const images = await getPrismaClient().productImage.findMany({
    select: {
      path: true,
      altText: true,
      product: { select: { nameAr: true } },
    },
    orderBy: [{ product: { nameAr: "asc" } }, { sortOrder: "asc" }],
  });
  const unique = new Map<string, SiteMediaOption>();
  for (const image of images) {
    if (!unique.has(image.path)) {
      unique.set(image.path, {
        path: image.path,
        label: image.product.nameAr,
        altText: image.altText,
      });
    }
  }
  return [...unique.values()];
}
