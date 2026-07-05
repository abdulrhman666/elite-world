import { ButtonLink } from "@/components/ui/button";
import { CategoryCard } from "@/components/ui/cards";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { getCatalogCategories } from "@/lib/catalog/service";

export async function CategoriesSection() {
  const categories = await getCatalogCategories();

  return (
    <section
      className="bg-brand-surface py-10 sm:py-16 lg:py-20"
      aria-labelledby="categories-title"
    >
      <Container>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeading
            id="categories-title"
            eyebrow="حلول لكل نشاط"
            title="أقسام المعدات"
          />
          <ButtonLink
            href="/categories"
            variant="outline"
            className="self-start sm:self-auto"
          >
            جميع الأقسام
          </ButtonLink>
        </div>
        <div className="-mx-4 mt-7 grid snap-x snap-mandatory auto-cols-[46%] grid-flow-col gap-3 overflow-x-auto px-4 pb-3 sm:mx-0 sm:mt-10 sm:grid-flow-row sm:auto-cols-auto sm:grid-cols-2 sm:gap-5 sm:overflow-visible sm:px-0 sm:pb-0 xl:grid-cols-4">
          {categories.slice(0, 4).map((category) => (
            <CategoryCard
              key={category.slug}
              category={category}
              count={category.productCount ?? 0}
              compact
            />
          ))}
        </div>
      </Container>
    </section>
  );
}
