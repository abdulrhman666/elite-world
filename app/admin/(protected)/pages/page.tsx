import { Eye, FileText, Pencil } from "lucide-react";
import { AdminMessage } from "@/components/admin/admin-message";
import { ButtonLink } from "@/components/ui/button";
import { getAdminContentPages } from "@/lib/admin/content-pages-admin";

export default async function AdminContentPagesPage() {
  const editor = await getAdminContentPages();
  return (
    <div>
      <div className="flex items-center gap-3">
        <span className="bg-brand-cyan/10 text-brand-petroleum grid size-12 place-items-center rounded-2xl">
          <FileText className="size-6" aria-hidden />
        </span>
        <div>
          <p className="text-brand-cyan text-sm font-bold">محتوى الموقع</p>
          <h1 className="text-brand-ink mt-1 text-3xl font-bold">
            إدارة الصفحات
          </h1>
        </div>
      </div>
      <p className="mt-4 max-w-3xl leading-7 text-slate-600">
        عدّل العناوين والنصوص والصور والأقسام والأزرار دون الحاجة إلى تعديل
        الكود.
      </p>

      {editor.message && (
        <div className="mt-6">
          <AdminMessage tone="error">{editor.message}</AdminMessage>
        </div>
      )}

      <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {editor.pages.map((page) => (
          <article
            key={page.slug}
            className="border-brand-border rounded-3xl border bg-white p-6"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-brand-cyan text-xs font-bold">
                  /{page.slug}
                </p>
                <h2 className="text-brand-ink mt-2 text-xl font-bold">
                  {page.title}
                </h2>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  page.customized
                    ? "bg-emerald-50 text-emerald-800"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {page.customized ? "مخصص" : "افتراضي"}
              </span>
            </div>
            <p className="mt-4 line-clamp-3 text-sm leading-7 text-slate-600">
              {page.heroDescription}
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <ButtonLink
                href={`/admin/pages/${page.slug}`}
                size="sm"
                icon={<Pencil className="size-4" aria-hidden />}
              >
                تعديل
              </ButtonLink>
              <ButtonLink
                href={`/${page.slug}`}
                size="sm"
                variant="outline"
                icon={<Eye className="size-4" aria-hidden />}
              >
                معاينة
              </ButtonLink>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
