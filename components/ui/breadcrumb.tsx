import { ChevronLeft, Home } from "lucide-react";
import Link from "next/link";

type BreadcrumbProps = {
  current: string;
  items?: Array<{ label: string; href: string }>;
  tone?: "light" | "dark";
};

export function Breadcrumb({
  current,
  items = [],
  tone = "light",
}: BreadcrumbProps) {
  const dark = tone === "dark";
  return (
    <nav
      aria-label="مسار التنقل"
      className={`flex items-center gap-2 text-sm ${dark ? "text-cyan-100/75" : "text-slate-500"}`}
    >
      <Link
        href="/"
        className={`focus-visible:ring-brand-cyan inline-flex items-center gap-1.5 rounded-md focus-visible:ring-2 focus-visible:outline-none ${dark ? "hover:text-white" : "hover:text-brand-petroleum"}`}
      >
        <Home className="size-4" aria-hidden />
        الرئيسية
      </Link>
      <ChevronLeft className="size-4" aria-hidden />
      {items.map((item) => (
        <span key={item.href} className="contents">
          <Link
            href={item.href}
            className={`focus-visible:ring-brand-cyan rounded-md focus-visible:ring-2 focus-visible:outline-none ${dark ? "hover:text-white" : "hover:text-brand-petroleum"}`}
          >
            {item.label}
          </Link>
          <ChevronLeft className="size-4" aria-hidden />
        </span>
      ))}
      <span
        aria-current="page"
        className={
          dark ? "font-medium text-white" : "text-brand-ink font-medium"
        }
      >
        {current}
      </span>
    </nav>
  );
}
