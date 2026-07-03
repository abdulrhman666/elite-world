import "server-only";
import { getPrismaClient } from "@/lib/prisma";
import { isSiteSettingsDatabaseConfigured } from "@/lib/site-settings";

export async function getPermanentRedirect(sourcePath: string) {
  if (!isSiteSettingsDatabaseConfigured()) return null;
  try {
    return await getPrismaClient().slugRedirect.findUnique({
      where: { sourcePath },
      select: { destinationPath: true },
    });
  } catch {
    return null;
  }
}
