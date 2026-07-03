import { Search } from "lucide-react";
import { AdminMessage } from "@/components/admin/admin-message";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { Button, ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/feedback";
import { getAdminOrders } from "@/lib/admin/commerce-admin";
import {
  orderSourceLabel,
  orderStatusLabel,
  paymentStatusLabel,
} from "@/lib/commerce/status";

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const result = await getAdminOrders(query, params.page);
  return (
    <div>
      <p className="text-brand-cyan text-sm font-bold">المبيعات</p>
      <h1 className="text-brand-ink mt-2 text-3xl font-bold">الطلبات</h1>
      <p className="mt-2 text-sm text-slate-600">
        {result.records.length} نتيجة في الصفحة {result.page}
      </p>
      {result.message && (
        <div className="mt-6">
          <AdminMessage tone="error">{result.message}</AdminMessage>
        </div>
      )}
      <form
        action="/admin/orders"
        className="border-brand-border mt-6 flex flex-col gap-3 rounded-2xl border bg-white p-4 sm:flex-row"
      >
        <label className="relative flex-1">
          <span className="sr-only">البحث</span>
          <Search
            className="pointer-events-none absolute top-1/2 right-4 size-5 -translate-y-1/2"
            aria-hidden
          />
          <input
            name="q"
            defaultValue={query}
            placeholder="الاسم أو رقم الطلب"
            className="border-brand-border min-h-12 w-full rounded-xl border ps-4 pe-12"
          />
        </label>
        <Button type="submit">بحث</Button>
        {query && (
          <ButtonLink href="/admin/orders" variant="ghost">
            مسح
          </ButtonLink>
        )}
      </form>
      {result.records.length ? (
        <div className="border-brand-border mt-6 overflow-x-auto rounded-3xl border bg-white">
          <table className="w-full min-w-[1400px] text-sm">
            <thead className="bg-brand-petroleum text-white">
              <tr>
                <th className="px-5 py-4 text-start">الاسم</th>
                <th className="px-5 py-4 text-start">الرقم</th>
                <th className="px-5 py-4 text-start">المصدر</th>
                <th className="px-5 py-4 text-start">الحالة</th>
                <th className="px-5 py-4 text-start">مدة التوصيل</th>
                <th className="px-5 py-4 text-start">مزود الدفع</th>
                <th className="px-5 py-4 text-start">حالة الدفع</th>
                <th className="px-5 py-4 text-start">مرجع العملية</th>
                <th className="px-5 py-4 text-start">المبلغ</th>
                <th className="px-5 py-4 text-start">Webhook</th>
                <th className="px-5 py-4 text-start">الإجراء</th>
              </tr>
            </thead>
            <tbody>
              {result.records.map((order) => (
                <tr key={order.id} className="border-brand-border border-t">
                  <td className="px-5 py-4 font-semibold">
                    {order.customerName}
                  </td>
                  <td className="font-latin px-5 py-4">{order.number}</td>
                  <td className="px-5 py-4">
                    {orderSourceLabel(order.source)}
                  </td>
                  <td className="px-5 py-4">
                    {orderStatusLabel(order.status)}
                  </td>
                  <td className="px-5 py-4">{order.deliveryEstimate ?? "—"}</td>
                  <td className="font-latin px-5 py-4">
                    {order.payment?.provider ?? "—"}
                  </td>
                  <td className="px-5 py-4">
                    {order.payment
                      ? paymentStatusLabel(order.payment.status)
                      : "—"}
                  </td>
                  <td className="font-latin px-5 py-4">
                    {order.payment?.providerRef ?? "—"}
                  </td>
                  <td className="px-5 py-4">
                    {order.payment ? formatMoney(order.payment.amount) : "—"}
                  </td>
                  <td className="px-5 py-4">
                    {order.payment?.webhookReceivedAt
                      ? "received"
                      : "not received"}
                  </td>
                  <td className="px-5 py-4">
                    <ButtonLink
                      href={`/admin/orders/${order.id}`}
                      variant="ghost"
                      size="sm"
                    >
                      التفاصيل
                    </ButtonLink>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mt-6">
          <EmptyState
            title="لا توجد طلبات"
            description={
              result.page > 1
                ? "لا توجد نتائج في هذه الصفحة؛ ارجع إلى الصفحة السابقة."
                : result.readOnly
                  ? "فعّل PostgreSQL ثم طبّق Migrations التجارة."
                  : "أنشئ طلباً مباشراً أو حوّل عرض سعر ليظهر هنا."
            }
          />
        </div>
      )}
      <AdminPagination
        basePath="/admin/orders"
        query={query}
        page={result.page}
        hasNext={result.hasNext}
      />
    </div>
  );
}

function formatMoney(value: unknown) {
  const amount = Number(value);
  return new Intl.NumberFormat("ar-SA", {
    style: "currency",
    currency: "SAR",
  }).format(Number.isFinite(amount) ? amount : 0);
}
