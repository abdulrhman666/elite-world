"use client";

import { FileText, ShoppingCart } from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";
import { submitCheckoutAction } from "@/app/checkout/actions";
import { useCart } from "@/components/cart/cart-provider";
import { Button, ButtonLink } from "@/components/ui/button";
import { Alert, EmptyState, LoadingSpinner } from "@/components/ui/feedback";
import { formatProductPrice } from "@/lib/catalog";

type CheckoutProduct = {
  slug: string;
  nameAr: string;
  sku: string;
  model: string;
  image: string;
  price: number | null;
  stockQuantity: number;
};

type CheckoutMode = "quote" | "order";

const controlClass =
  "border-brand-border focus:border-brand-cyan focus:ring-brand-cyan/15 min-h-12 w-full rounded-xl border bg-white px-4 text-sm text-brand-ink outline-none transition focus:ring-3";

function formatMoney(value: number) {
  return `${new Intl.NumberFormat("ar-SA-u-nu-latn", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)} ر.س`;
}

export function CheckoutForm({
  products,
  initialMode,
  serviceAvailable,
  serviceMessage,
  initialCustomer,
  isAuthenticated,
  deliveryEstimates,
}: {
  products: CheckoutProduct[];
  initialMode: CheckoutMode;
  serviceAvailable: boolean;
  serviceMessage: string | null;
  initialCustomer: {
    email: string;
    name: string;
    phone: string;
    city: string;
    address: string | null;
  } | null;
  isAuthenticated: boolean;
  deliveryEstimates: { riyadh: string; outsideRiyadh: string };
}) {
  const { items, hydrated } = useCart();
  const [mode, setMode] = useState<CheckoutMode>(initialMode);
  const productMap = useMemo(
    () => new Map(products.map((product) => [product.slug, product])),
    [products],
  );
  const {
    cartLines,
    hasMissingPrice,
    hasStockIssue,
    productsAllowDirectOrder,
    subtotal,
    itemsJson,
  } = useMemo(() => {
    const lines = items.flatMap((item) => {
      const product = productMap.get(item.slug);
      return product ? [{ ...item, product }] : [];
    });
    const missingPrice = lines.some((line) => line.product.price === null);
    const stockIssue = lines.some(
      (line) =>
        line.product.stockQuantity <= 0 ||
        line.quantity > line.product.stockQuantity,
    );
    return {
      cartLines: lines,
      hasMissingPrice: missingPrice,
      hasStockIssue: stockIssue,
      productsAllowDirectOrder:
        lines.length > 0 && !missingPrice && !stockIssue,
      subtotal: lines.reduce(
        (total, line) => total + (line.product.price ?? 0) * line.quantity,
        0,
      ),
      itemsJson: JSON.stringify(
        lines.map((line) => ({
          slug: line.slug,
          quantity: line.quantity,
        })),
      ),
    };
  }, [items, productMap]);

  const directOrderAllowed = productsAllowDirectOrder && isAuthenticated;
  const effectiveMode: CheckoutMode =
    mode === "order" && !productsAllowDirectOrder ? "quote" : mode;

  if (!hydrated) {
    return (
      <div className="border-brand-border mt-10 rounded-3xl border bg-white p-8 text-center">
        <LoadingSpinner label="جارٍ تجهيز الطلب" />
      </div>
    );
  }

  if (cartLines.length === 0) {
    return (
      <div className="mt-10">
        <EmptyState
          title="لا توجد منتجات لإكمال الطلب"
          description="أضف المنتجات إلى السلة أولاً ثم عد إلى صفحة إكمال الطلب."
        />
        <div className="mt-5 text-center">
          <ButtonLink href="/shop">العودة إلى المتجر</ButtonLink>
        </div>
      </div>
    );
  }

  return (
    <form
      action={submitCheckoutAction}
      className="mt-10 grid gap-7 lg:grid-cols-[1fr_380px] lg:items-start"
    >
      <input type="hidden" name="itemsJson" value={itemsJson} />
      <input type="hidden" name="intent" value={effectiveMode} />
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        aria-hidden
      />

      <div className="space-y-6">
        <fieldset className="border-brand-border rounded-3xl border bg-white p-5 sm:p-7">
          <legend className="text-brand-ink px-2 text-xl font-bold">
            نوع الطلب
          </legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <label
              className={`cursor-pointer rounded-2xl border p-5 transition ${
                effectiveMode === "order"
                  ? "border-brand-cyan bg-cyan-50/60"
                  : "border-brand-border"
              } ${!directOrderAllowed ? "cursor-not-allowed opacity-60" : ""}`}
            >
              <input
                type="radio"
                name="checkoutMode"
                value="order"
                checked={effectiveMode === "order"}
                disabled={!directOrderAllowed}
                onChange={() => setMode("order")}
                className="sr-only"
              />
              <ShoppingCart className="text-brand-cyan size-7" aria-hidden />
              <span className="text-brand-ink mt-3 block font-bold">
                طلب مباشر
              </span>
              <span className="mt-2 block text-sm leading-6 text-slate-600">
                إنشاء طلب مؤكد بالإجمالي الحالي دون دفع إلكتروني الآن.
              </span>
            </label>
            <label
              className={`cursor-pointer rounded-2xl border p-5 transition ${
                effectiveMode === "quote"
                  ? "border-brand-cyan bg-cyan-50/60"
                  : "border-brand-border"
              }`}
            >
              <input
                type="radio"
                name="checkoutMode"
                value="quote"
                checked={effectiveMode === "quote"}
                onChange={() => setMode("quote")}
                className="sr-only"
              />
              <FileText className="text-brand-cyan size-7" aria-hidden />
              <span className="text-brand-ink mt-3 block font-bold">
                طلب عرض سعر
              </span>
              <span className="mt-2 block text-sm leading-6 text-slate-600">
                مراجعة الأسعار والكميات والتواصل مع العميل قبل إنشاء الطلب.
              </span>
            </label>
          </div>
          {hasMissingPrice && (
            <Alert title="تم اختيار عرض السعر" className="mt-5">
              بعض المنتجات بلا سعر ثابت، لذلك لا يمكن إنشاء طلب مباشر لهذه السلة
              قبل تسعيرها.
            </Alert>
          )}
          {hasStockIssue && (
            <Alert title="الشراء المباشر غير متاح" className="mt-5">
              الكمية المطلوبة تتجاوز المخزون الحالي. يمكنك تعديل السلة أو إرسال
              طلب عرض سعر ليتم التواصل معك.
            </Alert>
          )}
          {effectiveMode === "order" && !isAuthenticated && (
            <Alert title="سجّل الدخول لإكمال الشراء" className="mt-5">
              <p>
                يتطلب الطلب المباشر حساب عميل مرتبطاً ببريد إلكتروني. يظل طلب
                عرض السعر متاحاً دون حساب.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <ButtonLink
                  href="/auth/login?next=%2Fcheckout%3Fmode%3Dorder"
                  size="sm"
                >
                  تسجيل الدخول
                </ButtonLink>
                <ButtonLink
                  href="/auth/register?next=%2Fcheckout%3Fmode%3Dorder"
                  variant="outline"
                  size="sm"
                >
                  إنشاء حساب
                </ButtonLink>
              </div>
            </Alert>
          )}
        </fieldset>

        <fieldset className="border-brand-border grid gap-5 rounded-3xl border bg-white p-5 sm:grid-cols-2 sm:p-7">
          <legend className="text-brand-ink px-2 text-xl font-bold">
            بيانات العميل
          </legend>
          <Field
            name="customerName"
            label="الاسم"
            defaultValue={initialCustomer?.name}
          />
          <Field
            name="phone"
            label="رقم الهاتف"
            dir="ltr"
            defaultValue={initialCustomer?.phone}
          />
          <Field
            name="city"
            label="المدينة"
            defaultValue={initialCustomer?.city}
          />
          {isAuthenticated && initialCustomer?.email && (
            <div className="rounded-xl border border-cyan-200 bg-cyan-50 p-4 sm:col-span-2">
              <p className="text-xs text-slate-500">البريد المرتبط بالطلب</p>
              <p
                className="font-latin text-brand-ink mt-1 font-semibold"
                dir="ltr"
              >
                {initialCustomer.email}
              </p>
            </div>
          )}
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

        {!serviceAvailable && (
          <Alert title="الخدمة غير متاحة حالياً">
            {serviceMessage} لم يتم حفظ أي بيانات وهمية.
          </Alert>
        )}
        <Button
          type="submit"
          size="lg"
          disabled={
            !serviceAvailable ||
            (effectiveMode === "order" && !directOrderAllowed)
          }
          className="w-full sm:w-auto"
        >
          {effectiveMode === "order"
            ? "تأكيد الطلب المباشر"
            : "إرسال طلب عرض السعر"}
        </Button>
      </div>

      <aside className="border-brand-border sticky top-44 rounded-3xl border bg-white p-6 shadow-sm">
        <h2 className="text-brand-ink text-xl font-bold">ملخص الطلب</h2>
        <div className="mt-5 space-y-4">
          {cartLines.map(({ product, quantity }) => (
            <div key={product.slug} className="flex gap-3">
              <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                <Image
                  src={product.image}
                  alt={product.nameAr}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-brand-ink line-clamp-2 text-sm font-bold">
                  {product.nameAr}
                </p>
                <p className="font-latin mt-1 text-xs text-slate-500">
                  {quantity} × {formatProductPrice(product.price)}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  المتاح: {product.stockQuantity}
                </p>
              </div>
            </div>
          ))}
        </div>
        <div className="border-brand-border mt-6 flex justify-between gap-4 border-t pt-5">
          <span className="font-semibold">
            {effectiveMode === "order" ? "الإجمالي" : "الإجمالي المبدئي"}
          </span>
          <span className="text-brand-petroleum font-bold">
            {hasMissingPrice ? "بعد التسعير" : formatMoney(subtotal)}
          </span>
        </div>
        <p className="mt-4 text-xs leading-6 text-slate-500">
          السعر المعروض للمنتجات فقط. تؤكد تكلفة الشحن وموعد التسليم قبل الدفع
          حسب المدينة والتوفر، وتظهر حالة الدفع في صفحة المتابعة.
        </p>
        <div className="mt-4 rounded-2xl bg-cyan-50 p-4 text-xs leading-6 text-cyan-950">
          <p>داخل الرياض: {deliveryEstimates.riyadh}</p>
          <p>خارج الرياض: {deliveryEstimates.outsideRiyadh}</p>
        </div>
        <ButtonLink href="/cart" variant="ghost" className="mt-5 w-full">
          تعديل السلة
        </ButtonLink>
      </aside>
    </form>
  );
}

function Field({
  name,
  label,
  dir,
  defaultValue,
}: {
  name: string;
  label: string;
  dir?: "ltr" | "rtl";
  defaultValue?: string;
}) {
  return (
    <label className="block">
      <span className="text-brand-ink mb-2 block text-sm font-semibold">
        {label}
      </span>
      <input
        name={name}
        required
        dir={dir}
        defaultValue={defaultValue}
        className={controlClass}
      />
    </label>
  );
}
