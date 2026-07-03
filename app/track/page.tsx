import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "متابعة الطلب",
  description: "تابع حالة الطلب أو عرض السعر باستخدام رمز المتابعة الآمن.",
  robots: { index: false, follow: false },
};

export default async function TrackIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const token = (await searchParams).token?.trim();
  if (token) redirect(`/track/${encodeURIComponent(token)}`);

  return (
    <section className="bg-brand-surface min-h-[65vh] py-12 sm:py-16">
      <Container>
        <Breadcrumb current="متابعة الطلب" />
        <div className="border-brand-border shadow-soft mx-auto mt-8 max-w-2xl rounded-3xl border bg-white p-6 sm:p-9">
          <p className="text-brand-cyan text-sm font-bold">متابعة آمنة</p>
          <h1 className="text-brand-ink mt-2 text-3xl font-bold">
            متابعة الطلب أو عرض السعر
          </h1>
          <p className="mt-4 leading-8 text-slate-600">
            أدخل رمز المتابعة الموجود في صفحة نجاح الطلب لعرض آخر حالة دون
            الحاجة إلى حساب.
          </p>
          <form
            method="get"
            className="mt-7 grid gap-4 sm:grid-cols-[1fr_auto]"
          >
            <label className="sr-only" htmlFor="tracking-token">
              رمز المتابعة
            </label>
            <input
              id="tracking-token"
              name="token"
              required
              autoComplete="off"
              placeholder="أدخل رمز المتابعة"
              className="border-brand-border focus:border-brand-cyan focus:ring-brand-cyan/20 min-h-12 rounded-xl border bg-white px-4 outline-none focus:ring-3"
            />
            <Button type="submit">عرض الحالة</Button>
          </form>
        </div>
      </Container>
    </section>
  );
}
