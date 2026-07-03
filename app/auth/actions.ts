"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  clearCustomerSession,
  createCustomerSession,
  customerAuthConfigurationIssue,
  getCustomerSession,
} from "@/lib/auth/customer-auth";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { getPrismaClient } from "@/lib/prisma";

function field(formData: FormData, name: string, maximum: number) {
  const value = String(formData.get(name) ?? "").trim();
  if (!value || value.length > maximum) throw new Error("INVALID_FIELDS");
  return value;
}

function optionalField(formData: FormData, name: string, maximum: number) {
  const value = String(formData.get(name) ?? "").trim();
  if (value.length > maximum) throw new Error("INVALID_FIELDS");
  return value || null;
}

function emailField(formData: FormData) {
  const email = field(formData, "email", 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("INVALID_EMAIL");
  }
  return email;
}

function passwordField(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  if (password.length < 10 || password.length > 200) {
    throw new Error("INVALID_PASSWORD");
  }
  return password;
}

function phoneField(formData: FormData) {
  const phone = field(formData, "phone", 50);
  if (phone.replace(/\D/g, "").length < 7) throw new Error("INVALID_FIELDS");
  return phone;
}

function safeNext(value: FormDataEntryValue | null) {
  const path = String(value ?? "");
  return path.startsWith("/") && !path.startsWith("//") ? path : "/account";
}

export async function registerCustomerAction(formData: FormData) {
  if (customerAuthConfigurationIssue()) redirect("/auth/register?error=config");
  try {
    const email = emailField(formData);
    const passwordHash = await hashPassword(passwordField(formData));
    const customer = await getPrismaClient().user.create({
      data: {
        email,
        passwordHash,
        name: field(formData, "name", 120),
        companyName: optionalField(formData, "companyName", 160),
        phone: phoneField(formData),
        city: field(formData, "city", 120),
        address: optionalField(formData, "address", 300),
      },
      select: { id: true, email: true },
    });
    await createCustomerSession(customer.id, customer.email);
  } catch (error) {
    const duplicate =
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002";
    redirect(`/auth/register?error=${duplicate ? "exists" : "invalid"}`);
  }
  redirect(safeNext(formData.get("next")));
}

export async function loginCustomerAction(formData: FormData) {
  if (customerAuthConfigurationIssue()) redirect("/auth/login?error=config");
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  let customer: { id: string; email: string; passwordHash: string } | null;
  try {
    customer = await getPrismaClient().user.findUnique({
      where: { email },
      select: { id: true, email: true, passwordHash: true },
    });
  } catch {
    redirect("/auth/login?error=config");
  }
  if (!customer || !(await verifyPassword(password, customer.passwordHash))) {
    redirect("/auth/login?error=credentials");
  }
  await createCustomerSession(customer.id, customer.email);
  redirect(safeNext(formData.get("next")));
}

export async function logoutCustomerAction() {
  await clearCustomerSession();
  redirect("/auth/login?success=logout");
}

export async function updateCustomerProfileAction(formData: FormData) {
  const session = await getCustomerSession();
  if (!session) redirect("/auth/login?error=session");
  try {
    await getPrismaClient().user.update({
      where: { id: session.userId },
      data: {
        name: field(formData, "name", 120),
        companyName: optionalField(formData, "companyName", 160),
        phone: phoneField(formData),
        city: field(formData, "city", 120),
        address: optionalField(formData, "address", 300),
      },
    });
  } catch {
    redirect("/account?error=profile");
  }
  revalidatePath("/account");
  redirect("/account?success=profile");
}

export async function changeCustomerPasswordAction(formData: FormData) {
  const session = await getCustomerSession();
  if (!session) redirect("/auth/login?error=session");

  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (newPassword.length < 10 || newPassword.length > 200) {
    redirect("/account?error=password-length");
  }
  if (newPassword !== confirmPassword) {
    redirect("/account?error=password-match");
  }

  let customer: { passwordHash: string } | null;
  try {
    customer = await getPrismaClient().user.findUnique({
      where: { id: session.userId },
      select: { passwordHash: true },
    });
  } catch {
    redirect("/account?error=password");
  }

  if (
    !customer ||
    !(await verifyPassword(currentPassword, customer.passwordHash))
  ) {
    redirect("/account?error=password-current");
  }

  try {
    await getPrismaClient().user.update({
      where: { id: session.userId },
      data: { passwordHash: await hashPassword(newPassword) },
    });
  } catch {
    redirect("/account?error=password");
  }

  revalidatePath("/account");
  redirect("/account?success=password");
}
