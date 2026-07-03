import Image from "next/image";
import Link from "next/link";
import { Search } from "lucide-react";
import { deleteProductImageAction } from "@/app/admin/actions";
import { AdminMessage } from "@/components/admin/admin-message";
import { MediaDeleteButton } from "@/components/admin/media-delete-button";
import { Button, ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/feedback";
import { getAdminMedia } from "@/lib/admin/media-admin";

type AdminMediaPageProps = {
  searchParams: Promise<{ q?: string; success?: string; error?: string }>;
};

function formatSize(sizeBytes: number | null) {
  if (!sizeBytes) return "الحجم غير مسجل";
  return `${(sizeBytes / 1024).toFixed(0)} KB`;
}

export default async function AdminMediaPage({
  searchParams,
}: AdminMediaPageProps) {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const media = await getAdminMedia(query);

  return (
    <div>
      <p className="text-brand-cyan text-sm font-bold">مكتبة الوسائط</p>
      <h1 className="text-brand-ink mt-2 text-3xl font-bold">صور المنتجات</h1>
      <p className="mt-2 text-sm text-slate-600">
        {media.records.length} صورة مستخدمة
      </p>

      <div className="mt-6 space-y-3">
        {media.message && (
          <AdminMessage tone="error">{media.message}</AdminMessage>
        )}
        {params.success === "image-deleted" && (
          <AdminMessage tone="success">
            تم حذف ارتباط الصورة بعد التأكيد.
          </AdminMessage>
        )}
        {params.error && (
          <AdminMessage tone="error">{params.error}</AdminMessage>
        )}
      </div>

      <form
        action="/admin/media"
        method="get"
        className="border-brand-border mt-6 flex flex-col gap-3 rounded-2xl border bg-white p-4 sm:flex-row"
      >
        <label className="relative flex-1">
          <span className="sr-only">البحث في الصور</span>
          <Search
            className="text-brand-petroleum pointer-events-none absolute top-1/2 right-4 size-5 -translate-y-1/2"
            aria-hidden
          />
          <input
            name="q"
            defaultValue={query}
            placeholder="اسم المنتج، SKU، Alt Text أو مسار الصورة"
            className="border-brand-border focus:border-brand-cyan min-h-12 w-full rounded-xl border ps-4 pe-12 outline-none"
          />
        </label>
        <Button type="submit">بحث</Button>
        {query && (
          <ButtonLink href="/admin/media" variant="ghost">
            مسح
          </ButtonLink>
        )}
      </form>

      {media.records.length > 0 ? (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {media.records.map((image) => (
            <article
              key={image.id}
              className="border-brand-border overflow-hidden rounded-3xl border bg-white"
            >
              <div className="relative aspect-[4/3] bg-slate-100">
                <Image
                  src={image.path}
                  alt={image.altText}
                  fill
                  sizes="(max-width: 640px) 100vw, 33vw"
                  className="object-contain"
                />
                {image.isPrimary && (
                  <span className="absolute top-3 right-3 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                    رئيسية
                  </span>
                )}
              </div>
              <div className="p-5">
                <Link
                  href={`/products/${image.productSlug}`}
                  className="text-brand-ink hover:text-brand-cyan font-bold"
                >
                  {image.productName}
                </Link>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {image.altText}
                </p>
                <p
                  className="font-latin mt-2 text-xs break-all text-slate-400"
                  dir="ltr"
                >
                  {image.path}
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  {formatSize(image.sizeBytes)}
                </p>
                <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                  {!media.readOnly && (
                    <>
                      <ButtonLink
                        href={`/admin/products/${image.productId}/edit`}
                        variant="ghost"
                        size="sm"
                      >
                        إدارة صور المنتج
                      </ButtonLink>
                      <MediaDeleteButton
                        returnTo="media"
                        productName={image.productName}
                        action={deleteProductImageAction.bind(
                          null,
                          image.id,
                          image.productId,
                        )}
                      />
                    </>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-8">
          <EmptyState
            title="لا توجد صور مطابقة"
            description="غيّر عبارة البحث أو أضف صوراً من صفحة تعديل المنتج."
          />
        </div>
      )}
    </div>
  );
}
