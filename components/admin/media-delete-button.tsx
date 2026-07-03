"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function MediaDeleteButton({
  action,
  productName,
  returnTo = "product",
}: {
  action: (formData: FormData) => Promise<void>;
  productName: string;
  returnTo?: "product" | "media";
}) {
  return (
    <form
      action={action}
      onSubmit={(event) => {
        const confirmed = window.confirm(
          `هذه الصورة مرتبطة بالمنتج «${productName}». هل تريد إزالة الارتباط؟ لن يُحذف ملف من الصور الأصلية الحالية.`,
        );
        if (!confirmed) event.preventDefault();
      }}
    >
      <input type="hidden" name="confirmDelete" value="confirmed" />
      <input type="hidden" name="returnTo" value={returnTo} />
      <Button
        type="submit"
        variant="ghost"
        size="sm"
        className="text-red-700 hover:bg-red-50"
        icon={<Trash2 className="size-4" aria-hidden />}
      >
        حذف الصورة
      </Button>
    </form>
  );
}
