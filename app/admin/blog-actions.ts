"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin/auth";
import {
  createBlogPost,
  deleteBlogPost,
  updateBlogPost,
  type BlogPostInput,
} from "@/lib/blog/service";

async function requireAdmin() {
  if (!(await getAdminSession())) redirect("/admin/login?error=session");
}

function value(formData: FormData, name: string, maximum: number) {
  const text = String(formData.get(name) ?? "").trim();
  if (!text || text.length > maximum) throw new Error("INVALID_BLOG_POST");
  return text;
}

function input(formData: FormData): BlogPostInput {
  const slug = value(formData, "slug", 180);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new Error("INVALID_BLOG_POST");
  }
  const optional = (name: string, maximum: number) => {
    const text = String(formData.get(name) ?? "").trim();
    if (text.length > maximum) throw new Error("INVALID_BLOG_POST");
    return text || null;
  };
  const image = value(formData, "image", 500);
  if (!image.startsWith("/") || image.includes("..")) {
    throw new Error("INVALID_BLOG_POST");
  }
  return {
    slug,
    title: value(formData, "title", 180),
    excerpt: value(formData, "excerpt", 500),
    content: value(formData, "content", 30000),
    category: value(formData, "category", 100),
    image,
    published: formData.get("published") === "on",
    seoTitle: optional("seoTitle", 90),
    seoDescription: optional("seoDescription", 220),
  };
}

function refresh(slug?: string) {
  revalidatePath("/blog");
  if (slug) revalidatePath(`/blog/${slug}`);
  revalidatePath("/sitemap.xml");
  revalidatePath("/admin/blog");
}

export async function createBlogPostAction(formData: FormData) {
  await requireAdmin();
  let postId = "";
  let postSlug = "";
  try {
    const post = await createBlogPost(input(formData));
    postId = post.id;
    postSlug = post.slug;
  } catch {
    redirect("/admin/blog/new?error=save");
  }
  refresh(postSlug);
  redirect(`/admin/blog/${postId}/edit?success=created`);
}

export async function updateBlogPostAction(id: string, formData: FormData) {
  await requireAdmin();
  try {
    const post = await updateBlogPost(id, input(formData));
    refresh(post.slug);
  } catch {
    redirect(`/admin/blog/${id}/edit?error=save`);
  }
  redirect(`/admin/blog/${id}/edit?success=updated`);
}

export async function deleteBlogPostAction(id: string) {
  await requireAdmin();
  try {
    await deleteBlogPost(id);
    refresh();
  } catch {
    redirect("/admin/blog?error=delete");
  }
  redirect("/admin/blog?success=deleted");
}
