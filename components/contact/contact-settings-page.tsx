import {
  AtSign,
  BriefcaseBusiness,
  Building2,
  Clock3,
  Mail,
  MapPin,
  MessageCircle,
  Music2,
  Phone,
} from "lucide-react";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Container } from "@/components/ui/container";
import { getWhatsAppContactUrl, isPlaceholderValue } from "@/lib/whatsapp";
import type { SiteSettingsData } from "@/types/site-settings";

export function ContactSettingsPage({
  settings,
}: {
  settings: SiteSettingsData;
}) {
  const whatsappUrl = getWhatsAppContactUrl(settings.whatsapp);
  const social = [
    { label: "Instagram", href: settings.instagramUrl, icon: AtSign },
    { label: "X", href: settings.xUrl, icon: AtSign },
    {
      label: "LinkedIn",
      href: settings.linkedinUrl,
      icon: BriefcaseBusiness,
    },
    { label: "TikTok", href: settings.tiktokUrl, icon: Music2 },
  ].filter((item) => item.href && item.href !== "#");

  return (
    <section className="bg-brand-surface relative min-h-[68vh] overflow-hidden py-12 sm:py-16 lg:py-20">
      <div className="from-brand-cyan/10 absolute inset-x-0 top-0 h-56 bg-gradient-to-b to-transparent" />
      <Container className="relative">
        <Breadcrumb current="تواصل معنا" />
        <div className="mt-10 grid gap-7 lg:grid-cols-[1.05fr_.95fr]">
          <div className="border-brand-border rounded-[2rem] border bg-white p-7 shadow-sm sm:p-10">
            <p className="text-brand-cyan text-sm font-bold">نحن هنا لخدمتك</p>
            <h1 className="text-brand-ink mt-3 text-3xl font-bold sm:text-5xl">
              تواصل مع {settings.companyNameAr}
            </h1>
            <p className="mt-5 text-base leading-8 text-slate-600">
              {settings.companyDescription}
            </p>
            {(settings.commercialRegistration || settings.taxNumber) && (
              <div className="mt-7 flex flex-wrap gap-3 text-sm text-slate-600">
                {settings.commercialRegistration && (
                  <span className="rounded-full bg-slate-100 px-4 py-2">
                    السجل التجاري: {settings.commercialRegistration}
                  </span>
                )}
                {settings.taxNumber && (
                  <span className="rounded-full bg-slate-100 px-4 py-2">
                    الرقم الضريبي: {settings.taxNumber}
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="border-brand-border rounded-[2rem] border bg-white p-7 shadow-sm sm:p-10">
            {settings.showContactDetails ? (
              <>
                <h2 className="text-brand-ink text-2xl font-bold">
                  بيانات التواصل
                </h2>
                <div className="mt-6 space-y-5 text-sm text-slate-600">
                  <ContactLine
                    icon={Phone}
                    label="الهاتف"
                    value={settings.phone}
                  />
                  <ContactLine
                    icon={MessageCircle}
                    label="واتساب"
                    value={settings.whatsapp}
                    href={whatsappUrl}
                  />
                  <ContactLine
                    icon={Mail}
                    label="البريد"
                    value={settings.email}
                    href={
                      isPlaceholderValue(settings.email)
                        ? null
                        : `mailto:${settings.email}`
                    }
                  />
                  <ContactLine
                    icon={MapPin}
                    label="العنوان"
                    value={`${settings.city} · ${settings.address}`}
                  />
                  <ContactLine
                    icon={Clock3}
                    label="ساعات العمل"
                    value={settings.workingHours}
                  />
                </div>
                {social.length > 0 && (
                  <div className="border-brand-border mt-7 flex flex-wrap gap-2 border-t pt-6">
                    {social.map(({ label, href, icon: Icon }) => (
                      <a
                        key={label}
                        href={href ?? undefined}
                        target="_blank"
                        rel="noreferrer"
                        className="border-brand-border text-brand-petroleum hover:border-brand-cyan inline-flex min-h-11 items-center gap-2 rounded-xl border px-4 text-sm font-bold"
                      >
                        <Icon className="size-4" aria-hidden />
                        {label}
                      </a>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="py-10 text-center">
                <Building2
                  className="text-brand-cyan mx-auto size-10"
                  aria-hidden
                />
                <h2 className="text-brand-ink mt-4 text-xl font-bold">
                  بيانات التواصل غير معروضة حالياً
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  يمكن إظهارها من مركز إعدادات الموقع.
                </p>
              </div>
            )}
          </div>
        </div>
      </Container>
    </section>
  );
}

function ContactLine({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: typeof Phone;
  label: string;
  value: string;
  href?: string | null;
}) {
  const content = (
    <>
      <Icon className="text-brand-cyan mt-1 size-5 shrink-0" aria-hidden />
      <span>
        <span className="text-brand-ink block font-bold">{label}</span>
        <span
          className="mt-1 block"
          dir={label === "البريد" ? "ltr" : undefined}
        >
          {value}
        </span>
      </span>
    </>
  );
  return href ? (
    <a href={href} className="hover:text-brand-petroleum flex gap-3">
      {content}
    </a>
  ) : (
    <div className="flex gap-3">{content}</div>
  );
}
