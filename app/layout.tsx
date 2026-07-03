import "@fontsource/ibm-plex-sans-arabic/400.css";
import "@fontsource/ibm-plex-sans-arabic/500.css";
import "@fontsource/ibm-plex-sans-arabic/600.css";
import "@fontsource/ibm-plex-sans-arabic/700.css";
import "@fontsource-variable/manrope";
import type { Metadata, Viewport } from "next";
import { CartProvider } from "@/components/cart/cart-provider";
import { Footer } from "@/components/layout/footer";
import { FloatingWhatsApp } from "@/components/layout/floating-whatsapp";
import { Header } from "@/components/layout/header";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { SiteShell } from "@/components/layout/site-shell";
import { JsonLd } from "@/components/seo/json-ld";
import { ToastProvider } from "@/components/ui/toast";
import { siteConfig } from "@/config/site";
import { getCustomerSession } from "@/lib/auth/customer-auth";
import { getSiteSettings } from "@/lib/site-settings";
import { absoluteSiteUrl } from "@/lib/seo/metadata";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return {
    metadataBase: new URL(siteConfig.url),
    title: {
      default: `${settings.companyNameEn} | معدات وحلول صناعية`,
      template: `%s | ${settings.companyNameEn}`,
    },
    description: settings.companyDescription,
    applicationName: settings.companyNameEn,
    openGraph: {
      type: "website",
      locale: "ar_SA",
      siteName: settings.companyNameEn,
      title: `${settings.companyNameEn} | معدات وحلول صناعية`,
      description: settings.companyDescription,
      images: [{ url: settings.logo, alt: `شعار ${settings.companyNameEn}` }],
    },
    robots: { index: true, follow: true },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#00677F",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const settings = await getSiteSettings();
  const session = await getCustomerSession();
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: settings.companyNameEn,
    alternateName: settings.companyNameAr,
    url: siteConfig.url,
    logo: absoluteSiteUrl(settings.logo),
    description: settings.companyDescription,
    telephone: settings.phone,
    email: settings.email,
    address: {
      "@type": "PostalAddress",
      addressLocality: settings.city,
      streetAddress: settings.address,
    },
  };
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: settings.companyNameEn,
    alternateName: settings.companyNameAr,
    url: siteConfig.url,
    inLanguage: "ar-SA",
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteConfig.url}/shop?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
  return (
    <html lang="ar" dir="rtl" data-scroll-behavior="smooth">
      <head>
        <link rel="icon" href={settings.favicon} />
      </head>
      <body>
        <ToastProvider>
          <CartProvider authenticated={Boolean(session)}>
            <SiteShell
              header={<Header settings={settings} />}
              footer={<Footer settings={settings} />}
              mobileNavigation={<MobileBottomNav />}
              floatingAction={<FloatingWhatsApp settings={settings} />}
            >
              {children}
            </SiteShell>
          </CartProvider>
        </ToastProvider>
        <JsonLd data={organizationSchema} />
        <JsonLd data={websiteSchema} />
      </body>
    </html>
  );
}
