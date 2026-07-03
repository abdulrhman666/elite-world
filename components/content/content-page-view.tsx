import {
  CheckCircle2,
  Factory,
  Layers3,
  MoveLeft,
  Sparkles,
} from "lucide-react";
import Image from "next/image";
import { BrandLogoCard } from "@/components/ui/cards";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/feedback";
import { ProductCard } from "@/components/ui/product-card";
import type { ContentPageData, ContentPageSection } from "@/types/content-page";
import type { Product } from "@/types";

export function ContentPageView({
  page,
  products = [],
  brands = [],
}: {
  page: ContentPageData;
  products?: Product[];
  brands?: string[];
}) {
  return (
    <>
      <section className="bg-brand-petroleum relative overflow-hidden text-white">
        <Image
          src={page.heroImage}
          alt={page.heroTitle}
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-25"
        />
        <div className="from-brand-ink/95 via-brand-petroleum/90 absolute inset-0 bg-gradient-to-l to-[#00677f]/75" />
        <Container className="relative py-12 sm:py-16 lg:py-24">
          <Breadcrumb current={page.title} tone="dark" />
          <div className="mt-10 max-w-3xl">
            <p className="text-brand-cyan text-sm font-bold tracking-wide">
              {page.eyebrow}
            </p>
            <h1 className="mt-3 text-4xl leading-tight font-bold sm:text-5xl lg:text-6xl">
              {page.heroTitle}
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-200 sm:text-lg">
              {page.heroDescription}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href={page.primaryCtaUrl} variant="light">
                {page.primaryCtaText}
              </ButtonLink>
              {page.secondaryCtaText && page.secondaryCtaUrl && (
                <ButtonLink href={page.secondaryCtaUrl} variant="outline">
                  {page.secondaryCtaText}
                </ButtonLink>
              )}
            </div>
          </div>
        </Container>
      </section>

      {page.sections.map((section, index) => (
        <ContentSection
          key={section.id}
          section={section}
          alternate={index % 2 === 1}
        />
      ))}

      {page.slug === "brands" && (
        <section className="section-space bg-brand-surface">
          <Container>
            <SectionHeading
              eyebrow="الكتالوج"
              title="العلامات الموجودة في المنتجات"
              description="تتحدث هذه القائمة تلقائياً عند إضافة أو تعديل المنتجات والعلامات من لوحة الإدارة."
            />
            {brands.length > 0 ? (
              <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {brands.map((brand) => (
                  <BrandLogoCard key={brand} name={brand} />
                ))}
              </div>
            ) : (
              <div className="mt-8">
                <EmptyState
                  title="لا توجد علامات تجارية محفوظة"
                  description="ستظهر العلامات هنا بعد إضافتها إلى قاعدة البيانات."
                />
              </div>
            )}
          </Container>
        </section>
      )}

      {page.slug === "stainless" && products.length > 0 && (
        <section className="section-space bg-white">
          <Container>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <SectionHeading
                eyebrow="من الكتالوج"
                title="منتجات الستانلس المتاحة"
                description="نماذج مرتبطة مباشرة بكتالوج المنتجات الحالي."
              />
              <ButtonLink
                href="/categories/stainless-steel"
                variant="outline"
                icon={<MoveLeft className="size-4" aria-hidden />}
              >
                عرض الكل
              </ButtonLink>
            </div>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {products.slice(0, 8).map((product) => (
                <ProductCard key={product.slug} product={product} />
              ))}
            </div>
          </Container>
        </section>
      )}

      <section className="bg-brand-petroleum py-12 text-white sm:py-16">
        <Container className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div>
            <p className="text-brand-cyan text-sm font-bold">ELITE WORLD</p>
            <h2 className="mt-2 text-2xl font-bold sm:text-3xl">
              هل تريد مناقشة احتياجك؟
            </h2>
          </div>
          <ButtonLink href={page.primaryCtaUrl} variant="light">
            {page.primaryCtaText}
          </ButtonLink>
        </Container>
      </section>
    </>
  );
}

function ContentSection({
  section,
  alternate,
}: {
  section: ContentPageSection;
  alternate: boolean;
}) {
  return (
    <section
      className={`section-space ${alternate ? "bg-brand-surface" : "bg-white"}`}
    >
      <Container>
        <div
          className={`grid items-center gap-10 ${section.image ? "lg:grid-cols-2" : ""}`}
        >
          <div>
            <SectionHeading
              eyebrow="حلول ELITE WORLD"
              title={section.title}
              description={section.description}
            />
            <SectionItems section={section} />
          </div>
          {section.image && (
            <div className="border-brand-border shadow-soft relative aspect-[4/3] overflow-hidden rounded-3xl border bg-white">
              <Image
                src={section.image}
                alt={section.title}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}

function SectionItems({ section }: { section: ContentPageSection }) {
  if (section.layout === "steps") {
    return (
      <ol className="mt-8 grid gap-4 sm:grid-cols-2">
        {section.items.map((item, index) => (
          <li
            key={`${section.id}-${item}`}
            className="border-brand-border flex gap-4 rounded-2xl border bg-white p-5"
          >
            <span className="bg-brand-cyan text-brand-ink grid size-9 shrink-0 place-items-center rounded-full font-bold">
              {index + 1}
            </span>
            <span className="text-brand-ink pt-1 font-semibold">{item}</span>
          </li>
        ))}
      </ol>
    );
  }
  if (section.layout === "list") {
    return (
      <ul className="mt-8 grid gap-3 sm:grid-cols-2">
        {section.items.map((item) => (
          <li key={`${section.id}-${item}`} className="flex items-center gap-3">
            <CheckCircle2
              className="text-brand-cyan size-5 shrink-0"
              aria-hidden
            />
            <span className="text-brand-ink font-semibold">{item}</span>
          </li>
        ))}
      </ul>
    );
  }
  return (
    <div className="mt-8 grid gap-4 sm:grid-cols-2">
      {section.items.map((item, index) => {
        const Icon =
          index % 3 === 0 ? Factory : index % 3 === 1 ? Layers3 : Sparkles;
        return (
          <div
            key={`${section.id}-${item}`}
            className="border-brand-border shadow-soft rounded-2xl border bg-white p-5"
          >
            <Icon className="text-brand-cyan size-6" aria-hidden />
            <p className="text-brand-ink mt-4 leading-7 font-semibold">
              {item}
            </p>
          </div>
        );
      })}
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="max-w-2xl">
      <p className="text-brand-cyan text-sm font-bold">{eyebrow}</p>
      <h2 className="text-brand-ink mt-2 text-3xl leading-tight font-bold sm:text-4xl">
        {title}
      </h2>
      <p className="mt-4 leading-8 text-slate-600">{description}</p>
    </div>
  );
}
