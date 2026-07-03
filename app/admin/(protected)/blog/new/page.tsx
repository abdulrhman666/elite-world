import { createBlogPostAction } from "@/app/admin/blog-actions";
import { BlogPostForm } from "@/components/admin/blog-post-form";
import { AdminMessage } from "@/components/admin/admin-message";

export default async function NewBlogPostPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <div>
      <p className="text-brand-cyan text-sm font-bold">المقالات</p>
      <h1 className="text-brand-ink mt-2 text-3xl font-bold">مقال جديد</h1>
      {error && (
        <div className="mt-5">
          <AdminMessage tone="error">تحقق من الحقول وSlug.</AdminMessage>
        </div>
      )}
      <BlogPostForm action={createBlogPostAction} />
    </div>
  );
}
