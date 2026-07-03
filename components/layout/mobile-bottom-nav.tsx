"use client";

import { Boxes, FileSearch, Home, Search, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const items = [
  { label: "الرئيسية", href: "/", icon: Home },
  { label: "الأقسام", href: "/categories", icon: Boxes },
  { label: "البحث", href: "/search", icon: Search },
  { label: "عرض السعر", href: "/quote", icon: FileSearch },
  { label: "السلة", href: "/cart", icon: ShoppingCart },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="التنقل السريع للجوال"
      className="border-brand-border fixed inset-x-0 bottom-0 z-40 border-t bg-white/95 px-2 pb-[max(0.35rem,env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgba(16,42,51,.08)] backdrop-blur-xl lg:hidden"
    >
      <div className="mx-auto grid max-w-lg grid-cols-5">
        {items.map(({ label, href, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "focus-visible:ring-brand-cyan flex min-h-[64px] flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-semibold text-slate-500 focus-visible:ring-2 focus-visible:outline-none",
                active && "text-brand-petroleum",
              )}
            >
              <Icon
                className={cn("size-5", active && "text-brand-cyan")}
                aria-hidden
              />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
