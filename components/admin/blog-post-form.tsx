import { Button } from "@/components/ui/button";
import type { BlogPostInput } from "@/lib/blog/service";

export function BlogPostForm({
  action,
  post,
}: {
  action: (formData: FormData) => void | Promise<void>;
  post?: BlogPostInput;
}) {
  return (
    <form
      action={action}
      className="border-brand-border mt-6 grid gap-5 rounded-3xl border bg-white p-6 sm:grid-cols-2"
    >
      <Field name="title" label="عنوان المقال" value={post?.title} />
      <Field name="slug" label="Slug" value={post?.slug} dir="ltr" />
      <Field name="category" label="التصنيف" value={post?.category} />
      <Field name="image" label="مسار الصورة" value={post?.image} dir="ltr" />
      <TextArea
        name="excerpt"
        label="الوصف المختصر"
        value={post?.excerpt}
        rows={3}
        className="sm:col-span-2"
      />
      <TextArea
        name="content"
        label="محتوى المقال"
        value={post?.content}
        rows={14}
        className="sm:col-span-2"
      />
      <Field
        name="seoTitle"
        label="SEO Title (اختياري)"
        value={post?.seoTitle ?? ""}
      />
      <Field
        name="seoDescription"
        label="Meta Description (اختياري)"
        value={post?.seoDescription ?? ""}
      />
      <label className="flex items-center gap-3 text-sm font-semibold">
        <input
          type="checkbox"
          name="published"
          defaultChecked={post?.published}
        />
        نشر المقال
      </label>
      <div className="sm:text-end">
        <Button type="submit">حفظ المقال</Button>
      </div>
    </form>
  );
}

function Field({
  name,
  label,
  value,
  dir,
}: {
  name: string;
  label: string;
  value?: string;
  dir?: "ltr";
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold">{label}</span>
      <input
        name={name}
        required={!name.startsWith("seo")}
        defaultValue={value}
        dir={dir}
        className="border-brand-border min-h-12 w-full rounded-xl border px-4"
      />
    </label>
  );
}

function TextArea({
  name,
  label,
  value,
  rows,
  className,
}: {
  name: string;
  label: string;
  value?: string;
  rows: number;
  className?: string;
}) {
  return (
    <label className={className}>
      <span className="mb-2 block text-sm font-semibold">{label}</span>
      <textarea
        name={name}
        required
        defaultValue={value}
        rows={rows}
        className="border-brand-border w-full rounded-xl border p-4 leading-7"
      />
    </label>
  );
}
