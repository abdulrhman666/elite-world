"use client";

import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import Image from "next/image";
import { useMemo } from "react";
import { useCart } from "@/components/cart/cart-provider";
import { Button, ButtonLink, buttonClasses } from "@/components/ui/button";
import { EmptyState, LoadingSpinner } from "@/components/ui/feedback";
import { formatProductPrice } from "@/lib/catalog";

type CartProduct = {
  slug: string;
  nameAr: string;
  sku: string;
  model: string;
  image: string;
  price: number | null;
  stockQuantity: number;
};

function formatMoney(value: number) {
  return `${new Intl.NumberFormat("ar-SA-u-nu-latn", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)} ر.س`;
}

export function CartPage({ products }: { products: CartProduct[] }) {
  const { items, hydrated, setQuantity, removeItem, clearCart } = useCart();
  const productMap = useMemo(
    () => new Map(products.map((product) => [product.slug, product])),
    [products],
  );
  const cartLines = items.flatMap((item) => {
    const product = productMap.get(item.slug);
    return product ? [{ ...item, product }] : [];
  });
  const hasMissingPrice = cartLines.some((line) => line.product.price === null);
  const hasStockIssue = cartLines.some(
    (line) =>
      line.product.stockQuantity <= 0 ||
      line.quantity > line.product.stockQuantity,
  );
  const subtotal = cartLines.reduce(
    (total, line) => total + (line.product.price ?? 0) * line.quantity,
    0,
  );

  if (!hydrated) {
    return (
      <div className="border-brand-border mt-10 rounded-3xl border bg-white p-8 text-center">
        <LoadingSpinner label="جارٍ تحميل السلة" />
      </div>
    );
  }

  if (cartLines.length === 0) {
    return (
      <div className="mt-10">
        <EmptyState
          title="السلة فارغة"
          description="أضف المنتجات المطلوبة من المتجر، ثم عد لإكمال الطلب أو طلب عرض سعر."
        />
        <div className="mt-5 text-center">
          <ButtonLink href="/shop" icon={<ShoppingBag className="size-4" />}>
            تصفح المنتجات
          </ButtonLink>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-10 grid gap-7 lg:grid-cols-[1fr_360px] lg:items-start">
      <section className="space-y-4">
        {cartLines.map(({ product, quantity }) => (
          <article
            key={product.slug}
            className="border-brand-border grid gap-4 rounded-3xl border bg-white p-4 sm:grid-cols-[110px_1fr_auto] sm:items-center"
          >
            <div className="relative aspect-square overflow-hidden rounded-2xl bg-slate-100">
              <Image
                src={product.image}
                alt={product.nameAr}
                fill
                sizes="110px"
                className="object-cover"
              />
            </div>
            <div>
              <h2 className="text-brand-ink text-lg font-bold">
                {product.nameAr}
              </h2>
              <p className="font-latin mt-1 text-xs text-slate-500">
                {product.sku} · {product.model}
              </p>
              <p className="text-brand-petroleum mt-3 font-bold">
                {formatProductPrice(product.price)}
              </p>
              <p className="mt-2 text-xs font-semibold text-slate-500">
                المتاح: {product.stockQuantity}
              </p>
            </div>
            <div className="flex items-center gap-2 sm:flex-col sm:items-end">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`تقليل كمية ${product.nameAr}`}
                  disabled={quantity <= 1 || product.stockQuantity <= 0}
                  onClick={() =>
                    setQuantity(
                      product.slug,
                      quantity - 1,
                      product.stockQuantity,
                    )
                  }
                  icon={<Minus className="size-4" aria-hidden />}
                />
                <input
                  type="number"
                  min="1"
                  max={Math.max(1, product.stockQuantity)}
                  value={quantity}
                  disabled={product.stockQuantity <= 0}
                  onChange={(event) =>
                    setQuantity(
                      product.slug,
                      Number(event.target.value),
                      product.stockQuantity,
                    )
                  }
                  className="border-brand-border font-latin h-11 w-20 rounded-xl border text-center"
                  aria-label={`كمية ${product.nameAr}`}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`زيادة كمية ${product.nameAr}`}
                  disabled={
                    product.stockQuantity <= 0 ||
                    quantity >= product.stockQuantity
                  }
                  onClick={() =>
                    setQuantity(
                      product.slug,
                      quantity + 1,
                      product.stockQuantity,
                    )
                  }
                  icon={<Plus className="size-4" aria-hidden />}
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeItem(product.slug)}
                icon={<Trash2 className="size-4 text-red-600" aria-hidden />}
              >
                حذف
              </Button>
            </div>
          </article>
        ))}
        <Button type="button" variant="ghost" onClick={clearCart}>
          تفريغ السلة
        </Button>
      </section>

      <aside className="border-brand-border sticky top-44 rounded-3xl border bg-white p-6 shadow-sm">
        <h2 className="text-brand-ink text-xl font-bold">ملخص السلة</h2>
        <div className="border-brand-border mt-5 flex justify-between border-b pb-4 text-sm">
          <span>عدد القطع</span>
          <span className="font-latin font-bold">
            {cartLines.reduce((total, line) => total + line.quantity, 0)}
          </span>
        </div>
        <div className="mt-4 flex justify-between gap-4">
          <span className="font-semibold">الإجمالي المبدئي</span>
          <span className="text-brand-petroleum font-bold">
            {hasMissingPrice ? "بعد التسعير" : formatMoney(subtotal)}
          </span>
        </div>
        <p className="mt-4 rounded-2xl bg-cyan-50 p-4 text-xs leading-6 text-slate-600">
          تكلفة الشحن وموعد التسليم يؤكدان معك قبل الدفع حسب المدينة وتوفر
          المنتجات.
        </p>
        {hasMissingPrice && (
          <p className="mt-4 rounded-2xl bg-amber-50 p-4 text-sm leading-6 text-amber-950">
            تحتوي السلة على منتجات بلا سعر ثابت. يمكنك إرسالها كطلب عرض سعر،
            بينما يتطلب الطلب المباشر أسعاراً محددة لجميع المنتجات.
          </p>
        )}
        {hasStockIssue && (
          <p className="mt-4 rounded-2xl bg-red-50 p-4 text-sm leading-6 text-red-900">
            كمية أحد المنتجات غير متوفرة للشراء المباشر. يمكنك خفض الكمية أو
            إرسال طلب عرض سعر.
          </p>
        )}
        <div className="mt-6 grid gap-3">
          {!hasMissingPrice && !hasStockIssue ? (
            <ButtonLink href="/checkout?mode=order" className="w-full">
              إكمال الطلب المباشر
            </ButtonLink>
          ) : (
            <span
              className={buttonClasses({ className: "w-full" })}
              aria-disabled="true"
              title="بعض المنتجات تحتاج إلى تسعير"
            >
              {hasStockIssue
                ? "الطلب غير متاح حتى تعديل الكمية"
                : "الطلب المباشر غير متاح"}
            </span>
          )}
          <ButtonLink
            href="/checkout?mode=quote"
            variant="outline"
            className="w-full"
          >
            طلب عرض سعر للسلة
          </ButtonLink>
          <ButtonLink href="/shop" variant="ghost" className="w-full">
            متابعة التسوق
          </ButtonLink>
        </div>
      </aside>
    </div>
  );
}
