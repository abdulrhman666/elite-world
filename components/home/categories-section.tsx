import { ButtonLink } from "@/components/ui/button";
import { CategoryCard } from "@/components/ui/cards";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { getCatalogCategories } from "@/lib/catalog/service";

export async function CategoriesSection() {
  const categories = await getCatalogCategories();

  return (
    <section
      className="section-space bg-brand-surface"
      aria-labelledby="categories-title"
    >
      <Container>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeading
            id="categories-title"
            eyebrow="حلول لكل نشاط"
            title="أقسام المعدات"
            description="استكشف مجموعة متكاملة من المعدات التجارية والتصنيع المخصص ضمن كتالوج واضح ومنظم."
          />
          <ButtonLink
            href="/categories"
            variant="outline"
            className="self-start sm:self-auto"
          >
            جميع الأقسام
          </ButtonLink>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {categories.slice(0, 4).map((category) => (
            <CategoryCard
              key={category.slug}
              category={category}
              count={category.productCount ?? 0}
            />
          ))}
        </div>
      </Container>
    </section>
  );
}
