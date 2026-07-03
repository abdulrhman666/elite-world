"use client";

import { ShoppingCart } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/cart/cart-provider";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

export function AddToCartButton({
  productSlug,
  productName,
  stockQuantity,
  openCart = false,
  label = "أضف للسلة",
  className,
}: {
  productSlug: string;
  productName: string;
  stockQuantity: number;
  openCart?: boolean;
  label?: string;
  className?: string;
}) {
  const router = useRouter();
  const { addItem } = useCart();
  const { showToast } = useToast();

  function add() {
    if (stockQuantity <= 0) return;
    addItem(productSlug, 1, stockQuantity);
    if (openCart) {
      router.push("/cart");
      return;
    }
    showToast(`تمت إضافة ${productName} إلى السلة.`);
  }

  return (
    <Button
      type="button"
      className={className}
      disabled={stockQuantity <= 0}
      onClick={add}
      icon={<ShoppingCart className="size-4" aria-hidden />}
    >
      {stockQuantity > 0 ? label : "غير متوفر"}
    </Button>
  );
}
