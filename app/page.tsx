import type { Metadata } from "next";
import { CommerceTrustBar } from "@/components/commerce/trust-layer";
import { CategoriesSection } from "@/components/home/categories-section";
import { FinalCta } from "@/components/home/final-cta";
import { Hero } from "@/components/home/hero";
import { ProductsSection } from "@/components/home/products-section";
import { getSiteSettings } from "@/lib/site-settings";
import { buildSeoMetadata } from "@/lib/seo/metadata";
import { getPageSeo } from "@/lib/seo/page-seo";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const [settings, seo] = await Promise.all([
    getSiteSettings(),
    getPageSeo("/"),
  ]);
  return buildSeoMetadata({
    seo,
    fallbackTitle: `${settings.companyNameEn} | معدات وحلول صناعية`,
    fallbackDescription: settings.companyDescription,
    defaultPath: "/",
    fallbackImage: settings.heroImage,
    fallbackImageAlt: settings.heroTitle,
  });
}

export default async function HomePage() {
  const settings = await getSiteSettings();
  return (
    <>
      <Hero settings={settings} />
      <CommerceTrustBar />
      <CategoriesSection />
      <ProductsSection />
      <FinalCta />
    </>
  );
}
