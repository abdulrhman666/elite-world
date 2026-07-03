import { notFound } from "next/navigation";
import { updateBlogPostAction } from "@/app/admin/blog-actions";
import { BlogPostForm } from "@/components/admin/blog-post-form";
import { AdminMessage } from "@/components/admin/admin-message";
import { getAdminBlogPost } from "@/lib/blog/service";

export default async function EditBlogPostPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const [{ id }, messages] = await Promise.all([params, searchParams]);
  const post = await getAdminBlogPost(id);
  if (!post) notFound();
  return (
    <div>
      <p className="text-brand-cyan text-sm font-bold">المقالات</p>
      <h1 className="text-brand-ink mt-2 text-3xl font-bold">تعديل المقال</h1>
      {messages.success && (
        <div className="mt-5">
          <AdminMessage tone="success">تم حفظ المقال.</AdminMessage>
        </div>
      )}
      {messages.error && (
        <div className="mt-5">
          <AdminMessage tone="error">تعذر حفظ المقال.</AdminMessage>
        </div>
      )}
      <BlogPostForm
        action={updateBlogPostAction.bind(null, id)}
        post={{ ...post }}
      />
    </div>
  );
}
