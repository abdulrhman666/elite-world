import { ButtonLink, buttonClasses } from "@/components/ui/button";
import {
  getAdminPaginationItems,
  type AdminPageItem,
} from "@/lib/admin/pagination";

export function AdminPagination({
  basePath,
  query,
  page,
  hasNext,
  totalPages,
}: {
  basePath: string;
  query: string;
  page: number;
  hasNext: boolean;
  totalPages?: number;
}) {
  if (page === 1 && !hasNext) return null;

  const hrefFor = (targetPage: number) => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (targetPage > 1) params.set("page", String(targetPage));
    const suffix = params.toString();
    return suffix ? `${basePath}?${suffix}` : basePath;
  };

  const pageItems = totalPages
    ? getAdminPaginationItems(page, totalPages)
    : ([] as AdminPageItem[]);

  return (
    <nav
      className="mt-6 flex flex-wrap items-center justify-between gap-3"
      aria-label="التنقل بين صفحات النتائج"
    >
      {page > 1 ? (
        <ButtonLink href={hrefFor(page - 1)} variant="outline" size="sm">
          السابق
        </ButtonLink>
      ) : (
        <span />
      )}
      {pageItems.length > 0 ? (
        <div
          className="flex flex-wrap items-center justify-center gap-2"
          dir="ltr"
        >
          {pageItems.map((item) =>
            typeof item === "number" ? (
              item === page ? (
                <span
                  key={item}
                  className={buttonClasses({
                    variant: "secondary",
                    size: "icon",
                  })}
                  aria-current="page"
                >
                  {item}
                </span>
              ) : (
                <ButtonLink
                  key={item}
                  href={hrefFor(item)}
                  variant="outline"
                  size="icon"
                  aria-label={`الانتقال إلى الصفحة ${item}`}
                >
                  {item}
                </ButtonLink>
              )
            ) : (
              <span
                key={item}
                className="grid size-8 place-items-center text-sm font-bold text-slate-400"
                aria-hidden
              >
                …
              </span>
            ),
          )}
        </div>
      ) : (
        <span className="text-sm font-semibold text-slate-600">
          الصفحة {page}
        </span>
      )}
      {hasNext ? (
        <ButtonLink href={hrefFor(page + 1)} variant="outline" size="sm">
          التالي
        </ButtonLink>
      ) : (
        <span />
      )}
    </nav>
  );
}
