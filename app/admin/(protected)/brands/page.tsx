import {
  createBrandAction,
  deleteBrandAction,
  updateBrandAction,
} from "@/app/admin/actions";
import { AdminMessage } from "@/components/admin/admin-message";
import { AdminBrandForm } from "@/components/admin/brand-form";
import { DeleteProductButton } from "@/components/admin/delete-product-button";
import { EmptyState } from "@/components/ui/feedback";
import { getAdminBrands } from "@/lib/admin/catalog-admin";

type AdminBrandsPageProps = {
  searchParams: Promise<{ success?: string; error?: string }>;
};

const successMessages: Record<string, string> = {
  created: "تمت إضافة العلامة التجارية بنجاح.",
  updated: "تم حفظ تعديلات العلامة التجارية.",
  deleted: "تم حذف العلامة التجارية بنجاح.",
};

export default async function AdminBrandsPage({
  searchParams,
}: AdminBrandsPageProps) {
  const [catalog, params] = await Promise.all([getAdminBrands(), searchParams]);

  return (
    <div>
      <p className="text-brand-cyan text-sm font-bold">الكتالوج</p>
      <h1 className="text-brand-ink mt-2 text-3xl font-bold">
        العلامات التجارية
      </h1>
      <p className="mt-2 text-sm text-slate-600">
        {catalog.records.length} علامة
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
          <h2 className="text-brand-ink mb-5 text-xl font-bold">
            إضافة علامة تجارية
          </h2>
          <AdminBrandForm action={createBrandAction} />
        </section>
      )}

      {catalog.records.length > 0 ? (
        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          {catalog.records.map((brand) => (
            <article
              key={brand.id}
              className="border-brand-border rounded-3xl border bg-white p-5 sm:p-6"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-brand-ink text-lg font-bold">
                    {brand.name}
                  </h2>
                  {brand.origin && (
                    <p className="mt-1 text-sm text-slate-500">
                      {brand.origin}
                    </p>
                  )}
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                  {brand.productCount} منتج
                </span>
              </div>
              {brand.description && (
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {brand.description}
                </p>
              )}

              {!catalog.readOnly && (
                <div className="mt-5 border-t border-slate-100 pt-5">
                  <details>
                    <summary className="text-brand-petroleum cursor-pointer text-sm font-bold">
                      تعديل العلامة
                    </summary>
                    <div className="mt-5">
                      <AdminBrandForm
                        brand={brand}
                        action={updateBrandAction.bind(null, brand.id)}
                      />
                    </div>
                  </details>
                  <div className="mt-4">
                    {brand.productCount > 0 ? (
                      <p className="text-xs font-semibold text-amber-700">
                        لا يمكن الحذف لأن العلامة مرتبطة بمنتجات.
                      </p>
                    ) : (
                      <DeleteProductButton
                        productName={brand.name}
                        action={deleteBrandAction.bind(null, brand.id)}
                      />
                    )}
                  </div>
                </div>
              )}
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-8">
          <EmptyState
            title="لا توجد علامات تجارية في قاعدة البيانات"
            description="اربط قاعدة البيانات أو أضف أول علامة من لوحة الإدارة."
          />
        </div>
      )}
    </div>
  );
}
