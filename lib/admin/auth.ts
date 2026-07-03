import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { cache } from "react";
import {
  createAdminSessionToken,
  verifyAdminSessionToken,
} from "@/lib/admin/session-token";
import { verifyPassword } from "@/lib/auth/password";
import { getPrismaClient } from "@/lib/prisma";

export const ADMIN_SESSION_COOKIE = "elite_world_admin_session";
const SESSION_DURATION_MS = 8 * 60 * 60 * 1000;
export type AdminRole = "SUPER_ADMIN" | "ADMIN";

type AdminAuthConfig = {
  email: string;
  password: string;
  secret: string;
  environmentSuperAdmin: boolean;
};

function isPlaceholder(value: string) {
  return !value || value.includes("[") || value.includes("change-me");
}

export function getAdminAuthConfig():
  | { configured: true; value: AdminAuthConfig }
  | { configured: false; message: string } {
  const email = process.env.ADMIN_EMAIL?.trim() ?? "";
  const password = process.env.ADMIN_PASSWORD ?? "";
  const secret = process.env.AUTH_SECRET ?? "";
  const environmentSuperAdmin =
    !isPlaceholder(email) &&
    !isPlaceholder(password) &&
    email.includes("@") &&
    password.length >= 12;

  if (isPlaceholder(secret) || secret.length < 32) {
    return {
      configured: false,
      message:
        "أضف AUTH_SECRET آمناً بطول 32 حرفاً على الأقل لتفعيل جلسات الإدارة.",
    };
  }
  if (!environmentSuperAdmin && !process.env.DATABASE_URL) {
    return {
      configured: false,
      message:
        "أضف حساب إدارة بيئياً أو اربط قاعدة البيانات لاستخدام المدراء المسجلين.",
    };
  }
  return {
    configured: true,
    value: { email, password, secret, environmentSuperAdmin },
  };
}

function secureTextEqual(first: string, second: string) {
  const firstHash = createHash("sha256").update(first).digest();
  const secondHash = createHash("sha256").update(second).digest();
  return timingSafeEqual(firstHash, secondHash);
}

export async function validateAdminCredentials(
  email: string,
  password: string,
): Promise<{ email: string; role: AdminRole } | null> {
  const config = getAdminAuthConfig();
  if (!config.configured) return null;
  if (
    config.value.environmentSuperAdmin &&
    secureTextEqual(
      email.trim().toLowerCase(),
      config.value.email.toLowerCase(),
    ) &&
    secureTextEqual(password, config.value.password)
  ) {
    return { email: config.value.email, role: "SUPER_ADMIN" };
  }

  if (!process.env.DATABASE_URL) return null;
  try {
    const user = await getPrismaClient().user.findUnique({
      where: { email: email.trim().toLowerCase() },
      select: { email: true, passwordHash: true, role: true },
    });
    if (!user?.role || !(await verifyPassword(password, user.passwordHash))) {
      return null;
    }
    return { email: user.email, role: user.role };
  } catch {
    return null;
  }
}

export async function createAdminSession(email: string, role: AdminRole) {
  const config = getAdminAuthConfig();
  if (!config.configured)
    throw new Error("Admin authentication is not configured.");
  const expiresAt = Date.now() + SESSION_DURATION_MS;
  const token = createAdminSessionToken(
    email,
    role,
    config.value.secret,
    expiresAt,
  );
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/admin",
    maxAge: 0,
  });
  cookieStore.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: Math.floor(SESSION_DURATION_MS / 1000),
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
  cookieStore.set(ADMIN_SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/admin",
    maxAge: 0,
  });
}

async function resolveAdminSession() {
  const config = getAdminAuthConfig();
  if (!config.configured) return null;
  const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return null;
  const payload = verifyAdminSessionToken(token, config.value.secret);
  if (!payload) return null;
  if (
    config.value.environmentSuperAdmin &&
    secureTextEqual(payload.email, config.value.email)
  ) {
    return payload.role === "SUPER_ADMIN" ? payload : null;
  }
  if (!process.env.DATABASE_URL) return null;
  try {
    const user = await getPrismaClient().user.findUnique({
      where: { email: payload.email.toLowerCase() },
      select: { role: true },
    });
    return user?.role === payload.role ? payload : null;
  } catch {
    return null;
  }
}

export const getAdminSession = cache(resolveAdminSession);
