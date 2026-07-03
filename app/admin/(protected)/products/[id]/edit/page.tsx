import { notFound } from "next/navigation";
import { updateProductAction } from "@/app/admin/actions";
import { AdminMessage } from "@/components/admin/admin-message";
import { AdminProductForm } from "@/components/admin/product-form";
import { ProductMediaManager } from "@/components/admin/product-media-manager";
import { ButtonLink } from "@/components/ui/button";
import { getAdminProductEditor } from "@/lib/admin/catalog-admin";
import { getAdminProductMedia } from "@/lib/admin/media-admin";

type EditProductPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; success?: string }>;
};

const mediaSuccessMessages: Record<string, string> = {
  created: "تمت إضافة المنتج. يمكنك الآن رفع صوره.",
  "images-uploaded": "تم ضغط الصور وتحويلها إلى WebP ورفعها بنجاح.",
  "alt-updated": "تم حفظ Alt Text للصورة.",
  "primary-updated": "تم تغيير الصورة الرئيسية.",
  "order-updated": "تم تحديث ترتيب الصور.",
  "image-deleted": "تم حذف ارتباط الصورة بنجاح.",
};

export default async function EditProductPage({
  params,
  searchParams,
}: EditProductPageProps) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const [editor, media] = await Promise.all([
    getAdminProductEditor(id),
    getAdminProductMedia(id),
  ]);
  if (!editor.readOnly && !editor.product) notFound();

  return (
    <div>
      <p className="text-brand-cyan text-sm font-bold">المنتجات</p>
      <h1 className="text-brand-ink mt-2 text-3xl font-bold">تعديل المنتج</h1>

      <div className="mt-6 space-y-3">
        {editor.message && (
          <AdminMessage tone="error">{editor.message}</AdminMessage>
        )}
        {!editor.readOnly && media.message && (
          <AdminMessage tone="error">{media.message}</AdminMessage>
        )}
        {query.error && <AdminMessage tone="error">{query.error}</AdminMessage>}
        {query.success && mediaSuccessMessages[query.success] && (
          <AdminMessage tone="success">
            {mediaSuccessMessages[query.success]}
          </AdminMessage>
        )}
      </div>

      <div className="mt-8">
        {editor.readOnly || !editor.product ? (
          <ButtonLink href="/admin/products" variant="secondary">
            العودة إلى المنتجات
          </ButtonLink>
        ) : (
          <div className="space-y-12">
            <AdminProductForm
              action={updateProductAction.bind(null, id)}
              categories={editor.categories}
              brands={editor.brands}
              product={editor.product}
              media={editor.media}
              aiEnabled={editor.aiEnabled}
            />
            {!media.readOnly && (
              <ProductMediaManager productId={id} records={media.records} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
