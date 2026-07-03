"use client";

import { Minus, Plus, Trash2 } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { submitQuoteAction } from "@/app/quote/actions";
import { QUOTE_DRAFT_STORAGE_KEY } from "@/components/quote/add-to-quote-button";
import { Button } from "@/components/ui/button";

type QuoteProduct = {
  slug: string;
  nameAr: string;
  sku: string;
  model: string;
  image: string;
};

type DraftItem = { slug: string; quantity: number };

const controlClass =
  "border-brand-border focus:border-brand-cyan focus:ring-brand-cyan/15 min-h-12 w-full rounded-xl border bg-white px-4 text-sm text-brand-ink outline-none transition focus:ring-3";

export function QuoteRequestForm({
  products,
  initialSlug,
}: {
  products: QuoteProduct[];
  initialSlug?: string;
}) {
  const [items, setItems] = useState<DraftItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [selectedSlug, setSelectedSlug] = useState(initialSlug ?? "");

  useEffect(() => {
    let cancelled = false;
    const frame = window.requestAnimationFrame(() => {
      if (cancelled) return;
      let stored: DraftItem[] = [];
      try {
        const parsed = JSON.parse(
          window.localStorage.getItem(QUOTE_DRAFT_STORAGE_KEY) ?? "[]",
        );
        if (Array.isArray(parsed)) stored = parsed;
      } catch {
        stored = [];
      }
      const valid = stored.filter((item) =>
        products.some((product) => product.slug === item.slug),
      );
      if (
        initialSlug &&
        products.some((product) => product.slug === initialSlug)
      ) {
        const existing = valid.find((item) => item.slug === initialSlug);
        if (!existing) valid.push({ slug: initialSlug, quantity: 1 });
      }
      setItems(valid);
      setHydrated(true);
    });

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frame);
    };
  }, [initialSlug, products]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(
        QUOTE_DRAFT_STORAGE_KEY,
        JSON.stringify(items),
      );
    } catch {
      // The form remains usable when local storage is unavailable.
    }
  }, [hydrated, items]);

  const productMap = useMemo(
    () => new Map(products.map((product) => [product.slug, product])),
    [products],
  );

  function addSelected() {
    if (!selectedSlug) return;
    setItems((current) => {
      const existing = current.find((item) => item.slug === selectedSlug);
      return existing
        ? current.map((item) =>
            item.slug === selectedSlug
              ? { ...item, quantity: Math.min(999, item.quantity + 1) }
              : item,
          )
        : [...current, { slug: selectedSlug, quantity: 1 }];
    });
  }

  function setQuantity(slug: string, quantity: number) {
    setItems((current) =>
      current.map((item) =>
        item.slug === slug
          ? { ...item, quantity: Math.max(1, Math.min(999, quantity)) }
          : item,
      ),
    );
  }

  return (
    <form action={submitQuoteAction} className="space-y-8">
      <input type="hidden" name="itemsJson" value={JSON.stringify(items)} />
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        aria-hidden
      />

      <fieldset className="border-brand-border rounded-3xl border bg-white p-5 sm:p-7">
        <legend className="text-brand-ink px-2 text-xl font-bold">
          المنتجات والكميات
        </legend>
        <div className="flex flex-col gap-3 sm:flex-row">
          <select
            value={selectedSlug}
            onChange={(event) => setSelectedSlug(event.target.value)}
            className={`${controlClass} flex-1`}
          >
            <option value="">اختر منتجاً لإضافته</option>
            {products.map((product) => (
              <option key={product.slug} value={product.slug}>
                {product.nameAr} — {product.model}
              </option>
            ))}
          </select>
          <Button type="button" onClick={addSelected} disabled={!selectedSlug}>
            إضافة المنتج
          </Button>
        </div>

        {items.length === 0 ? (
          <p className="border-brand-border mt-5 rounded-2xl border border-dashed p-6 text-center text-sm text-slate-600">
            أضف منتجاً واحداً على الأقل لإرسال الطلب.
          </p>
        ) : (
          <div className="mt-6 space-y-3">
            {items.map((item) => {
              const product = productMap.get(item.slug);
              if (!product) return null;
              return (
                <div
                  key={item.slug}
                  className="border-brand-border grid items-center gap-4 rounded-2xl border p-4 sm:grid-cols-[72px_1fr_auto]"
                >
                  <div className="relative size-18 overflow-hidden rounded-xl bg-slate-100">
                    <Image
                      src={product.image}
                      alt={product.nameAr}
                      fill
                      sizes="72px"
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <p className="text-brand-ink font-bold">{product.nameAr}</p>
                    <p className="font-latin mt-1 text-xs text-slate-500">
                      {product.sku} · {product.model}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="تقليل الكمية"
                      onClick={() => setQuantity(item.slug, item.quantity - 1)}
                      icon={<Minus className="size-4" aria-hidden />}
                    />
                    <input
                      type="number"
                      min="1"
                      max="999"
                      value={item.quantity}
                      onChange={(event) =>
                        setQuantity(item.slug, Number(event.target.value))
                      }
                      className="border-brand-border font-latin h-11 w-20 rounded-xl border text-center"
                      aria-label={`كمية ${product.nameAr}`}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="زيادة الكمية"
                      onClick={() => setQuantity(item.slug, item.quantity + 1)}
                      icon={<Plus className="size-4" aria-hidden />}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`حذف ${product.nameAr}`}
                      onClick={() =>
                        setItems((current) =>
                          current.filter((value) => value.slug !== item.slug),
                        )
                      }
                      icon={
                        <Trash2 className="size-4 text-red-600" aria-hidden />
                      }
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </fieldset>

      <fieldset className="border-brand-border grid gap-5 rounded-3xl border bg-white p-5 sm:grid-cols-2 sm:p-7">
        <legend className="text-brand-ink px-2 text-xl font-bold">
          بيانات العميل
        </legend>
        <Field name="customerName" label="الاسم" />
        <Field name="phone" label="الهاتف" dir="ltr" />
        <Field name="city" label="المدينة" />
        <label className="block sm:col-span-2">
          <span className="text-brand-ink mb-2 block text-sm font-semibold">
            ملاحظات العميل (اختياري)
          </span>
          <textarea
            name="customerNotes"
            rows={5}
            className={`${controlClass} py-3`}
          />
        </label>
      </fieldset>

      <Button type="submit" size="lg" disabled={items.length === 0}>
        إرسال طلب عرض السعر
      </Button>
    </form>
  );
}

function Field({
  name,
  label,
  required = true,
  dir,
  className = "",
}: {
  name: string;
  label: string;
  required?: boolean;
  dir?: "ltr" | "rtl";
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="text-brand-ink mb-2 block text-sm font-semibold">
        {label}
      </span>
      <input
        name={name}
        type="text"
        required={required}
        dir={dir}
        className={controlClass}
      />
    </label>
  );
}
