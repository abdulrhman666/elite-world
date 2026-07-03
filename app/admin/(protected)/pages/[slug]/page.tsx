import { ArrowRight, Eye, FilePenLine } from "lucide-react";
import { notFound } from "next/navigation";
import { AdminMessage } from "@/components/admin/admin-message";
import { ContentPageForm } from "@/components/admin/content-page-form";
import { ButtonLink } from "@/components/ui/button";
import { getAdminContentPageEditor } from "@/lib/admin/content-pages-admin";

export default async function AdminContentPageEdit({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const editor = await getAdminContentPageEditor(slug);
  if (!editor) notFound();

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="bg-brand-cyan/10 text-brand-petroleum grid size-12 place-items-center rounded-2xl">
            <FilePenLine className="size-6" aria-hidden />
          </span>
          <div>
            <p className="text-brand-cyan text-sm font-bold">تعديل الصفحة</p>
            <h1 className="text-brand-ink mt-1 text-3xl font-bold">
              {editor.page.title}
            </h1>
          </div>
        </div>
        <div className="flex gap-2">
          <ButtonLink
            href="/admin/pages"
            variant="outline"
            size="sm"
            icon={<ArrowRight className="size-4" aria-hidden />}
          >
            كل الصفحات
          </ButtonLink>
          <ButtonLink
            href={`/${slug}`}
            variant="outline"
            size="sm"
            icon={<Eye className="size-4" aria-hidden />}
          >
            معاينة
          </ButtonLink>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {editor.message && (
          <AdminMessage tone="error">{editor.message}</AdminMessage>
        )}
        {query.success === "saved" && (
          <AdminMessage tone="success">
            تم حفظ الصفحة ونشر التغييرات مباشرة.
          </AdminMessage>
        )}
        {query.success === "restored" && (
          <AdminMessage tone="success">
            تمت استعادة المحتوى الافتراضي للصفحة.
          </AdminMessage>
        )}
        {query.error && <AdminMessage tone="error">{query.error}</AdminMessage>}
      </div>

      <ContentPageForm
        page={editor.page}
        media={editor.media}
        readOnly={editor.readOnly}
      />
    </div>
  );
}
