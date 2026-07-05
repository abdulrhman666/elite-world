import "server-only";
import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import type { EmailCodePurpose } from "@prisma/client";
import { sendCustomerEmailCode } from "@/lib/email/service";
import { getPrismaClient } from "@/lib/prisma";

const CODE_TTL_MS = 10 * 60 * 1000;
const RESEND_WAIT_MS = 60 * 1000;
const MAX_HOURLY_CODES = 5;
const MAX_ATTEMPTS = 5;

function codeSecret() {
  const secret = process.env.AUTH_SECRET ?? "";
  if (secret.length < 32) throw new Error("AUTH_NOT_CONFIGURED");
  return secret;
}

function codeHash(email: string, purpose: EmailCodePurpose, code: string) {
  return createHmac("sha256", codeSecret())
    .update(`${email}:${purpose}:${code}`)
    .digest("hex");
}

export async function issueEmailCode(input: {
  userId: string;
  email: string;
  name: string;
  purpose: EmailCodePurpose;
}) {
  const prisma = getPrismaClient();
  const now = new Date();
  const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const recent = await prisma.emailCode.findFirst({
    where: { userId: input.userId, purpose: input.purpose },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });
  if (recent && now.getTime() - recent.createdAt.getTime() < RESEND_WAIT_MS) {
    return { ok: false as const, reason: "too-soon" as const };
  }
  const hourlyCount = await prisma.emailCode.count({
    where: {
      userId: input.userId,
      purpose: input.purpose,
      createdAt: { gte: hourAgo },
    },
  });
  if (hourlyCount >= MAX_HOURLY_CODES) {
    return { ok: false as const, reason: "rate" as const };
  }

  const code = randomInt(0, 1_000_000).toString().padStart(6, "0");
  const created = await prisma.$transaction(async (tx) => {
    await tx.emailCode.updateMany({
      where: {
        userId: input.userId,
        purpose: input.purpose,
        consumedAt: null,
      },
      data: { consumedAt: now },
    });
    return tx.emailCode.create({
      data: {
        userId: input.userId,
        purpose: input.purpose,
        codeHash: codeHash(input.email, input.purpose, code),
        expiresAt: new Date(now.getTime() + CODE_TTL_MS),
      },
      select: { id: true },
    });
  });

  try {
    await sendCustomerEmailCode({
      to: input.email,
      name: input.name,
      code,
      purpose: input.purpose,
    });
  } catch {
    await prisma.emailCode.delete({ where: { id: created.id } }).catch(() => {});
    return { ok: false as const, reason: "email" as const };
  }
  return { ok: true as const };
}

export async function verifyEmailCode(input: {
  userId: string;
  email: string;
  purpose: EmailCodePurpose;
  code: string;
}) {
  if (!/^\d{6}$/.test(input.code)) return null;
  const prisma = getPrismaClient();
  const record = await prisma.emailCode.findFirst({
    where: {
      userId: input.userId,
      purpose: input.purpose,
      consumedAt: null,
    },
    orderBy: { createdAt: "desc" },
    select: { id: true, codeHash: true, expiresAt: true, attempts: true },
  });
  if (
    !record ||
    record.expiresAt.getTime() <= Date.now() ||
    record.attempts >= MAX_ATTEMPTS
  ) {
    return null;
  }

  const expected = Buffer.from(record.codeHash, "hex");
  const provided = Buffer.from(
    codeHash(input.email, input.purpose, input.code),
    "hex",
  );
  if (
    expected.length !== provided.length ||
    !timingSafeEqual(expected, provided)
  ) {
    await prisma.emailCode.update({
      where: { id: record.id },
      data: { attempts: { increment: 1 } },
    });
    return null;
  }
  return record.id;
}
