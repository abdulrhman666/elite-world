"use client";

import { RotateCcw, Save, Upload } from "lucide-react";
import Image from "next/image";
import {
  type ChangeEvent,
  type DragEvent,
  useEffect,
  useRef,
  useState,
} from "react";
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
  categoryMedia = [],
  productMedia = [],
  aiEnabled,
}: {
  action: (formData: FormData) => Promise<void>;
  category?: AdminCategoryRecord;
  media: SiteMediaOption[];
  categoryMedia?: SiteMediaOption[];
  productMedia?: SiteMediaOption[];
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
        <CategoryCardImagePicker
          value={category?.image ?? "/images/equipment-blueprint.svg"}
          previewValue={category?.cardImage}
          automaticImage={category?.automaticImage}
          categoryMedia={categoryMedia}
          productMedia={productMedia}
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

const acceptedImageTypes = ["image/jpeg", "image/png", "image/webp"];
const maxImageSize = 8 * 1024 * 1024;

function CategoryCardImagePicker({
  value,
  previewValue,
  automaticImage,
  categoryMedia,
  productMedia,
}: {
  value: string;
  previewValue?: string;
  automaticImage?: string;
  categoryMedia: SiteMediaOption[];
  productMedia: SiteMediaOption[];
}) {
  const [selectedPath, setSelectedPath] = useState(value);
  const [preview, setPreview] = useState(previewValue || value);
  const [error, setError] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  const objectUrl = useRef<string | null>(null);

  useEffect(
    () => () => {
      if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
    },
    [],
  );

  function clearObjectUrl() {
    if (objectUrl.current) {
      URL.revokeObjectURL(objectUrl.current);
      objectUrl.current = null;
    }
  }

  function validateFile(file: File) {
    if (!acceptedImageTypes.includes(file.type)) {
      return "اختر صورة JPG أو PNG أو WebP.";
    }
    if (file.size <= 0 || file.size > maxImageSize) {
      return "حجم الصورة يجب ألا يتجاوز 8 MB.";
    }
    return "";
  }

  function previewFile(file: File) {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      if (fileInput.current) fileInput.current.value = "";
      return;
    }
    clearObjectUrl();
    objectUrl.current = URL.createObjectURL(file);
    setPreview(objectUrl.current);
    setError("");
  }

  function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) previewFile(file);
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (!file || !fileInput.current) return;
    const transfer = new DataTransfer();
    transfer.items.add(file);
    fileInput.current.files = transfer.files;
    previewFile(file);
  }

  function selectExisting(image: SiteMediaOption) {
    clearObjectUrl();
    if (fileInput.current) fileInput.current.value = "";
    setSelectedPath(image.path);
    setPreview(image.path);
    setError("");
  }

  function useAutomaticImage() {
    clearObjectUrl();
    if (fileInput.current) fileInput.current.value = "";
    setSelectedPath("/images/equipment-blueprint.svg");
    setPreview(automaticImage || "/images/equipment-blueprint.svg");
    setError("");
  }

  return (
    <div className="sm:col-span-2">
      <input type="hidden" name="image" value={selectedPath} />
      <span className="text-brand-ink mb-2 block text-sm font-semibold">
        صورة المعدة داخل بطاقة القسم
      </span>
      <div
        onDragOver={(event) => event.preventDefault()}
        onDrop={onDrop}
        className="border-brand-border bg-brand-surface grid gap-4 rounded-2xl border border-dashed p-4 sm:grid-cols-[180px_1fr]"
      >
        <div className="border-brand-border relative aspect-[4/3] overflow-hidden rounded-xl border bg-white">
          <Image
            src={preview}
            alt="معاينة صورة بطاقة القسم"
            fill
            unoptimized={preview.startsWith("blob:")}
            className="object-contain p-3"
            sizes="180px"
          />
        </div>
        <div className="flex flex-col justify-center">
          <p className="text-brand-ink text-sm font-bold">
            اسحب الصورة هنا أو اخترها من جهازك
          </p>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            JPG أو PNG أو WebP، وبحد أقصى 8 MB. سيبقى شكل البطاقة كما هو.
          </p>
          <input
            ref={fileInput}
            type="file"
            name="categoryImageFile"
            accept="image/jpeg,image/png,image/webp"
            onChange={onFileChange}
            className="sr-only"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              icon={<Upload className="size-4" aria-hidden />}
              onClick={() => fileInput.current?.click()}
            >
              اختيار من الملفات
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              icon={<RotateCcw className="size-4" aria-hidden />}
              onClick={useAutomaticImage}
            >
              اختيار تلقائي
            </Button>
          </div>
          {error && (
            <p className="mt-2 text-xs font-semibold text-red-700">{error}</p>
          )}
        </div>
      </div>

      <ImageLibrary
        title="صور الأقسام السابقة"
        images={categoryMedia}
        selectedPath={selectedPath}
        onSelect={selectExisting}
      />
      <ImageLibrary
        title="صور منتجات هذا القسم"
        images={productMedia}
        selectedPath={selectedPath}
        onSelect={selectExisting}
      />
    </div>
  );
}

function ImageLibrary({
  title,
  images,
  selectedPath,
  onSelect,
}: {
  title: string;
  images: SiteMediaOption[];
  selectedPath: string;
  onSelect: (image: SiteMediaOption) => void;
}) {
  if (images.length === 0) return null;
  return (
    <details className="border-brand-border mt-3 rounded-2xl border bg-white">
      <summary className="text-brand-petroleum cursor-pointer px-4 py-3 text-sm font-bold">
        {title} ({images.length})
      </summary>
      <div className="grid max-h-80 grid-cols-2 gap-3 overflow-y-auto border-t border-slate-100 p-4 sm:grid-cols-4 lg:grid-cols-6">
        {images.map((image) => (
          <button
            key={`${title}-${image.path}`}
            type="button"
            onClick={() => onSelect(image)}
            className={`rounded-xl border p-2 text-start transition ${
              selectedPath === image.path
                ? "border-brand-cyan ring-brand-cyan/20 bg-cyan-50 ring-2"
                : "border-brand-border hover:border-brand-cyan"
            }`}
            title={image.label}
          >
            <span className="relative block aspect-square overflow-hidden rounded-lg bg-slate-50">
              <Image
                src={image.path}
                alt={image.altText}
                fill
                className="object-contain p-1"
                sizes="120px"
              />
            </span>
            <span className="mt-2 line-clamp-2 block text-xs font-semibold text-slate-600">
              {image.label}
            </span>
          </button>
        ))}
      </div>
    </details>
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
