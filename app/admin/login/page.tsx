import { LockKeyhole } from "lucide-react";
import { redirect } from "next/navigation";
import { loginAdminAction } from "@/app/admin/actions";
import { AdminMessage } from "@/components/admin/admin-message";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { getAdminAuthConfig, getAdminSession } from "@/lib/admin/auth";

type LoginPageProps = {
  searchParams: Promise<{ error?: string; success?: string }>;
};

export default async function AdminLoginPage({ searchParams }: LoginPageProps) {
  if (await getAdminSession()) redirect("/admin");
  const params = await searchParams;
  const config = getAdminAuthConfig();
  const errorMessage =
    params.error === "credentials"
      ? "بيانات الدخول غير صحيحة."
      : params.error === "session"
        ? "انتهت الجلسة. سجّل الدخول مجدداً."
        : params.error === "config"
          ? config.configured
            ? "تعذر بدء الجلسة."
            : config.message
          : null;

  return (
    <section className="section-space bg-brand-surface min-h-[65vh]">
      <Container className="max-w-lg">
        <div className="border-brand-border shadow-soft rounded-3xl border bg-white p-6 sm:p-9">
          <span className="bg-brand-cyan/10 text-brand-petroleum grid size-12 place-items-center rounded-2xl">
            <LockKeyhole className="size-6" aria-hidden />
          </span>
          <h1 className="text-brand-ink mt-5 text-3xl font-bold">
            دخول الإدارة
          </h1>
          <p className="mt-2 text-sm leading-7 text-slate-600">
            دخول آمن لإدارة المتجر حسب صلاحية مدير النظام أو المدير.
          </p>

          <div className="mt-6 space-y-3">
            {!config.configured && (
              <AdminMessage tone="error">{config.message}</AdminMessage>
            )}
            {errorMessage && (
              <AdminMessage tone="error">{errorMessage}</AdminMessage>
            )}
            {params.success === "logout" && (
              <AdminMessage tone="success">تم تسجيل الخروج بنجاح.</AdminMessage>
            )}
          </div>

          <form action={loginAdminAction} className="mt-7 space-y-5">
            <label className="block">
              <span className="text-brand-ink mb-2 block text-sm font-semibold">
                البريد الإداري
              </span>
              <input
                name="email"
                type="email"
                autoComplete="username"
                required
                dir="ltr"
                className="border-brand-border focus:border-brand-cyan focus:ring-brand-cyan/15 min-h-12 w-full rounded-xl border px-4 outline-none focus:ring-3"
              />
            </label>
            <label className="block">
              <span className="text-brand-ink mb-2 block text-sm font-semibold">
                كلمة المرور
              </span>
              <input
                name="password"
                type="password"
                autoComplete="current-password"
                required
                dir="ltr"
                className="border-brand-border focus:border-brand-cyan focus:ring-brand-cyan/15 min-h-12 w-full rounded-xl border px-4 outline-none focus:ring-3"
              />
            </label>
            <Button
              type="submit"
              className="w-full"
              disabled={!config.configured}
            >
              تسجيل الدخول
            </Button>
          </form>
        </div>
      </Container>
    </section>
  );
}
