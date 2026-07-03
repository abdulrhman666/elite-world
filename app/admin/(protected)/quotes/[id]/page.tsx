import { notFound } from "next/navigation";
import {
  convertQuoteAction,
  updateQuoteStatusAction,
} from "@/app/admin/commerce-actions";
import { AdminMessage } from "@/components/admin/admin-message";
import { Button, ButtonLink } from "@/components/ui/button";
import { getAdminQuote } from "@/lib/admin/commerce-admin";
import { quoteStatusOptions } from "@/lib/commerce/status";

export default async function AdminQuotePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const { id } = await params;
  const [result, messages] = await Promise.all([
    getAdminQuote(id),
    searchParams,
  ]);
  if (!result.record && !result.readOnly) notFound();

  return (
    <div>
      <ButtonLink href="/admin/quotes" variant="ghost" size="sm">
        العودة إلى العروض
      </ButtonLink>
      <h1 className="text-brand-ink mt-4 text-3xl font-bold">
        تفاصيل عرض السعر
      </h1>
      <div className="mt-5 space-y-3">
        {result.message && (
          <AdminMessage tone="error">{result.message}</AdminMessage>
        )}
        {messages.success === "status" && (
          <AdminMessage tone="success">تم تحديث الحالة.</AdminMessage>
        )}
        {messages.error && (
          <AdminMessage tone="error">{messages.error}</AdminMessage>
        )}
      </div>
      {result.record && (
        <>
          <section className="border-brand-border mt-6 grid gap-5 rounded-3xl border bg-white p-6 sm:grid-cols-2">
            <Value label="رقم الطلب" value={result.record.number} latin />
            <Value label="الاسم" value={result.record.customerName} />
            <Value label="الهاتف" value={result.record.phone} latin />
            <Value label="المدينة" value={result.record.city} />
            <Value
              label="الملاحظات"
              value={result.record.customerNotes || "لا توجد"}
            />
          </section>

          <section className="border-brand-border mt-6 rounded-3xl border bg-white p-6">
            <h2 className="text-brand-ink text-xl font-bold">المنتجات</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="bg-brand-surface">
                    <th className="px-4 py-3 text-start">المنتج</th>
                    <th className="px-4 py-3 text-start">SKU</th>
                    <th className="px-4 py-3 text-start">الكمية</th>
                  </tr>
                </thead>
                <tbody>
                  {result.record.items.map((item) => (
                    <tr key={item.id} className="border-brand-border border-t">
                      <td className="px-4 py-3 font-semibold">
                        {item.productName}
                      </td>
                      <td className="font-latin px-4 py-3">{item.sku}</td>
                      <td className="px-4 py-3">{item.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {!result.readOnly && (
            <section className="border-brand-border mt-6 flex flex-wrap items-end gap-4 rounded-3xl border bg-white p-6">
              <form
                action={updateQuoteStatusAction.bind(null, id)}
                className="flex flex-wrap items-end gap-3"
              >
                <label>
                  <span className="mb-2 block text-sm font-semibold">
                    الحالة
                  </span>
                  <select
                    name="status"
                    defaultValue={result.record.status}
                    className="border-brand-border min-h-12 rounded-xl border bg-white px-4"
                  >
                    {quoteStatusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <Button type="submit">حفظ الحالة</Button>
              </form>
              {result.record.order ? (
                <ButtonLink
                  href={`/admin/orders/${result.record.order.id}`}
                  variant="secondary"
                >
                  فتح الطلب {result.record.order.number}
                </ButtonLink>
              ) : (
                <form action={convertQuoteAction.bind(null, id)}>
                  <Button type="submit" variant="secondary">
                    تحويل إلى طلب
                  </Button>
                </form>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
}

function Value({
  label,
  value,
  latin = false,
}: {
  label: string;
  value: string;
  latin?: boolean;
}) {
  return (
    <div>
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd
        className={`${latin ? "font-latin" : ""} text-brand-ink mt-1 font-semibold`}
      >
        {value}
      </dd>
    </div>
  );
}
