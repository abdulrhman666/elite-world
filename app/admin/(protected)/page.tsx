import {
  CheckCircle2,
  Database,
  CircleDollarSign,
  FileText,
  Package,
  Plus,
  Wrench,
} from "lucide-react";
import { AdminMessage } from "@/components/admin/admin-message";
import { ButtonLink } from "@/components/ui/button";
import { getAdminCatalogStats } from "@/lib/admin/catalog-admin";
import { getAdminCommerceStats } from "@/lib/admin/commerce-admin";
import { getAdminAnalytics } from "@/lib/admin/analytics";
import { getAdminSession } from "@/lib/admin/auth";

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const [catalog, commerce, analytics, session, params] = await Promise.all([
    getAdminCatalogStats(),
    getAdminCommerceStats(),
    getAdminAnalytics(),
    getAdminSession(),
    searchParams,
  ]);

  return (
    <div>
      <p className="text-brand-cyan text-sm font-bold">لوحة مصغّرة</p>
      <p className="mt-2 text-sm font-semibold text-slate-500">
        الصلاحية الحالية:{" "}
        {session?.role === "SUPER_ADMIN" ? "مدير النظام" : "مدير"}
      </p>
      {params.error === "forbidden" && (
        <div className="mt-5">
          <AdminMessage tone="error">
            هذه الصفحة أو العملية متاحة لمدير النظام فقط.
          </AdminMessage>
        </div>
      )}
      <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-brand-ink text-3xl font-bold sm:text-4xl">
            إدارة الكتالوج
          </h1>
          <p className="mt-3 text-slate-600">
            إدارة المنتجات والأقسام والعلامات التجارية عبر PostgreSQL.
          </p>
        </div>
        {!catalog.readOnly && (
          <ButtonLink
            href="/admin/products/new"
            icon={<Plus className="size-4" aria-hidden />}
          >
            منتج جديد
          </ButtonLink>
        )}
      </div>

      {catalog.message && (
        <div className="mt-6">
          <AdminMessage tone="error">{catalog.message}</AdminMessage>
        </div>
      )}

      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        <div className="border-brand-border rounded-3xl border bg-white p-6">
          <Package className="text-brand-cyan size-7" aria-hidden />
          <p className="text-brand-ink mt-4 text-3xl font-bold">
            {catalog.productCount}
          </p>
          <p className="mt-1 text-sm text-slate-600">منتج في الكتالوج</p>
        </div>
        <div className="border-brand-border rounded-3xl border bg-white p-6">
          <Database className="text-brand-cyan size-7" aria-hidden />
          <p className="text-brand-ink mt-4 text-lg font-bold">
            {catalog.readOnly ? "قراءة فقط" : "PostgreSQL متصل"}
          </p>
          <p className="mt-1 text-sm text-slate-600">
            {catalog.readOnly
              ? "لن تُنفذ أي عملية كتابة."
              : "عمليات CRUD مفعّلة."}
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardCard
          icon={Package}
          value={analytics.totalOrders}
          label="إجمالي الطلبات"
        />
        <DashboardCard
          icon={CircleDollarSign}
          value={formatMoney(analytics.revenue)}
          label="الإيرادات المحصلة"
        />
        <DashboardCard
          icon={FileText}
          value={commerce.newQuotes}
          label="عروض أسعار جديدة"
        />
        <DashboardCard
          icon={Wrench}
          value={commerce.activeOrders}
          label="طلبات قيد التنفيذ"
        />
        <DashboardCard
          icon={CheckCircle2}
          value={commerce.delivered}
          label="طلبات تم تسليمها"
        />
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <AnalyticsList
          title="المنتجات الأكثر طلباً"
          items={analytics.topProducts}
        />
        <AnalyticsList
          title="الأقسام الأكثر طلباً"
          items={analytics.topCategories}
        />
      </div>
      <section className="border-brand-border mt-5 rounded-3xl border bg-white p-6">
        <h2 className="text-brand-ink text-lg font-bold">
          الطلبات اليومية — آخر 14 يوماً
        </h2>
        <div className="mt-5 grid grid-cols-7 gap-2 sm:grid-cols-14">
          {analytics.dailyOrders.map((item) => (
            <div key={item.date} className="text-center">
              <div className="bg-brand-cyan/15 text-brand-petroleum grid min-h-12 place-items-center rounded-xl font-bold">
                {item.count}
              </div>
              <p className="mt-1 text-[10px] text-slate-500">
                {item.date.slice(5)}
              </p>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-8">
        <div className="flex flex-wrap gap-3">
          <ButtonLink href="/admin/quotes" variant="secondary">
            عروض الأسعار
          </ButtonLink>
          <ButtonLink href="/admin/orders" variant="secondary">
            الطلبات
          </ButtonLink>
          <ButtonLink href="/admin/customers" variant="secondary">
            العملاء
          </ButtonLink>
          <ButtonLink href="/admin/products" variant="secondary">
            عرض المنتجات
          </ButtonLink>
          <ButtonLink href="/admin/categories" variant="outline">
            إدارة الأقسام
          </ButtonLink>
          <ButtonLink href="/admin/brands" variant="outline">
            إدارة العلامات
          </ButtonLink>
          <ButtonLink href="/admin/media" variant="outline">
            مكتبة الصور
          </ButtonLink>
          {session?.role === "SUPER_ADMIN" && (
            <ButtonLink href="/admin/settings" variant="outline">
              إعدادات الموقع
            </ButtonLink>
          )}
          <ButtonLink href="/admin/pages" variant="outline">
            إدارة الصفحات
          </ButtonLink>
          <ButtonLink href="/admin/blog" variant="outline">
            إدارة المقالات
          </ButtonLink>
          {session?.role === "SUPER_ADMIN" && (
            <ButtonLink href="/admin/settings/payments" variant="outline">
              إعدادات الدفع
            </ButtonLink>
          )}
          <ButtonLink href="/admin/seo" variant="outline">
            مركز SEO
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}

function DashboardCard({
  icon: Icon,
  value,
  label,
}: {
  icon: typeof Package;
  value: number | string;
  label: string;
}) {
  return (
    <div className="border-brand-border rounded-3xl border bg-white p-6">
      <Icon className="text-brand-cyan size-7" aria-hidden />
      <p className="text-brand-ink mt-4 text-3xl font-bold">{value}</p>
      <p className="mt-1 text-sm text-slate-600">{label}</p>
    </div>
  );
}

function AnalyticsList({
  title,
  items,
}: {
  title: string;
  items: Array<{ name: string; quantity: number }>;
}) {
  return (
    <section className="border-brand-border rounded-3xl border bg-white p-6">
      <h2 className="text-brand-ink text-lg font-bold">{title}</h2>
      {items.length ? (
        <ol className="mt-4 space-y-3">
          {items.map((item, index) => (
            <li key={item.name} className="flex justify-between gap-3 text-sm">
              <span>
                {index + 1}. {item.name}
              </span>
              <strong>{item.quantity}</strong>
            </li>
          ))}
        </ol>
      ) : (
        <p className="mt-4 text-sm text-slate-500">لا توجد بيانات بعد.</p>
      )}
    </section>
  );
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("ar-SA", {
    style: "currency",
    currency: "SAR",
  }).format(value);
}
