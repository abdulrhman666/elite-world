import type { Metadata } from "next";
import { CatalogPageHero } from "@/components/catalog/catalog-page-hero";
import { CategoryCard } from "@/components/ui/cards";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/feedback";
import { getCatalogCategories } from "@/lib/catalog/service";
import { buildSeoMetadata } from "@/lib/seo/metadata";
import { getPageSeo } from "@/lib/seo/page-seo";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return buildSeoMetadata({
    seo: await getPageSeo("/categories"),
    fallbackTitle: "أقسام المعدات",
    fallbackDescription:
      "ثمانية أقسام رئيسية تغطي الطبخ والمخابز والكافيهات والتبريد والتحضير والغسيل والبوفيهات والستانلس.",
    defaultPath: "/categories",
  });
}

export default async function CategoriesPage() {
  const categories = await getCatalogCategories();

  return (
    <>
      <CatalogPageHero
        title="أقسام المعدات"
        description="اختر النشاط أو نوع التجهيز للوصول إلى الأقسام الفرعية والمنتجات المرتبطة به."
      />
      <section className="section-space bg-white" aria-label="قائمة الأقسام">
        <Container>
          {categories.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {categories.map((category, index) => (
                <CategoryCard
                  key={category.slug}
                  category={category}
                  count={category.productCount ?? 0}
                  className={
                    categories.length % 4 === 1 &&
                    index === categories.length - 1
                      ? "lg:col-span-2 lg:col-start-2"
                      : undefined
                  }
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title="لا توجد أقسام محفوظة"
              description="ستظهر الأقسام هنا بعد إضافتها إلى قاعدة البيانات."
            />
          )}
        </Container>
      </section>
    </>
  );
}
