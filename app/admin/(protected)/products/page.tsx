import { Edit3, Plus, Search } from "lucide-react";
import { deleteProductAction } from "@/app/admin/actions";
import { AdminMessage } from "@/components/admin/admin-message";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { DeleteProductButton } from "@/components/admin/delete-product-button";
import { Button, ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/feedback";
import { formatProductPrice, getAvailabilityLabel } from "@/lib/catalog";
import { getAdminProducts } from "@/lib/admin/catalog-admin";

type AdminProductsPageProps = {
  searchParams: Promise<{
    q?: string;
    page?: string;
    success?: string;
    error?: string;
  }>;
};

const successMessages: Record<string, string> = {
  created: "تمت إضافة المنتج بنجاح.",
  updated: "تم حفظ تعديلات المنتج.",
  deleted: "تم حذف المنتج بنجاح.",
};

export default async function AdminProductsPage({
  searchParams,
}: AdminProductsPageProps) {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const catalog = await getAdminProducts(query, params.page);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-brand-cyan text-sm font-bold">الكتالوج</p>
          <h1 className="text-brand-ink mt-2 text-3xl font-bold">المنتجات</h1>
          <p className="mt-2 text-sm text-slate-600">
            {catalog.products.length} نتيجة في الصفحة {catalog.page}
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

      <form
        action="/admin/products"
        method="get"
        className="border-brand-border mt-6 flex flex-col gap-3 rounded-2xl border bg-white p-4 sm:flex-row"
      >
        <label className="relative flex-1">
          <span className="sr-only">البحث في المنتجات</span>
          <Search
            className="text-brand-petroleum pointer-events-none absolute top-1/2 right-4 size-5 -translate-y-1/2"
            aria-hidden
          />
          <input
            name="q"
            defaultValue={query}
            placeholder="الاسم، SKU، الموديل أو القسم"
            className="border-brand-border focus:border-brand-cyan min-h-12 w-full rounded-xl border ps-4 pe-12 outline-none"
          />
        </label>
        <Button type="submit">بحث</Button>
        {query && (
          <ButtonLink href="/admin/products" variant="ghost">
            مسح
          </ButtonLink>
        )}
      </form>

      {catalog.products.length > 0 ? (
        <div className="border-brand-border mt-6 overflow-x-auto rounded-3xl border bg-white">
          <table className="w-full min-w-[980px] border-collapse text-sm">
            <thead className="bg-brand-petroleum text-white">
              <tr>
                <th className="px-5 py-4 text-start">المنتج</th>
                <th className="px-5 py-4 text-start">SKU</th>
                <th className="px-5 py-4 text-start">القسم</th>
                <th className="px-5 py-4 text-start">السعر</th>
                <th className="px-5 py-4 text-start">المخزون</th>
                <th className="px-5 py-4 text-start">التوفر</th>
                <th className="px-5 py-4 text-start">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {catalog.products.map((product) => (
                <tr key={product.id} className="border-brand-border border-t">
                  <td className="text-brand-ink px-5 py-4 font-semibold">
                    {product.nameAr}
                  </td>
                  <td className="font-latin px-5 py-4 text-slate-600">
                    {product.sku}
                  </td>
                  <td className="px-5 py-4 text-slate-600">
                    {product.category}
                  </td>
                  <td className="px-5 py-4 text-slate-600">
                    {formatProductPrice(product.price)}
                  </td>
                  <td className="font-latin px-5 py-4 font-bold text-slate-700">
                    {product.stockQuantity}
                  </td>
                  <td className="px-5 py-4 text-slate-600">
                    {getAvailabilityLabel(product.availability)}
                  </td>
                  <td className="px-5 py-4">
                    {catalog.readOnly ? (
                      <span className="text-xs font-semibold text-slate-400">
                        قراءة فقط
                      </span>
                    ) : (
                      <div className="flex items-center gap-1">
                        <ButtonLink
                          href={`/admin/products/${product.id}/edit`}
                          variant="ghost"
                          size="sm"
                          icon={<Edit3 className="size-4" aria-hidden />}
                        >
                          تعديل
                        </ButtonLink>
                        <DeleteProductButton
                          productName={product.nameAr}
                          action={deleteProductAction.bind(null, product.id)}
                        />
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mt-6">
          <EmptyState
            title="لا توجد منتجات"
            description={
              catalog.page > 1
                ? "لا توجد نتائج في هذه الصفحة؛ ارجع إلى الصفحة السابقة."
                : "غيّر عبارة البحث أو أضف منتجاً جديداً."
            }
          />
        </div>
      )}
      <AdminPagination
        basePath="/admin/products"
        query={query}
        page={catalog.page}
        hasNext={catalog.hasNext}
      />
    </div>
  );
}
