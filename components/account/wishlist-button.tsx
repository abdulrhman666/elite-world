"use client";

import { Heart } from "lucide-react";
import { useFormStatus } from "react-dom";
import { addWishlistAction } from "@/app/account/actions";

export function WishlistButton({ productSlug }: { productSlug: string }) {
  return (
    <form action={addWishlistAction.bind(null, productSlug)}>
      <WishlistSubmit />
    </form>
  );
}

function WishlistSubmit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="border-brand-border text-brand-petroleum hover:border-brand-cyan flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border px-3 text-xs font-bold disabled:opacity-60"
    >
      <Heart className="size-4" aria-hidden />
      {pending ? "جارٍ الحفظ" : "حفظ بالمفضلة"}
    </button>
  );
}
