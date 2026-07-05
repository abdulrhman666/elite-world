import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { Category } from "@/types";

export function CategoryCard({
  category,
  count,
  className = "",
  compact = false,
}: {
  category: Category;
  count: number;
  className?: string;
  compact?: boolean;
}) {
  return (
    <article
      className={`border-brand-border shadow-soft hover:border-brand-cyan/35 hover:shadow-card snap-start overflow-hidden border bg-white transition duration-300 hover:-translate-y-1 ${compact ? "rounded-2xl" : "rounded-3xl"} ${className}`}
    >
      <Link
        href={`/categories/${category.slug}`}
        className="group focus-visible:ring-brand-cyan flex h-full flex-col focus-visible:ring-3 focus-visible:outline-none focus-visible:ring-inset"
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-b from-slate-50 to-cyan-50/70">
          <Image
            src={category.cardImage ?? category.image}
            alt={category.seo?.imageAlt || `صورة قسم ${category.name}`}
            fill
            sizes={
              compact
                ? "(max-width: 640px) 46vw, (max-width: 1024px) 50vw, 25vw"
                : "(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 25vw"
            }
            className="object-contain p-3 mix-blend-multiply transition duration-500 group-hover:scale-[1.04] sm:p-4"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-white via-white/5 to-transparent" />
          <span className={`bg-brand-cyan absolute rounded-lg font-bold text-white shadow-sm ${compact ? "top-2 right-2 px-2 py-1 text-[10px]" : "top-3 right-3 px-2.5 py-1 text-[10px] sm:top-4 sm:right-4 sm:px-3 sm:py-1.5 sm:text-xs"}`}>
            {count} منتج
          </span>
        </div>
        <div className={`flex flex-1 flex-col ${compact ? "p-3 pt-2" : "p-3 pt-2 sm:p-5 sm:pt-3"}`}>
          <h3 className={`text-brand-ink font-bold ${compact ? "text-sm leading-6 sm:text-lg" : "text-base sm:text-xl"}`}>
            {category.name}
          </h3>
          {!compact && (
            <p className="mt-2 hidden min-h-12 text-sm leading-6 text-slate-600 sm:block">
              {category.description}
            </p>
          )}
          <span className={`text-brand-cyan mt-auto inline-flex items-center gap-1.5 font-bold transition group-hover:gap-2.5 ${compact ? "min-h-9 pt-2 text-xs sm:text-sm" : "min-h-10 pt-3 text-xs sm:min-h-11 sm:pt-4 sm:text-base"}`}>
            عرض القسم <ArrowLeft className="size-3.5 sm:size-4" aria-hidden />
          </span>
        </div>
      </Link>
    </article>
  );
}

export function BrandLogoCard({ name }: { name: string }) {
  return (
    <div className="border-brand-border shadow-soft hover:border-brand-cyan/50 grid min-h-28 place-items-center rounded-2xl border bg-white p-4 text-center transition">
      <div>
        <p className="font-latin text-brand-petroleum text-lg font-extrabold tracking-[0.18em]">
          {name}
        </p>
        <p className="mt-2 text-[10px] text-slate-400">علامة تجارية</p>
      </div>
    </div>
  );
}
