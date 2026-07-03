"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCustomerSession } from "@/lib/auth/customer-auth";
import { getPrismaClient } from "@/lib/prisma";

export async function addWishlistAction(productSlug: string) {
  const session = await getCustomerSession();
  if (!session) {
    redirect(
      `/auth/login?next=${encodeURIComponent(`/products/${productSlug}`)}`,
    );
  }
  const product = await getPrismaClient().product.findUnique({
    where: { slug: productSlug },
    select: { id: true },
  });
  if (!product) return;
  await getPrismaClient().wishlistItem.upsert({
    where: {
      userId_productId: { userId: session.userId, productId: product.id },
    },
    create: { userId: session.userId, productId: product.id },
    update: {},
  });
  revalidatePath("/account");
}

export async function removeWishlistAction(wishlistId: string) {
  const session = await getCustomerSession();
  if (!session) redirect("/auth/login?error=session");
  await getPrismaClient().wishlistItem.deleteMany({
    where: { id: wishlistId, userId: session.userId },
  });
  revalidatePath("/account");
}
