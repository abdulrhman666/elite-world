import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { Category } from "@/types";
import { getCategoryIconSource } from "@/lib/category-icons";

export function CategoryCard({
  category,
  count,
}: {
  category: Category;
  count: number;
}) {
  return (
    <article className="group border-brand-border bg-brand-petroleum shadow-soft relative min-h-[300px] overflow-hidden rounded-3xl border">
      <Image
        src={category.image}
        alt={category.seo?.imageAlt || `صورة قسم ${category.name}`}
        fill
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        className="object-cover transition duration-500 group-hover:scale-[1.04]"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#061d25] via-[#062a34]/80 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-5">
        <div className="flex items-start justify-between gap-4">
          <span className="relative grid size-16 shrink-0 place-items-center rounded-full border-2 border-white/90 bg-gradient-to-br from-white to-cyan-50 shadow-[0_10px_30px_rgba(0,0,0,0.28)] ring-4 ring-cyan-300/20 transition duration-300 group-hover:-translate-y-1 group-hover:scale-105">
            <Image
              src={getCategoryIconSource(category.icon, category.slug)}
              alt={`رمز معدات قسم ${category.name}`}
              width={42}
              height={42}
              className="size-10 object-contain"
            />
          </span>
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-cyan-50">
            {count} منتج
          </span>
        </div>
        <h3 className="mt-5 text-xl font-bold text-white">{category.name}</h3>
        <p className="mt-2 min-h-12 text-sm leading-6 text-slate-200">
          {category.description}
        </p>
        <Link
          href={`/categories/${category.slug}`}
          className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-lg font-semibold text-cyan-100 transition group-hover:gap-3 hover:text-white focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
        >
          استعراض القسم <ArrowLeft className="size-4" aria-hidden />
        </Link>
      </div>
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
