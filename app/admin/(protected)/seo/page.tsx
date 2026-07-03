import { AlertTriangle, CheckCircle2, Copy, Search } from "lucide-react";
import Link from "next/link";
import { updatePageSeoAction } from "@/app/admin/actions";
import { AdminMessage } from "@/components/admin/admin-message";
import { SeoFields } from "@/components/admin/seo-fields";
import { Button } from "@/components/ui/button";
import { getAdminSeoDashboard } from "@/lib/admin/seo-admin";

type AdminSeoPageProps = {
  searchParams: Promise<{ success?: string; error?: string }>;
};

export default async function AdminSeoPage({
  searchParams,
}: AdminSeoPageProps) {
  const [dashboard, params] = await Promise.all([
    getAdminSeoDashboard(),
    searchParams,
  ]);
  const missing = dashboard.items.filter((item) => item.missing.length > 0);
  const duplicates = dashboard.items.filter(
    (item) => item.duplicateTitle || item.duplicateDescription,
  );

  return (
    <div>
      <p className="text-brand-cyan text-sm font-bold">تحسين الظهور</p>
      <h1 className="text-brand-ink mt-2 text-3xl font-bold">مركز SEO</h1>
      <p className="mt-2 text-sm leading-7 text-slate-600">
        القيم الفارغة تستخدم محتوى الصفحة تلقائياً، ويعرض المركز فرص التحسين
        والتكرار دون إجراء أي تعديل جماعي.
      </p>

      <div className="mt-6 space-y-3">
        {dashboard.message && (
          <AdminMessage tone="error">{dashboard.message}</AdminMessage>
        )}
        {params.success === "page-updated" && (
          <AdminMessage tone="success">
            تم حفظ SEO للصفحة وتحديث Metadata وSitemap.
          </AdminMessage>
        )}
        {params.error && (
          <AdminMessage tone="error">{params.error}</AdminMessage>
        )}
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <SummaryCard
          icon={Search}
          value={dashboard.items.length}
          label="عنصر مفحوص"
        />
        <SummaryCard
          icon={AlertTriangle}
          value={missing.length}
          label="يستخدم قيماً تلقائية"
          warning
        />
        <SummaryCard
          icon={Copy}
          value={duplicates.length}
          label="تكرار محتمل"
          warning={duplicates.length > 0}
        />
      </div>

      <section className="mt-10">
        <h2 className="text-brand-ink text-2xl font-bold">
          العناصر الناقصة أو المكررة
        </h2>
        {missing.length === 0 && duplicates.length === 0 ? (
          <div className="mt-5 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-900">
            <CheckCircle2 className="size-6" aria-hidden />
            لا توجد ملاحظات SEO حالياً.
          </div>
        ) : (
          <div className="border-brand-border mt-5 overflow-hidden rounded-3xl border bg-white">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead className="bg-brand-surface text-brand-ink">
                  <tr>
                    <th className="px-5 py-4 text-start">العنصر</th>
                    <th className="px-5 py-4 text-start">المسار</th>
                    <th className="px-5 py-4 text-start">الملاحظات</th>
                    <th className="px-5 py-4 text-start">الإجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-brand-border divide-y">
                  {dashboard.items
                    .filter(
                      (item) =>
                        item.missing.length > 0 ||
                        item.duplicateTitle ||
                        item.duplicateDescription,
                    )
                    .map((item) => (
                      <tr key={item.key}>
                        <td className="px-5 py-4">
                          <span className="text-brand-ink font-bold">
                            {item.label}
                          </span>
                          <span className="mt-1 block text-xs text-slate-500">
                            {item.type}
                          </span>
                        </td>
                        <td className="font-latin px-5 py-4 text-xs text-slate-500">
                          {item.path}
                        </td>
                        <td className="px-5 py-4 text-xs leading-6 text-amber-800">
                          {[
                            ...item.missing,
                            item.duplicateTitle ? "عنوان مكرر" : "",
                            item.duplicateDescription ? "وصف مكرر" : "",
                          ]
                            .filter(Boolean)
                            .join("، ")}
                        </td>
                        <td className="px-5 py-4">
                          <Link
                            href={item.editHref}
                            className="text-brand-petroleum font-bold hover:underline"
                          >
                            مراجعة
                          </Link>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      <section className="mt-12">
        <h2 className="text-brand-ink text-2xl font-bold">
          SEO الصفحات العامة
        </h2>
        <div className="mt-5 space-y-4">
          {dashboard.pages.map((page) => (
            <details
              key={page.path}
              id={`page-${encodeURIComponent(page.path)}`}
              className="border-brand-border rounded-3xl border bg-white p-5"
            >
              <summary className="text-brand-ink cursor-pointer font-bold">
                {page.label}
                <span className="font-latin me-3 text-xs font-normal text-slate-500">
                  {page.path}
                </span>
              </summary>
              {!dashboard.readOnly && (
                <form
                  action={updatePageSeoAction.bind(null, page.path)}
                  className="mt-6"
                >
                  <SeoFields
                    values={page.values}
                    fallbackTitle={page.label}
                    fallbackDescription={`${page.label} في موقع ELITE WORLD للمعدات والحلول الصناعية.`}
                    defaultPath={page.path}
                    entityType="page"
                    media={dashboard.media}
                    aiEnabled={dashboard.aiEnabled}
                  />
                  <Button type="submit" className="mt-5">
                    حفظ SEO الصفحة
                  </Button>
                </form>
              )}
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  value,
  label,
  warning = false,
}: {
  icon: typeof Search;
  value: number;
  label: string;
  warning?: boolean;
}) {
  return (
    <div className="border-brand-border rounded-3xl border bg-white p-5">
      <Icon
        className={`size-6 ${warning ? "text-amber-600" : "text-brand-cyan"}`}
        aria-hidden
      />
      <p className="text-brand-ink mt-4 text-3xl font-bold">{value}</p>
      <p className="mt-1 text-sm text-slate-600">{label}</p>
    </div>
  );
}
