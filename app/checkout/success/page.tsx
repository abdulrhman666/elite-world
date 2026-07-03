import type { Metadata } from "next";
import { CheckCircle2 } from "lucide-react";
import { ClearCart } from "@/components/cart/clear-cart";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "تم استلام الطلب",
  robots: { index: false, follow: false },
};

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; number?: string; token?: string }>;
}) {
  const params = await searchParams;
  const isDirectOrder = params.type === "order";
  const validToken = /^[A-Za-z0-9_-]{40,80}$/.test(params.token ?? "");

  return (
    <section className="bg-brand-surface grid min-h-[65vh] place-items-center py-12">
      <ClearCart />
      <Container>
        <div className="border-brand-border mx-auto max-w-2xl rounded-[2rem] border bg-white p-8 text-center shadow-sm sm:p-12">
          <CheckCircle2
            className="mx-auto size-16 text-emerald-600"
            aria-hidden
          />
          <h1 className="text-brand-ink mt-5 text-3xl font-bold">
            {isDirectOrder ? "تم إنشاء طلبك بنجاح" : "تم استلام طلب عرض السعر"}
          </h1>
          <p className="mt-4 text-slate-600">الرقم المرجعي</p>
          <p className="font-latin text-brand-petroleum mt-2 text-2xl font-bold">
            {params.number ?? "—"}
          </p>
          <p className="mt-5 leading-8 text-slate-600">
            {isDirectOrder
              ? "يمكنك متابعة حالة الطلب والدفع والفاتورة من الرابط الآمن أدناه."
              : "سيتم مراجعة المنتجات والكميات، ويمكنك متابعة حالة الطلب من الرابط الآمن أدناه."}
          </p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            {validToken && (
              <ButtonLink href={`/track/${params.token}`}>
                متابعة الطلب
              </ButtonLink>
            )}
            <ButtonLink href="/shop" variant="outline">
              العودة إلى المتجر
            </ButtonLink>
          </div>
        </div>
      </Container>
    </section>
  );
}
