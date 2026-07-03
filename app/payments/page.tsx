import type { Metadata } from "next";
import { CreditCard, ShieldCheck } from "lucide-react";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "الدفع",
  description: "حالة الدفع مرتبطة بالطلب وتظهر عبر رابط المتابعة الآمن.",
  robots: { index: false, follow: false },
};

export default function PaymentsPage() {
  return (
    <section className="bg-brand-surface min-h-[65vh] py-12 sm:py-16">
      <Container>
        <Breadcrumb current="الدفع" />
        <div className="border-brand-border shadow-soft mx-auto mt-8 max-w-3xl rounded-3xl border bg-white p-6 text-center sm:p-10">
          <CreditCard className="text-brand-cyan mx-auto size-12" aria-hidden />
          <h1 className="text-brand-ink mt-5 text-3xl font-bold">الدفع</h1>
          <p className="mx-auto mt-4 max-w-xl leading-8 text-slate-600">
            يتم إنشاء سجل الدفع مع الطلب، ويمكنك الاطلاع على حالته والمبلغ
            المدفوع والمتبقي من خلال رابط متابعة الطلب.
          </p>
          <div className="text-brand-petroleum mx-auto mt-6 flex w-fit items-center gap-2 rounded-xl bg-cyan-50 px-4 py-3 text-sm font-semibold">
            <ShieldCheck className="size-5" aria-hidden />
            لا تُعرض أي بيانات داخلية في صفحة المتابعة
          </div>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <ButtonLink href="/track">متابعة حالة الدفع</ButtonLink>
            <ButtonLink href="/checkout" variant="outline">
              إكمال طلب
            </ButtonLink>
          </div>
        </div>
      </Container>
    </section>
  );
}
