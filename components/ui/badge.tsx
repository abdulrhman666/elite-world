import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Badge({
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "border-brand-cyan/20 bg-brand-cyan/10 text-brand-petroleum inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold",
        className,
      )}
      {...props}
    />
  );
}
