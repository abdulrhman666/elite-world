import { createProductAction } from "@/app/admin/actions";
import { AdminMessage } from "@/components/admin/admin-message";
import { AdminProductForm } from "@/components/admin/product-form";
import { ButtonLink } from "@/components/ui/button";
import { getAdminProductEditor } from "@/lib/admin/catalog-admin";

type NewProductPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function NewProductPage({
  searchParams,
}: NewProductPageProps) {
  const [editor, params] = await Promise.all([
    getAdminProductEditor(),
    searchParams,
  ]);

  return (
    <div>
      <p className="text-brand-cyan text-sm font-bold">المنتجات</p>
      <h1 className="text-brand-ink mt-2 text-3xl font-bold">إضافة منتج</h1>
      <p className="mt-2 text-sm text-slate-600">
        تُحفظ البيانات مباشرة في PostgreSQL.
      </p>

      <div className="mt-6 space-y-3">
        {editor.message && (
          <AdminMessage tone="error">{editor.message}</AdminMessage>
        )}
        {params.error && (
          <AdminMessage tone="error">{params.error}</AdminMessage>
        )}
      </div>

      <div className="mt-8">
        {editor.readOnly ? (
          <ButtonLink href="/admin/products" variant="secondary">
            العودة إلى المنتجات
          </ButtonLink>
        ) : (
          <AdminProductForm
            action={createProductAction}
            categories={editor.categories}
            brands={editor.brands}
            media={editor.media}
            aiEnabled={editor.aiEnabled}
          />
        )}
      </div>
    </div>
  );
}
