import "server-only";
import { cookies } from "next/headers";
import { cache } from "react";
import {
  createCustomerSessionToken,
  verifyCustomerSessionToken,
} from "@/lib/auth/session-token";
import { CUSTOMER_SESSION_COOKIE } from "@/lib/auth/constants";

const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000;

function authSecret() {
  const secret = process.env.AUTH_SECRET ?? "";
  return secret.length >= 32 ? secret : null;
}

export function customerAuthConfigurationIssue() {
  if (!process.env.DATABASE_URL)
    return "قاعدة بيانات العملاء غير متاحة حالياً.";
  if (!authSecret()) return "إعداد حماية جلسات العملاء غير مكتمل.";
  return null;
}

export async function createCustomerSession(userId: string, email: string) {
  const secret = authSecret();
  if (!secret) throw new Error("AUTH_NOT_CONFIGURED");
  const expiresAt = Date.now() + SESSION_DURATION_MS;
  const token = createCustomerSessionToken(
    { userId, email, expiresAt },
    secret,
  );
  (await cookies()).set(CUSTOMER_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: Math.floor(SESSION_DURATION_MS / 1000),
  });
}

export async function clearCustomerSession() {
  (await cookies()).set(CUSTOMER_SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

async function resolveCustomerSession() {
  const secret = authSecret();
  if (!secret) return null;
  const token = (await cookies()).get(CUSTOMER_SESSION_COOKIE)?.value;
  return token ? verifyCustomerSessionToken(token, secret) : null;
}

export const getCustomerSession = cache(resolveCustomerSession);
