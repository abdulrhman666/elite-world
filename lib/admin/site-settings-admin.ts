import "server-only";
import { getAdminMediaOptions } from "@/lib/admin/media-options";
import { getPrismaClient } from "@/lib/prisma";
import {
  getDefaultSiteSettings,
  isSiteSettingsDatabaseConfigured,
  SITE_SETTINGS_ID,
} from "@/lib/site-settings";
import type { SiteMediaOption, SiteSettingsData } from "@/types/site-settings";

const setupMessage =
  "وضع المعاينة مفعّل. يتاح حفظ إعدادات الموقع بعد ربط قاعدة بيانات الموقع.";
const connectionMessage =
  "تعذر الاتصال بقاعدة PostgreSQL. تُعرض قيم siteConfig للقراءة فقط حتى استعادة الاتصال.";

export async function getAdminSiteSettingsEditor() {
  if (!isSiteSettingsDatabaseConfigured()) {
    return {
      settings: getDefaultSiteSettings(),
      media: [] as SiteMediaOption[],
      readOnly: true,
      message: setupMessage,
    };
  }

  try {
    const [record, media] = await Promise.all([
      getPrismaClient().siteSettings.findUnique({
        where: { id: SITE_SETTINGS_ID },
      }),
      getAdminMediaOptions(),
    ]);
    const settings = record
      ? (({ id: _id, updatedAt: _updatedAt, ...values }) => {
          void _id;
          void _updatedAt;
          return values;
        })(record)
      : getDefaultSiteSettings();
    return { settings, media, readOnly: false, message: null };
  } catch {
    return {
      settings: getDefaultSiteSettings(),
      media: [] as SiteMediaOption[],
      readOnly: true,
      message: connectionMessage,
    };
  }
}

export async function updateSiteSettings(input: SiteSettingsData) {
  if (!isSiteSettingsDatabaseConfigured()) throw new Error("READ_ONLY");
  return getPrismaClient().siteSettings.upsert({
    where: { id: SITE_SETTINGS_ID },
    create: { id: SITE_SETTINGS_ID, ...input },
    update: input,
  });
}

export async function restoreDefaultSiteSettings() {
  return updateSiteSettings(getDefaultSiteSettings());
}
