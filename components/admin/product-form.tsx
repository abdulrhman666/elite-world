"use client";

import { Save } from "lucide-react";
import { useState } from "react";
import { SeoFields } from "@/components/admin/seo-fields";
import { Button, ButtonLink } from "@/components/ui/button";
import type {
  AdminBrandOption,
  AdminCategoryOption,
  AdminProductFormValues,
} from "@/lib/admin/catalog-admin";
import type { SiteMediaOption } from "@/types/site-settings";

const controlClass =
  "border-brand-border focus:border-brand-cyan focus:ring-brand-cyan/15 min-h-12 w-full rounded-xl border bg-white px-4 text-sm text-brand-ink outline-none transition focus:ring-3";

const specificationFields = [
  ["spec_dimensions", "الأبعاد"],
  ["spec_capacity", "السعة"],
  ["spec_power", "القدرة"],
  ["spec_voltage", "الجهد"],
  ["spec_temperature", "نطاق الحرارة"],
  ["spec_material", "الخامة"],
] as const;

export function AdminProductForm({
  action,
  categories,
  brands,
  product,
  media,
  aiEnabled,
}: {
  action: (formData: FormData) => Promise<void>;
  categories: AdminCategoryOption[];
  brands: AdminBrandOption[];
  product?: AdminProductFormValues | null;
  media: SiteMediaOption[];
  aiEnabled: boolean;
}) {
  const [activeTab, setActiveTab] = useState<"data" | "seo">("data");
  return (
    <form action={action} className="space-y-8">
      <div className="border-brand-border flex gap-2 rounded-2xl border bg-white p-2">
        <button
          type="button"
          onClick={() => setActiveTab("data")}
          className={`min-h-11 rounded-xl px-5 text-sm font-bold ${activeTab === "data" ? "bg-brand-petroleum text-white" : "text-slate-600"}`}
        >
          بيانات المنتج
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("seo")}
          className={`min-h-11 rounded-xl px-5 text-sm font-bold ${activeTab === "seo" ? "bg-brand-petroleum text-white" : "text-slate-600"}`}
        >
          SEO
        </button>
      </div>

      <div hidden={activeTab !== "data"} className="space-y-8">
        <fieldset className="border-brand-border grid gap-5 rounded-3xl border bg-white p-5 sm:grid-cols-2 sm:p-7">
          <legend className="text-brand-ink px-2 text-lg font-bold">
            بيانات المنتج
          </legend>
          <Field
            label="الاسم العربي"
            name="nameAr"
            defaultValue={product?.nameAr}
          />
          <Field
            label="الاسم الإنجليزي"
            name="nameEn"
            defaultValue={product?.nameEn}
            dir="ltr"
          />
          <Field
            label="Slug"
            name="slug"
            defaultValue={product?.slug}
            dir="ltr"
          />
          <Field label="SKU" name="sku" defaultValue={product?.sku} dir="ltr" />
          <Field
            label="الموديل"
            name="model"
            defaultValue={product?.model}
            dir="ltr"
          />
          <label className="block">
            <span className="text-brand-ink mb-2 block text-sm font-semibold">
              القسم
            </span>
            <select
              name="categoryId"
              required
              defaultValue={product?.categoryId ?? ""}
              className={controlClass}
            >
              <option value="" disabled>
                اختر القسم
              </option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-brand-ink mb-2 block text-sm font-semibold">
              العلامة التجارية
            </span>
            <select
              name="brandId"
              required
              defaultValue={product?.brandId ?? ""}
              className={controlClass}
            >
              <option value="" disabled>
                اختر العلامة التجارية
              </option>
              {brands.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </select>
          </label>
          <Field
            label="بلد المنشأ"
            name="origin"
            defaultValue={product?.origin}
          />
          <Field
            label="الضمان"
            name="warranty"
            defaultValue={product?.warranty}
          />
          <Field
            label="مسار الصورة"
            name="image"
            defaultValue={product?.image}
            dir="ltr"
          />
          <label className="block sm:col-span-2">
            <span className="text-brand-ink mb-2 block text-sm font-semibold">
              الوصف
            </span>
            <textarea
              name="description"
              required
              defaultValue={product?.description}
              rows={5}
              className={`${controlClass} py-3`}
            />
          </label>
        </fieldset>

        <fieldset className="border-brand-border grid gap-5 rounded-3xl border bg-white p-5 sm:grid-cols-3 sm:p-7">
          <legend className="text-brand-ink px-2 text-lg font-bold">
            السعر والتوفر
          </legend>
          <label className="block">
            <span className="text-brand-ink mb-2 block text-sm font-semibold">
              طريقة السعر
            </span>
            <select
              name="priceMode"
              defaultValue={product?.price == null ? "quote" : "fixed"}
              className={controlClass}
            >
              <option value="quote">اطلب عرض سعر</option>
              <option value="fixed">سعر ثابت</option>
            </select>
          </label>
          <label className="block">
            <span className="text-brand-ink mb-2 block text-sm font-semibold">
              السعر (ر.س)
            </span>
            <input
              name="price"
              type="number"
              min="0.01"
              step="0.01"
              defaultValue={product?.price ?? ""}
              className={controlClass}
              dir="ltr"
            />
          </label>
          <label className="block">
            <span className="text-brand-ink mb-2 block text-sm font-semibold">
              كمية المخزون
            </span>
            <input
              name="stockQuantity"
              type="number"
              min="0"
              step="1"
              required
              defaultValue={product?.stockQuantity ?? 0}
              className={controlClass}
              dir="ltr"
            />
            <span className="mt-2 block text-xs text-slate-500">
              عند وصول الكمية إلى صفر يظهر المنتج «غير متوفر».
            </span>
          </label>
        </fieldset>

        <fieldset className="border-brand-border grid gap-5 rounded-3xl border bg-white p-5 sm:grid-cols-2 sm:p-7 lg:grid-cols-3">
          <legend className="text-brand-ink px-2 text-lg font-bold">
            المواصفات الفنية الأساسية
          </legend>
          {specificationFields.map(([name, label]) => (
            <Field
              key={name}
              label={label}
              name={name}
              required={false}
              defaultValue={product?.specifications[label]}
            />
          ))}
        </fieldset>
      </div>

      <div hidden={activeTab !== "seo"}>
        <fieldset className="border-brand-border rounded-3xl border bg-white p-5 sm:p-7">
          <legend className="text-brand-ink px-2 text-lg font-bold">
            إعدادات SEO
          </legend>
          <SeoFields
            values={{
              seoTitle: product?.seoTitle ?? null,
              seoDescription: product?.seoDescription ?? null,
              canonicalUrl: product?.canonicalUrl ?? null,
              seoIndexable: product?.seoIndexable ?? true,
              ogTitle: product?.ogTitle ?? null,
              ogDescription: product?.ogDescription ?? null,
              ogImage: product?.ogImage ?? null,
              seoImageAlt: product?.seoImageAlt ?? null,
            }}
            fallbackTitle={product?.nameAr ?? "اسم المنتج"}
            fallbackDescription={
              product?.description ?? "وصف المنتج سيُستخدم تلقائياً."
            }
            defaultPath={`/products/${product?.slug ?? "product-slug"}`}
            entityType="product"
            media={media}
            aiEnabled={aiEnabled}
          />
        </fieldset>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" icon={<Save className="size-4" aria-hidden />}>
          {product ? "حفظ التعديلات" : "إضافة المنتج"}
        </Button>
        <ButtonLink href="/admin/products" variant="ghost">
          إلغاء
        </ButtonLink>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  defaultValue,
  required = true,
  dir,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  required?: boolean;
  dir?: "ltr" | "rtl";
}) {
  return (
    <label className="block">
      <span className="text-brand-ink mb-2 block text-sm font-semibold">
        {label}
      </span>
      <input
        name={name}
        required={required}
        defaultValue={defaultValue}
        className={controlClass}
        dir={dir}
      />
    </label>
  );
}
