"use client";

import { LoaderCircle } from "lucide-react";
import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { buttonClasses } from "@/components/ui/button";

export function TransferSubmitButton({
  children,
  pendingLabel,
  className,
}: {
  children: ReactNode;
  pendingLabel: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className={buttonClasses({ className })}
    >
      {pending && <LoaderCircle className="size-4 animate-spin" aria-hidden />}
      {pending ? pendingLabel : children}
    </button>
  );
}
