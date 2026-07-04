export const ADMIN_PAGE_SIZE = 30;

export type AdminPageItem = number | "ellipsis-start" | "ellipsis-end";

export function normalizeAdminPage(value: number | string | undefined) {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) && parsed >= 1 ? Math.floor(parsed) : 1;
}

export function getAdminPaginationItems(
  page: number,
  totalPages: number,
): AdminPageItem[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }
  if (page <= 4) return [1, 2, 3, 4, 5, "ellipsis-end", totalPages];
  if (page >= totalPages - 3) {
    return [
      1,
      "ellipsis-start",
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ];
  }
  return [
    1,
    "ellipsis-start",
    page - 1,
    page,
    page + 1,
    "ellipsis-end",
    totalPages,
  ];
}
