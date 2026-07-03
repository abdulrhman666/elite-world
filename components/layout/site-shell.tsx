"use client";

import { usePathname } from "next/navigation";

export function SiteShell({
  children,
  header,
  footer,
  mobileNavigation,
  floatingAction,
}: {
  children: React.ReactNode;
  header: React.ReactNode;
  footer: React.ReactNode;
  mobileNavigation: React.ReactNode;
  floatingAction: React.ReactNode;
}) {
  const pathname = usePathname();
  const admin = pathname.startsWith("/admin");

  return (
    <>
      <a href="#main-content" className="skip-link">
        تخطَّ إلى المحتوى
      </a>
      {!admin && header}
      <main id="main-content" tabIndex={-1}>
        {children}
      </main>
      {!admin && footer}
      {!admin && mobileNavigation}
      {!admin && floatingAction}
    </>
  );
}
