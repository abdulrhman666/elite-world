import type { Metadata } from "next";
import { Alert } from "@/components/ui/feedback";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Container } from "@/components/ui/container";
import { QuoteRequestForm } from "@/components/quote/quote-request-form";
import { getCatalogOrderProducts } from "@/lib/catalog/service";
import { getQuoteServiceAvailability } from "@/lib/commerce/public-service";
import { buildSeoMetadata } from "@/lib/seo/metadata";
import { getPageSeo } from "@/lib/seo/page-seo";

export async function generateMetadata(): Promise<Metadata> {
  return buildSeoMetadata({
    seo: await getPageSeo("/quote"),
    fallbackTitle: "طلب عرض سعر",
    fallbackDescription: "أرسل طلب عرض سعر بسيط للمنتجات والكميات المطلوبة.",
    defaultPath: "/quote",
  });
}

export default async function QuotePage({
  searchParams,
}: {
  searchParams: Promise<{ product?: string; error?: string }>;
}) {
  const [params, products, availability] = await Promise.all([
    searchParams,
    getCatalogOrderProducts(),
    getQuoteServiceAvailability(),
  ]);
  return (
    <section className="bg-brand-surface min-h-[70vh] py-12 sm:py-16">
      <Container>
        <Breadcrumb current="طلب عرض سعر" />
        <div className="mt-8 max-w-3xl">
          <p className="text-brand-cyan text-sm font-bold">بدون إنشاء حساب</p>
          <h1 className="text-brand-ink mt-2 text-3xl font-bold sm:text-5xl">
            طلب عرض سعر
          </h1>
          <p className="mt-4 text-base leading-8 text-slate-600">
            اختر المنتجات والكميات وأرسل اسمك ورقم هاتفك ومدينتك، وسيظهر لك رقم
            مرجعي ورابط متابعة آمن.
          </p>
        </div>

        {params.error && (
          <Alert title="تعذر إرسال الطلب" className="mt-7">
            {params.error}
          </Alert>
        )}
        {!availability.available ? (
          <Alert title="الخدمة غير متاحة حالياً" className="mt-8">
            {availability.message} لم يتم حفظ أي بيانات وهمية.
          </Alert>
        ) : (
          <div className="mt-10">
            <QuoteRequestForm
              products={products.map((product) => ({
                slug: product.slug,
                nameAr: product.nameAr,
                sku: product.sku,
                model: product.model,
                image: product.image,
              }))}
              initialSlug={params.product}
            />
          </div>
        )}
      </Container>
    </section>
  );
}
