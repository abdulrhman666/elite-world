"use client";

import { Save } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { SeoFields } from "@/components/admin/seo-fields";
import { Button } from "@/components/ui/button";
import {
  categoryIconOptions,
  getCategoryIconSource,
  normalizeCategoryIconValue,
} from "@/lib/category-icons";
import type { AdminCategoryRecord } from "@/lib/admin/catalog-admin";
import type { SiteMediaOption } from "@/types/site-settings";

const controlClass =
  "border-brand-border focus:border-brand-cyan focus:ring-brand-cyan/15 min-h-12 w-full rounded-xl border bg-white px-4 text-sm text-brand-ink outline-none transition focus:ring-3";

export function AdminCategoryForm({
  action,
  category,
  media,
  aiEnabled,
}: {
  action: (formData: FormData) => Promise<void>;
  category?: AdminCategoryRecord;
  media: SiteMediaOption[];
  aiEnabled: boolean;
}) {
  const [activeTab, setActiveTab] = useState<"data" | "seo">("data");
  return (
    <form action={action} className="space-y-6">
      <div className="border-brand-border flex gap-2 rounded-2xl border bg-slate-50 p-2">
        <button
          type="button"
          onClick={() => setActiveTab("data")}
          className={`min-h-11 rounded-xl px-4 text-sm font-bold ${activeTab === "data" ? "bg-brand-petroleum text-white" : "text-slate-600"}`}
        >
          بيانات القسم
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("seo")}
          className={`min-h-11 rounded-xl px-4 text-sm font-bold ${activeTab === "seo" ? "bg-brand-petroleum text-white" : "text-slate-600"}`}
        >
          SEO
        </button>
      </div>

      <div hidden={activeTab !== "data"} className="grid gap-4 sm:grid-cols-2">
        <Field label="الاسم العربي" name="name" defaultValue={category?.name} />
        <Field
          label="الاسم الإنجليزي"
          name="nameEn"
          defaultValue={category?.nameEn}
          dir="ltr"
        />
        <Field
          label="Slug"
          name="slug"
          defaultValue={category?.slug}
          dir="ltr"
        />
        <label className="block">
          <span className="text-brand-ink mb-2 block text-sm font-semibold">
            ترتيب الظهور
          </span>
          <input
            name="sortOrder"
            type="number"
            min="0"
            step="1"
            required
            defaultValue={category?.sortOrder ?? 0}
            className={controlClass}
            dir="ltr"
          />
        </label>
        <Field
          label="مسار الصورة"
          name="image"
          defaultValue={category?.image ?? "/images/equipment-blueprint.svg"}
          dir="ltr"
          className="sm:col-span-2"
        />
        <CategoryIconPicker
          value={category?.icon ?? "commercial-oven"}
          media={media}
        />
        <label className="block sm:col-span-2">
          <span className="text-brand-ink mb-2 block text-sm font-semibold">
            الوصف
          </span>
          <textarea
            name="description"
            required
            rows={4}
            defaultValue={category?.description}
            className={`${controlClass} py-3`}
          />
        </label>
      </div>

      <div hidden={activeTab !== "seo"}>
        <SeoFields
          values={{
            seoTitle: category?.seoTitle ?? null,
            seoDescription: category?.seoDescription ?? null,
            canonicalUrl: category?.canonicalUrl ?? null,
            seoIndexable: category?.seoIndexable ?? true,
            ogTitle: category?.ogTitle ?? null,
            ogDescription: category?.ogDescription ?? null,
            ogImage: category?.ogImage ?? null,
            seoImageAlt: category?.seoImageAlt ?? null,
          }}
          fallbackTitle={category?.name ?? "اسم القسم"}
          fallbackDescription={
            category?.description ?? "وصف القسم سيُستخدم تلقائياً."
          }
          defaultPath={`/categories/${category?.slug ?? "category-slug"}`}
          entityType="category"
          media={media}
          aiEnabled={aiEnabled}
        />
      </div>

      <div>
        <Button
          type="submit"
          size="sm"
          icon={<Save className="size-4" aria-hidden />}
        >
          {category ? "حفظ القسم" : "إضافة القسم"}
        </Button>
      </div>
    </form>
  );
}

function CategoryIconPicker({
  value,
  media,
}: {
  value: string;
  media: SiteMediaOption[];
}) {
  const [selected, setSelected] = useState(normalizeCategoryIconValue(value));
  return (
    <div className="sm:col-span-2">
      <label className="block">
        <span className="text-brand-ink mb-2 block text-sm font-semibold">
          رمز القسم الواضح
        </span>
        <select
          name="icon"
          value={selected}
          onChange={(event) => setSelected(event.target.value)}
          className={controlClass}
        >
          <optgroup label="رسومات معدات جاهزة">
            {categoryIconOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </optgroup>
          {media.length > 0 && (
            <optgroup label="صورة من مكتبة الوسائط">
              {media.map((image) => (
                <option key={image.path} value={`media:${image.path}`}>
                  {image.label} — {image.path}
                </option>
              ))}
            </optgroup>
          )}
        </select>
      </label>
      <div className="border-brand-border bg-brand-surface mt-3 flex items-center gap-4 rounded-2xl border p-4">
        <span className="grid size-16 place-items-center rounded-full border-2 border-white bg-gradient-to-br from-white to-cyan-50 shadow-lg ring-4 ring-cyan-300/20">
          <Image
            src={getCategoryIconSource(selected)}
            alt="معاينة رمز القسم"
            width={42}
            height={42}
            className="size-10 object-contain"
          />
        </span>
        <span className="text-brand-ink text-sm font-bold">
          {categoryIconOptions.find((item) => item.value === selected)?.label ??
            "صورة مختارة من مكتبة الوسائط"}
        </span>
      </div>
    </div>
  );
}

function Field({
  label,
  name,
  defaultValue,
  dir,
  className = "",
}: {
  label: string;
  name: string;
  defaultValue?: string;
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
        required
        defaultValue={defaultValue}
        dir={dir}
        className={controlClass}
      />
    </label>
  );
}
