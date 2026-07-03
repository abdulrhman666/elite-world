"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin/auth";
import { hashPassword } from "@/lib/auth/password";
import { getPrismaClient } from "@/lib/prisma";

async function requireSuperAdmin() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login?error=session");
  if (session.role !== "SUPER_ADMIN") redirect("/admin?error=forbidden");
  return session;
}

function required(formData: FormData, name: string, maximum: number) {
  const value = String(formData.get(name) ?? "").trim();
  if (!value || value.length > maximum) throw new Error("INVALID_FIELDS");
  return value;
}

function optional(formData: FormData, name: string, maximum: number) {
  const value = String(formData.get(name) ?? "").trim();
  if (value.length > maximum) throw new Error("INVALID_FIELDS");
  return value || null;
}

function email(formData: FormData) {
  const value = required(formData, "email", 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    throw new Error("INVALID_FIELDS");
  }
  return value;
}

function role(formData: FormData) {
  const value = String(formData.get("role") ?? "CUSTOMER");
  if (value === "SUPER_ADMIN" || value === "ADMIN") return value;
  if (value === "CUSTOMER") return null;
  throw new Error("INVALID_ROLE");
}

function errorCode(error: unknown) {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    return "exists";
  }
  if (error instanceof Error && error.message === "SELF_ROLE") return "self";
  return "invalid";
}

export async function createAdminUserAction(formData: FormData) {
  await requireSuperAdmin();
  try {
    const password = required(formData, "password", 200);
    if (password.length < 10) throw new Error("INVALID_FIELDS");
    await getPrismaClient().user.create({
      data: {
        name: required(formData, "name", 120),
        email: email(formData),
        passwordHash: await hashPassword(password),
        companyName: optional(formData, "companyName", 160),
        phone: required(formData, "phone", 50),
        city: required(formData, "city", 120),
        address: optional(formData, "address", 300),
        role: role(formData),
      },
    });
  } catch (error) {
    redirect(`/admin/customers?error=${errorCode(error)}`);
  }
  revalidatePath("/admin/customers");
  redirect("/admin/customers?success=created");
}

export async function updateAdminUserAction(id: string, formData: FormData) {
  const session = await requireSuperAdmin();
  try {
    const existing = await getPrismaClient().user.findUnique({
      where: { id },
      select: { email: true, role: true },
    });
    if (!existing) throw new Error("NOT_FOUND");
    const nextRole = role(formData);
    if (
      existing.email.toLowerCase() === session.email.toLowerCase() &&
      nextRole !== "SUPER_ADMIN"
    ) {
      throw new Error("SELF_ROLE");
    }
    const password = String(formData.get("password") ?? "");
    if (password && password.length < 10) throw new Error("INVALID_FIELDS");
    await getPrismaClient().user.update({
      where: { id },
      data: {
        name: required(formData, "name", 120),
        email: email(formData),
        companyName: optional(formData, "companyName", 160),
        phone: required(formData, "phone", 50),
        city: required(formData, "city", 120),
        address: optional(formData, "address", 300),
        role: nextRole,
        ...(password ? { passwordHash: await hashPassword(password) } : {}),
      },
    });
  } catch (error) {
    redirect(`/admin/customers/${id}?error=${errorCode(error)}`);
  }
  revalidatePath("/admin/customers");
  redirect(`/admin/customers/${id}?success=saved`);
}

export async function updateAdminUserRoleAction(
  id: string,
  formData: FormData,
) {
  const session = await requireSuperAdmin();
  try {
    const existing = await getPrismaClient().user.findUnique({
      where: { id },
      select: { email: true },
    });
    if (!existing) throw new Error("NOT_FOUND");
    const nextRole = role(formData);
    if (
      existing.email.toLowerCase() === session.email.toLowerCase() &&
      nextRole !== "SUPER_ADMIN"
    ) {
      throw new Error("SELF_ROLE");
    }
    await getPrismaClient().user.update({
      where: { id },
      data: { role: nextRole },
    });
  } catch (error) {
    redirect(`/admin/customers?error=${errorCode(error)}`);
  }
  revalidatePath("/admin/customers");
  redirect("/admin/customers?success=role");
}

export async function deleteAdminUserAction(id: string, formData: FormData) {
  const session = await requireSuperAdmin();
  if (formData.get("confirmDelete") !== "confirmed") {
    redirect("/admin/customers?error=confirm");
  }
  try {
    const existing = await getPrismaClient().user.findUnique({
      where: { id },
      select: { email: true },
    });
    if (!existing) throw new Error("NOT_FOUND");
    if (existing.email.toLowerCase() === session.email.toLowerCase()) {
      throw new Error("SELF_ROLE");
    }
    await getPrismaClient().user.delete({ where: { id } });
  } catch (error) {
    redirect(`/admin/customers?error=${errorCode(error)}`);
  }
  revalidatePath("/admin/customers");
  redirect("/admin/customers?success=deleted");
}
