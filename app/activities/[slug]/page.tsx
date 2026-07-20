import { CheckCircle2, MessageCircle, MoveLeft, PackageCheck } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/seo/json-ld";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { ProductCard } from "@/components/ui/product-card";
import { getActivityBySlug } from "@/lib/activities";
import { absoluteSiteUrl, buildSeoMetadata } from "@/lib/seo/metadata";
import { getSiteSettings } from "@/lib/site-settings";
import { getWhatsAppContactUrl } from "@/lib/whatsapp";

type ActivityPageProps = { params: Promise<{ slug: string }> };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: ActivityPageProps): Promise<Metadata> {
  const { slug } = await params;
  const activity = await getActivityBySlug(slug);
  if (!activity) return {};
  return buildSeoMetadata({
    seo: activity.seo,
    fallbackTitle: activity.heroTitle,
    fallbackDescription: activity.heroDescription,
    defaultPath: `/activities/${activity.slug}`,
    fallbackImage: activity.image,
    fallbackImageAlt: activity.heroTitle,
  });
}

export default async function ActivityPage({ params }: ActivityPageProps) {
  const { slug } = await params;
  const [activity, settings] = await Promise.all([
    getActivityBySlug(slug),
    getSiteSettings(),
  ]);
  if (!activity) notFound();

  const groupOrder = ["الطبخ", "التبريد", "التحضير", "الستانلس", "الغسيل والتخزين"];
  const groups = groupOrder
    .map((name) => ({ name, items: activity.products.filter((item) => item.equipmentGroup === name) }))
    .filter((group) => group.items.length > 0);
  const complementary = activity.products.filter((item) => !item.essential).slice(0, 4);
  const whatsappUrl = getWhatsAppContactUrl(settings.whatsapp);
  const pageUrl = absoluteSiteUrl(`/activities/${activity.slug}`);

  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: activity.heroTitle,
    description: activity.heroDescription,
    url: pageUrl,
    image: absoluteSiteUrl(activity.image),
    areaServed: { "@type": "City", name: "الرياض" },
    provider: { "@type": "Organization", name: settings.companyNameEn, url: absoluteSiteUrl("/") },
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: `معدات ${activity.name}`,
      itemListElement: activity.products.map(({ product }, index) => ({
        "@type": "Offer",
        position: index + 1,
        itemOffered: {
          "@type": "Product",
          name: product.nameAr,
          url: absoluteSiteUrl(`/products/${product.slug}`),
        },
      })),
    },
  };
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "الرئيسية", item: absoluteSiteUrl("/") },
      { "@type": "ListItem", position: 2, name: "جهّز مشروعك", item: absoluteSiteUrl("/#activities-title") },
      { "@type": "ListItem", position: 3, name: activity.name, item: pageUrl },
    ],
  };

  return (
    <>
      <JsonLd data={serviceSchema} />
      <JsonLd data={breadcrumbSchema} />

      <section className="bg-brand-petroleum relative overflow-hidden text-white">
        <Image src={activity.image} alt={activity.heroTitle} fill priority sizes="100vw" className="object-cover opacity-25" />
        <div className="from-brand-ink/95 via-brand-petroleum/90 absolute inset-0 bg-gradient-to-l to-[#00677f]/75" />
        <Container className="relative py-12 sm:py-16 lg:py-24">
          <Breadcrumb current={activity.name} items={[{ label: "جهّز مشروعك", href: "/#activities-title" }]} tone="dark" />
          <div className="mt-10 max-w-3xl">
            <p className="text-brand-cyan text-sm font-bold tracking-wide">{activity.eyebrow}</p>
            <h1 className="mt-3 text-4xl leading-tight font-bold sm:text-5xl lg:text-6xl">{activity.heroTitle}</h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-200 sm:text-lg">{activity.heroDescription}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href={`/quote?activity=${encodeURIComponent(activity.slug)}`} variant="light" size="lg">
                {activity.primaryCtaText}
              </ButtonLink>
              {whatsappUrl && (
                <ButtonLink
                  href={whatsappUrl}
                  variant="outline"
                  size="lg"
                  className="border-white/30 text-white hover:bg-white/10"
                  icon={<MessageCircle className="size-5" aria-hidden />}
                >
                  استفسر عبر واتساب
                </ButtonLink>
              )}
            </div>
          </div>
        </Container>
      </section>

      <section className="bg-white py-10 sm:py-16">
        <Container className="grid gap-8 lg:grid-cols-[1.2fr_.8fr] lg:items-start">
          <div>
            <p className="text-brand-cyan text-sm font-bold">خطة تشغيل متوازنة</p>
            <h2 className="text-brand-ink mt-2 text-3xl font-bold">ما الذي يحتاجه مطعم البرجر؟</h2>
            <p className="mt-5 max-w-3xl text-base leading-9 text-slate-600">{activity.introduction}</p>
          </div>
          <aside className="border-brand-border bg-brand-surface rounded-3xl border p-6">
            <h2 className="text-brand-ink text-lg font-bold">انتقل بسهولة</h2>
            <div className="mt-4 grid gap-3">
              <ButtonLink href="/categories" variant="outline" className="justify-between">أقسام المعدات <MoveLeft className="size-4" aria-hidden /></ButtonLink>
              <ButtonLink href="/project-solutions" variant="outline" className="justify-between">تجهيز المشاريع <MoveLeft className="size-4" aria-hidden /></ButtonLink>
              <ButtonLink href="/stainless" variant="outline" className="justify-between">تصنيع الستانلس <MoveLeft className="size-4" aria-hidden /></ButtonLink>
            </div>
          </aside>
        </Container>
      </section>

      <section className="bg-brand-surface py-10 sm:py-16 lg:py-20" aria-labelledby="equipment-title">
        <Container>
          <p className="text-brand-cyan text-sm font-bold">مرتب حسب منطقة التشغيل</p>
          <h2 id="equipment-title" className="text-brand-ink mt-2 text-3xl font-bold sm:text-4xl">معدات تجهيز مطعم برجر</h2>
          <p className="mt-4 max-w-3xl leading-8 text-slate-600">المنتجات أدناه مرتبطة مباشرة بكتالوج عالم النخبة؛ افتح أي منتج لمراجعة مواصفاته أو إضافته إلى طلب عرض السعر.</p>

          <div className="mt-10 space-y-12">
            {groups.map((group) => (
              <section key={group.name} aria-labelledby={`group-${group.name}`}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 id={`group-${group.name}`} className="text-brand-ink text-2xl font-bold">{group.name}</h3>
                  <ButtonLink href={`/categories/${group.items[0].product.categorySlug}`} variant="ghost" size="sm">
                    تصفح القسم
                  </ButtonLink>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
                  {group.items.map(({ product, essential }) => (
                    <div key={product.slug} className="relative">
                      <span className={`absolute end-2 top-2 z-10 rounded-full px-2.5 py-1 text-[10px] font-bold ${essential ? "bg-brand-petroleum text-white" : "bg-white text-brand-petroleum shadow"}`}>
                        {essential ? "أساسي" : "مكمل"}
                      </span>
                      <ProductCard product={product} compact />
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </Container>
      </section>

      {complementary.length > 0 && (
        <section className="bg-white py-10 sm:py-16" aria-labelledby="complementary-title">
          <Container>
            <div className="flex items-start gap-3">
              <PackageCheck className="text-brand-cyan mt-1 size-6" aria-hidden />
              <div>
                <p className="text-brand-cyan text-sm font-bold">أكمل خط التشغيل</p>
                <h2 id="complementary-title" className="text-brand-ink mt-2 text-3xl font-bold">معدات اختيارية ومكملة</h2>
              </div>
            </div>
            <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-4">
              {complementary.map(({ product }) => <ProductCard key={product.slug} product={product} compact />)}
            </div>
          </Container>
        </section>
      )}

      <section className="bg-brand-petroleum py-12 text-white sm:py-16">
        <Container className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <CheckCircle2 className="text-brand-cyan size-7" aria-hidden />
            <h2 className="mt-3 text-3xl font-bold">احصل على عرض تجهيز يناسب مشروعك</h2>
            <p className="mt-3 max-w-2xl leading-8 text-slate-200">أرسل مساحة الموقع والطاقة الإنتاجية المتوقعة، وسنساعدك في اختيار المعدات وترتيب الأولويات دون شراء تجهيزات غير ضرورية.</p>
          </div>
          <ButtonLink href={`/quote?activity=${encodeURIComponent(activity.slug)}`} variant="light" size="lg">{activity.primaryCtaText}</ButtonLink>
        </Container>
      </section>
    </>
  );
}
