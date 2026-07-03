import { ButtonLink } from "@/components/ui/button";

export function AdminPagination({
  basePath,
  query,
  page,
  hasNext,
}: {
  basePath: string;
  query: string;
  page: number;
  hasNext: boolean;
}) {
  if (page === 1 && !hasNext) return null;

  const hrefFor = (targetPage: number) => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (targetPage > 1) params.set("page", String(targetPage));
    const suffix = params.toString();
    return suffix ? `${basePath}?${suffix}` : basePath;
  };

  return (
    <nav
      className="mt-6 flex items-center justify-between gap-4"
      aria-label="التنقل بين صفحات النتائج"
    >
      {page > 1 ? (
        <ButtonLink href={hrefFor(page - 1)} variant="outline" size="sm">
          السابق
        </ButtonLink>
      ) : (
        <span />
      )}
      <span className="text-sm font-semibold text-slate-600">
        الصفحة {page}
      </span>
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
