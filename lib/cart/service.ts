import "server-only";
import { getPrismaClient } from "@/lib/prisma";

export type StoredCartItem = {
  slug: string;
  quantity: number;
};

export type CartMutation =
  | { action: "add" | "set"; slug: string; quantity: number }
  | { action: "remove"; slug: string }
  | { action: "clear" };

const cartSelect = {
  quantity: true,
  product: { select: { slug: true } },
} as const;

function mapCartItems(
  records: Array<{ quantity: number; product: { slug: string } }>,
): StoredCartItem[] {
  return records.map((record) => ({
    slug: record.product.slug,
    quantity: record.quantity,
  }));
}

export async function getUserCart(userId: string) {
  const records = await getPrismaClient().cart.findMany({
    where: { userId },
    select: cartSelect,
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
  });
  return mapCartItems(records);
}

export async function mutateUserCart(userId: string, mutation: CartMutation) {
  const prisma = getPrismaClient();
  return prisma.$transaction(async (transaction) => {
    if (mutation.action === "clear") {
      await transaction.cart.deleteMany({ where: { userId } });
    } else {
      const product = await transaction.product.findUnique({
        where: { slug: mutation.slug },
        select: { id: true, stockQuantity: true },
      });
      if (!product) throw new Error("PRODUCT_NOT_FOUND");

      if (mutation.action === "remove") {
        await transaction.cart.deleteMany({
          where: { userId, productId: product.id },
        });
      } else {
        if (product.stockQuantity < 1) throw new Error("OUT_OF_STOCK");
        const requested = Math.max(1, Math.min(999, mutation.quantity));
        const existing = await transaction.cart.findUnique({
          where: { userId_productId: { userId, productId: product.id } },
          select: { quantity: true },
        });
        const quantity = Math.min(
          product.stockQuantity,
          mutation.action === "add"
            ? (existing?.quantity ?? 0) + requested
            : requested,
        );
        await transaction.cart.upsert({
          where: { userId_productId: { userId, productId: product.id } },
          update: { quantity },
          create: { userId, productId: product.id, quantity },
        });
      }
    }

    const records = await transaction.cart.findMany({
      where: { userId },
      select: cartSelect,
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    });
    return mapCartItems(records);
  });
}
