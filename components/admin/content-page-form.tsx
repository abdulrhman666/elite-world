"use client";

import {
  ArrowDown,
  ArrowUp,
  Plus,
  RotateCcw,
  Save,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";
import {
  restoreDefaultContentPageAction,
  updateContentPageAction,
} from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { FormInput, Select, Textarea } from "@/components/ui/form-controls";
import type { ContentPageData, ContentPageSection } from "@/types/content-page";
import type { SiteMediaOption } from "@/types/site-settings";

export function ContentPageForm({
  page,
  media,
  readOnly,
}: {
  page: ContentPageData;
  media: SiteMediaOption[];
  readOnly: boolean;
}) {
  const [sections, setSections] = useState(page.sections);
  const updateAction = updateContentPageAction.bind(null, page.slug);
  const restoreAction = restoreDefaultContentPageAction.bind(null, page.slug);

  function updateSection(index: number, values: Partial<ContentPageSection>) {
    setSections((current) =>
      current.map((section, sectionIndex) =>
        sectionIndex === index ? { ...section, ...values } : section,
      ),
    );
  }

  function moveSection(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= sections.length) return;
    setSections((current) => {
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function removeSection(index: number) {
    if (
      sections.length <= 1 ||
      !window.confirm("هل تريد حذف هذا القسم من الصفحة؟")
    ) {
      return;
    }
    setSections((current) =>
      current.filter((_, itemIndex) => itemIndex !== index),
    );
  }

  function addSection() {
    if (sections.length >= 8) return;
    setSections((current) => [
      ...current,
      {
        id: `section-${Date.now()}`,
        title: "قسم جديد",
        description: "اكتب وصف القسم هنا.",
        items: ["عنصر جديد"],
        image: null,
        layout: "cards",
      },
    ]);
  }

  return (
    <div className="mt-7 space-y-6">
      <form action={updateAction} className="space-y-6">
        <input
          type="hidden"
          name="sectionsJson"
          value={JSON.stringify(sections)}
        />

        <div className="border-brand-border rounded-3xl border bg-white p-5 sm:p-7">
          <h2 className="text-brand-ink text-xl font-bold">رأس الصفحة</h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <FormInput
              label="اسم الصفحة في التنقل"
              name="title"
              defaultValue={page.title}
              disabled={readOnly}
              required
            />
            <FormInput
              label="النص الصغير أعلى العنوان"
              name="eyebrow"
              defaultValue={page.eyebrow}
              disabled={readOnly}
              required
            />
            <FormInput
              label="العنوان الرئيسي"
              name="heroTitle"
              defaultValue={page.heroTitle}
              disabled={readOnly}
              required
              className="sm:col-span-2"
            />
            <Textarea
              label="وصف الصفحة"
              name="heroDescription"
              defaultValue={page.heroDescription}
              disabled={readOnly}
              required
              className="sm:col-span-2"
            />
            <ImageSelect
              label="صورة رأس الصفحة"
              name="heroImage"
              value={page.heroImage}
              media={media}
              disabled={readOnly}
              required
            />
          </div>
        </div>

        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-brand-ink text-xl font-bold">أقسام الصفحة</h2>
              <p className="mt-1 text-sm text-slate-600">
                عدّل النصوص والعناصر، أو غيّر الترتيب بالأسهم.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              icon={<Plus className="size-4" aria-hidden />}
              onClick={addSection}
              disabled={readOnly || sections.length >= 8}
            >
              إضافة قسم
            </Button>
          </div>

          {sections.map((section, index) => (
            <div
              key={section.id}
              className="border-brand-border rounded-3xl border bg-white p-5 sm:p-7"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-brand-petroleum font-bold">
                  القسم {index + 1}
                </p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="نقل القسم لأعلى"
                    onClick={() => moveSection(index, -1)}
                    disabled={readOnly || index === 0}
                    icon={<ArrowUp className="size-4" aria-hidden />}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="نقل القسم لأسفل"
                    onClick={() => moveSection(index, 1)}
                    disabled={readOnly || index === sections.length - 1}
                    icon={<ArrowDown className="size-4" aria-hidden />}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="حذف القسم"
                    onClick={() => removeSection(index)}
                    disabled={readOnly || sections.length <= 1}
                    icon={
                      <Trash2 className="size-4 text-red-700" aria-hidden />
                    }
                  />
                </div>
              </div>

              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <FormInput
                  label="عنوان القسم"
                  value={section.title}
                  disabled={readOnly}
                  required
                  onChange={(event) =>
                    updateSection(index, { title: event.target.value })
                  }
                />
                <Select
                  label="طريقة عرض العناصر"
                  value={section.layout}
                  disabled={readOnly}
                  onChange={(event) =>
                    updateSection(index, {
                      layout: event.target
                        .value as ContentPageSection["layout"],
                    })
                  }
                >
                  <option value="cards">بطاقات</option>
                  <option value="steps">خطوات مرقمة</option>
                  <option value="list">قائمة مختصرة</option>
                </Select>
                <Textarea
                  label="وصف القسم"
                  value={section.description}
                  disabled={readOnly}
                  required
                  onChange={(event) =>
                    updateSection(index, { description: event.target.value })
                  }
                />
                <Textarea
                  label="العناصر — عنصر واحد في كل سطر"
                  value={section.items.join("\n")}
                  disabled={readOnly}
                  required
                  onChange={(event) =>
                    updateSection(index, {
                      items: event.target.value
                        .split("\n")
                        .map((item) => item.trim())
                        .filter(Boolean),
                    })
                  }
                />
                <ImageSelect
                  label="صورة القسم — اختيارية"
                  value={section.image ?? ""}
                  media={media}
                  disabled={readOnly}
                  onChange={(image) =>
                    updateSection(index, { image: image || null })
                  }
                />
              </div>
            </div>
          ))}
        </div>

        <div className="border-brand-border rounded-3xl border bg-white p-5 sm:p-7">
          <h2 className="text-brand-ink text-xl font-bold">أزرار الصفحة</h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <FormInput
              label="نص الزر الرئيسي"
              name="primaryCtaText"
              defaultValue={page.primaryCtaText}
              disabled={readOnly}
              required
            />
            <FormInput
              label="رابط الزر الرئيسي"
              name="primaryCtaUrl"
              defaultValue={page.primaryCtaUrl}
              disabled={readOnly}
              required
              dir="ltr"
            />
            <FormInput
              label="نص الزر الثانوي — اختياري"
              name="secondaryCtaText"
              defaultValue={page.secondaryCtaText ?? ""}
              disabled={readOnly}
            />
            <FormInput
              label="رابط الزر الثانوي — اختياري"
              name="secondaryCtaUrl"
              defaultValue={page.secondaryCtaUrl ?? ""}
              disabled={readOnly}
              dir="ltr"
            />
          </div>
        </div>

        <Button
          type="submit"
          icon={<Save className="size-4" aria-hidden />}
          disabled={readOnly}
        >
          حفظ ونشر التغييرات
        </Button>
      </form>

      <form
        action={restoreAction}
        onSubmit={(event) => {
          if (
            !window.confirm("هل تريد استعادة المحتوى الافتراضي لهذه الصفحة؟")
          ) {
            event.preventDefault();
          }
        }}
      >
        <input type="hidden" name="confirmRestore" value="confirmed" />
        <Button
          type="submit"
          variant="outline"
          icon={<RotateCcw className="size-4" aria-hidden />}
          disabled={readOnly}
        >
          استعادة المحتوى الافتراضي
        </Button>
      </form>
    </div>
  );
}

function ImageSelect({
  label,
  name,
  value,
  media,
  disabled,
  required = false,
  onChange,
}: {
  label: string;
  name?: string;
  value: string;
  media: SiteMediaOption[];
  disabled: boolean;
  required?: boolean;
  onChange?: (value: string) => void;
}) {
  const [selected, setSelected] = useState(value);
  const options = useMemo(() => {
    const unique = new Map<string, SiteMediaOption>();
    if (!required)
      unique.set("", { path: "", label: "بدون صورة", altText: "" });
    if (value) {
      unique.set(value, {
        path: value,
        label: "الصورة الحالية",
        altText: label,
      });
    }
    for (const image of media) unique.set(image.path, image);
    return [...unique.values()];
  }, [label, media, required, value]);

  return (
    <div className="sm:col-span-2">
      <Select
        label={label}
        name={name}
        value={selected}
        disabled={disabled}
        required={required}
        dir="ltr"
        onChange={(event) => {
          setSelected(event.target.value);
          onChange?.(event.target.value);
        }}
      >
        {options.map((image) => (
          <option key={image.path || "none"} value={image.path}>
            {image.label} {image.path ? `— ${image.path}` : ""}
          </option>
        ))}
      </Select>
      {selected && (
        <div className="border-brand-border mt-3 overflow-hidden rounded-2xl border bg-slate-50 p-3">
          <div className="relative h-40">
            <Image
              src={selected}
              alt={`معاينة ${label}`}
              fill
              unoptimized
              sizes="700px"
              className="object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
