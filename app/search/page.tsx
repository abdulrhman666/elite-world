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

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "البحث في الكتالوج",
  description:
    "بحث محلي سريع في أسماء المنتجات وSKU والموديلات والعلامات والأقسام.",
  alternates: { canonical: "/search" },
  robots: { index: false, follow: false },
};

export default async function SearchPage() {
  const [categories, products] = await Promise.all([
    getCatalogCategories(),
    getCatalogProducts(),
  ]);

  return (
    <>
      <CatalogPageHero
        title="البحث في الكتالوج"
        description="ابحث بالاسم العربي أو الإنجليزي، SKU، الموديل، العلامة التجارية أو القسم."
        eyebrow="بحث محلي سريع"
      />
      <section className="section-space bg-white" aria-label="نتائج البحث">
        <Container>
          <Suspense fallback={<LoadingSpinner label="جارٍ تجهيز البحث" />}>
            <CatalogExplorer
              categories={categories}
              products={products}
              mode="search"
            />
          </Suspense>
        </Container>
      </section>
    </>
  );
}
