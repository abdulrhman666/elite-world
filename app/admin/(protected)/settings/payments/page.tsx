import {
  createPaymentProviderAction,
  setPaymentProviderActiveAction,
  updatePaymentProviderAction,
} from "@/app/admin/payment-settings-actions";
import type { InputHTMLAttributes } from "react";
import { AdminMessage } from "@/components/admin/admin-message";
import { Button } from "@/components/ui/button";
import { getPaymentProvidersEditor } from "@/lib/payments/settings";

const controlClass =
  "border-brand-border min-h-12 w-full rounded-xl border bg-white px-4 text-sm";

const errorMessages: Record<string, string> = {
  name: "اسم المزود يجب أن يكون إنجليزياً قصيراً وفريداً.",
  endpoint: "أدخل رابط HTTPS عام وصحيح لنقطة تكامل المزود.",
  duplicate: "يوجد مزود آخر بالاسم نفسه.",
  missing: "مزود الدفع غير موجود.",
  readonly: "قاعدة البيانات غير متاحة للكتابة.",
  save: "تعذر حفظ إعدادات المزود.",
};

export default async function AdminPaymentSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const [settings, params] = await Promise.all([
    getPaymentProvidersEditor(),
    searchParams,
  ]);
  return (
    <div className="max-w-4xl">
      <p className="text-brand-cyan text-sm font-bold">الإعدادات</p>
      <h1 className="text-brand-ink mt-2 text-3xl font-bold">مزودات الدفع</h1>
      <p className="mt-3 text-sm leading-7 text-slate-600">
        أضف أي مزود يطبّق عقد التكامل الموحد. المفاتيح مشفّرة ولا تظهر مجدداً،
        ويمكن تفعيل مزود واحد فقط في الوقت نفسه.
      </p>
      <div className="mt-6 space-y-3">
        {settings.message && (
          <AdminMessage tone="error">{settings.message}</AdminMessage>
        )}
        {params.success && (
          <AdminMessage tone="success">تم حفظ إعدادات الدفع.</AdminMessage>
        )}
        {params.error && (
          <AdminMessage tone="error">
            {errorMessages[params.error] ?? errorMessages.save}
          </AdminMessage>
        )}
      </div>

      <section className="mt-7 space-y-5">
        {settings.records.length === 0 && !settings.readOnly && (
          <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm font-medium text-amber-950">
            لا يوجد مزود نشط حالياً؛ ستُحفظ الطلبات بدون محاولة دفع إلكتروني.
          </div>
        )}
        {settings.records.map((provider) => (
          <article
            key={provider.id}
            className="border-brand-border rounded-3xl border bg-white p-6"
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="font-latin text-brand-ink text-xl font-bold">
                  {provider.name}
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  {provider.isActive ? "نشط" : "متوقف"} · API Key:{" "}
                  {provider.hasApiKey ? "محفوظ" : "غير محفوظ"} · Secret:{" "}
                  {provider.hasSecretKey ? "محفوظ" : "غير محفوظ"}
                </p>
              </div>
              <form
                action={setPaymentProviderActiveAction.bind(
                  null,
                  provider.id,
                  !provider.isActive,
                )}
              >
                <Button
                  type="submit"
                  variant={provider.isActive ? "outline" : "primary"}
                  disabled={settings.readOnly}
                >
                  {provider.isActive ? "إيقاف المزود" : "تفعيل المزود"}
                </Button>
              </form>
            </div>
            <form
              action={updatePaymentProviderAction.bind(null, provider.id)}
              className="mt-6 grid gap-4 sm:grid-cols-2"
            >
              <Field
                name="endpoint"
                label="رابط Endpoint"
                type="url"
                defaultValue={provider.endpoint}
                disabled={settings.readOnly}
                className="sm:col-span-2"
              />
              <SecretField
                name="apiKey"
                label="API Key"
                configured={provider.hasApiKey}
                disabled={settings.readOnly}
              />
              <SecretField
                name="secretKey"
                label="Secret Key (اختياري)"
                configured={provider.hasSecretKey}
                disabled={settings.readOnly}
              />
              <label className="flex items-center gap-3 text-sm sm:col-span-2">
                <input
                  type="checkbox"
                  name="clearKeys"
                  disabled={settings.readOnly}
                />
                حذف المفاتيح المحفوظة لهذا المزود
              </label>
              <div className="sm:col-span-2">
                <Button type="submit" disabled={settings.readOnly}>
                  حفظ التعديل
                </Button>
              </div>
            </form>
          </article>
        ))}
      </section>

      <form
        action={createPaymentProviderAction}
        className="border-brand-border mt-7 grid gap-4 rounded-3xl border bg-white p-6 sm:grid-cols-2"
      >
        <h2 className="text-brand-ink text-xl font-bold sm:col-span-2">
          إضافة مزود دفع
        </h2>
        <Field
          name="name"
          label="اسم تقني فريد"
          placeholder="provider_name"
          disabled={settings.readOnly}
        />
        <Field
          name="endpoint"
          label="رابط Endpoint"
          type="url"
          placeholder="https://payments.example.com/adapter"
          disabled={settings.readOnly}
        />
        <SecretField
          name="apiKey"
          label="API Key"
          configured={false}
          disabled={settings.readOnly}
        />
        <SecretField
          name="secretKey"
          label="Secret Key (اختياري)"
          configured={false}
          disabled={settings.readOnly}
        />
        <label className="flex items-center gap-3 text-sm sm:col-span-2">
          <input type="checkbox" name="isActive" disabled={settings.readOnly} />
          تفعيل هذا المزود مباشرة
        </label>
        <div className="sm:col-span-2">
          <Button type="submit" disabled={settings.readOnly}>
            إضافة المزود
          </Button>
        </div>
      </form>
    </div>
  );
}

function Field({
  name,
  label,
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  name: string;
  label: string;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-2 block text-sm font-semibold">{label}</span>
      <input name={name} required className={controlClass} {...props} />
    </label>
  );
}

function SecretField({
  name,
  label,
  configured,
  disabled,
}: {
  name: string;
  label: string;
  configured: boolean;
  disabled: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-2 flex justify-between gap-3 text-sm font-semibold">
        {label}
        <span className={configured ? "text-emerald-700" : "text-slate-400"}>
          {configured ? "محفوظ" : "غير محفوظ"}
        </span>
      </span>
      <input
        name={name}
        type="password"
        autoComplete="new-password"
        disabled={disabled}
        placeholder={configured ? "اتركه فارغاً للاحتفاظ به" : "أدخل المفتاح"}
        className={controlClass}
      />
    </label>
  );
}
