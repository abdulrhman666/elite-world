"use server";

import { EmailCodePurpose, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  clearCustomerSession,
  createCustomerSession,
  customerAuthConfigurationIssue,
  getCustomerSession,
} from "@/lib/auth/customer-auth";
import { issueEmailCode, verifyEmailCode } from "@/lib/auth/email-codes";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { emailConfigurationIssue } from "@/lib/email/service";
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

function verificationUrl(
  email: string,
  next: string,
  state?: { error?: string; success?: string },
) {
  const params = new URLSearchParams({ email, next });
  if (state?.error) params.set("error", state.error);
  if (state?.success) params.set("success", state.success);
  return `/auth/verify?${params.toString()}`;
}

export async function registerCustomerAction(formData: FormData) {
  if (customerAuthConfigurationIssue() || emailConfigurationIssue()) {
    redirect("/auth/register?error=config");
  }
  const next = safeNext(formData.get("next"));
  let email: string;
  let passwordHash: string;
  let name: string;
  let companyName: string | null;
  let phone: string;
  let city: string;
  let address: string | null;
  try {
    email = emailField(formData);
    passwordHash = await hashPassword(passwordField(formData));
    name = field(formData, "name", 120);
    companyName = optionalField(formData, "companyName", 160);
    phone = phoneField(formData);
    city = field(formData, "city", 120);
    address = optionalField(formData, "address", 300);
  } catch {
    redirect("/auth/register?error=invalid");
  }

  const prisma = getPrismaClient();
  let existing;
  try {
    existing = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, emailVerifiedAt: true },
    });
  } catch {
    redirect("/auth/register?error=config");
  }
  if (existing?.emailVerifiedAt) redirect("/auth/register?error=exists");

  let customer: { id: string; email: string; name: string };
  try {
    customer = existing
      ? await prisma.user.update({
          where: { id: existing.id },
          data: { passwordHash, name, companyName, phone, city, address },
          select: { id: true, email: true, name: true },
        })
      : await prisma.user.create({
          data: {
            email,
            passwordHash,
            name,
            companyName,
            phone,
            city,
            address,
          },
          select: { id: true, email: true, name: true },
        });
  } catch (error) {
    const duplicate =
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002";
    redirect(`/auth/register?error=${duplicate ? "exists" : "invalid"}`);
  }

  let issued;
  try {
    issued = await issueEmailCode({
      userId: customer.id,
      email: customer.email,
      name: customer.name,
      purpose: EmailCodePurpose.VERIFY_ACCOUNT,
    });
  } catch {
    redirect("/auth/register?error=config");
  }
  if (!issued.ok) {
    redirect(
      verificationUrl(customer.email, next, {
        error: issued.reason === "email" ? "email" : "rate",
      }),
    );
  }
  redirect(verificationUrl(customer.email, next, { success: "sent" }));
}

export async function loginCustomerAction(formData: FormData) {
  if (customerAuthConfigurationIssue()) redirect("/auth/login?error=config");
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  let customer: {
    id: string;
    email: string;
    passwordHash: string;
    emailVerifiedAt: Date | null;
  } | null;
  try {
    customer = await getPrismaClient().user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        emailVerifiedAt: true,
      },
    });
  } catch {
    redirect("/auth/login?error=config");
  }
  if (!customer || !(await verifyPassword(password, customer.passwordHash))) {
    redirect("/auth/login?error=credentials");
  }
  if (!customer.emailVerifiedAt) {
    redirect(
      verificationUrl(customer.email, safeNext(formData.get("next")), {
        error: "unverified",
      }),
    );
  }
  await createCustomerSession(customer.id, customer.email);
  redirect(safeNext(formData.get("next")));
}

export async function verifyCustomerEmailAction(formData: FormData) {
  const next = safeNext(formData.get("next"));
  let email: string;
  try {
    email = emailField(formData);
  } catch {
    redirect("/auth/verify?error=code");
  }
  const code = String(formData.get("code") ?? "").trim();
  const prisma = getPrismaClient();
  const customer = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, emailVerifiedAt: true },
  });
  if (!customer) redirect(verificationUrl(email, next, { error: "code" }));
  if (!customer.emailVerifiedAt) {
    const codeId = await verifyEmailCode({
      userId: customer.id,
      email: customer.email,
      purpose: EmailCodePurpose.VERIFY_ACCOUNT,
      code,
    });
    if (!codeId) {
      redirect(verificationUrl(email, next, { error: "code" }));
    }
    await prisma.$transaction(async (tx) => {
      const consumed = await tx.emailCode.updateMany({
        where: { id: codeId, consumedAt: null },
        data: { consumedAt: new Date() },
      });
      if (consumed.count !== 1) throw new Error("CODE_ALREADY_USED");
      await tx.user.update({
        where: { id: customer.id },
        data: { emailVerifiedAt: new Date() },
      });
    });
  }
  await createCustomerSession(customer.id, customer.email);
  redirect(next);
}

export async function resendCustomerVerificationAction(formData: FormData) {
  if (emailConfigurationIssue()) redirect("/auth/verify?error=email");
  const next = safeNext(formData.get("next"));
  let email: string;
  try {
    email = emailField(formData);
  } catch {
    redirect("/auth/verify?error=code");
  }
  const customer = await getPrismaClient().user.findUnique({
    where: { email },
    select: { id: true, email: true, name: true, emailVerifiedAt: true },
  });
  if (!customer) redirect(verificationUrl(email, next, { success: "sent" }));
  if (customer.emailVerifiedAt) redirect("/auth/login");
  const issued = await issueEmailCode({
    userId: customer.id,
    email: customer.email,
    name: customer.name,
    purpose: EmailCodePurpose.VERIFY_ACCOUNT,
  });
  redirect(
    verificationUrl(customer.email, next, {
      ...(issued.ok
        ? { success: "sent" }
        : { error: issued.reason === "email" ? "email" : "rate" }),
    }),
  );
}

export async function requestPasswordResetAction(formData: FormData) {
  if (customerAuthConfigurationIssue() || emailConfigurationIssue()) {
    redirect("/auth/forgot-password?error=config");
  }
  let email: string;
  try {
    email = emailField(formData);
  } catch {
    redirect("/auth/forgot-password?error=invalid");
  }
  const customer = await getPrismaClient().user.findUnique({
    where: { email },
    select: { id: true, email: true, name: true, emailVerifiedAt: true },
  });
  if (customer?.emailVerifiedAt) {
    const issued = await issueEmailCode({
      userId: customer.id,
      email: customer.email,
      name: customer.name,
      purpose: EmailCodePurpose.RESET_PASSWORD,
    });
    if (!issued.ok && issued.reason === "email") {
      redirect("/auth/forgot-password?error=email");
    }
  }
  redirect(`/auth/reset-password?email=${encodeURIComponent(email)}&sent=1`);
}

export async function resetCustomerPasswordAction(formData: FormData) {
  let email: string;
  try {
    email = emailField(formData);
  } catch {
    redirect("/auth/reset-password?error=code");
  }
  const code = String(formData.get("code") ?? "").trim();
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");
  const resetUrl = `/auth/reset-password?email=${encodeURIComponent(email)}`;
  if (newPassword.length < 10 || newPassword.length > 200) {
    redirect(`${resetUrl}&error=password-length`);
  }
  if (newPassword !== confirmPassword) {
    redirect(`${resetUrl}&error=password-match`);
  }
  const prisma = getPrismaClient();
  const customer = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true },
  });
  if (!customer) redirect(`${resetUrl}&error=code`);
  const codeId = await verifyEmailCode({
    userId: customer.id,
    email: customer.email,
    purpose: EmailCodePurpose.RESET_PASSWORD,
    code,
  });
  if (!codeId) redirect(`${resetUrl}&error=code`);

  const passwordHash = await hashPassword(newPassword);
  await prisma.$transaction(async (tx) => {
    const consumed = await tx.emailCode.updateMany({
      where: { id: codeId, consumedAt: null },
      data: { consumedAt: new Date() },
    });
    if (consumed.count !== 1) throw new Error("CODE_ALREADY_USED");
    await tx.user.update({
      where: { id: customer.id },
      data: { passwordHash },
    });
  });
  await clearCustomerSession();
  redirect("/auth/login?success=password-reset");
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
