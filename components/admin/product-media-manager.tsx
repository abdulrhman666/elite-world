"use client";

import Image from "next/image";
import { ArrowDown, ArrowUp, Check, ImageIcon, Save } from "lucide-react";
import {
  deleteProductImageAction,
  moveProductImageAction,
  setPrimaryProductImageAction,
  updateProductImageAltAction,
  uploadProductImagesAction,
} from "@/app/admin/actions";
import { MediaDeleteButton } from "@/components/admin/media-delete-button";
import { ProductImageUploader } from "@/components/admin/product-image-uploader";
import { Button } from "@/components/ui/button";
import type { AdminMediaRecord } from "@/lib/admin/media-admin";

const altClass =
  "border-brand-border focus:border-brand-cyan min-h-11 w-full rounded-xl border px-3 text-sm outline-none";

export function ProductMediaManager({
  productId,
  records,
}: {
  productId: string;
  records: AdminMediaRecord[];
}) {
  return (
    <div className="space-y-8">
      <section className="border-brand-border rounded-3xl border bg-white p-5 sm:p-7">
        <div className="mb-5 flex items-center gap-3">
          <ImageIcon className="text-brand-cyan size-6" aria-hidden />
          <div>
            <h2 className="text-brand-ink text-xl font-bold">رفع صور المنتج</h2>
            <p className="mt-1 text-sm text-slate-500">
              التخزين محلي الآن عبر Storage Adapter قابل للاستبدال لاحقاً.
            </p>
          </div>
        </div>
        <ProductImageUploader
          action={uploadProductImagesAction.bind(null, productId)}
        />
      </section>

      <section>
        <h2 className="text-brand-ink text-xl font-bold">الصور المرتبطة</h2>
        {records.length === 0 ? (
          <p className="border-brand-border mt-4 rounded-2xl border border-dashed bg-white p-6 text-sm text-slate-600">
            لا توجد سجلات صور بعد. ارفع صورة رئيسية للبدء.
          </p>
        ) : (
          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            {records.map((image, index) => (
              <article
                key={image.id}
                className="border-brand-border rounded-3xl border bg-white p-4"
              >
                <div className="grid gap-4 sm:grid-cols-[150px_1fr]">
                  <div className="relative aspect-square overflow-hidden rounded-2xl bg-slate-100">
                    <Image
                      src={image.path}
                      alt={image.altText}
                      fill
                      sizes="150px"
                      className="object-contain"
                    />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      {image.isPrimary && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                          <Check className="size-3" aria-hidden /> رئيسية
                        </span>
                      )}
                      <span className="text-xs text-slate-500">
                        الترتيب {index + 1}
                      </span>
                    </div>
                    <p className="font-latin mt-2 text-xs break-all text-slate-500">
                      {image.path}
                    </p>
                    <form
                      action={updateProductImageAltAction.bind(
                        null,
                        image.id,
                        productId,
                      )}
                      className="mt-3 flex gap-2"
                    >
                      <input
                        name="altText"
                        required
                        defaultValue={image.altText}
                        aria-label="Alt Text عربي"
                        className={altClass}
                      />
                      <Button
                        type="submit"
                        variant="ghost"
                        size="icon"
                        aria-label="حفظ Alt Text"
                        icon={<Save className="size-4" aria-hidden />}
                      />
                    </form>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
                  {!image.isPrimary && (
                    <form
                      action={setPrimaryProductImageAction.bind(
                        null,
                        image.id,
                        productId,
                      )}
                    >
                      <Button type="submit" variant="outline" size="sm">
                        اجعلها رئيسية
                      </Button>
                    </form>
                  )}
                  <form
                    action={moveProductImageAction.bind(
                      null,
                      image.id,
                      productId,
                      "up",
                    )}
                  >
                    <Button
                      type="submit"
                      variant="ghost"
                      size="icon"
                      disabled={index === 0}
                      aria-label="تحريك الصورة للأعلى"
                      icon={<ArrowUp className="size-4" aria-hidden />}
                    />
                  </form>
                  <form
                    action={moveProductImageAction.bind(
                      null,
                      image.id,
                      productId,
                      "down",
                    )}
                  >
                    <Button
                      type="submit"
                      variant="ghost"
                      size="icon"
                      disabled={index === records.length - 1}
                      aria-label="تحريك الصورة للأسفل"
                      icon={<ArrowDown className="size-4" aria-hidden />}
                    />
                  </form>
                  <MediaDeleteButton
                    productName={image.productName}
                    action={deleteProductImageAction.bind(
                      null,
                      image.id,
                      productId,
                    )}
                  />
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
