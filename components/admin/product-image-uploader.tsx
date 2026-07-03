"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  MAX_IMAGES_PER_UPLOAD,
  validateImageFileMetadata,
} from "@/lib/storage/storage-adapter";

const controlClass =
  "border-brand-border focus:border-brand-cyan focus:ring-brand-cyan/15 min-h-12 w-full rounded-xl border bg-white px-4 text-sm text-brand-ink outline-none transition focus:ring-3";

export function ProductImageUploader({
  action,
}: {
  action: (formData: FormData) => Promise<void>;
}) {
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const previews = useMemo(
    () => files.map((file) => URL.createObjectURL(file)),
    [files],
  );

  useEffect(
    () => () => previews.forEach((preview) => URL.revokeObjectURL(preview)),
    [previews],
  );

  return (
    <form action={action} className="space-y-5">
      <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-4 text-sm leading-6 text-cyan-950">
        JPG أو PNG أو WebP، بحد أقصى 8 MB لكل صورة و8 صور في العملية. تُضغط
        الصور وتتحول تلقائياً إلى WebP بجودة 86%.
      </div>

      <label className="block">
        <span className="text-brand-ink mb-2 block text-sm font-semibold">
          نوع الرفع
        </span>
        <select
          name="uploadMode"
          className={controlClass}
          defaultValue="additional"
        >
          <option value="additional">صور إضافية</option>
          <option value="primary">اجعل الصورة الأولى رئيسية</option>
        </select>
      </label>

      <label className="block">
        <span className="text-brand-ink mb-2 block text-sm font-semibold">
          اختر الصور
        </span>
        <input
          name="files"
          type="file"
          multiple
          required
          accept="image/jpeg,image/png,image/webp"
          className={`${controlClass} file:bg-brand-surface file:text-brand-petroleum py-2 file:me-3 file:rounded-lg file:border-0 file:px-3 file:py-2 file:font-semibold`}
          onChange={(event) => {
            const selected = Array.from(event.currentTarget.files ?? []);
            const validationError = selected
              .map((file) => validateImageFileMetadata(file))
              .find(Boolean);
            if (selected.length > MAX_IMAGES_PER_UPLOAD) {
              setError("يمكن رفع 8 صور كحد أقصى في العملية الواحدة.");
              setFiles([]);
              event.currentTarget.value = "";
              return;
            }
            if (validationError) {
              setError(validationError);
              setFiles([]);
              event.currentTarget.value = "";
              return;
            }
            setError(null);
            setFiles(selected);
          }}
        />
      </label>

      {error && <p className="text-sm font-semibold text-red-700">{error}</p>}

      {files.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {files.map((file, index) => (
            <div
              key={`${file.name}-${file.lastModified}`}
              className="border-brand-border rounded-2xl border bg-white p-3"
            >
              <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-slate-100">
                <Image
                  src={previews[index]}
                  alt="معاينة الصورة قبل الرفع"
                  fill
                  unoptimized
                  className="object-contain"
                />
              </div>
              <p className="mt-2 truncate text-xs text-slate-500" dir="ltr">
                {file.name}
              </p>
              <label className="mt-3 block">
                <span className="text-brand-ink mb-2 block text-xs font-semibold">
                  Alt Text عربي للصورة {index + 1}
                </span>
                <input
                  name={`altText_${index}`}
                  required
                  placeholder="مثال: فرن دوار تجاري من الأمام"
                  className={controlClass}
                />
              </label>
            </div>
          ))}
        </div>
      )}

      <Button
        type="submit"
        disabled={files.length === 0}
        icon={<ImagePlus className="size-4" aria-hidden />}
      >
        رفع ومعالجة الصور
      </Button>
    </form>
  );
}
