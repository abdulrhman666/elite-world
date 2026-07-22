"use client";

import { useMemo, useState } from "react";

type ProductOption = {
  id: string;
  nameAr: string;
  sku: string;
  category: { name: string };
};

export function ProductPicker({
  products,
  name,
  title,
}: {
  products: ProductOption[];
  name: string;
  title: string;
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const visible = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return products;
    return products.filter((product) =>
      `${product.nameAr} ${product.sku} ${product.category.name}`
        .toLowerCase()
        .includes(normalized),
    );
  }, [products, query]);

  function toggle(productId: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return next;
    });
  }

  return (
    <details className="border-brand-border rounded-2xl border">
      <summary className="text-brand-petroleum cursor-pointer p-4 text-sm font-bold">
        {title} <span className="text-slate-500">({selected.size})</span>
      </summary>
      <div className="border-brand-border border-t p-4">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="border-brand-border focus:border-brand-cyan min-h-11 flex-1 rounded-xl border px-4 text-sm outline-none"
            placeholder="ابحث بالاسم أو SKU أو التصنيف"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() =>
                setSelected(
                  (current) =>
                    new Set([
                      ...current,
                      ...visible.map((product) => product.id),
                    ]),
                )
              }
              className="border-brand-border text-brand-petroleum min-h-11 rounded-xl border px-3 text-xs font-bold"
            >
              تحديد الظاهر
            </button>
            <button
              type="button"
              onClick={() => setSelected(new Set())}
              className="border-brand-border min-h-11 rounded-xl border px-3 text-xs font-bold text-slate-600"
            >
              إلغاء الكل
            </button>
          </div>
        </div>
        <div className="grid max-h-96 gap-2 overflow-y-auto sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((product) => (
            <label
              key={product.id}
              className="bg-brand-surface flex items-start gap-3 rounded-xl p-3 text-sm"
            >
              <input
                type="checkbox"
                name={name}
                value={product.id}
                checked={selected.has(product.id)}
                onChange={() => toggle(product.id)}
                className="accent-brand-cyan mt-1 size-4"
              />
              <span>
                <strong className="text-brand-ink block">
                  {product.nameAr}
                </strong>
                <small className="font-latin text-slate-500">
                  {product.sku} · {product.category.name}
                </small>
              </span>
            </label>
          ))}
          {visible.length === 0 && (
            <p className="py-6 text-sm text-slate-500">
              لا توجد منتجات مطابقة.
            </p>
          )}
        </div>
      </div>
    </details>
  );
}
