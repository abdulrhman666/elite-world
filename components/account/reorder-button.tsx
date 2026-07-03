"use client";

import { RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/cart/cart-provider";
import { Button } from "@/components/ui/button";

export function ReorderButton({
  items,
}: {
  items: Array<{ productSlug: string; quantity: number }>;
}) {
  const { addItem } = useCart();
  const router = useRouter();
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      icon={<RotateCcw className="size-4" aria-hidden />}
      onClick={() => {
        items.forEach((item) => addItem(item.productSlug, item.quantity));
        router.push("/cart");
      }}
    >
      إعادة الطلب
    </Button>
  );
}
