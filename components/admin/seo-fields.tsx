"use client";

import { Bot, Check, Search } from "lucide-react";
import Image from "next/image";
import { useRef, useState, useTransition } from "react";
import { suggestSeoAction } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import type { SeoFormValues, SeoSuggestionInput } from "@/types/seo";
import type { SiteMediaOption } from "@/types/site-settings";

const controlClass =
  "border-brand-border focus:border-brand-cyan focus:ring-brand-cyan/15 min-h-12 w-full rounded-xl border bg-white px-4 text-sm text-brand-ink outline-none transition focus:ring-3";

export function SeoFields({
  values,
  fallbackTitle,
  fallbackDescription,
  defaultPath,
  entityType,
  media,
  aiEnabled,
}: {
  values: SeoFormValues;
  fallbackTitle: string;
  fallbackDescription: string;
  defaultPath: string;
  entityType: SeoSuggestionInput["entityType"];
  media: SiteMediaOption[];
  aiEnabled: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [title, setTitle] = useState(values.seoTitle ?? "");
  const [description, setDescription] = useState(values.seoDescription ?? "");
  const [canonical, setCanonical] = useState(values.canonicalUrl ?? "");
  const [ogTitle, setOgTitle] = useState(values.ogTitle ?? "");
  const [ogDescription, setOgDescription] = useState(
    values.ogDescription ?? "",
  );
  const [ogImage, setOgImage] = useState(values.ogImage ?? "");
  const [imageAlt, setImageAlt] = useState(values.seoImageAlt ?? "");
  const [suggestion, setSuggestion] = useState<
    Awaited<ReturnType<typeof suggestSeoAction>> | undefined
  >();
  const [isPending, startTransition] = useTransition();

  const imageOptions = new Map(media.map((image) => [image.path, image]));
  if (ogImage && !imageOptions.has(ogImage)) {
    imageOptions.set(ogImage, {
      path: ogImage,
      label: "الصورة الحالية",
      altText: imageAlt || fallbackTitle,
    });
  }

  function requestSuggestion() {
    const form = containerRef.current?.closest("form");
    const formData =
      form instanceof HTMLFormElement ? new FormData(form) : new FormData();
    const nameAr = String(
      formData.get("nameAr") ?? formData.get("name") ?? fallbackTitle,
    );
    const input: SeoSuggestionInput = {
      entityType,
      nameAr,
      nameEn: String(formData.get("nameEn") ?? ""),
      description: String(formData.get("description") ?? fallbackDescription),
      slug: String(formData.get("slug") ?? defaultPath.replace(/^\//, "")),
    };
    startTransition(async () => setSuggestion(await suggestSeoAction(input)));
  }

  function applySuggestion() {
    if (!suggestion?.ok) return;
    const result = suggestion.suggestion;
    setTitle(result.title);
    setDescription(result.description);
    setOgTitle(result.ogTitle);
    setOgDescription(result.ogDescription);
    setImageAlt(result.imageAlt);
    const form = containerRef.current?.closest("form");
    const slugInput =
      form instanceof HTMLFormElement ? form.elements.namedItem("slug") : null;
    if (entityType !== "page" && slugInput instanceof HTMLInputElement) {
      slugInput.value = result.slug;
    }
    setSuggestion(undefined);
  }

  return (
    <div ref={containerRef} className="space-y-6">
      <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-4 text-sm leading-7 text-cyan-950">
        اترك أي حقل فارغاً لاستخدام الاسم والوصف والصورة الحالية تلقائياً.
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <SeoTextField
          label="SEO Title"
          name="seoTitle"
          value={title}
          onChange={setTitle}
          maximum={60}
          guidance="يفضّل 30–60 حرفاً"
        />
        <SeoTextField
          label="Canonical URL"
          name="canonicalUrl"
          value={canonical}
          onChange={setCanonical}
          maximum={500}
          guidance={`تلقائي: ${defaultPath}`}
          dir="ltr"
        />
        <SeoTextArea
          label="Meta Description"
          name="seoDescription"
          value={description}
          onChange={setDescription}
          maximum={160}
          guidance="يفضّل 120–160 حرفاً"
        />
        <label className="border-brand-border flex min-h-14 items-center gap-3 rounded-xl border px-4 sm:col-span-2">
          <input
            type="checkbox"
            name="seoIndexable"
            defaultChecked={values.seoIndexable}
            className="accent-brand-cyan size-5"
          />
          <span className="text-brand-ink text-sm font-semibold">
            السماح لمحركات البحث بفهرسة الصفحة
          </span>
        </label>
        <SeoTextField
          label="OG Title"
          name="ogTitle"
          value={ogTitle}
          onChange={setOgTitle}
          maximum={70}
          guidance="يستخدم SEO Title تلقائياً عند تركه فارغاً"
        />
        <SeoTextArea
          label="OG Description"
          name="ogDescription"
          value={ogDescription}
          onChange={setOgDescription}
          maximum={200}
          guidance="يستخدم Meta Description تلقائياً"
        />
        <label className="block sm:col-span-2">
          <span className="text-brand-ink mb-2 block text-sm font-semibold">
            صورة Open Graph من مكتبة الوسائط
          </span>
          <select
            name="ogImage"
            value={ogImage}
            onChange={(event) => setOgImage(event.target.value)}
            className={controlClass}
            dir="ltr"
          >
            <option value="">الصورة التلقائية الحالية</option>
            {[...imageOptions.values()].map((image) => (
              <option key={image.path} value={image.path}>
                {image.label} — {image.path}
              </option>
            ))}
          </select>
        </label>
        {ogImage && (
          <div className="border-brand-border relative h-48 overflow-hidden rounded-2xl border bg-slate-50 sm:col-span-2">
            <Image
              src={ogImage}
              alt={imageAlt || fallbackTitle}
              fill
              sizes="700px"
              className="object-contain"
            />
          </div>
        )}
        <SeoTextField
          label="Alt Text للصورة"
          name="seoImageAlt"
          value={imageAlt}
          onChange={setImageAlt}
          maximum={180}
          guidance="صف الصورة بوضوح دون حشو كلمات مفتاحية"
          className="sm:col-span-2"
        />
      </div>

      <section className="border-brand-border rounded-2xl border bg-white p-5">
        <div className="flex items-center gap-2">
          <Search className="text-brand-cyan size-5" aria-hidden />
          <h3 className="text-brand-ink font-bold">معاينة Google</h3>
        </div>
        <p className="mt-4 text-sm text-emerald-700" dir="ltr">
          {canonical || defaultPath}
        </p>
        <p className="mt-1 text-xl text-[#1a0dab]">{title || fallbackTitle}</p>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          {description || fallbackDescription}
        </p>
      </section>

      <section className="rounded-2xl border border-violet-200 bg-violet-50 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-brand-ink flex items-center gap-2 font-bold">
              <Bot className="size-5 text-violet-700" aria-hidden />
              مساعد SEO بالذكاء الاصطناعي
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              الاقتراح يظهر للمراجعة ولا يُحفظ تلقائياً.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            loading={isPending}
            disabled={!aiEnabled}
            onClick={requestSuggestion}
          >
            {aiEnabled ? "اقتراح SEO بالذكاء الاصطناعي" : "AI غير مفعّل"}
          </Button>
        </div>
        {!aiEnabled && (
          <p className="mt-3 text-xs text-violet-900">
            يعمل SEO كاملاً دون AI. أضف OPENAI_API_KEY وOPENAI_MODEL اختيارياً
            للتفعيل.
          </p>
        )}
        {suggestion && !suggestion.ok && (
          <p className="mt-4 rounded-xl bg-white p-3 text-sm text-red-700">
            {suggestion.error}
          </p>
        )}
        {suggestion?.ok && (
          <div className="mt-5 rounded-2xl bg-white p-4">
            <p className="font-bold text-violet-900">اقتراح للمراجعة</p>
            <dl className="mt-3 grid gap-3 text-sm">
              <Suggestion label="العنوان" value={suggestion.suggestion.title} />
              <Suggestion
                label="الوصف"
                value={suggestion.suggestion.description}
              />
              <Suggestion label="Slug" value={suggestion.suggestion.slug} />
              <Suggestion
                label="Alt Text"
                value={suggestion.suggestion.imageAlt}
              />
              <Suggestion
                label="OG"
                value={`${suggestion.suggestion.ogTitle} — ${suggestion.suggestion.ogDescription}`}
              />
            </dl>
            <Button
              type="button"
              size="sm"
              className="mt-4"
              onClick={applySuggestion}
              icon={<Check className="size-4" aria-hidden />}
            >
              تطبيق الاقتراحات على الحقول دون حفظ
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}

function SeoTextField({
  label,
  name,
  value,
  onChange,
  maximum,
  guidance,
  dir,
  className = "",
}: {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  maximum: number;
  guidance: string;
  dir?: "ltr" | "rtl";
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="text-brand-ink mb-2 block text-sm font-semibold">
        {label}
      </span>
      <input
        name={name}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={controlClass}
        dir={dir}
      />
      <Counter value={value} maximum={maximum} guidance={guidance} />
    </label>
  );
}

function SeoTextArea({
  label,
  name,
  value,
  onChange,
  maximum,
  guidance,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  maximum: number;
  guidance: string;
}) {
  return (
    <label className="block sm:col-span-2">
      <span className="text-brand-ink mb-2 block text-sm font-semibold">
        {label}
      </span>
      <textarea
        name={name}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={4}
        className={`${controlClass} py-3`}
      />
      <Counter value={value} maximum={maximum} guidance={guidance} />
    </label>
  );
}

function Counter({
  value,
  maximum,
  guidance,
}: {
  value: string;
  maximum: number;
  guidance: string;
}) {
  const warning = value.length > maximum;
  return (
    <span
      className={`mt-2 flex justify-between gap-3 text-xs ${warning ? "font-bold text-amber-700" : "text-slate-500"}`}
    >
      <span>{guidance}</span>
      <span className="font-latin" dir="ltr">
        {value.length}/{maximum}
      </span>
    </span>
  );
}

function Suggestion({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-bold text-slate-700">{label}</dt>
      <dd className="mt-1 leading-6 text-slate-600">{value}</dd>
    </div>
  );
}
