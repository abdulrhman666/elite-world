export const ADMIN_PAGE_SIZE = 30;

export function normalizeAdminPage(value: number | string | undefined) {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) && parsed >= 1 ? Math.floor(parsed) : 1;
}
