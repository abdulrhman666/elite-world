import { Search } from "lucide-react";
import { AdminMessage } from "@/components/admin/admin-message";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { Button, ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/feedback";
import { getAdminQuotes } from "@/lib/admin/commerce-admin";
import { quoteStatusLabel } from "@/lib/commerce/status";

export default async function AdminQuotesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const result = await getAdminQuotes(query, params.page);

  return (
    <div>
      <p className="text-brand-cyan text-sm font-bold">المبيعات</p>
      <h1 className="text-brand-ink mt-2 text-3xl font-bold">عروض الأسعار</h1>
      <p className="mt-2 text-sm text-slate-600">
        {result.records.length} نتيجة في الصفحة {result.page}
      </p>
      {result.message && (
        <div className="mt-6">
          <AdminMessage tone="error">{result.message}</AdminMessage>
        </div>
      )}
      <form
        action="/admin/quotes"
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
            placeholder="الاسم أو رقم الطلب أو الهاتف"
            className="border-brand-border min-h-12 w-full rounded-xl border ps-4 pe-12"
          />
        </label>
        <Button type="submit">بحث</Button>
        {query && (
          <ButtonLink href="/admin/quotes" variant="ghost">
            مسح
          </ButtonLink>
        )}
      </form>
      {result.records.length ? (
        <div className="border-brand-border mt-6 overflow-x-auto rounded-3xl border bg-white">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-brand-petroleum text-white">
              <tr>
                <th className="px-5 py-4 text-start">الاسم</th>
                <th className="px-5 py-4 text-start">الرقم</th>
                <th className="px-5 py-4 text-start">الحالة</th>
                <th className="px-5 py-4 text-start">الإجراء</th>
              </tr>
            </thead>
            <tbody>
              {result.records.map((quote) => (
                <tr key={quote.id} className="border-brand-border border-t">
                  <td className="px-5 py-4 font-semibold">
                    {quote.customerName}
                  </td>
                  <td className="font-latin px-5 py-4">{quote.number}</td>
                  <td className="px-5 py-4">
                    {quoteStatusLabel(quote.status)}
                  </td>
                  <td className="px-5 py-4">
                    <ButtonLink
                      href={`/admin/quotes/${quote.id}`}
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
            title="لا توجد عروض أسعار"
            description={
              result.page > 1
                ? "لا توجد نتائج في هذه الصفحة؛ ارجع إلى الصفحة السابقة."
                : result.readOnly
                  ? "فعّل PostgreSQL ثم طبّق Migration المرحلة التاسعة."
                  : "لم تصل طلبات بعد."
            }
          />
        </div>
      )}
      <AdminPagination
        basePath="/admin/quotes"
        query={query}
        page={result.page}
        hasNext={result.hasNext}
      />
    </div>
  );
}
