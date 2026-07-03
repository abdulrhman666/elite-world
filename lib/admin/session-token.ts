import { createHmac, timingSafeEqual } from "node:crypto";

export type AdminSessionPayload = {
  email: string;
  role: "SUPER_ADMIN" | "ADMIN";
  expiresAt: number;
};

function signature(value: string, secret: string) {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

export function createAdminSessionToken(
  email: string,
  role: AdminSessionPayload["role"],
  secret: string,
  expiresAt: number,
) {
  const payload = Buffer.from(
    JSON.stringify({ email, role, expiresAt } satisfies AdminSessionPayload),
  ).toString("base64url");
  return `${payload}.${signature(payload, secret)}`;
}

export function verifyAdminSessionToken(
  token: string,
  secret: string,
  now = Date.now(),
): AdminSessionPayload | null {
  const [payload, providedSignature, extra] = token.split(".");
  if (!payload || !providedSignature || extra) return null;

  const expectedSignature = signature(payload, secret);
  const provided = Buffer.from(providedSignature);
  const expected = Buffer.from(expectedSignature);
  if (
    provided.length !== expected.length ||
    !timingSafeEqual(provided, expected)
  ) {
    return null;
  }

  try {
    const value = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as Partial<AdminSessionPayload>;
    if (
      typeof value.email !== "string" ||
      (value.role !== "SUPER_ADMIN" && value.role !== "ADMIN") ||
      typeof value.expiresAt !== "number" ||
      value.expiresAt <= now
    ) {
      return null;
    }
    return { email: value.email, role: value.role, expiresAt: value.expiresAt };
  } catch {
    return null;
  }
}
