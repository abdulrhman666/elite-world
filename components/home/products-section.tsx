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
        className="bg-white py-10 sm:py-16 lg:py-20"
        aria-labelledby="best-sellers-title"
      >
        <Container>
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <SectionHeading
              id="best-sellers-title"
              eyebrow="اختيار العملاء"
              title="الأكثر طلباً"
            />
            <ButtonLink
              href="/shop?sort=best-selling"
              variant="outline"
              className="self-start sm:self-auto"
            >
              عرض المتجر
            </ButtonLink>
          </div>
          <div className="mt-7 grid grid-cols-2 gap-3 sm:mt-10 sm:gap-5 xl:grid-cols-4">
            {bestSellingProducts.map((product) => (
              <ProductCard key={product.slug} product={product} compact />
            ))}
          </div>
        </Container>
      </section>

      <section
        className="bg-brand-surface py-10 sm:py-16 lg:py-20"
        aria-labelledby="products-title"
      >
        <Container>
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <SectionHeading
              id="products-title"
              eyebrow="مختارات التشغيل"
              title="منتجات مميزة"
            />
            <ButtonLink
              href="/shop"
              variant="outline"
              className="self-start sm:self-auto"
            >
              تصفح الكتالوج
            </ButtonLink>
          </div>
          <div className="mt-7 grid grid-cols-2 gap-3 sm:mt-10 sm:gap-5 xl:grid-cols-4">
            {distinctFeatured.slice(0, 8).map((product) => (
              <ProductCard key={product.slug} product={product} compact />
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
