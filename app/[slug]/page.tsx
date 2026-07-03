import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ContentPageView } from "@/components/content/content-page-view";
import { ContactSettingsPage } from "@/components/contact/contact-settings-page";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/feedback";
import { placeholderPages } from "@/data/pages";
import { isEditableContentPageSlug } from "@/data/content-pages";
import {
  getCatalogBrands,
  getCatalogProductsByCategory,
} from "@/lib/catalog/service";
import { getContentPage } from "@/lib/content-pages";
import { getSiteSettings } from "@/lib/site-settings";
import { buildSeoMetadata } from "@/lib/seo/metadata";
import { getPageSeo } from "@/lib/seo/page-seo";

type PageProps = { params: Promise<{ slug: string }> };

// صفحات المحتوى الإدارية تُقرأ من Prisma عند الطلب وتظهر تعديلات الإدارة فوراً.
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const contentPage = await getContentPage(slug);
  if (contentPage) {
    return buildSeoMetadata({
      seo: await getPageSeo(`/${slug}`),
      fallbackTitle: contentPage.title,
      fallbackDescription: contentPage.heroDescription,
      defaultPath: `/${slug}`,
      fallbackImage: contentPage.heroImage,
      fallbackImageAlt: contentPage.heroTitle,
    });
  }
  if (isEditableContentPageSlug(slug)) {
    return {
      title: "المحتوى غير متوفر",
      robots: { index: false, follow: false },
    };
  }
  const page = placeholderPages[slug];
  if (!page) return {};
  return buildSeoMetadata({
    seo: await getPageSeo(`/${slug}`),
    fallbackTitle: page.title,
    fallbackDescription: page.description,
    defaultPath: `/${slug}`,
  });
}

export default async function PublicPage({ params }: PageProps) {
  const { slug } = await params;
  if (slug === "contact") {
    return <ContactSettingsPage settings={await getSiteSettings()} />;
  }
  const contentPage = await getContentPage(slug);
  if (contentPage) {
    const [catalogProducts, brands] = await Promise.all([
      slug === "stainless"
        ? getCatalogProductsByCategory("stainless-steel")
        : [],
      slug === "brands" ? getCatalogBrands() : [],
    ]);
    return (
      <ContentPageView
        page={contentPage}
        products={catalogProducts}
        brands={brands}
      />
    );
  }
  if (isEditableContentPageSlug(slug)) {
    return (
      <section className="bg-brand-surface min-h-[55vh] py-16">
        <Container>
          <EmptyState
            title="لا يوجد محتوى محفوظ لهذه الصفحة"
            description="تعتمد الصفحة على Prisma فقط. أضف محتواها من لوحة الإدارة بعد ربط قاعدة البيانات."
          />
        </Container>
      </section>
    );
  }
  const page = placeholderPages[slug];
  if (!page) notFound();
  const Icon = page.icon;

  return (
    <section className="bg-brand-surface relative min-h-[68vh] overflow-hidden py-12 sm:py-16 lg:py-20">
      <div className="from-brand-cyan/10 absolute inset-x-0 top-0 h-56 bg-gradient-to-b to-transparent" />
      <Container className="relative">
        <Breadcrumb current={page.title} />
        <div className="border-brand-border shadow-soft mx-auto mt-12 max-w-3xl rounded-[2rem] border bg-white p-7 text-center sm:p-12">
          <div className="steel-sheen border-brand-border text-brand-petroleum mx-auto grid size-24 place-items-center rounded-3xl border">
            <Icon className="size-11" aria-hidden />
          </div>
          <p className="text-brand-cyan mt-7 text-sm font-bold">ELITE WORLD</p>
          <h1 className="text-brand-ink mt-3 text-3xl font-bold sm:text-5xl">
            {page.title}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
            {page.description}
          </p>
          <ButtonLink href="/" className="mt-8">
            العودة إلى الرئيسية
          </ButtonLink>
        </div>
      </Container>
    </section>
  );
}
