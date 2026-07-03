"use client";

import {
  Building2,
  House,
  MessageCircle,
  Palette,
  PanelBottom,
  RotateCcw,
  Save,
  Truck,
} from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";
import {
  restoreSiteSettingsAction,
  updateSiteSettingsAction,
} from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import type { SiteMediaOption, SiteSettingsData } from "@/types/site-settings";

const controlClass =
  "border-brand-border focus:border-brand-cyan focus:ring-brand-cyan/15 min-h-12 w-full rounded-xl border bg-white px-4 text-sm text-brand-ink outline-none transition focus:ring-3 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500";

const tabs = [
  { id: "company", label: "بيانات الشركة", icon: Building2 },
  { id: "home", label: "الصفحة الرئيسية", icon: House },
  { id: "identity", label: "الهوية", icon: Palette },
  { id: "contact", label: "التواصل", icon: MessageCircle },
  { id: "shipping", label: "الشحن والتوصيل", icon: Truck },
  { id: "footer", label: "الفوتر", icon: PanelBottom },
] as const;

type TabId = (typeof tabs)[number]["id"];

export function SiteSettingsForm({
  settings,
  media,
  readOnly,
}: {
  settings: SiteSettingsData;
  media: SiteMediaOption[];
  readOnly: boolean;
}) {
  const [activeTab, setActiveTab] = useState<TabId>("company");

  return (
    <div>
      <div
        className="border-brand-border mt-7 flex gap-2 overflow-x-auto rounded-2xl border bg-white p-2"
        role="tablist"
        aria-label="أقسام إعدادات الموقع"
      >
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={activeTab === id}
            aria-controls={`settings-panel-${id}`}
            onClick={() => setActiveTab(id)}
            className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl px-4 text-sm font-bold transition ${
              activeTab === id
                ? "bg-brand-petroleum text-white"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Icon className="size-4" aria-hidden />
            {label}
          </button>
        ))}
      </div>

      <form action={updateSiteSettingsAction} className="mt-6">
        <SettingsPanel id="company" activeTab={activeTab}>
          <Field
            label="الاسم العربي"
            name="companyNameAr"
            defaultValue={settings.companyNameAr}
            disabled={readOnly}
          />
          <Field
            label="الاسم الإنجليزي"
            name="companyNameEn"
            defaultValue={settings.companyNameEn}
            disabled={readOnly}
            dir="ltr"
          />
          <Field
            label="الهاتف"
            name="phone"
            defaultValue={settings.phone}
            disabled={readOnly}
            dir="ltr"
          />
          <Field
            label="واتساب"
            name="whatsapp"
            defaultValue={settings.whatsapp}
            disabled={readOnly}
            dir="ltr"
          />
          <Field
            label="البريد الإلكتروني"
            name="email"
            defaultValue={settings.email}
            disabled={readOnly}
            dir="ltr"
          />
          <Field
            label="المدينة"
            name="city"
            defaultValue={settings.city}
            disabled={readOnly}
          />
          <Field
            label="العنوان"
            name="address"
            defaultValue={settings.address}
            disabled={readOnly}
            className="sm:col-span-2"
          />
          <Field
            label="ساعات العمل"
            name="workingHours"
            defaultValue={settings.workingHours}
            disabled={readOnly}
            className="sm:col-span-2"
          />
          <TextArea
            label="وصف مختصر للشركة"
            name="companyDescription"
            defaultValue={settings.companyDescription}
            disabled={readOnly}
            className="sm:col-span-2"
          />
          <Field
            label="السجل التجاري (اختياري)"
            name="commercialRegistration"
            defaultValue={settings.commercialRegistration ?? ""}
            disabled={readOnly}
          />
          <Field
            label="الرقم الضريبي (اختياري)"
            name="taxNumber"
            defaultValue={settings.taxNumber ?? ""}
            disabled={readOnly}
          />
        </SettingsPanel>

        <SettingsPanel id="home" activeTab={activeTab}>
          <Field
            label="عنوان Hero"
            name="heroTitle"
            defaultValue={settings.heroTitle}
            disabled={readOnly}
            className="sm:col-span-2"
          />
          <TextArea
            label="نص Hero"
            name="heroText"
            defaultValue={settings.heroText}
            disabled={readOnly}
            className="sm:col-span-2"
          />
          <Field
            label="نص الزر الأول"
            name="heroPrimaryButtonText"
            defaultValue={settings.heroPrimaryButtonText}
            disabled={readOnly}
          />
          <Field
            label="رابط الزر الأول"
            name="heroPrimaryButtonUrl"
            defaultValue={settings.heroPrimaryButtonUrl}
            disabled={readOnly}
            dir="ltr"
          />
          <Field
            label="نص الزر الثاني"
            name="heroSecondaryButtonText"
            defaultValue={settings.heroSecondaryButtonText}
            disabled={readOnly}
          />
          <Field
            label="رابط الزر الثاني"
            name="heroSecondaryButtonUrl"
            defaultValue={settings.heroSecondaryButtonUrl}
            disabled={readOnly}
            dir="ltr"
          />
          <Field
            label="نص الزر الثالث"
            name="heroTertiaryButtonText"
            defaultValue={settings.heroTertiaryButtonText}
            disabled={readOnly}
          />
          <Field
            label="رابط الزر الثالث"
            name="heroTertiaryButtonUrl"
            defaultValue={settings.heroTertiaryButtonUrl}
            disabled={readOnly}
            dir="ltr"
          />
          <ImagePicker
            label="صورة Hero"
            name="heroImage"
            currentPath={settings.heroImage}
            media={media}
            disabled={readOnly}
          />
          <Field
            label="نص شريط الإعلان العلوي"
            name="announcementText"
            defaultValue={settings.announcementText}
            disabled={readOnly}
            className="sm:col-span-2"
          />
          <Toggle
            label="إظهار شريط الإعلان العلوي"
            name="showAnnouncement"
            defaultChecked={settings.showAnnouncement}
            disabled={readOnly}
          />
        </SettingsPanel>

        <SettingsPanel id="identity" activeTab={activeTab}>
          <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-4 text-sm leading-7 text-cyan-950 sm:col-span-2">
            ألوان هوية ELITE WORLD ثابتة في هذه المرحلة. يمكنك فقط اختيار الشعار
            وFavicon من مكتبة الوسائط.
          </div>
          <ImagePicker
            label="الشعار"
            name="logo"
            currentPath={settings.logo}
            media={media}
            disabled={readOnly}
          />
          <ImagePicker
            label="Favicon"
            name="favicon"
            currentPath={settings.favicon}
            media={media}
            disabled={readOnly}
          />
        </SettingsPanel>

        <SettingsPanel id="contact" activeTab={activeTab}>
          <Field
            label="Instagram"
            name="instagramUrl"
            defaultValue={settings.instagramUrl ?? ""}
            disabled={readOnly}
            dir="ltr"
            placeholder="https://instagram.com/..."
          />
          <Field
            label="X"
            name="xUrl"
            defaultValue={settings.xUrl ?? ""}
            disabled={readOnly}
            dir="ltr"
            placeholder="https://x.com/..."
          />
          <Field
            label="LinkedIn"
            name="linkedinUrl"
            defaultValue={settings.linkedinUrl ?? ""}
            disabled={readOnly}
            dir="ltr"
            placeholder="https://linkedin.com/..."
          />
          <Field
            label="TikTok"
            name="tiktokUrl"
            defaultValue={settings.tiktokUrl ?? ""}
            disabled={readOnly}
            dir="ltr"
            placeholder="https://tiktok.com/@..."
          />
          <Toggle
            label="إظهار زر واتساب العائم"
            name="showFloatingWhatsapp"
            defaultChecked={settings.showFloatingWhatsapp}
            disabled={readOnly}
          />
          <Toggle
            label="إظهار بيانات التواصل في الموقع"
            name="showContactDetails"
            defaultChecked={settings.showContactDetails}
            disabled={readOnly}
          />
        </SettingsPanel>

        <SettingsPanel id="shipping" activeTab={activeTab}>
          <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-4 text-sm leading-7 text-cyan-950 sm:col-span-2">
            تُحفظ هذه المدة تلقائياً داخل الطلب الجديد حسب مدينة العميل، ويمكن
            تعديلها لاحقاً من تفاصيل الطلب.
          </div>
          <Field
            label="مدة التوصيل داخل الرياض"
            name="riyadhDeliveryEstimate"
            defaultValue={settings.riyadhDeliveryEstimate}
            disabled={readOnly}
          />
          <Field
            label="مدة التوصيل خارج الرياض"
            name="outsideDeliveryEstimate"
            defaultValue={settings.outsideDeliveryEstimate}
            disabled={readOnly}
          />
        </SettingsPanel>

        <SettingsPanel id="footer" activeTab={activeTab}>
          <TextArea
            label="وصف الشركة في الفوتر"
            name="footerDescription"
            defaultValue={settings.footerDescription}
            disabled={readOnly}
            className="sm:col-span-2"
          />
          <Field
            label="حقوق النشر"
            name="copyrightText"
            defaultValue={settings.copyrightText}
            disabled={readOnly}
            className="sm:col-span-2"
          />
          <Toggle
            label="إظهار روابط التواصل في الفوتر"
            name="showSocialLinks"
            defaultChecked={settings.showSocialLinks}
            disabled={readOnly}
          />
        </SettingsPanel>

        {!readOnly && (
          <div className="border-brand-border mt-6 flex justify-end border-t pt-6">
            <Button
              type="submit"
              icon={<Save className="size-4" aria-hidden />}
            >
              حفظ جميع الإعدادات
            </Button>
          </div>
        )}
      </form>

      {!readOnly && (
        <form
          action={restoreSiteSettingsAction}
          className="mt-4"
          onSubmit={(event) => {
            if (
              !window.confirm(
                "سيتم استبدال إعدادات الموقع الحالية بالقيم الافتراضية. هل تريد المتابعة؟",
              )
            ) {
              event.preventDefault();
            }
          }}
        >
          <input type="hidden" name="confirmRestore" value="confirmed" />
          <Button
            type="submit"
            variant="ghost"
            icon={<RotateCcw className="size-4" aria-hidden />}
          >
            استعادة القيم الافتراضية
          </Button>
        </form>
      )}
    </div>
  );
}

function SettingsPanel({
  id,
  activeTab,
  children,
}: {
  id: TabId;
  activeTab: TabId;
  children: React.ReactNode;
}) {
  return (
    <section
      id={`settings-panel-${id}`}
      role="tabpanel"
      hidden={activeTab !== id}
      className="border-brand-border grid gap-5 rounded-3xl border bg-white p-5 sm:grid-cols-2 sm:p-7"
    >
      {children}
    </section>
  );
}

function Field({
  label,
  name,
  defaultValue,
  disabled,
  type = "text",
  dir,
  className = "",
  placeholder,
}: {
  label: string;
  name: string;
  defaultValue: string;
  disabled: boolean;
  type?: "text" | "email";
  dir?: "ltr" | "rtl";
  className?: string;
  placeholder?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="text-brand-ink mb-2 block text-sm font-semibold">
        {label}
      </span>
      <input
        name={name}
        type={type}
        required={!label.includes("اختياري") && !placeholder}
        defaultValue={defaultValue}
        disabled={disabled}
        dir={dir}
        placeholder={placeholder}
        className={controlClass}
      />
    </label>
  );
}

function TextArea({
  label,
  name,
  defaultValue,
  disabled,
  className = "",
}: {
  label: string;
  name: string;
  defaultValue: string;
  disabled: boolean;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="text-brand-ink mb-2 block text-sm font-semibold">
        {label}
      </span>
      <textarea
        name={name}
        required
        rows={4}
        defaultValue={defaultValue}
        disabled={disabled}
        className={`${controlClass} py-3`}
      />
    </label>
  );
}

function Toggle({
  label,
  name,
  defaultChecked,
  disabled,
}: {
  label: string;
  name: string;
  defaultChecked: boolean;
  disabled: boolean;
}) {
  return (
    <label className="border-brand-border flex min-h-14 items-center gap-3 rounded-xl border px-4 sm:col-span-2">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        disabled={disabled}
        className="accent-brand-cyan size-5"
      />
      <span className="text-brand-ink text-sm font-semibold">{label}</span>
    </label>
  );
}

function ImagePicker({
  label,
  name,
  currentPath,
  media,
  disabled,
}: {
  label: string;
  name: string;
  currentPath: string;
  media: SiteMediaOption[];
  disabled: boolean;
}) {
  const [selectedPath, setSelectedPath] = useState(currentPath);
  const options = useMemo(() => {
    const unique = new Map<string, SiteMediaOption>();
    unique.set(currentPath, {
      path: currentPath,
      label: "القيمة الحالية",
      altText: label,
    });
    for (const image of media) unique.set(image.path, image);
    return [...unique.values()];
  }, [currentPath, label, media]);

  return (
    <div className="sm:col-span-2">
      <label className="block">
        <span className="text-brand-ink mb-2 block text-sm font-semibold">
          {label}
        </span>
        <select
          name={name}
          value={selectedPath}
          disabled={disabled}
          onChange={(event) => setSelectedPath(event.target.value)}
          className={controlClass}
          dir="ltr"
        >
          {options.map((image) => (
            <option key={image.path} value={image.path}>
              {image.label} — {image.path}
            </option>
          ))}
        </select>
      </label>
      <div className="border-brand-border mt-4 overflow-hidden rounded-2xl border bg-slate-50 p-3">
        <div className="relative h-44 w-full">
          <Image
            src={selectedPath}
            alt={`معاينة ${label}`}
            fill
            unoptimized
            sizes="(max-width: 640px) 100vw, 700px"
            className="object-contain"
          />
        </div>
      </div>
    </div>
  );
}
