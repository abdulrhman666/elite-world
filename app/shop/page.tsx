import type { Metadata } from "next";
import { Suspense } from "react";
import { CatalogExplorer } from "@/components/catalog/catalog-explorer";
import { CatalogPageHero } from "@/components/catalog/catalog-page-hero";
import { Container } from "@/components/ui/container";
import { LoadingSpinner } from "@/components/ui/feedback";
import {
  getCatalogCategories,
  getCatalogProducts,
} from "@/lib/catalog/service";
import { buildSeoMetadata } from "@/lib/seo/metadata";
import { getPageSeo } from "@/lib/seo/page-seo";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const params = await searchParams;
  return buildSeoMetadata({
    seo: await getPageSeo("/shop"),
    fallbackTitle: "متجر المعدات",
    fallbackDescription:
      "ابحث وصفِّ معدات المطاعم والمخابز والكافيهات ومنتجات الستانلس.",
    defaultPath: "/shop",
    forceNoIndex: Object.values(params).some((value) => value !== undefined),
  });
}

export default async function ShopPage() {
  const [categories, products] = await Promise.all([
    getCatalogCategories(),
    getCatalogProducts(),
  ]);

  return (
    <>
      <CatalogPageHero
        title="متجر المعدات"
        description="كتالوج عملي للمعدات التجارية، مع بحث وفلاتر تحفظ اختياراتك في رابط الصفحة."
      />
      <section className="section-space bg-white" aria-label="منتجات المتجر">
        <Container>
          <Suspense fallback={<LoadingSpinner label="جارٍ تجهيز الكتالوج" />}>
            <CatalogExplorer
              categories={categories}
              products={products}
              emptyDescription="لا توجد منتجات محفوظة في قاعدة البيانات حالياً."
            />
          </Suspense>
        </Container>
      </section>
    </>
  );
}
