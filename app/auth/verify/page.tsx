import type { Metadata } from "next";
import Link from "next/link";
import {
  resendCustomerVerificationAction,
  verifyCustomerEmailAction,
} from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Alert } from "@/components/ui/feedback";

export const metadata: Metadata = {
  title: "تأكيد البريد الإلكتروني",
  robots: { index: false, follow: false },
};

const errors: Record<string, string> = {
  code: "الرمز غير صحيح أو انتهت صلاحيته. اطلب رمزاً جديداً.",
  rate: "انتظر دقيقة قبل طلب رمز جديد. عدد المحاولات محدود لحماية حسابك.",
  email: "تعذر إرسال البريد الآن. حاول مرة أخرى بعد قليل.",
  unverified: "أكد بريدك الإلكتروني أولاً لإكمال تسجيل الدخول.",
};

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{
    email?: string;
    next?: string;
    error?: string;
    success?: string;
  }>;
}) {
  const params = await searchParams;
  const email = params.email?.trim() ?? "";
  const next = params.next?.startsWith("/") ? params.next : "/account";

  return (
    <section className="bg-brand-surface min-h-[70vh] py-12 sm:py-16">
      <Container>
        <div className="border-brand-border shadow-soft mx-auto max-w-xl rounded-3xl border bg-white p-6 sm:p-9">
          <p className="text-brand-cyan text-sm font-bold">خطوة أخيرة</p>
          <h1 className="text-brand-ink mt-2 text-3xl font-bold">
            تأكيد البريد الإلكتروني
          </h1>
          <p className="mt-3 leading-7 text-slate-600">
            أدخل الرمز المكوّن من 6 أرقام المرسل إلى{" "}
            <span className="font-latin font-semibold" dir="ltr">
              {email || "بريدك الإلكتروني"}
            </span>
            .
          </p>
          {params.error && errors[params.error] && (
            <Alert className="mt-5">{errors[params.error]}</Alert>
          )}
          {params.success === "sent" && (
            <Alert title="تم إرسال الرمز" className="mt-5">
              راجع صندوق الوارد والبريد غير المرغوب فيه. الرمز صالح 10 دقائق.
            </Alert>
          )}
          <form action={verifyCustomerEmailAction} className="mt-7 space-y-5">
            <input type="hidden" name="email" value={email} />
            <input type="hidden" name="next" value={next} />
            <label className="block">
              <span className="text-brand-ink mb-2 block text-sm font-semibold">
                رمز التأكيد
              </span>
              <input
                name="code"
                required
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                maxLength={6}
                dir="ltr"
                className="border-brand-border focus:border-brand-cyan min-h-14 w-full rounded-xl border px-4 text-center font-mono text-2xl tracking-[.4em] outline-none"
              />
            </label>
            <Button type="submit" size="lg" className="w-full">
              تأكيد الحساب
            </Button>
          </form>
          <form
            action={resendCustomerVerificationAction}
            className="mt-4 text-center"
          >
            <input type="hidden" name="email" value={email} />
            <input type="hidden" name="next" value={next} />
            <Button type="submit" variant="ghost" size="sm">
              لم يصل الرمز؟ أرسله مجدداً
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-slate-500">
            <Link href="/auth/login" className="text-brand-petroleum font-bold">
              العودة إلى تسجيل الدخول
            </Link>
          </p>
        </div>
      </Container>
    </section>
  );
}
