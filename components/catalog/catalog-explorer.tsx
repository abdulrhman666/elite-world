"use client";

import { RotateCcw, Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ProductCard } from "@/components/ui/product-card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/feedback";
import {
  filterCatalogProducts,
  suggestCatalogProducts,
  type AvailabilityFilter,
  type CatalogSort,
} from "@/lib/catalog";
import type { Category, Product } from "@/types";

const controlClass =
  "border-brand-border focus:border-brand-cyan focus:ring-brand-cyan/15 min-h-12 w-full rounded-xl border bg-white px-4 text-sm text-brand-ink outline-none transition focus:ring-3";
const PAGE_SIZE = 24;

export function CatalogExplorer({
  categories,
  products,
  mode = "shop",
  emptyTitle = "لا توجد منتجات محفوظة",
  emptyDescription = "ستظهر المنتجات هنا بعد إضافتها إلى قاعدة البيانات.",
}: {
  categories: Category[];
  products: Product[];
  mode?: "shop" | "search";
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const query = searchParams.get("q")?.trim() ?? "";
  const [draft, setDraft] = useState({ source: query, value: query });
  const draftQuery = draft.source === query ? draft.value : query;
  const setDraftQuery = (value: string) => setDraft({ source: query, value });
  const requestedCategory = searchParams.get("category") ?? "all";
  const category = categories.some((item) => item.slug === requestedCategory)
    ? requestedCategory
    : "all";
  const requestedAvailability = searchParams.get("availability") ?? "all";
  const availability: AvailabilityFilter = [
    "all",
    "in-stock",
    "on-request",
  ].includes(requestedAvailability)
    ? (requestedAvailability as AvailabilityFilter)
    : "all";
  const requestedSort = searchParams.get("sort") ?? "best-selling";
  const sort: CatalogSort = [
    "best-selling",
    "newest",
    "price",
    "name",
  ].includes(requestedSort)
    ? (requestedSort as CatalogSort)
    : "best-selling";

  const results = filterCatalogProducts({
    products,
    categories,
    query,
    category,
    availability,
    sort,
  });
  const suggestions = suggestCatalogProducts(products, draftQuery);
  const requestedPage = Number(searchParams.get("page") ?? "1");
  const totalPages = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
  const page = Number.isInteger(requestedPage)
    ? Math.min(Math.max(1, requestedPage), totalPages)
    : 1;
  const visibleResults = results.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  const updateParameter = (name: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (
      !value ||
      value === "all" ||
      (name === "sort" && value === "best-selling") ||
      (name === "page" && value === "1")
    ) {
      params.delete(name);
    } else {
      params.set(name, value);
    }
    if (name !== "page") params.delete("page");
    const nextQuery = params.toString();
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, {
      scroll: false,
    });
  };

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    updateParameter("q", String(formData.get("q") ?? "").trim());
  };

  const resetFilters = () => {
    setDraftQuery("");
    router.replace(pathname, { scroll: false });
  };

  return (
    <div>
      <form
        onSubmit={submitSearch}
        className="border-brand-border shadow-soft rounded-3xl border bg-white p-5 sm:p-6"
        role="search"
      >
        <div
          className={`grid gap-4 ${mode === "shop" ? "lg:grid-cols-[1.5fr_1fr_1fr_1fr_auto]" : "md:grid-cols-[1.8fr_1fr_auto]"}`}
        >
          <label className="block">
            <span className="text-brand-ink mb-2 block text-sm font-semibold">
              البحث في الكتالوج
            </span>
            <span className="relative block">
              <Search
                className="text-brand-petroleum pointer-events-none absolute top-1/2 right-4 size-5 -translate-y-1/2"
                aria-hidden
              />
              <input
                name="q"
                type="search"
                value={draftQuery}
                onChange={(event) => setDraftQuery(event.target.value)}
                list="catalog-search-suggestions"
                placeholder="الاسم، SKU، الموديل أو العلامة"
                className={`${controlClass} pe-12`}
              />
              <datalist id="catalog-search-suggestions">
                {suggestions.map((suggestion) => (
                  <option key={suggestion} value={suggestion} />
                ))}
              </datalist>
            </span>
          </label>

          <label className="block">
            <span className="text-brand-ink mb-2 block text-sm font-semibold">
              القسم
            </span>
            <select
              value={category}
              onChange={(event) =>
                updateParameter("category", event.target.value)
              }
              className={controlClass}
            >
              <option value="all">جميع الأقسام</option>
              {categories.map((item) => (
                <option key={item.slug} value={item.slug}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>

          {mode === "shop" && (
            <>
              <label className="block">
                <span className="text-brand-ink mb-2 block text-sm font-semibold">
                  حالة التوفر
                </span>
                <select
                  value={availability}
                  onChange={(event) =>
                    updateParameter("availability", event.target.value)
                  }
                  className={controlClass}
                >
                  <option value="all">كل الحالات</option>
                  <option value="in-stock">متوفر</option>
                  <option value="on-request">غير متوفر</option>
                </select>
              </label>

              <label className="block">
                <span className="text-brand-ink mb-2 block text-sm font-semibold">
                  الترتيب
                </span>
                <select
                  value={sort}
                  onChange={(event) =>
                    updateParameter("sort", event.target.value)
                  }
                  className={controlClass}
                >
                  <option value="best-selling">الأكثر مبيعاً</option>
                  <option value="newest">الأحدث</option>
                  <option value="price">السعر: الأقل أولاً</option>
                  <option value="name">الاسم</option>
                </select>
              </label>
            </>
          )}

          <div className="flex items-end gap-2">
            <Button type="submit" className="flex-1 lg:flex-none">
              بحث
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={resetFilters}
              aria-label="مسح البحث والفلاتر"
              title="مسح الفلاتر"
              icon={<RotateCcw className="size-4" aria-hidden />}
            />
          </div>
        </div>
      </form>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <p className="text-brand-ink font-semibold" aria-live="polite">
          {results.length} نتيجة
        </p>
        {(query ||
          category !== "all" ||
          availability !== "all" ||
          sort !== "best-selling" ||
          page > 1) && (
          <button
            type="button"
            onClick={resetFilters}
            className="text-brand-petroleum hover:text-brand-cyan focus-visible:ring-brand-cyan min-h-11 rounded-lg px-2 text-sm font-semibold focus-visible:ring-2 focus-visible:outline-none"
          >
            مسح الفلاتر
          </button>
        )}
      </div>

      {results.length > 0 ? (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-4">
          {visibleResults.map((product) => (
            <ProductCard key={product.slug} product={product} compact />
          ))}
        </div>
      ) : (
        <div className="mt-6">
          <EmptyState
            title={products.length === 0 ? emptyTitle : "لا توجد منتجات مطابقة"}
            description={
              products.length === 0
                ? emptyDescription
                : "جرّب كلمة بحث أخرى أو امسح الفلاتر الحالية."
            }
          />
          {query && suggestions.length > 0 && (
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <span className="text-sm text-slate-500">هل تقصد:</span>
              {suggestions.slice(0, 3).map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => {
                    setDraftQuery(suggestion);
                    updateParameter("q", suggestion);
                  }}
                  className="text-brand-petroleum text-sm font-bold underline"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {results.length > PAGE_SIZE && (
        <nav
          className="mt-8 flex items-center justify-center gap-3"
          aria-label="صفحات المنتجات"
        >
          <Button
            type="button"
            variant="outline"
            disabled={page <= 1}
            onClick={() => updateParameter("page", String(page - 1))}
          >
            السابق
          </Button>
          <span className="text-sm font-semibold text-slate-600">
            صفحة {page} من {totalPages}
          </span>
          <Button
            type="button"
            variant="outline"
            disabled={page >= totalPages}
            onClick={() => updateParameter("page", String(page + 1))}
          >
            التالي
          </Button>
        </nav>
      )}
    </div>
  );
}
