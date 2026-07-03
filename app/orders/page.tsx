import type { Metadata } from "next";
import { ClipboardList, FileText } from "lucide-react";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "الطلبات",
  description: "إنشاء الطلبات ومتابعتها بأمان دون الحاجة إلى حساب.",
  robots: { index: false, follow: false },
};

export default function OrdersPage() {
  return (
    <section className="bg-brand-surface min-h-[65vh] py-12 sm:py-16">
      <Container>
        <Breadcrumb current="الطلبات" />
        <div className="border-brand-border shadow-soft mx-auto mt-8 max-w-3xl rounded-3xl border bg-white p-6 text-center sm:p-10">
          <ClipboardList
            className="text-brand-cyan mx-auto size-12"
            aria-hidden
          />
          <h1 className="text-brand-ink mt-5 text-3xl font-bold">الطلبات</h1>
          <p className="mx-auto mt-4 max-w-xl leading-8 text-slate-600">
            أكمل طلباً جديداً من السلة، أو تابع طلبك الحالي باستخدام رمز
            المتابعة الآمن.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <ButtonLink href="/checkout" icon={<FileText className="size-4" />}>
              إكمال طلب جديد
            </ButtonLink>
            <ButtonLink href="/track" variant="outline">
              متابعة طلب
            </ButtonLink>
          </div>
        </div>
      </Container>
    </section>
  );
}
