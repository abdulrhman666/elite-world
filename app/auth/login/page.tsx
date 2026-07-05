import type { Metadata } from "next";
import Link from "next/link";
import { loginCustomerAction } from "@/app/auth/actions";
import { Alert } from "@/components/ui/feedback";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "دخول العملاء",
  robots: { index: false, follow: false },
};

const errors: Record<string, string> = {
  config: "خدمة حسابات العملاء غير متاحة مؤقتاً.",
  credentials: "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
  session: "انتهت الجلسة. سجّل الدخول مجدداً.",
};

export default async function CustomerLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string; next?: string }>;
}) {
  const params = await searchParams;
  return (
    <section className="bg-brand-surface min-h-[70vh] py-12 sm:py-16">
      <Container>
        <div className="border-brand-border shadow-soft mx-auto max-w-xl rounded-3xl border bg-white p-6 sm:p-9">
          <p className="text-brand-cyan text-sm font-bold">حساب العملاء</p>
          <h1 className="text-brand-ink mt-2 text-3xl font-bold">
            تسجيل الدخول
          </h1>
          {params.error && errors[params.error] && (
            <Alert className="mt-5">{errors[params.error]}</Alert>
          )}
          {params.success === "logout" && (
            <Alert title="تم تسجيل الخروج" className="mt-5">
              يمكنك تسجيل الدخول مجدداً في أي وقت.
            </Alert>
          )}
          {params.success === "password-reset" && (
            <Alert title="تم تغيير كلمة المرور" className="mt-5">
              يمكنك الآن الدخول بكلمة المرور الجديدة.
            </Alert>
          )}
          <form action={loginCustomerAction} className="mt-7 space-y-5">
            <input
              type="hidden"
              name="next"
              value={params.next ?? "/account"}
            />
            <AuthField name="email" label="البريد الإلكتروني" type="email" />
            <AuthField name="password" label="كلمة المرور" type="password" />
            <div className="text-left">
              <Link
                href="/auth/forgot-password"
                className="text-brand-petroleum text-sm font-bold"
              >
                نسيت كلمة المرور؟
              </Link>
            </div>
            <Button type="submit" size="lg" className="w-full">
              دخول
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-slate-600">
            ليس لديك حساب؟{" "}
            <Link
              href={`/auth/register?next=${encodeURIComponent(params.next ?? "/account")}`}
              className="text-brand-petroleum font-bold"
            >
              إنشاء حساب
            </Link>
          </p>
        </div>
      </Container>
    </section>
  );
}

function AuthField({
  name,
  label,
  type,
}: {
  name: string;
  label: string;
  type: string;
}) {
  return (
    <label className="block">
      <span className="text-brand-ink mb-2 block text-sm font-semibold">
        {label}
      </span>
      <input
        name={name}
        type={type}
        required
        autoComplete={type === "password" ? "current-password" : "email"}
        className="border-brand-border focus:border-brand-cyan min-h-12 w-full rounded-xl border px-4 outline-none"
      />
    </label>
  );
}
