import { notFound } from "next/navigation";
import {
  addOrderPaymentAction,
  updateOrderShippingAction,
  updateOrderTotalAction,
  updateOrderStatusAction,
  uploadInvoiceAction,
} from "@/app/admin/commerce-actions";
import { AdminMessage } from "@/components/admin/admin-message";
import { Button, ButtonLink } from "@/components/ui/button";
import { getAdminOrder } from "@/lib/admin/commerce-admin";
import {
  orderPaymentStatusLabel,
  orderSourceLabel,
  orderStatusOptions,
  paymentMethodLabel,
  paymentMethodOptions,
  paymentStatusLabel,
} from "@/lib/commerce/status";

export default async function AdminOrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const { id } = await params;
  const [result, messages] = await Promise.all([
    getAdminOrder(id),
    searchParams,
  ]);
  if (!result.record && !result.readOnly) notFound();
  return (
    <div>
      <ButtonLink href="/admin/orders" variant="ghost" size="sm">
        العودة إلى الطلبات
      </ButtonLink>
      <h1 className="text-brand-ink mt-4 text-3xl font-bold">تفاصيل الطلب</h1>
      <div className="mt-5 space-y-3">
        {result.message && (
          <AdminMessage tone="error">{result.message}</AdminMessage>
        )}
        {messages.success === "converted" && (
          <AdminMessage tone="success">
            تم تحويل عرض السعر إلى طلب.
          </AdminMessage>
        )}
        {messages.success === "status" && (
          <AdminMessage tone="success">تم تحديث حالة الطلب.</AdminMessage>
        )}
        {messages.success === "shipping" && (
          <AdminMessage tone="success">
            تم حفظ بيانات الشحن وتحديث صفحة تتبع العميل.
          </AdminMessage>
        )}
        {messages.success === "invoice" && (
          <AdminMessage tone="success">تم رفع الفاتورة.</AdminMessage>
        )}
        {messages.success === "total" && (
          <AdminMessage tone="success">تم تحديث إجمالي الطلب.</AdminMessage>
        )}
        {messages.success === "payment" && (
          <AdminMessage tone="success">تمت إضافة الدفعة.</AdminMessage>
        )}
        {messages.error && (
          <AdminMessage tone="error">{messages.error}</AdminMessage>
        )}
      </div>
      {result.record && (
        <>
          <section className="border-brand-border mt-6 grid gap-5 rounded-3xl border bg-white p-6 sm:grid-cols-2">
            <Value label="رقم الطلب" value={result.record.number} latin />
            <Value
              label="مصدر الطلب"
              value={orderSourceLabel(
                result.record.quote.number.startsWith("D-")
                  ? "DIRECT"
                  : "QUOTE",
              )}
            />
            <Value label="الاسم" value={result.record.customerName} />
            <Value label="الهاتف" value={result.record.phone} latin />
            <Value label="المدينة" value={result.record.city} />
            <Value
              label="بريد العميل"
              value={result.record.user?.email || "طلب بدون حساب"}
              latin={Boolean(result.record.user?.email)}
            />
            <Value
              label="ملاحظات العميل"
              value={result.record.customerNotes || "لا توجد"}
            />
            <Value
              label="إجمالي الطلب"
              value={formatMoney(result.record.totalAmount)}
            />
            <Value
              label="المدفوع"
              value={formatMoney(result.record.paidAmount)}
            />
            <Value
              label="حالة الدفع"
              value={orderPaymentStatusLabel(result.record.paymentStatus)}
            />
          </section>
          <section className="border-brand-border mt-6 rounded-3xl border bg-white p-6">
            <h2 className="text-brand-ink text-xl font-bold">المنتجات</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="bg-brand-surface">
                    <th className="px-4 py-3 text-start">المنتج</th>
                    <th className="px-4 py-3 text-start">الموديل</th>
                    <th className="px-4 py-3 text-start">الكمية</th>
                  </tr>
                </thead>
                <tbody>
                  {result.record.items.map((item) => (
                    <tr key={item.id} className="border-brand-border border-t">
                      <td className="px-4 py-3 font-semibold">
                        {item.productName}
                      </td>
                      <td className="font-latin px-4 py-3">{item.model}</td>
                      <td className="px-4 py-3">{item.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          <section className="border-brand-border mt-6 rounded-3xl border bg-white p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-brand-cyan text-sm font-bold">تتبع الطلب</p>
                <h2 className="text-brand-ink mt-1 text-xl font-bold">
                  الشحن والتوصيل
                </h2>
              </div>
              <span className="rounded-full bg-cyan-50 px-4 py-2 text-sm font-bold text-cyan-950">
                {orderStatusOptions.find(
                  (item) => item.value === result.record!.status,
                )?.label ?? result.record.status}
              </span>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              <Value
                label="المدة المتوقعة"
                value={result.record.deliveryEstimate || "غير محددة"}
              />
              <Value
                label="شركة الشحن"
                value={result.record.shippingCarrier || "لم تُحدد بعد"}
              />
              <Value
                label="رقم التتبع"
                value={result.record.trackingNumber || "لم يصدر بعد"}
                latin={Boolean(result.record.trackingNumber)}
              />
            </div>
            {!result.readOnly && (
              <form
                action={updateOrderShippingAction.bind(null, id)}
                className="border-brand-border mt-6 grid gap-4 border-t pt-6 sm:grid-cols-3"
              >
                <label>
                  <span className="mb-2 block text-sm font-semibold">
                    مدة التوصيل
                  </span>
                  <input
                    name="deliveryEstimate"
                    required
                    maxLength={120}
                    defaultValue={result.record.deliveryEstimate ?? ""}
                    placeholder="مثال: 3–7 أيام عمل"
                    className="border-brand-border min-h-12 w-full rounded-xl border px-4"
                  />
                </label>
                <label>
                  <span className="mb-2 block text-sm font-semibold">
                    شركة الشحن (اختياري)
                  </span>
                  <input
                    name="shippingCarrier"
                    maxLength={120}
                    defaultValue={result.record.shippingCarrier ?? ""}
                    className="border-brand-border min-h-12 w-full rounded-xl border px-4"
                  />
                </label>
                <label>
                  <span className="mb-2 block text-sm font-semibold">
                    رقم التتبع (اختياري)
                  </span>
                  <input
                    name="trackingNumber"
                    maxLength={160}
                    defaultValue={result.record.trackingNumber ?? ""}
                    dir="ltr"
                    className="border-brand-border min-h-12 w-full rounded-xl border px-4"
                  />
                </label>
                <div className="sm:col-span-3">
                  <Button type="submit">حفظ بيانات الشحن</Button>
                </div>
              </form>
            )}
          </section>
          {!result.readOnly && (
            <section className="border-brand-border mt-6 rounded-3xl border bg-white p-6">
              <h2 className="text-brand-ink text-xl font-bold">حالة الطلب</h2>
              <form
                action={updateOrderStatusAction.bind(null, id)}
                className="mt-4 flex flex-wrap items-end gap-3"
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
                    {orderStatusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="min-w-[260px] flex-1">
                  <span className="mb-2 block text-sm font-semibold">
                    ملاحظة إدارية (اختياري)
                  </span>
                  <input
                    name="adminNote"
                    maxLength={1000}
                    placeholder="سبب التغيير أو ملاحظة داخلية"
                    className="border-brand-border min-h-12 w-full rounded-xl border px-4"
                  />
                </label>
                <Button type="submit">حفظ الحالة</Button>
              </form>
            </section>
          )}
          <section className="border-brand-border mt-6 rounded-3xl border bg-white p-6">
            <h2 className="text-brand-ink text-xl font-bold">سجل الحالة</h2>
            {result.record.statusHistory.length ? (
              <ol className="mt-5 space-y-4">
                {result.record.statusHistory.map((entry) => (
                  <li
                    key={entry.id}
                    className="border-brand-border border-s-2 ps-4"
                  >
                    <p className="text-brand-ink font-bold">
                      {orderStatusOptions.find(
                        (item) => item.value === entry.status,
                      )?.label ?? entry.status}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {new Intl.DateTimeFormat("ar-SA", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(entry.createdAt)}
                    </p>
                    {entry.note && (
                      <p className="mt-2 text-sm text-slate-600">
                        {entry.note}
                      </p>
                    )}
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-4 text-sm text-slate-500">
                لا توجد تغييرات مسجلة بعد.
              </p>
            )}
          </section>
          <section className="border-brand-border mt-6 rounded-3xl border bg-white p-6">
            <h2 className="text-brand-ink text-xl font-bold">المدفوعات</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <Value
                label="إجمالي الطلب"
                value={formatMoney(result.record.totalAmount)}
              />
              <Value
                label="المدفوع"
                value={formatMoney(result.record.paidAmount)}
              />
              <Value
                label="المتبقي"
                value={formatMoney(
                  Math.max(
                    0,
                    Number(result.record.totalAmount) -
                      Number(result.record.paidAmount),
                  ),
                )}
              />
            </div>
            {!result.readOnly && (
              <div className="mt-6 grid gap-5 lg:grid-cols-2">
                <form
                  action={updateOrderTotalAction.bind(null, id)}
                  className="border-brand-border rounded-2xl border p-4"
                >
                  <h3 className="text-brand-ink font-bold">إجمالي الطلب</h3>
                  <label className="mt-4 block">
                    <span className="mb-2 block text-sm font-semibold">
                      المبلغ الإجمالي
                    </span>
                    <input
                      name="totalAmount"
                      inputMode="decimal"
                      defaultValue={String(result.record.totalAmount)}
                      className="border-brand-border min-h-12 w-full rounded-xl border px-4"
                    />
                  </label>
                  <Button type="submit" className="mt-4">
                    حفظ الإجمالي
                  </Button>
                </form>
                <form
                  action={addOrderPaymentAction.bind(null, id)}
                  className="border-brand-border rounded-2xl border p-4"
                >
                  <h3 className="text-brand-ink font-bold">إضافة دفعة</h3>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <label>
                      <span className="mb-2 block text-sm font-semibold">
                        المبلغ
                      </span>
                      <input
                        name="amount"
                        required
                        inputMode="decimal"
                        className="border-brand-border min-h-12 w-full rounded-xl border px-4"
                      />
                    </label>
                    <label>
                      <span className="mb-2 block text-sm font-semibold">
                        طريقة الدفع
                      </span>
                      <select
                        name="method"
                        className="border-brand-border min-h-12 w-full rounded-xl border bg-white px-4"
                      >
                        {paymentMethodOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <label className="mt-4 block">
                    <span className="mb-2 block text-sm font-semibold">
                      إثبات الدفع اختياري (PDF أو صورة)
                    </span>
                    <input
                      name="attachment"
                      type="file"
                      accept="application/pdf,.pdf,image/jpeg,image/png,image/webp"
                      className="border-brand-border w-full rounded-xl border p-3"
                    />
                  </label>
                  <Button type="submit" className="mt-4">
                    إضافة الدفعة
                  </Button>
                </form>
              </div>
            )}
            {result.record.payment ? (
              <div className="mt-6 overflow-x-auto">
                <table className="w-full min-w-[880px] text-sm">
                  <thead className="bg-brand-surface">
                    <tr>
                      <th className="px-4 py-3 text-start">المبلغ</th>
                      <th className="px-4 py-3 text-start">المزود</th>
                      <th className="px-4 py-3 text-start">مرجع العملية</th>
                      <th className="px-4 py-3 text-start">الطريقة</th>
                      <th className="px-4 py-3 text-start">الحالة</th>
                      <th className="px-4 py-3 text-start">Webhook</th>
                      <th className="px-4 py-3 text-start">التاريخ</th>
                      <th className="px-4 py-3 text-start">الإثبات</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-brand-border border-t">
                      <td className="px-4 py-3">
                        {formatMoney(result.record.payment.amount)}
                      </td>
                      <td className="font-latin px-4 py-3">
                        {result.record.payment.provider}
                      </td>
                      <td className="font-latin px-4 py-3">
                        {result.record.payment.providerRef || "—"}
                      </td>
                      <td className="px-4 py-3">
                        {result.record.payment.method
                          ? paymentMethodLabel(result.record.payment.method)
                          : "—"}
                      </td>
                      <td className="px-4 py-3">
                        {paymentStatusLabel(result.record.payment.status)}
                      </td>
                      <td className="px-4 py-3">
                        {result.record.payment.webhookReceivedAt
                          ? "received"
                          : "not received"}
                      </td>
                      <td className="px-4 py-3">
                        {result.record.payment.createdAt.toLocaleDateString(
                          "ar-SA",
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {result.record.payment.attachmentUrl ? (
                          <ButtonLink
                            href={`/admin/orders/${id}/payments/${result.record.payment.id}/attachment`}
                            variant="ghost"
                            size="sm"
                          >
                            تنزيل
                          </ButtonLink>
                        ) : (
                          "لا يوجد"
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-600">
                لا توجد دفعات مسجلة لهذا الطلب.
              </p>
            )}
          </section>
          <section className="border-brand-border mt-6 rounded-3xl border bg-white p-6">
            <h2 className="text-brand-ink text-xl font-bold">
              الفاتورة الخارجية
            </h2>
            {result.record.invoice ? (
              <div className="mt-4 flex flex-wrap items-center gap-4">
                <p>
                  رقم الفاتورة:{" "}
                  <strong>{result.record.invoice.invoiceNumber}</strong>
                </p>
                <ButtonLink
                  href={`/admin/orders/${id}/invoice`}
                  variant="outline"
                >
                  تنزيل PDF
                </ButtonLink>
              </div>
            ) : result.readOnly ? (
              <p className="mt-3 text-sm text-slate-600">
                لا توجد فاتورة مرفقة.
              </p>
            ) : (
              <form
                action={uploadInvoiceAction.bind(null, id)}
                className="mt-4 grid max-w-xl gap-4"
              >
                <label>
                  <span className="mb-2 block text-sm font-semibold">
                    رقم الفاتورة
                  </span>
                  <input
                    name="invoiceNumber"
                    required
                    maxLength={100}
                    className="border-brand-border min-h-12 w-full rounded-xl border px-4"
                  />
                </label>
                <label>
                  <span className="mb-2 block text-sm font-semibold">
                    ملف PDF (حتى 10 MB)
                  </span>
                  <input
                    name="file"
                    type="file"
                    required
                    accept="application/pdf,.pdf"
                    className="border-brand-border w-full rounded-xl border p-3"
                  />
                </label>
                <Button type="submit">رفع الفاتورة</Button>
              </form>
            )}
          </section>
        </>
      )}
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
