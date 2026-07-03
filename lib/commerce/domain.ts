import { randomBytes } from "node:crypto";

export type RequestedQuoteItem = { slug: string; quantity: number };

export function generateReferenceNumber(
  prefix: "Q" | "O" | "D",
  now = new Date(),
) {
  const date = now.toISOString().slice(0, 10).replaceAll("-", "");
  const random = randomBytes(3).toString("hex").toUpperCase();
  return `${prefix}-${date}-${random}`;
}

export function generateTrackingToken() {
  return randomBytes(32).toString("base64url");
}

export function normalizeRequestedItems(value: unknown): RequestedQuoteItem[] {
  if (!Array.isArray(value)) throw new Error("INVALID_ITEMS");
  const quantities = new Map<string, number>();
  for (const item of value) {
    if (!item || typeof item !== "object") throw new Error("INVALID_ITEMS");
    const record = item as Record<string, unknown>;
    const slug = String(record.slug ?? "").trim();
    const quantity = Number(record.quantity);
    if (
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) ||
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      quantity > 999
    ) {
      throw new Error("INVALID_ITEMS");
    }
    quantities.set(slug, Math.min(999, (quantities.get(slug) ?? 0) + quantity));
  }
  const items = [...quantities].map(([slug, quantity]) => ({ slug, quantity }));
  if (items.length === 0 || items.length > 50) throw new Error("INVALID_ITEMS");
  return items;
}

export function assertQuoteConvertible({ hasOrder }: { hasOrder: boolean }) {
  if (hasOrder) throw new Error("ALREADY_CONVERTED");
}
