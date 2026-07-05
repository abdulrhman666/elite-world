import type { Metadata } from "next";
import Link from "next/link";
import { requestPasswordResetAction } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Alert } from "@/components/ui/feedback";

export const metadata: Metadata = {
  title: "استعادة كلمة المرور",
  robots: { index: false, follow: false },
};

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <section className="bg-brand-surface min-h-[70vh] py-12 sm:py-16">
      <Container>
        <div className="border-brand-border shadow-soft mx-auto max-w-xl rounded-3xl border bg-white p-6 sm:p-9">
          <p className="text-brand-cyan text-sm font-bold">حساب العملاء</p>
          <h1 className="text-brand-ink mt-2 text-3xl font-bold">
            نسيت كلمة المرور؟
          </h1>
          <p className="mt-3 leading-7 text-slate-600">
            أدخل بريد حسابك وسنرسل رمزاً من 6 أرقام لتعيين كلمة مرور جديدة.
          </p>
          {error && (
            <Alert className="mt-5">
              {error === "config"
                ? "خدمة البريد غير متاحة مؤقتاً."
                : error === "email"
                  ? "تعذر إرسال الرسالة الآن. حاول بعد قليل."
                  : "أدخل بريداً إلكترونياً صحيحاً."}
            </Alert>
          )}
          <form action={requestPasswordResetAction} className="mt-7 space-y-5">
            <label className="block">
              <span className="text-brand-ink mb-2 block text-sm font-semibold">
                البريد الإلكتروني
              </span>
              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                dir="ltr"
                className="border-brand-border focus:border-brand-cyan min-h-12 w-full rounded-xl border px-4 outline-none"
              />
            </label>
            <Button type="submit" size="lg" className="w-full">
              إرسال رمز الاستعادة
            </Button>
          </form>
          <p className="mt-6 text-center text-sm">
            <Link href="/auth/login" className="text-brand-petroleum font-bold">
              العودة إلى تسجيل الدخول
            </Link>
          </p>
        </div>
      </Container>
    </section>
  );
}
