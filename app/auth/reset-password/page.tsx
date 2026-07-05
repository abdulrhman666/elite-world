import type { Metadata } from "next";
import Link from "next/link";
import { resetCustomerPasswordAction } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Alert } from "@/components/ui/feedback";

export const metadata: Metadata = {
  title: "تعيين كلمة مرور جديدة",
  robots: { index: false, follow: false },
};

const errors: Record<string, string> = {
  code: "الرمز غير صحيح أو انتهت صلاحيته. اطلب رمزاً جديداً.",
  "password-length": "كلمة المرور يجب أن تكون 10 أحرف على الأقل.",
  "password-match": "كلمتا المرور غير متطابقتين.",
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; error?: string; sent?: string }>;
}) {
  const params = await searchParams;
  const email = params.email?.trim() ?? "";
  return (
    <section className="bg-brand-surface min-h-[70vh] py-12 sm:py-16">
      <Container>
        <div className="border-brand-border shadow-soft mx-auto max-w-xl rounded-3xl border bg-white p-6 sm:p-9">
          <p className="text-brand-cyan text-sm font-bold">حماية الحساب</p>
          <h1 className="text-brand-ink mt-2 text-3xl font-bold">
            كلمة مرور جديدة
          </h1>
          {params.sent === "1" && (
            <Alert title="إذا كان البريد مسجلاً" className="mt-5">
              ستصلك رسالة تحتوي رمزاً صالحاً لمدة 10 دقائق.
            </Alert>
          )}
          {params.error && errors[params.error] && (
            <Alert className="mt-5">{errors[params.error]}</Alert>
          )}
          <form action={resetCustomerPasswordAction} className="mt-7 space-y-5">
            <label className="block">
              <span className="text-brand-ink mb-2 block text-sm font-semibold">
                البريد الإلكتروني
              </span>
              <input
                name="email"
                type="email"
                required
                defaultValue={email}
                autoComplete="email"
                dir="ltr"
                className="border-brand-border focus:border-brand-cyan min-h-12 w-full rounded-xl border px-4 outline-none"
              />
            </label>
            <label className="block">
              <span className="text-brand-ink mb-2 block text-sm font-semibold">
                رمز الاستعادة
              </span>
              <input
                name="code"
                required
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                maxLength={6}
                dir="ltr"
                className="border-brand-border focus:border-brand-cyan min-h-12 w-full rounded-xl border px-4 text-center font-mono text-xl tracking-[.35em] outline-none"
              />
            </label>
            <PasswordField name="newPassword" label="كلمة المرور الجديدة" />
            <PasswordField
              name="confirmPassword"
              label="تأكيد كلمة المرور الجديدة"
            />
            <Button type="submit" size="lg" className="w-full">
              حفظ كلمة المرور
            </Button>
          </form>
          <p className="mt-6 text-center text-sm">
            <Link
              href="/auth/forgot-password"
              className="text-brand-petroleum font-bold"
            >
              طلب رمز جديد
            </Link>
          </p>
        </div>
      </Container>
    </section>
  );
}

function PasswordField({ name, label }: { name: string; label: string }) {
  return (
    <label className="block">
      <span className="text-brand-ink mb-2 block text-sm font-semibold">
        {label}
      </span>
      <input
        name={name}
        type="password"
        required
        minLength={10}
        maxLength={200}
        autoComplete="new-password"
        className="border-brand-border focus:border-brand-cyan min-h-12 w-full rounded-xl border px-4 outline-none"
      />
    </label>
  );
}
