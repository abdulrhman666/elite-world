"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DeleteUserButton({
  userName,
  action,
}: {
  userName: string;
  action: (formData: FormData) => void;
}) {
  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!window.confirm(`هل تريد حذف حساب «${userName}»؟`)) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="confirmDelete" value="confirmed" />
      <Button
        type="submit"
        variant="ghost"
        size="sm"
        icon={<Trash2 className="size-4 text-red-600" aria-hidden />}
      >
        حذف
      </Button>
    </form>
  );
}
