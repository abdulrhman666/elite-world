"use client";

import { FilePlus2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

export const QUOTE_DRAFT_STORAGE_KEY = "elite-world-quote-draft";

type DraftItem = { slug: string; quantity: number };

function readDraft(): DraftItem[] {
  try {
    const value = JSON.parse(
      window.localStorage.getItem(QUOTE_DRAFT_STORAGE_KEY) ?? "[]",
    );
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

export function AddToQuoteButton({
  productSlug,
  productName,
  openQuote = false,
  label = "أضف لعرض السعر",
  className,
}: {
  productSlug: string;
  productName: string;
  openQuote?: boolean;
  label?: string;
  className?: string;
}) {
  const router = useRouter();
  const { showToast } = useToast();

  function add() {
    const items = readDraft();
    const existing = items.find((item) => item.slug === productSlug);
    if (existing) existing.quantity = Math.min(999, existing.quantity + 1);
    else items.push({ slug: productSlug, quantity: 1 });
    try {
      window.localStorage.setItem(
        QUOTE_DRAFT_STORAGE_KEY,
        JSON.stringify(items),
      );
    } catch {
      // The query parameter still lets the quote page receive this product.
    }
    if (openQuote) {
      router.push(`/quote?product=${encodeURIComponent(productSlug)}`);
      return;
    }
    showToast(`تمت إضافة ${productName} إلى طلب عرض السعر.`);
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className={className}
      onClick={add}
      icon={<FilePlus2 className="size-4" aria-hidden />}
    >
      {label}
    </Button>
  );
}
