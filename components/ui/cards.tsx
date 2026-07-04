import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { Category } from "@/types";

export function CategoryCard({
  category,
  count,
  className = "",
}: {
  category: Category;
  count: number;
  className?: string;
}) {
  return (
    <article
      className={`border-brand-border shadow-soft hover:border-brand-cyan/35 hover:shadow-card overflow-hidden rounded-3xl border bg-white transition duration-300 hover:-translate-y-1 ${className}`}
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
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-contain p-4 mix-blend-multiply transition duration-500 group-hover:scale-[1.04]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-white via-white/5 to-transparent" />
          <span className="bg-brand-cyan absolute top-4 right-4 rounded-lg px-3 py-1.5 text-xs font-bold text-white shadow-sm">
            {count} منتج
          </span>
        </div>
        <div className="flex flex-1 flex-col p-5 pt-3">
          <h3 className="text-brand-ink text-xl font-bold">{category.name}</h3>
          <p className="mt-2 min-h-12 text-sm leading-6 text-slate-600">
            {category.description}
          </p>
          <span className="text-brand-cyan mt-auto inline-flex min-h-11 items-center gap-2 pt-4 font-bold transition group-hover:gap-3">
            استعراض القسم <ArrowLeft className="size-4" aria-hidden />
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
