import type { Metadata } from "next";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import { Alert } from "@/components/ui/feedback";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Container } from "@/components/ui/container";
import { getCheckoutCustomer } from "@/lib/account/service";
import { getCustomerSession } from "@/lib/auth/customer-auth";
import { getCatalogOrderProducts } from "@/lib/catalog/service";
import { getCheckoutServiceAvailability } from "@/lib/commerce/public-service";
import { getDeliveryEstimates } from "@/lib/commerce/shipping";

export const metadata: Metadata = {
  title: "إكمال الطلب",
  robots: { index: false, follow: false },
};

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; error?: string }>;
}) {
  const session = await getCustomerSession();
  const [params, products, availability, customer, deliveryEstimates] =
    await Promise.all([
      searchParams,
      getCatalogOrderProducts(),
      getCheckoutServiceAvailability(),
      session ? getCheckoutCustomer(session.userId) : null,
      getDeliveryEstimates(),
    ]);
  const initialMode = params.mode === "quote" ? "quote" : "order";

  return (
    <section className="bg-brand-surface min-h-[70vh] py-12 sm:py-16">
      <Container>
        <Breadcrumb current="إكمال الطلب" />
        <div className="mt-8 max-w-3xl">
          <p className="text-brand-cyan text-sm font-bold">خطوة واحدة فقط</p>
          <h1 className="text-brand-ink mt-2 text-3xl font-bold sm:text-5xl">
            إكمال الطلب
          </h1>
          <p className="mt-4 text-base leading-8 text-slate-600">
            الشراء المباشر متاح للعملاء المسجلين، بينما يمكنك إرسال طلب عرض سعر
            دون إنشاء حساب.
          </p>
        </div>
        {params.error && (
          <Alert title="تعذر إرسال الطلب" className="mt-7">
            {params.error}
          </Alert>
        )}
        <CheckoutForm
          products={products}
          initialMode={initialMode}
          serviceAvailable={availability.available}
          serviceMessage={availability.message}
          initialCustomer={customer}
          isAuthenticated={Boolean(session && customer)}
          deliveryEstimates={deliveryEstimates}
        />
      </Container>
    </section>
  );
}
