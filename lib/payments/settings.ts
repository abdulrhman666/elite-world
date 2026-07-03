import "server-only";
import { getPrismaClient } from "@/lib/prisma";
import { decryptSecret, encryptSecret } from "@/lib/security/encryption";

export type PaymentProviderEditorInput = {
  name: string;
  endpoint: string;
  apiKey: string | null;
  secretKey: string | null;
  isActive: boolean;
  clearKeys: boolean;
};

export type ActivePaymentProviderConfig = {
  id: string;
  name: string;
  endpoint: string;
  apiKey: string | null;
  secretKey: string | null;
};

const providerSelect = {
  id: true,
  name: true,
  endpoint: true,
  apiKeyEncrypted: true,
  secretKeyEncrypted: true,
  isActive: true,
  updatedAt: true,
} as const;

export function normalizeProviderName(value: string) {
  const name = value.trim().toLowerCase();
  if (!/^[a-z0-9][a-z0-9_-]{1,49}$/.test(name) || name === "manual") {
    throw new Error("INVALID_PROVIDER_NAME");
  }
  return name;
}

function privateHostname(hostname: string) {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (
    host === "localhost" ||
    host === "::1" ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    /^127\./.test(host) ||
    /^10\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^169\.254\./.test(host)
  ) {
    return true;
  }
  const match = host.match(/^172\.(\d{1,3})\./);
  return Boolean(match && Number(match[1]) >= 16 && Number(match[1]) <= 31);
}

export function normalizeProviderEndpoint(value: string) {
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    throw new Error("INVALID_PROVIDER_ENDPOINT");
  }
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.hash ||
    privateHostname(url.hostname)
  ) {
    throw new Error("INVALID_PROVIDER_ENDPOINT");
  }
  return url.toString();
}

export async function getPaymentProvidersEditor() {
  if (!process.env.DATABASE_URL) {
    return {
      records: [],
      readOnly: true,
      message: "اربط قاعدة البيانات لتفعيل إعدادات الدفع.",
    };
  }
  try {
    const records = await getPrismaClient().paymentProvider.findMany({
      select: providerSelect,
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
    });
    return {
      records: records.map((record) => ({
        id: record.id,
        name: record.name,
        endpoint: record.endpoint,
        isActive: record.isActive,
        hasApiKey: Boolean(record.apiKeyEncrypted),
        hasSecretKey: Boolean(record.secretKeyEncrypted),
        updatedAt: record.updatedAt,
      })),
      readOnly: false,
      message: null,
    };
  } catch {
    return {
      records: [],
      readOnly: true,
      message: "طبّق Migration المخزون ومزودات الدفع لتفعيل هذه الصفحة.",
    };
  }
}

function encryptedValue(
  value: string | null,
  current: string | null | undefined,
  clear: boolean,
) {
  if (clear) return null;
  return value ? encryptSecret(value) : (current ?? null);
}

export async function createPaymentProvider(input: PaymentProviderEditorInput) {
  if (!process.env.DATABASE_URL) throw new Error("READ_ONLY");
  const prisma = getPrismaClient();
  const name = normalizeProviderName(input.name);
  const endpoint = normalizeProviderEndpoint(input.endpoint);
  return prisma.$transaction(async (transaction) => {
    if (input.isActive) {
      await transaction.paymentProvider.updateMany({
        where: { isActive: true },
        data: { isActive: false },
      });
    }
    return transaction.paymentProvider.create({
      data: {
        name,
        endpoint,
        apiKeyEncrypted: input.apiKey ? encryptSecret(input.apiKey) : null,
        secretKeyEncrypted: input.secretKey
          ? encryptSecret(input.secretKey)
          : null,
        isActive: input.isActive,
      },
    });
  });
}

export async function updatePaymentProvider(
  id: string,
  input: Omit<PaymentProviderEditorInput, "name" | "isActive">,
) {
  if (!process.env.DATABASE_URL) throw new Error("READ_ONLY");
  const prisma = getPrismaClient();
  const current = await prisma.paymentProvider.findUnique({ where: { id } });
  if (!current) throw new Error("PROVIDER_NOT_FOUND");
  return prisma.paymentProvider.update({
    where: { id },
    data: {
      endpoint: normalizeProviderEndpoint(input.endpoint),
      apiKeyEncrypted: encryptedValue(
        input.apiKey,
        current.apiKeyEncrypted,
        input.clearKeys,
      ),
      secretKeyEncrypted: encryptedValue(
        input.secretKey,
        current.secretKeyEncrypted,
        input.clearKeys,
      ),
    },
  });
}

export async function setPaymentProviderActive(id: string, active: boolean) {
  if (!process.env.DATABASE_URL) throw new Error("READ_ONLY");
  const prisma = getPrismaClient();
  return prisma.$transaction(async (transaction) => {
    if (active) {
      await transaction.paymentProvider.updateMany({
        where: { isActive: true, id: { not: id } },
        data: { isActive: false },
      });
    }
    return transaction.paymentProvider.update({
      where: { id },
      data: { isActive: active },
    });
  });
}

function toRuntimeConfig(record: {
  id: string;
  name: string;
  endpoint: string;
  apiKeyEncrypted: string | null;
  secretKeyEncrypted: string | null;
}): ActivePaymentProviderConfig {
  return {
    id: record.id,
    name: record.name,
    endpoint: record.endpoint,
    apiKey: record.apiKeyEncrypted
      ? decryptSecret(record.apiKeyEncrypted)
      : null,
    secretKey: record.secretKeyEncrypted
      ? decryptSecret(record.secretKeyEncrypted)
      : null,
  };
}

export async function getPaymentProviderConfig(name?: string) {
  if (!process.env.DATABASE_URL) return null;
  const record = name
    ? await getPrismaClient().paymentProvider.findUnique({
        where: { name },
        select: providerSelect,
      })
    : await getPrismaClient().paymentProvider.findFirst({
        where: { isActive: true },
        select: providerSelect,
      });
  return record ? toRuntimeConfig(record) : null;
}
