import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Container } from "@/components/ui/container";
import { Alert } from "@/components/ui/feedback";
import { getTrackingRecord } from "@/lib/commerce/public-service";
import {
  orderPaymentStatusLabel,
  orderStatusLabel,
  quoteStatusLabel,
} from "@/lib/commerce/status";

export const metadata: Metadata = {
  title: "متابعة الطلب",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function TrackingPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const record = await getTrackingRecord(token);
  if (!record) notFound();
  if (record.unavailable) {
    return (
      <section className="bg-brand-surface min-h-[65vh] py-12">
        <Container>
          <Breadcrumb current="متابعة الطلب" />
          <Alert title="الخدمة غير متاحة" className="mt-8">
            تعذر الاتصال بقاعدة البيانات حالياً. حاول لاحقاً.
          </Alert>
        </Container>
      </section>
    );
  }
  const status =
    record.type === "order"
      ? orderStatusLabel(record.status)
      : quoteStatusLabel(record.status);
  return (
    <section className="bg-brand-surface min-h-[65vh] py-12">
      <Container>
        <Breadcrumb current="متابعة الطلب" />
        <div className="border-brand-border mx-auto mt-8 max-w-3xl rounded-3xl border bg-white p-6 sm:p-9">
          <p className="text-brand-cyan text-sm font-bold">متابعة آمنة</p>
          <h1 className="text-brand-ink mt-2 text-3xl font-bold">
            {record.type === "order" ? "حالة الطلب" : "حالة عرض السعر"}
          </h1>
          <dl className="mt-7 grid gap-5 sm:grid-cols-2">
            <div>
              <dt className="text-xs text-slate-500">رقم الطلب</dt>
              <dd className="font-latin text-brand-ink mt-1 text-lg font-bold">
                {record.number}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">الحالة</dt>
              <dd className="text-brand-petroleum mt-1 text-lg font-bold">
                {status}
              </dd>
            </div>
          </dl>
          {record.type === "order" && (
            <div className="border-brand-border mt-7 grid gap-4 rounded-2xl border bg-cyan-50/50 p-5 sm:grid-cols-3">
              <div>
                <dt className="text-xs text-slate-500">مدة التوصيل المتوقعة</dt>
                <dd className="text-brand-petroleum mt-1 font-bold">
                  {record.deliveryEstimate || "سيتم تأكيدها قريباً"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">شركة الشحن</dt>
                <dd className="text-brand-ink mt-1 font-bold">
                  {record.shippingCarrier || "لم تُحدد بعد"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">رقم التتبع</dt>
                <dd
                  className="font-latin text-brand-ink mt-1 font-bold"
                  dir="ltr"
                >
                  {record.trackingNumber || "—"}
                </dd>
              </div>
            </div>
          )}
          {record.type === "order" && (
            <div className="border-brand-border mt-7 grid gap-4 rounded-2xl border p-5 sm:grid-cols-3">
              <div>
                <dt className="text-xs text-slate-500">حالة الدفع</dt>
                <dd className="text-brand-petroleum mt-1 font-bold">
                  {orderPaymentStatusLabel(record.paymentStatus)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">المدفوع</dt>
                <dd className="text-brand-ink mt-1 font-bold">
                  {formatMoney(record.paidAmount)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">المتبقي</dt>
                <dd className="text-brand-ink mt-1 font-bold">
                  {formatMoney(
                    Math.max(
                      0,
                      Number(record.totalAmount) - Number(record.paidAmount),
                    ),
                  )}
                </dd>
              </div>
            </div>
          )}
          {record.type === "order" && (
            <div className="mt-8">
              <h2 className="text-brand-ink text-xl font-bold">مراحل الطلب</h2>
              <ol className="mt-4 space-y-4">
                {(record.statusHistory.length
                  ? record.statusHistory
                  : [{ status: record.status, createdAt: new Date() }]
                ).map((entry, index) => (
                  <li
                    key={`${entry.status}-${entry.createdAt.toISOString()}-${index}`}
                    className="border-brand-border border-s-2 ps-4"
                  >
                    <p className="text-brand-ink font-bold">
                      {orderStatusLabel(entry.status)}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {new Intl.DateTimeFormat("ar-SA", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(entry.createdAt)}
                    </p>
                  </li>
                ))}
              </ol>
            </div>
          )}
          <h2 className="text-brand-ink mt-9 text-xl font-bold">المنتجات</h2>
          <div className="border-brand-border mt-4 overflow-hidden rounded-2xl border">
            <table className="w-full text-sm">
              <thead className="bg-brand-surface">
                <tr>
                  <th className="px-4 py-3 text-start">المنتج</th>
                  <th className="px-4 py-3 text-start">الكمية</th>
                </tr>
              </thead>
              <tbody>
                {record.items.map((item) => (
                  <tr
                    key={`${item.productSlug}-${item.sku}`}
                    className="border-brand-border border-t"
                  >
                    <td className="px-4 py-3 font-semibold">
                      {item.productName}
                    </td>
                    <td className="px-4 py-3">{item.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="bg-brand-surface mt-7 rounded-2xl p-5">
            <p className="text-xs text-slate-500">ملاحظات العميل</p>
            <p className="mt-2 leading-7 text-slate-700">
              {record.customerNotes || "لا توجد ملاحظات."}
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}

function formatMoney(value: unknown) {
  const amount = Number(value);
  return new Intl.NumberFormat("ar-SA", {
    style: "currency",
    currency: "SAR",
  }).format(Number.isFinite(amount) ? amount : 0);
}
