"use client";

import { Heart, Menu, Search, ShoppingCart, UserRound, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useCart } from "@/components/cart/cart-provider";
import { TopBar } from "@/components/layout/top-bar";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import type { SiteSettingsData } from "@/types/site-settings";

const actionLinks = [
  { label: "البحث", href: "/search", icon: Search },
  { label: "الحساب", href: "/account", icon: UserRound },
  { label: "المفضلة", href: "/favorites", icon: Heart },
  { label: "السلة", href: "/cart", icon: ShoppingCart },
];

const desktopNavigation = siteConfig.navigation.filter((item) =>
  [
    "/",
    "/shop",
    "/categories",
    "/stainless",
    "/project-solutions",
    "/brands",
    "/contact",
  ].includes(item.href),
);

export function Header({ settings }: { settings: SiteSettingsData }) {
  const [open, setOpen] = useState(false);
  const { itemCount } = useCart();
  const pathname = usePathname();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className="border-brand-border/80 sticky top-0 z-50 border-b bg-white/95 shadow-[0_4px_24px_rgba(16,42,51,0.05)] backdrop-blur-xl">
      <TopBar settings={settings} />
      <Container className="flex min-h-[76px] items-center justify-between gap-4 lg:min-h-[82px]">
        <Link
          href="/"
          className="focus-visible:ring-brand-cyan/30 shrink-0 rounded-lg focus-visible:ring-3 focus-visible:outline-none"
          aria-label={`${settings.companyNameEn} - الصفحة الرئيسية`}
        >
          <Image
            src={settings.logo}
            width={92}
            height={73}
            priority
            alt={`شعار ${settings.companyNameEn}`}
            className="h-14 w-auto object-contain lg:h-16"
          />
        </Link>

        <div className="hidden items-center gap-2 lg:flex">
          {actionLinks.map(({ label, href, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              aria-label={label}
              title={label}
              className="text-brand-ink hover:bg-brand-surface hover:text-brand-petroleum focus-visible:ring-brand-cyan/30 relative grid size-11 place-items-center rounded-xl transition focus-visible:ring-3 focus-visible:outline-none"
            >
              <Icon className="size-5" aria-hidden />
              {href === "/cart" && (
                <span
                  className="bg-brand-cyan font-latin absolute -top-0.5 -left-0.5 grid min-w-5 place-items-center rounded-full px-1 text-[10px] font-bold text-white"
                  aria-label={`السلة تحتوي على ${itemCount} قطعة`}
                >
                  {itemCount > 99 ? "99+" : itemCount}
                </span>
              )}
            </Link>
          ))}
          <ButtonLink href="/quote" size="sm" className="ms-2">
            طلب عرض سعر
          </ButtonLink>
        </div>

        <button
          type="button"
          className="border-brand-border text-brand-ink grid size-12 place-items-center rounded-xl border lg:hidden"
          onClick={() => setOpen(true)}
          aria-label="فتح قائمة التنقل"
          aria-expanded={open}
          aria-controls="mobile-menu"
        >
          <Menu className="size-6" aria-hidden />
        </button>
      </Container>

      <nav
        aria-label="التنقل الرئيسي"
        className="border-brand-border/70 hidden border-t lg:block"
      >
        <Container className="flex min-h-14 items-center justify-center gap-x-5 xl:gap-x-8">
          {desktopNavigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "hover:text-brand-petroleum focus-visible:ring-brand-cyan relative inline-flex min-h-12 items-center text-[13px] font-semibold whitespace-nowrap text-slate-600 transition focus-visible:rounded-md focus-visible:ring-2 focus-visible:outline-none",
                pathname === item.href &&
                  "text-brand-petroleum after:bg-brand-cyan after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:rounded-full",
              )}
            >
              {item.label}
            </Link>
          ))}
        </Container>
      </nav>

      {open && (
        <div className="fixed inset-0 z-[70] lg:hidden" role="presentation">
          <button
            type="button"
            className="bg-brand-ink/65 absolute inset-0"
            onClick={() => setOpen(false)}
            aria-label="إغلاق قائمة التنقل"
          />
          <aside
            id="mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label="قائمة التنقل"
            className="absolute inset-y-0 right-0 flex w-[min(88vw,390px)] flex-col overflow-y-auto bg-white shadow-2xl"
          >
            <div className="border-brand-border flex min-h-20 items-center justify-between border-b px-5">
              <Image
                src={settings.logo}
                width={74}
                height={59}
                alt={`شعار ${settings.companyNameEn}`}
                className="h-14 w-auto object-contain"
              />
              <button
                ref={closeRef}
                type="button"
                onClick={() => setOpen(false)}
                className="border-brand-border grid size-11 place-items-center rounded-xl border"
                aria-label="إغلاق القائمة"
              >
                <X className="size-5" aria-hidden />
              </button>
            </div>
            <nav aria-label="التنقل للجوال" className="flex-1 p-4">
              {siteConfig.navigation.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "text-brand-ink hover:bg-brand-surface flex min-h-12 items-center rounded-xl px-4 font-semibold",
                    pathname === item.href &&
                      "bg-brand-cyan/10 text-brand-petroleum",
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="border-brand-border grid gap-3 border-t p-5">
              <div className="grid grid-cols-2 gap-3">
                <ButtonLink
                  href="/account"
                  variant="outline"
                  className="w-full"
                  onClick={() => setOpen(false)}
                >
                  حسابي
                </ButtonLink>
                <ButtonLink
                  href="/favorites"
                  variant="outline"
                  className="w-full"
                  onClick={() => setOpen(false)}
                >
                  المفضلة
                </ButtonLink>
              </div>
              <ButtonLink
                href="/cart"
                className="w-full"
                onClick={() => setOpen(false)}
              >
                السلة ({itemCount})
              </ButtonLink>
              <ButtonLink
                href="/quote"
                variant="outline"
                className="w-full"
                onClick={() => setOpen(false)}
              >
                طلب عرض سعر
              </ButtonLink>
            </div>
          </aside>
        </div>
      )}
    </header>
  );
}
