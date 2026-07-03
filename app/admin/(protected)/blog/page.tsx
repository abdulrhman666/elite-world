import { deleteBlogPostAction } from "@/app/admin/blog-actions";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { AdminMessage } from "@/components/admin/admin-message";
import { DeleteProductButton } from "@/components/admin/delete-product-button";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/feedback";
import { getAdminBlogPosts } from "@/lib/blog/service";

export default async function AdminBlogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; success?: string; error?: string }>;
}) {
  const params = await searchParams;
  const result = await getAdminBlogPosts(params.page);
  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-brand-cyan text-sm font-bold">المحتوى</p>
          <h1 className="text-brand-ink mt-2 text-3xl font-bold">المقالات</h1>
        </div>
        {!result.readOnly && (
          <ButtonLink href="/admin/blog/new">مقال جديد</ButtonLink>
        )}
      </div>
      {result.readOnly && (
        <div className="mt-6">
          <AdminMessage tone="error">
            اربط قاعدة البيانات وطبّق Migration المدونة.
          </AdminMessage>
        </div>
      )}
      {params.success && (
        <div className="mt-6">
          <AdminMessage tone="success">تم حفظ التغيير.</AdminMessage>
        </div>
      )}
      {params.error && (
        <div className="mt-6">
          <AdminMessage tone="error">تعذر تنفيذ العملية.</AdminMessage>
        </div>
      )}
      {result.records.length ? (
        <div className="border-brand-border mt-6 overflow-x-auto rounded-3xl border bg-white">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-brand-petroleum text-white">
              <tr>
                <th className="px-5 py-4 text-start">المقال</th>
                <th className="px-5 py-4 text-start">التصنيف</th>
                <th className="px-5 py-4 text-start">الحالة</th>
                <th className="px-5 py-4 text-start">الإجراء</th>
              </tr>
            </thead>
            <tbody>
              {result.records.map((post) => (
                <tr key={post.id} className="border-brand-border border-t">
                  <td className="px-5 py-4 font-bold">{post.title}</td>
                  <td className="px-5 py-4">{post.category}</td>
                  <td className="px-5 py-4">
                    {post.published ? "منشور" : "مسودة"}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex gap-2">
                      <ButtonLink
                        href={`/admin/blog/${post.id}/edit`}
                        size="sm"
                        variant="ghost"
                      >
                        تعديل
                      </ButtonLink>
                      <DeleteProductButton
                        action={deleteBlogPostAction.bind(null, post.id)}
                        productName={post.title}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mt-6">
          <EmptyState
            title="لا توجد مقالات"
            description="أضف أول مقال تسويقي من لوحة الإدارة."
          />
        </div>
      )}
      <AdminPagination
        basePath="/admin/blog"
        query=""
        page={result.page}
        hasNext={result.hasNext}
      />
    </div>
  );
}
