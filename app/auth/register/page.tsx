import type { Metadata } from "next";
import Link from "next/link";
import { registerCustomerAction } from "@/app/auth/actions";
import { Alert } from "@/components/ui/feedback";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "إنشاء حساب عميل",
  robots: { index: false, follow: false },
};

export default async function CustomerRegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const { error, next } = await searchParams;
  return (
    <section className="bg-brand-surface py-12 sm:py-16">
      <Container>
        <div className="border-brand-border shadow-soft mx-auto max-w-2xl rounded-3xl border bg-white p-6 sm:p-9">
          <p className="text-brand-cyan text-sm font-bold">حساب B2B</p>
          <h1 className="text-brand-ink mt-2 text-3xl font-bold">
            إنشاء حساب عميل
          </h1>
          {error && (
            <Alert className="mt-5">
              {error === "exists"
                ? "يوجد حساب بهذا البريد الإلكتروني."
                : error === "config"
                  ? "خدمة الحسابات غير متاحة حتى ربط قاعدة البيانات."
                  : "تحقق من البيانات وكلمة المرور ثم حاول مجدداً."}
            </Alert>
          )}
          <form
            action={registerCustomerAction}
            className="mt-7 grid gap-5 sm:grid-cols-2"
          >
            <input type="hidden" name="next" value={next ?? "/account"} />
            <Field name="name" label="الاسم" />
            <Field
              name="companyName"
              label="اسم المنشأة (اختياري)"
              required={false}
            />
            <Field name="email" label="البريد الإلكتروني" type="email" />
            <Field name="phone" label="رقم الهاتف" type="tel" />
            <Field name="city" label="المدينة" />
            <Field name="address" label="العنوان (اختياري)" required={false} />
            <Field
              name="password"
              label="كلمة المرور (10 أحرف على الأقل)"
              type="password"
            />
            <div className="flex items-end">
              <Button type="submit" size="lg" className="w-full">
                إنشاء الحساب
              </Button>
            </div>
          </form>
          <p className="mt-6 text-center text-sm text-slate-600">
            لديك حساب؟{" "}
            <Link
              href={`/auth/login?next=${encodeURIComponent(next ?? "/account")}`}
              className="text-brand-petroleum font-bold"
            >
              تسجيل الدخول
            </Link>
          </p>
        </div>
      </Container>
    </section>
  );
}

function Field({
  name,
  label,
  type = "text",
  required = true,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-brand-ink mb-2 block text-sm font-semibold">
        {label}
      </span>
      <input
        name={name}
        type={type}
        required={required}
        autoComplete={
          type === "password"
            ? "new-password"
            : type === "email"
              ? "email"
              : undefined
        }
        className="border-brand-border focus:border-brand-cyan min-h-12 w-full rounded-xl border px-4 outline-none"
      />
    </label>
  );
}
