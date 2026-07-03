import type { Metadata } from "next";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { CartPage } from "@/components/cart/cart-page";
import { Container } from "@/components/ui/container";
import { getCatalogOrderProducts } from "@/lib/catalog/service";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "سلة المشتريات",
  description: "راجع المنتجات والكميات قبل إرسال طلب مباشر أو طلب عرض سعر.",
  robots: { index: false, follow: false },
};

export default async function CartRoute() {
  const products = await getCatalogOrderProducts();
  return (
    <section className="bg-brand-surface min-h-[70vh] py-12 sm:py-16">
      <Container>
        <Breadcrumb current="سلة المشتريات" />
        <div className="mt-8 max-w-3xl">
          <p className="text-brand-cyan text-sm font-bold">
            محفوظة تلقائياً للعملاء المسجلين
          </p>
          <h1 className="text-brand-ink mt-2 text-3xl font-bold sm:text-5xl">
            سلة المشتريات
          </h1>
          <p className="mt-4 text-base leading-8 text-slate-600">
            عدّل الكميات، ثم اختر بين طلب مباشر للمنتجات المسعّرة أو إرسال السلة
            كطلب عرض سعر. يحفظ حسابك السلة بين الأجهزة دون الاعتماد على المتصفح.
          </p>
        </div>
        <CartPage products={products} />
      </Container>
    </section>
  );
}
