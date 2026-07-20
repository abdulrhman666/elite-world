"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin/auth";
import {
  createAdminActivity,
  deleteAdminActivity,
  EQUIPMENT_GROUPS,
  updateAdminActivity,
  type AdminActivityInput,
} from "@/lib/admin/activities-admin";

async function requireAdmin() {
  if (!(await getAdminSession())) redirect("/admin/login?error=session");
}

function text(formData: FormData, name: string, max: number) {
  const value = String(formData.get(name) ?? "").trim();
  if (!value || value.length > max) throw new Error(`قيمة ${name} غير صالحة.`);
  return value;
}

function optional(formData: FormData, name: string, max: number) {
  const value = String(formData.get(name) ?? "").trim();
  if (value.length > max) throw new Error(`قيمة ${name} طويلة جدًا.`);
  return value || null;
}

function parseInput(formData: FormData): AdminActivityInput {
  const slug = text(formData, "slug", 120).toLowerCase();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error("Slug غير صالح.");
  const image = text(formData, "image", 500);
  if (!image.startsWith("/") || image.includes("..")) throw new Error("مسار الصورة غير صالح.");
  const productIds = formData.getAll("productIds").map(String);
  return {
    slug,
    name: text(formData, "name", 120),
    eyebrow: text(formData, "eyebrow", 160),
    heroTitle: text(formData, "heroTitle", 180),
    heroDescription: text(formData, "heroDescription", 600),
    introduction: text(formData, "introduction", 1800),
    image,
    primaryCtaText: text(formData, "primaryCtaText", 80),
    published: formData.get("published") === "on",
    sortOrder: Math.max(0, Number(formData.get("sortOrder") ?? 0) || 0),
    seoTitle: optional(formData, "seoTitle", 90),
    seoDescription: optional(formData, "seoDescription", 220),
    canonicalUrl: optional(formData, "canonicalUrl", 500),
    ogTitle: optional(formData, "ogTitle", 100),
    ogDescription: optional(formData, "ogDescription", 220),
    ogImage: optional(formData, "ogImage", 500),
    seoImageAlt: optional(formData, "seoImageAlt", 180),
    products: productIds.map((productId, index) => {
      const group = String(formData.get(`group_${productId}`) ?? EQUIPMENT_GROUPS[0]);
      return {
        productId,
        equipmentGroup: EQUIPMENT_GROUPS.includes(group as (typeof EQUIPMENT_GROUPS)[number]) ? group : EQUIPMENT_GROUPS[0],
        essential: formData.get(`essential_${productId}`) === "on",
        sortOrder: (index + 1) * 10,
      };
    }),
  };
}

function refresh() {
  updateTag("activities");
  revalidatePath("/");
  revalidatePath("/activities", "layout");
  revalidatePath("/products", "layout");
}

function errorMessage(error: unknown) {
  return encodeURIComponent(error instanceof Error ? error.message : "تعذر حفظ النشاط.");
}

export async function createActivityAction(formData: FormData) {
  await requireAdmin();
  try {
    await createAdminActivity(parseInput(formData));
  } catch (error) {
    redirect(`/admin/activities?error=${errorMessage(error)}`);
  }
  refresh();
  redirect("/admin/activities?success=created");
}

export async function updateActivityAction(id: string, formData: FormData) {
  await requireAdmin();
  try {
    await updateAdminActivity(id, parseInput(formData));
  } catch (error) {
    redirect(`/admin/activities?error=${errorMessage(error)}`);
  }
  refresh();
  redirect("/admin/activities?success=updated");
}

export async function deleteActivityAction(id: string) {
  await requireAdmin();
  try {
    await deleteAdminActivity(id);
  } catch (error) {
    redirect(`/admin/activities?error=${errorMessage(error)}`);
  }
  refresh();
  redirect("/admin/activities?success=deleted");
}
