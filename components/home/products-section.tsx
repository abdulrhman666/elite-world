import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { ProductCard } from "@/components/ui/product-card";
import { SectionHeading } from "@/components/ui/section-heading";
import {
  getCatalogBestSellingProducts,
  getCatalogFeaturedProducts,
} from "@/lib/catalog/service";

export async function ProductsSection() {
  const [bestSellingProducts, featuredProducts] = await Promise.all([
    getCatalogBestSellingProducts(),
    getCatalogFeaturedProducts(),
  ]);
  const bestSellingSlugs = new Set(
    bestSellingProducts.map((product) => product.slug),
  );
  const distinctFeatured = featuredProducts.filter(
    (product) => !bestSellingSlugs.has(product.slug),
  );

  return (
    <>
      <section
        id="best-sellers"
        className="section-space bg-white"
        aria-labelledby="best-sellers-title"
      >
        <Container>
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <SectionHeading
              id="best-sellers-title"
              eyebrow="اختيار العملاء"
              title="الأكثر طلباً"
              description="معدات يتكرر طلبها من عملائنا، مرتبة حسب بيانات الطلبات الفعلية."
            />
            <ButtonLink
              href="/shop?sort=best-selling"
              variant="outline"
              className="self-start sm:self-auto"
            >
              عرض المتجر
            </ButtonLink>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {bestSellingProducts.map((product) => (
              <ProductCard key={product.slug} product={product} />
            ))}
          </div>
        </Container>
      </section>

      <section
        className="section-space bg-brand-surface"
        aria-labelledby="products-title"
      >
        <Container>
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <SectionHeading
              id="products-title"
              eyebrow="مختارات التشغيل"
              title="منتجات مميزة"
              description="مختارات من الكتالوج تعرض الموديل والتوفر والسعر أو خيار طلب عرض السعر."
            />
            <ButtonLink
              href="/shop"
              variant="outline"
              className="self-start sm:self-auto"
            >
              تصفح الكتالوج
            </ButtonLink>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {distinctFeatured.slice(0, 8).map((product) => (
              <ProductCard key={product.slug} product={product} />
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
