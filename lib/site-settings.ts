import "server-only";
import { unstable_cache } from "next/cache";
import { cache } from "react";
import { getPrismaClient } from "@/lib/prisma";
import { getDefaultSiteSettings } from "@/lib/site-settings-defaults";
import type { SiteSettingsData } from "@/types/site-settings";

export { getDefaultSiteSettings } from "@/lib/site-settings-defaults";

export const SITE_SETTINGS_ID = 1;

export function isSiteSettingsDatabaseConfigured() {
  return Boolean(process.env.DATABASE_URL);
}

const readStoredSiteSettings = unstable_cache(
  () =>
    getPrismaClient().siteSettings.findUnique({
      where: { id: SITE_SETTINGS_ID },
    }),
  ["site-settings-v2"],
  { revalidate: 300, tags: ["site-settings"] },
);

export const getSiteSettings = cache(
  async function getSiteSettings(): Promise<SiteSettingsData> {
    const defaults = getDefaultSiteSettings();
    if (!isSiteSettingsDatabaseConfigured()) return defaults;

    try {
      const settings = await readStoredSiteSettings();
      if (!settings) return defaults;
      const { id: _id, updatedAt: _updatedAt, ...data } = settings;
      void _id;
      void _updatedAt;
      return data;
    } catch {
      return defaults;
    }
  },
);
