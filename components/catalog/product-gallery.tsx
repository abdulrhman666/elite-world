"use client";

import Image from "next/image";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";

export function ProductGallery({
  image,
  imageAlt,
  additionalImages = [],
  additionalImageAlts = {},
  productName,
  badge,
}: {
  image: string;
  imageAlt?: string;
  additionalImages?: string[];
  additionalImageAlts?: Record<string, string>;
  productName: string;
  badge?: string;
}) {
  const images = [...new Set([image, ...additionalImages])].map(
    (imagePath) => ({
      path: imagePath,
      alt:
        imagePath === image
          ? (imageAlt ?? `صورة المنتج ${productName}`)
          : (additionalImageAlts[imagePath] ??
            `صورة إضافية للمنتج ${productName}`),
    }),
  );
  const [selectedPath, setSelectedPath] = useState(images[0].path);
  const selectedImage =
    images.find((item) => item.path === selectedPath) ?? images[0];

  return (
    <div>
      <div className="bg-brand-petroleum border-brand-border shadow-soft relative aspect-[4/3] overflow-hidden rounded-[2rem] border">
        <Image
          src={selectedImage.path}
          alt={selectedImage.alt}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 48vw"
          className="object-contain"
        />
        {badge && (
          <Badge className="absolute top-5 right-5 border-white/20 bg-white/90">
            {badge}
          </Badge>
        )}
      </div>

      {images.length > 1 && (
        <div
          className="mt-4 grid grid-cols-4 gap-3 sm:grid-cols-6"
          aria-label="صور المنتج الإضافية"
        >
          {images.map((item, index) => {
            const isSelected = item.path === selectedPath;
            return (
              <button
                key={item.path}
                type="button"
                onClick={() => setSelectedPath(item.path)}
                className={`border-brand-border focus-visible:ring-brand-cyan relative aspect-square overflow-hidden rounded-xl border bg-white focus-visible:ring-2 focus-visible:outline-none ${
                  isSelected ? "ring-brand-cyan ring-2" : ""
                }`}
                aria-label={`عرض صورة المنتج ${index + 1}`}
                aria-pressed={isSelected}
              >
                <Image
                  src={item.path}
                  alt={item.alt}
                  fill
                  sizes="96px"
                  className="object-contain"
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
