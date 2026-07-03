import { Boxes } from "lucide-react";
import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { CatalogPageHero } from "@/components/catalog/catalog-page-hero";
import { JsonLd } from "@/components/seo/json-ld";
import { ProductCard } from "@/components/ui/product-card";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/feedback";
import {
  getCatalogCategoryBySlug,
  getCatalogProductsByCategory,
} from "@/lib/catalog/service";
import { siteConfig } from "@/config/site";
import { absoluteSiteUrl, buildSeoMetadata } from "@/lib/seo/metadata";
import { getPermanentRedirect } from "@/lib/seo/redirects";

type CategoryPageProps = { params: Promise<{ slug: string }> };

// الأقسام تُقرأ من Prisma وقت الطلب حتى تظهر تغييرات الإدارة مباشرة.
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCatalogCategoryBySlug(slug);
  if (!category) return {};
  return buildSeoMetadata({
    seo: category.seo,
    fallbackTitle: category.name,
    fallbackDescription: category.description,
    defaultPath: `/categories/${category.slug}`,
    fallbackImage: category.image,
    fallbackImageAlt: `قسم ${category.name}`,
  });
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const category = await getCatalogCategoryBySlug(slug);
  if (!category) {
    const redirect = await getPermanentRedirect(`/categories/${slug}`);
    if (redirect) permanentRedirect(redirect.destinationPath);
    notFound();
  }
  const products = await getCatalogProductsByCategory(category.slug);
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "الرئيسية",
        item: siteConfig.url,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "الأقسام",
        item: absoluteSiteUrl("/categories"),
      },
      {
        "@type": "ListItem",
        position: 3,
        name: category.name,
        item: absoluteSiteUrl(`/categories/${category.slug}`),
      },
    ],
  };

  return (
    <>
      <JsonLd data={breadcrumbSchema} />
      <CatalogPageHero
        title={category.name}
        description={category.description}
        eyebrow={category.nameEn}
        breadcrumbItems={[{ label: "الأقسام", href: "/categories" }]}
      />

      <section className="border-brand-border bg-brand-surface border-b py-10">
        <Container>
          <div className="flex items-center gap-3">
            <span className="bg-brand-cyan/10 text-brand-petroleum grid size-11 place-items-center rounded-xl">
              <Boxes className="size-5" aria-hidden />
            </span>
            <div>
              <h2 className="text-brand-ink text-xl font-bold">
                الأقسام الفرعية
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                التصنيف الحالي يضم {products.length} منتجاً.
              </p>
            </div>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {category.subcategories.map((subcategory) => {
              const count = products.filter(
                (product) => product.subcategorySlug === subcategory.slug,
              ).length;
              return (
                <div
                  key={subcategory.slug}
                  className="border-brand-border rounded-2xl border bg-white p-4"
                >
                  <p className="text-brand-ink font-semibold">
                    {subcategory.name}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">{count} منتج</p>
                </div>
              );
            })}
          </div>
        </Container>
      </section>

      <section
        className="section-space bg-white"
        aria-labelledby="category-products"
      >
        <Container>
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-brand-cyan text-sm font-bold">الكتالوج</p>
              <h2
                id="category-products"
                className="text-brand-ink mt-2 text-3xl font-bold"
              >
                منتجات {category.name}
              </h2>
            </div>
            <p className="text-sm text-slate-500">{products.length} نتيجة</p>
          </div>
          {products.length > 0 ? (
            <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {products.map((product) => (
                <ProductCard key={product.slug} product={product} />
              ))}
            </div>
          ) : (
            <div className="mt-8">
              <EmptyState
                title="لا توجد منتجات في هذا القسم"
                description="لم تُضف منتجات مرتبطة بهذا القسم في قاعدة البيانات بعد."
              />
            </div>
          )}
        </Container>
      </section>
    </>
  );
}
