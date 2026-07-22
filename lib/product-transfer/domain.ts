import { CLEAR_VALUE } from "@/lib/product-transfer/columns";
import type { TransferScalar } from "@/lib/product-transfer/types";

const supportedZipImageExtensions = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
]);

export function isBlankImportValue(value: TransferScalar | undefined) {
  return value == null || value === "";
}

export function resolveImportedValue({
  current,
  incoming,
  clearable,
}: {
  current: TransferScalar;
  incoming: TransferScalar | undefined;
  clearable: boolean;
}) {
  if (isBlankImportValue(incoming)) return current;
  if (incoming === CLEAR_VALUE) return clearable ? null : current;
  return incoming;
}

export function areImportValuesEquivalent(
  current: TransferScalar,
  incoming: TransferScalar,
) {
  if (current == null || incoming == null) return current === incoming;
  if (typeof current === "string" && typeof incoming === "string")
    return current.trim() === incoming.trim();
  return String(current) === String(incoming);
}

export function validateImageReference(value: TransferScalar | undefined) {
  if (isBlankImportValue(value)) return null;
  const reference = String(value).trim();
  if (
    !reference ||
    /[\u0000-\u001f\u007f\\]/.test(reference) ||
    reference.includes("\n") ||
    reference.includes("\r")
  )
    return "مرجع الصورة غير صالح.";
  if (reference.startsWith("/")) {
    if (
      !reference.startsWith("/images/") ||
      reference.startsWith("//") ||
      reference.includes("?") ||
      reference.includes("#") ||
      reference.split("/").some((part) => part === "." || part === "..")
    )
      return "المسار المحلي يجب أن يكون داخل /images/ دون تنقل أو معاملات.";
    return null;
  }
  let url: URL;
  try {
    url = new URL(reference);
  } catch {
    return "مرجع الصورة يجب أن يكون مسارًا محليًا معتمدًا أو رابط HTTPS صالحًا.";
  }
  if (url.protocol !== "https:") return "روابط الصور يجب أن تستخدم HTTPS فقط.";
  if (url.username || url.password || (url.port && url.port !== "443"))
    return "رابط الصورة يحتوي بيانات دخول أو منفذًا غير مسموح.";
  const hostname = url.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (
    !hostname ||
    hostname === "localhost" ||
    hostname.endsWith(".local") ||
    isPrivateAddress(hostname)
  )
    return "مضيف الصورة محلي أو خاص وغير مسموح.";
  return null;
}

export function validateZipImageFilename(value: TransferScalar | undefined) {
  if (isBlankImportValue(value)) return null;
  const filename = String(value).trim();
  if (
    !filename ||
    filename === "." ||
    filename === ".." ||
    filename.includes("/") ||
    filename.includes("\\") ||
    /[\u0000-\u001f\u007f]/.test(filename)
  )
    return "اسم صورة ZIP يجب أن يكون اسم ملف فقط دون مسار.";
  const extension = filename.slice(filename.lastIndexOf(".")).toLowerCase();
  if (!supportedZipImageExtensions.has(extension))
    return "صورة ZIP يجب أن تكون JPG أو PNG أو WebP.";
  return null;
}

function isPrivateAddress(address: string) {
  return (
    /^(127\.|10\.|192\.168\.|169\.254\.|0\.|::1$|::ffff:(127\.|10\.|192\.168\.|169\.254\.)|fc|fd|fe80)/i.test(
      address,
    ) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(address) ||
    /^::ffff:172\.(1[6-9]|2\d|3[01])\./i.test(address)
  );
}

export function calculateBulkPrice(
  current: number | null,
  action: "pricePercent" | "priceAmount",
  rawValue: string,
) {
  if (current == null) return null;
  const value = Number(rawValue);
  if (!Number.isFinite(value)) return Number.NaN;
  const next =
    action === "pricePercent" ? current * (1 + value / 100) : current + value;
  return Math.max(0.01, Math.round(next * 100) / 100);
}

export function duplicateRowNumbers(
  values: Array<{ rowNumber: number; value: string }>,
) {
  const firstRows = new Map<string, number>();
  const duplicates = new Map<number, number>();
  for (const item of values) {
    if (!item.value) continue;
    const normalized = item.value.trim().toLowerCase();
    const first = firstRows.get(normalized);
    if (first != null) duplicates.set(item.rowNumber, first);
    else firstRows.set(normalized, item.rowNumber);
  }
  return duplicates;
}

export function chunkRecords<T>(records: T[], size: number) {
  if (!Number.isInteger(size) || size <= 0)
    throw new Error("INVALID_BATCH_SIZE");
  const batches: T[][] = [];
  for (let index = 0; index < records.length; index += size)
    batches.push(records.slice(index, index + size));
  return batches;
}

export function evaluateProductIdentity({
  productId,
  existingProductId,
  skuOwnerId,
  slugOwnerId,
}: {
  productId: string;
  existingProductId?: string;
  skuOwnerId?: string;
  slugOwnerId?: string;
}) {
  const errors: string[] = [];
  if (productId && !existingProductId) errors.push("Product ID غير موجود.");
  const ownerConflict = [skuOwnerId, slugOwnerId].some(
    (ownerId) => ownerId && ownerId !== existingProductId,
  );
  if (ownerConflict)
    errors.push("تعارض SKU أو slug مع منتج آخر في قاعدة البيانات.");
  return { errors, duplicate: !productId && ownerConflict };
}

export function isSafeRollbackVersion(
  currentUpdatedAt: string,
  postImportUpdatedAt: string,
) {
  return currentUpdatedAt === postImportUpdatedAt;
}

export function isValidSpecificationsJson(value: TransferScalar | undefined) {
  if (isBlankImportValue(value) || value === CLEAR_VALUE) return true;
  try {
    const parsed: unknown = JSON.parse(String(value));
    return (
      Array.isArray(parsed) &&
      parsed.every((item) => {
        if (!item || typeof item !== "object") return false;
        const candidate = item as { label?: unknown; value?: unknown };
        return (
          typeof candidate.label === "string" &&
          candidate.label.trim().length > 0 &&
          candidate.value != null
        );
      })
    );
  } catch {
    return false;
  }
}

export function zipContainsFilename(filenames: string[], requested: string) {
  const normalized = requested.trim().toLowerCase();
  return (
    normalized.length > 0 &&
    filenames.some((filename) => filename.trim().toLowerCase() === normalized)
  );
}
