import { createHmac, timingSafeEqual } from "node:crypto";

export type CustomerSessionPayload = {
  userId: string;
  email: string;
  expiresAt: number;
};

function signature(value: string, secret: string) {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

export function createCustomerSessionToken(
  payload: CustomerSessionPayload,
  secret: string,
) {
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encoded}.${signature(encoded, secret)}`;
}

export function verifyCustomerSessionToken(
  token: string,
  secret: string,
  now = Date.now(),
): CustomerSessionPayload | null {
  const [encoded, providedSignature, extra] = token.split(".");
  if (!encoded || !providedSignature || extra) return null;
  const expected = Buffer.from(signature(encoded, secret));
  const provided = Buffer.from(providedSignature);
  if (
    expected.length !== provided.length ||
    !timingSafeEqual(expected, provided)
  ) {
    return null;
  }
  try {
    const payload = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8"),
    ) as Partial<CustomerSessionPayload>;
    if (
      typeof payload.userId !== "string" ||
      typeof payload.email !== "string" ||
      typeof payload.expiresAt !== "number" ||
      payload.expiresAt <= now
    ) {
      return null;
    }
    return payload as CustomerSessionPayload;
  } catch {
    return null;
  }
}
