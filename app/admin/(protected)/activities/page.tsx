import { createActivityAction, deleteActivityAction, updateActivityAction } from "@/app/admin/activities/actions";
import { ActivityForm } from "@/components/admin/activity-form";
import { AdminMessage } from "@/components/admin/admin-message";
import { DeleteProductButton } from "@/components/admin/delete-product-button";
import { EmptyState } from "@/components/ui/feedback";
import { getAdminActivities } from "@/lib/admin/activities-admin";

export default async function AdminActivitiesPage({ searchParams }: { searchParams: Promise<{ success?: string; error?: string }> }) {
  const [data, params] = await Promise.all([getAdminActivities(), searchParams]);
  return (
    <div>
      <p className="text-brand-cyan text-sm font-bold">المحتوى والكتالوج</p>
      <h1 className="text-brand-ink mt-2 text-3xl font-bold">التسوق حسب النشاط</h1>
      <p className="mt-2 text-sm text-slate-600">أضف صفحات الأنشطة واربط كل نشاط بالمنتجات المناسبة دون تعديل الكود.</p>
      <div className="mt-6 space-y-3">
        {data.message && <AdminMessage tone="error">{data.message}</AdminMessage>}
        {params.success && <AdminMessage tone="success">تم حفظ التغيير بنجاح.</AdminMessage>}
        {params.error && <AdminMessage tone="error">{params.error}</AdminMessage>}
      </div>
      {!data.readOnly && (
        <details className="border-brand-border mt-8 rounded-3xl border bg-white p-5 sm:p-7">
          <summary className="text-brand-petroleum cursor-pointer text-lg font-bold">إضافة نشاط جديد</summary>
          <div className="mt-6"><ActivityForm action={createActivityAction} products={data.products} /></div>
        </details>
      )}
      {data.records.length > 0 ? (
        <div className="mt-8 space-y-5">
          {data.records.map((activity) => (
            <article key={activity.id} className="border-brand-border rounded-3xl border bg-white p-5 sm:p-7">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div><h2 className="text-brand-ink text-xl font-bold">{activity.name}</h2><p className="font-latin mt-1 text-sm text-slate-500">/activities/{activity.slug}</p><p className="mt-2 text-xs font-semibold text-slate-500">{activity.productLinks.length} منتج · {activity.published ? "منشور" : "مسودة"}</p></div>
                <DeleteProductButton productName={activity.name} action={deleteActivityAction.bind(null, activity.id)} />
              </div>
              <details className="mt-5 border-t border-slate-100 pt-5">
                <summary className="text-brand-petroleum cursor-pointer font-bold">تعديل النشاط والمنتجات</summary>
                <div className="mt-6"><ActivityForm action={updateActivityAction.bind(null, activity.id)} products={data.products} activity={activity} /></div>
              </details>
            </article>
          ))}
        </div>
      ) : <div className="mt-8"><EmptyState title="لا توجد أنشطة" description="طبّق Migration ثم أضف أول نشاط من النموذج أعلاه." /></div>}
    </div>
  );
}
