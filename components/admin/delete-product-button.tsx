"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DeleteProductButton({
  action,
  productName,
}: {
  action: () => Promise<void>;
  productName: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!window.confirm(`هل تريد حذف «${productName}» نهائياً؟`)) {
          event.preventDefault();
        }
      }}
    >
      <Button
        type="submit"
        variant="ghost"
        size="sm"
        className="text-red-700 hover:bg-red-50"
        icon={<Trash2 className="size-4" aria-hidden />}
      >
        حذف
      </Button>
    </form>
  );
}
