import {
  CheckCircle2,
  Clock3,
  FileText,
  Globe2,
  PackageCheck,
  ShieldCheck,
  Tag,
} from "lucide-react";
import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { CommerceTrustBadges } from "@/components/commerce/trust-layer";
import { ProductGallery } from "@/components/catalog/product-gallery";
import { AddToQuoteButton } from "@/components/quote/add-to-quote-button";
import { WishlistButton } from "@/components/account/wishlist-button";
import { JsonLd } from "@/components/seo/json-ld";
import { WhatsAppButton } from "@/components/catalog/whatsapp-button";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { ProductCard } from "@/components/ui/product-card";
import { Container } from "@/components/ui/container";
import { Alert, EmptyState } from "@/components/ui/feedback";
import { siteConfig } from "@/config/site";
import { getActivityComplementaryProducts } from "@/lib/activities";
import { formatProductPrice, getAvailabilityLabel } from "@/lib/catalog";
import {
  getCatalogProductBySlug,
  getCatalogSimilarProducts,
  isCatalogDatabaseConfigured,
} from "@/lib/catalog/service";
import { getSiteSettings } from "@/lib/site-settings";
import { getWhatsAppContactUrl } from "@/lib/whatsapp";
import { absoluteSiteUrl, buildSeoMetadata } from "@/lib/seo/metadata";
import { getPermanentRedirect } from "@/lib/seo/redirects";

type ProductPageProps = { params: Promise<{ slug: string }> };

// المنتجات تُقرأ من Prisma وقت الطلب حتى لا يحتاج الكتالوج إلى إعادة Build.
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getCatalogProductBySlug(slug);
  if (!product) return {};
  return buildSeoMetadata({
    seo: product.seo,
    fallbackTitle: product.nameAr,
    fallbackDescription: product.shortDescription,
    defaultPath: `/products/${product.slug}`,
    fallbackImage: product.image,
    fallbackImageAlt: product.imageAlt ?? product.nameAr,
  });
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  if (!isCatalogDatabaseConfigured()) {
    return (
      <section className="bg-brand-surface min-h-[55vh] py-16">
        <Container>
          <EmptyState
            title="تفاصيل المنتج غير متاحة حالياً"
            description="تعتمد صفحة المنتج على قاعدة بيانات Prisma فقط، ولم يتم ربط قاعدة البيانات بعد."
          />
        </Container>
      </section>
    );
  }
  const product = await getCatalogProductBySlug(slug);
  if (!product) {
    const redirect = await getPermanentRedirect(`/products/${slug}`);
    if (redirect) permanentRedirect(redirect.destinationPath);
    notFound();
  }
  const categoryName = product.categoryName ?? "القسم";
  const [settings, similarProducts, activityComplements] = await Promise.all([
    getSiteSettings(),
    getCatalogSimilarProducts(product.categorySlug, product.slug, 3),
    getActivityComplementaryProducts(product.slug, 4),
  ]);
  const similarSlugs = new Set(similarProducts.map((item) => item.slug));
  const complementaryProducts = activityComplements.filter(
    (item) => !similarSlugs.has(item.slug),
  );
  const productUrl = absoluteSiteUrl(`/products/${product.slug}`);
  const productSchema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.nameAr,
    alternateName: product.nameEn,
    description: product.seo?.description || product.shortDescription,
    image: [product.image, ...(product.additionalImages ?? [])].map(
      absoluteSiteUrl,
    ),
    sku: product.sku,
    model: product.model,
    brand: { "@type": "Brand", name: product.brand },
    url: productUrl,
  };
  if (product.price !== null) {
    productSchema.offers = {
      "@type": "Offer",
      priceCurrency: siteConfig.currency,
      price: product.price,
      availability:
        product.stockQuantity > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      inventoryLevel: {
        "@type": "QuantitativeValue",
        value: product.stockQuantity,
      },
      url: productUrl,
    };
  }
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
        name: categoryName,
        item: absoluteSiteUrl(`/categories/${product.categorySlug}`),
      },
      {
        "@type": "ListItem",
        position: 4,
        name: product.nameAr,
        item: productUrl,
      },
    ],
  };

  return (
    <>
      <JsonLd data={productSchema} />
      <JsonLd data={breadcrumbSchema} />
      <section className="bg-brand-surface border-brand-border border-b py-8 sm:py-12">
        <Container>
          <Breadcrumb
            current={product.nameAr}
            items={[
              { label: "الأقسام", href: "/categories" },
              {
                label: categoryName,
                href: `/categories/${product.categorySlug}`,
              },
            ]}
          />

          <div className="mt-9 grid items-start gap-8 lg:grid-cols-[.9fr_1.1fr] lg:gap-12">
            <ProductGallery
              image={product.image}
              imageAlt={product.imageAlt}
              additionalImages={product.additionalImages}
              additionalImageAlts={product.additionalImageAlts}
              productName={product.nameAr}
              badge={product.badge}
            />

            <div>
              <p className="font-latin text-brand-cyan text-sm font-bold tracking-wider">
                {product.sku} · {product.model}
              </p>
              <h1 className="text-brand-ink mt-3 text-3xl leading-tight font-bold sm:text-5xl">
                {product.nameAr}
              </h1>
              <p className="font-latin mt-3 text-base font-semibold text-slate-500 sm:text-lg">
                {product.nameEn}
              </p>
              <p className="mt-5 text-base leading-8 text-slate-600">
                {product.shortDescription}
              </p>

              <div className="border-brand-border mt-6 rounded-2xl border bg-white p-5">
                <p className="text-xs font-semibold text-slate-500">السعر</p>
                <p className="text-brand-petroleum mt-1 text-3xl font-bold">
                  {formatProductPrice(product.price)}
                </p>
              </div>

              <dl className="mt-7 grid gap-3 sm:grid-cols-2">
                <InfoItem
                  icon={Tag}
                  label="العلامة التجارية"
                  value={product.brand}
                />
                <InfoItem
                  icon={Globe2}
                  label="بلد المنشأ"
                  value={product.origin}
                />
                <InfoItem
                  icon={PackageCheck}
                  label="التوفر"
                  value={getAvailabilityLabel(product.availability)}
                />
                <InfoItem
                  icon={PackageCheck}
                  label="الكمية المتاحة"
                  value={String(product.stockQuantity)}
                />
                <InfoItem
                  icon={Clock3}
                  label="مدة التوريد"
                  value={product.leadTime}
                />
                <InfoItem
                  icon={ShieldCheck}
                  label="الضمان"
                  value={product.warranty}
                />
              </dl>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                {product.price !== null && (
                  <AddToCartButton
                    productSlug={product.slug}
                    productName={product.nameAr}
                    stockQuantity={product.stockQuantity}
                    openCart
                    label="أضف إلى السلة"
                    className="min-h-12 w-full sm:w-auto"
                  />
                )}
                <WhatsAppButton
                  productName={product.nameAr}
                  model={product.model}
                  productSlug={product.slug}
                  label="استفسر عبر واتساب"
                  className="min-h-12 w-full sm:w-auto"
                />
              </div>
              <AddToQuoteButton
                productSlug={product.slug}
                productName={product.nameAr}
                openQuote
                className="mt-3 min-h-12 w-full sm:w-auto"
              />
              {product.stockQuantity === 0 && (
                <Alert
                  title="المنتج غير متوفر حالياً"
                  className="mt-4 max-w-xl"
                >
                  يمكنك إرسال طلب عرض سعر لمعرفة موعد التوريد المتوقع.
                </Alert>
              )}
              <div className="mt-3 max-w-xs">
                <WishlistButton productSlug={product.slug} />
              </div>
              <CommerceTrustBadges className="mt-5" />

              {!getWhatsAppContactUrl(settings.whatsapp) && (
                <Alert
                  title="واتساب غير مفعّل"
                  className="mt-4 max-w-xl text-start"
                >
                  رقم واتساب الحالي Placeholder. سيظهر تنبيه محلي عند الضغط حتى
                  إضافة الرقم الرسمي في ملف الإعدادات.
                </Alert>
              )}
            </div>
          </div>
        </Container>
      </section>

      <section className="section-space bg-white">
        <Container className="grid gap-10 lg:grid-cols-[1fr_.9fr] lg:gap-16">
          <div>
            <h2 className="text-brand-ink text-2xl font-bold">وصف المنتج</h2>
            <p className="mt-4 text-base leading-8 text-slate-600">
              {product.description}
            </p>

            {(product.features.length > 0 || product.uses.length > 0) && (
              <div className="mt-10 grid gap-8 sm:grid-cols-2">
                {product.features.length > 0 && (
                  <div>
                    <h2 className="text-brand-ink text-xl font-bold">
                      المميزات
                    </h2>
                    <ul className="mt-4 space-y-3">
                      {product.features.map((feature) => (
                        <li key={feature} className="flex gap-3 text-slate-600">
                          <CheckCircle2
                            className="text-brand-cyan mt-1 size-5 shrink-0"
                            aria-hidden
                          />
                          <span className="leading-7">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {product.uses.length > 0 && (
                  <div>
                    <h2 className="text-brand-ink text-xl font-bold">
                      الاستخدامات
                    </h2>
                    <ul className="mt-4 space-y-3">
                      {product.uses.map((use) => (
                        <li key={use} className="flex gap-3 text-slate-600">
                          <CheckCircle2
                            className="text-brand-cyan mt-1 size-5 shrink-0"
                            aria-hidden
                          />
                          <span className="leading-7">{use}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <div className="border-brand-border bg-brand-surface mt-10 rounded-3xl border p-6">
              <div className="flex gap-3">
                <FileText className="text-brand-cyan size-6" aria-hidden />
                <div>
                  <h2 className="text-brand-ink text-xl font-bold">
                    الملفات الفنية
                  </h2>
                  <p className="mt-2 text-slate-600">
                    الملف الفني متاح عند الطلب
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-brand-ink text-2xl font-bold">
              المواصفات الفنية
            </h2>
            {product.specifications.length > 0 ? (
              <div className="border-brand-border mt-5 overflow-hidden rounded-3xl border">
                <table className="w-full border-collapse text-sm">
                  <tbody>
                    {product.specifications.map((specification, index) => (
                      <tr
                        key={specification.label}
                        className={
                          index % 2 === 0 ? "bg-brand-surface" : "bg-white"
                        }
                      >
                        <th
                          scope="row"
                          className="text-brand-ink w-2/5 px-4 py-4 text-start font-semibold sm:px-6"
                        >
                          {specification.label}
                        </th>
                        <td className="px-4 py-4 text-slate-600 sm:px-6">
                          {specification.value}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="border-brand-border bg-brand-surface mt-5 rounded-3xl border p-6 text-slate-600">
                لا توجد مواصفات فنية موثقة لهذا المنتج حالياً.
              </p>
            )}
          </div>
        </Container>
      </section>

      {similarProducts.length > 0 && (
        <section
          className="section-space bg-brand-surface"
          aria-labelledby="similar-products"
        >
          <Container>
            <p className="text-brand-cyan text-sm font-bold">قد يناسب مشروعك</p>
            <h2
              id="similar-products"
              className="text-brand-ink mt-2 text-3xl font-bold"
            >
              منتجات مشابهة
            </h2>
            <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3">
              {similarProducts.map((item) => (
                <ProductCard key={item.slug} product={item} compact />
              ))}
            </div>
          </Container>
        </section>
      )}

      {complementaryProducts.length > 0 && (
        <section className="section-space bg-white" aria-labelledby="complementary-products">
          <Container>
            <p className="text-brand-cyan text-sm font-bold">أكمل خط التشغيل</p>
            <h2 id="complementary-products" className="text-brand-ink mt-2 text-3xl font-bold">
              منتجات تكمل هذا المنتج
            </h2>
            <p className="mt-3 max-w-2xl leading-7 text-slate-600">
              اقتراحات من باقات تجهيز الأنشطة تساعدك على بناء خط عمل متكامل.
            </p>
            <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
              {complementaryProducts.map((item) => (
                <ProductCard key={item.slug} product={item} compact />
              ))}
            </div>
          </Container>
        </section>
      )}
    </>
  );
}

function InfoItem({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Tag;
  label: string;
  value: string;
}) {
  return (
    <div className="border-brand-border flex gap-3 rounded-2xl border bg-white p-4">
      <Icon className="text-brand-cyan mt-0.5 size-5 shrink-0" aria-hidden />
      <div>
        <dt className="text-xs text-slate-500">{label}</dt>
        <dd className="text-brand-ink mt-1 text-sm font-semibold">{value}</dd>
      </div>
    </div>
  );
}
