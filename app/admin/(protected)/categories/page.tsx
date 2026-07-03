import {
  createCategoryAction,
  deleteCategoryAction,
  updateCategoryAction,
} from "@/app/admin/actions";
import { AdminCategoryForm } from "@/components/admin/category-form";
import { AdminMessage } from "@/components/admin/admin-message";
import { DeleteProductButton } from "@/components/admin/delete-product-button";
import { EmptyState } from "@/components/ui/feedback";
import { getAdminCategories } from "@/lib/admin/catalog-admin";

type AdminCategoriesPageProps = {
  searchParams: Promise<{ success?: string; error?: string }>;
};

const successMessages: Record<string, string> = {
  created: "تمت إضافة القسم بنجاح.",
  updated: "تم حفظ تعديلات القسم.",
  deleted: "تم حذف القسم بنجاح.",
};

export default async function AdminCategoriesPage({
  searchParams,
}: AdminCategoriesPageProps) {
  const [catalog, params] = await Promise.all([
    getAdminCategories(),
    searchParams,
  ]);

  return (
    <div>
      <p className="text-brand-cyan text-sm font-bold">الكتالوج</p>
      <h1 className="text-brand-ink mt-2 text-3xl font-bold">إدارة الأقسام</h1>
      <p className="mt-2 text-sm text-slate-600">
        {catalog.records.length} قسم
      </p>

      <div className="mt-6 space-y-3">
        {catalog.message && (
          <AdminMessage tone="error">{catalog.message}</AdminMessage>
        )}
        {params.success && successMessages[params.success] && (
          <AdminMessage tone="success">
            {successMessages[params.success]}
          </AdminMessage>
        )}
        {params.error && (
          <AdminMessage tone="error">{params.error}</AdminMessage>
        )}
      </div>

      {!catalog.readOnly && (
        <section className="border-brand-border mt-8 rounded-3xl border bg-white p-5 sm:p-7">
          <h2 className="text-brand-ink mb-5 text-xl font-bold">إضافة قسم</h2>
          <AdminCategoryForm
            action={createCategoryAction}
            media={catalog.media}
            aiEnabled={catalog.aiEnabled}
          />
        </section>
      )}

      {catalog.records.length > 0 ? (
        <div className="mt-8 space-y-4">
          {catalog.records.map((category) => (
            <article
              key={category.id}
              id={`category-${category.id}`}
              className="border-brand-border rounded-3xl border bg-white p-5 sm:p-6"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-brand-ink text-lg font-bold">
                      {category.name}
                    </h2>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                      {category.productCount} منتج
                    </span>
                  </div>
                  <p className="font-latin mt-1 text-sm text-slate-500">
                    {category.slug}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {category.description}
                  </p>
                </div>
                <p className="text-xs font-semibold text-slate-500">
                  الترتيب: {category.sortOrder}
                </p>
              </div>

              {!catalog.readOnly && (
                <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-5">
                  <details className="w-full">
                    <summary className="text-brand-petroleum cursor-pointer text-sm font-bold">
                      تعديل القسم
                    </summary>
                    <div className="mt-5">
                      <AdminCategoryForm
                        category={category}
                        action={updateCategoryAction.bind(null, category.id)}
                        media={catalog.media}
                        aiEnabled={catalog.aiEnabled}
                      />
                    </div>
                  </details>
                  {category.productCount > 0 ? (
                    <p className="text-xs font-semibold text-amber-700">
                      لا يمكن الحذف لأن القسم مرتبط بمنتجات.
                    </p>
                  ) : (
                    <DeleteProductButton
                      productName={category.name}
                      action={deleteCategoryAction.bind(null, category.id)}
                    />
                  )}
                </div>
              )}
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-8">
          <EmptyState
            title="لا توجد أقسام في قاعدة البيانات"
            description="اربط قاعدة البيانات أو أضف أول قسم من لوحة الإدارة."
          />
        </div>
      )}
    </div>
  );
}
