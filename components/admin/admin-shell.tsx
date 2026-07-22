"use client";

import {
  BriefcaseBusiness,
  ExternalLink,
  CreditCard,
  FileClock,
  FileText,
  Images,
  Import,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  PackageSearch,
  Newspaper,
  SearchCheck,
  Settings,
  Shapes,
  ShoppingBag,
  Tags,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { logoutAdminAction } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";

const navigationGroups = [
  {
    label: "الرئيسية",
    items: [{ label: "نظرة عامة", href: "/admin", icon: LayoutDashboard }],
  },
  {
    label: "الكتالوج",
    items: [
      { label: "المنتجات", href: "/admin/products", icon: Package },
      {
        label: "استيراد وتصدير",
        href: "/admin/product-transfer",
        icon: Import,
      },
      { label: "الأنشطة", href: "/admin/activities", icon: BriefcaseBusiness },
      { label: "الأقسام", href: "/admin/categories", icon: Shapes },
      { label: "العلامات التجارية", href: "/admin/brands", icon: Tags },
      { label: "مكتبة الصور", href: "/admin/media", icon: Images },
    ],
  },
  {
    label: "المحتوى",
    items: [
      { label: "صفحات الموقع", href: "/admin/pages", icon: FileText },
      {
        label: "إعدادات الموقع",
        href: "/admin/settings",
        icon: Settings,
        superAdminOnly: true,
      },
      {
        label: "إعدادات الدفع",
        href: "/admin/settings/payments",
        icon: CreditCard,
        superAdminOnly: true,
      },
      { label: "المقالات", href: "/admin/blog", icon: Newspaper },
      { label: "مركز SEO", href: "/admin/seo", icon: SearchCheck },
    ],
  },
  {
    label: "المبيعات",
    items: [
      { label: "المستخدمون", href: "/admin/customers", icon: Users },
      { label: "عروض الأسعار", href: "/admin/quotes", icon: FileClock },
      { label: "الطلبات", href: "/admin/orders", icon: ShoppingBag },
    ],
  },
] as const;

export function AdminShell({
  email,
  role,
  children,
}: {
  email: string;
  role: "SUPER_ADMIN" | "ADMIN";
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="bg-brand-surface min-h-screen lg:grid lg:grid-cols-[17rem_minmax(0,1fr)]">
      <aside className="bg-brand-petroleum sticky top-0 hidden h-screen border-e border-white/10 text-white lg:flex lg:flex-col">
        <SidebarContent email={email} role={role} />
      </aside>

      <div className="min-w-0">
        <header className="bg-brand-petroleum sticky top-0 z-30 flex min-h-16 items-center justify-between border-b border-white/10 px-4 text-white lg:hidden">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 font-bold"
          >
            <PackageSearch className="text-brand-cyan size-5" aria-hidden />
            إدارة ELITE WORLD
          </Link>
          <Button
            type="button"
            variant="light"
            size="icon"
            aria-label="فتح قائمة الإدارة"
            icon={<Menu className="size-5" aria-hidden />}
            onClick={() => setMobileOpen(true)}
          />
        </header>

        <div className="mx-auto w-full max-w-[1600px] p-4 sm:p-6 lg:p-10">
          {children}
        </div>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/60"
            aria-label="إغلاق قائمة الإدارة"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="bg-brand-petroleum absolute inset-y-0 start-0 flex w-[min(19rem,88vw)] flex-col text-white shadow-2xl">
            <button
              type="button"
              className="absolute end-4 top-4 grid size-10 place-items-center rounded-xl bg-white/10 hover:bg-white/20"
              aria-label="إغلاق القائمة"
              onClick={() => setMobileOpen(false)}
            >
              <X className="size-5" aria-hidden />
            </button>
            <SidebarContent
              email={email}
              role={role}
              onNavigate={() => setMobileOpen(false)}
            />
          </aside>
        </div>
      )}
    </div>
  );
}

function SidebarContent({
  email,
  role,
  onNavigate,
}: {
  email: string;
  role: "SUPER_ADMIN" | "ADMIN";
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  return (
    <>
      <div className="border-b border-white/10 p-5">
        <Link
          href="/admin"
          onClick={onNavigate}
          className="inline-flex items-center gap-3"
        >
          <span className="bg-brand-cyan/15 text-brand-cyan grid size-11 place-items-center rounded-2xl">
            <PackageSearch className="size-6" aria-hidden />
          </span>
          <span>
            <strong className="block text-base">ELITE WORLD</strong>
            <span className="text-xs text-cyan-100/70">لوحة الإدارة</span>
          </span>
        </Link>
      </div>

      <nav className="admin-scrollbar flex-1 space-y-6 overflow-y-auto px-3 py-5">
        {navigationGroups.map((group) => (
          <div key={group.label}>
            <p className="px-3 text-[11px] font-bold tracking-wide text-cyan-100/45">
              {group.label}
            </p>
            <div className="mt-2 space-y-1">
              {group.items
                .filter(
                  (item) =>
                    !("superAdminOnly" in item && item.superAdminOnly) ||
                    role === "SUPER_ADMIN",
                )
                .map(({ label, href, icon: Icon }) => {
                  const active =
                    href === "/admin"
                      ? pathname === href
                      : href === "/admin/settings"
                        ? pathname === href
                        : pathname === href || pathname.startsWith(`${href}/`);
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={onNavigate}
                      className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition ${
                        active
                          ? "bg-brand-cyan text-brand-ink shadow-brand"
                          : "text-cyan-50/85 hover:bg-white/10 hover:text-white"
                      }`}
                      aria-current={active ? "page" : undefined}
                    >
                      <Icon className="size-5 shrink-0" aria-hidden />
                      {label}
                    </Link>
                  );
                })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-white/10 p-4">
        <Link
          href="/"
          onClick={onNavigate}
          className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold text-cyan-50/85 hover:bg-white/10 hover:text-white"
        >
          <ExternalLink className="size-5" aria-hidden />
          معاينة المتجر
        </Link>
        <div className="mt-3 rounded-2xl bg-white/5 p-3">
          <p className="font-latin truncate text-xs text-cyan-100/70" dir="ltr">
            {email}
          </p>
          <p className="mt-1 text-xs font-bold text-cyan-50">
            {role === "SUPER_ADMIN" ? "مدير النظام" : "مدير"}
          </p>
          <form action={logoutAdminAction} className="mt-3">
            <Button
              type="submit"
              variant="light"
              size="sm"
              className="w-full"
              icon={<LogOut className="size-4" aria-hidden />}
            >
              تسجيل الخروج
            </Button>
          </form>
        </div>
      </div>
    </>
  );
}
