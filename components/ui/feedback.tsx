import { Inbox, Info, LoaderCircle } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function LoadingSpinner({ label = "جارٍ التحميل" }: { label?: string }) {
  return (
    <span
      className="text-brand-petroleum inline-flex items-center gap-2 text-sm"
      role="status"
    >
      <LoaderCircle className="size-5 animate-spin" aria-hidden />
      <span>{label}</span>
    </span>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <span
      className={cn("block animate-pulse rounded-xl bg-slate-200", className)}
      aria-hidden
    />
  );
}

export function EmptyState({
  title = "لا توجد نتائج",
  description = "جرّب تغيير خيارات البحث لاحقاً.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="border-brand-border rounded-3xl border border-dashed bg-white p-8 text-center">
      <Inbox className="text-brand-cyan mx-auto size-10" aria-hidden />
      <h3 className="text-brand-ink mt-3 text-lg font-bold">{title}</h3>
      <p className="mt-1 text-sm text-slate-600">{description}</p>
    </div>
  );
}

export function Alert({
  children,
  title = "تنبيه",
  className,
}: {
  children: ReactNode;
  title?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-amber-950",
        className,
      )}
      role="status"
    >
      <Info className="mt-0.5 size-5 shrink-0" aria-hidden />
      <div>
        <p className="font-semibold">{title}</p>
        <div className="mt-1 text-sm leading-6">{children}</div>
      </div>
    </div>
  );
}
