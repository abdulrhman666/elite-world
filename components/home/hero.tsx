import { Search } from "lucide-react";
import Image from "next/image";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import type { SiteSettingsData } from "@/types/site-settings";

export function Hero({ settings }: { settings: SiteSettingsData }) {
  return (
    <section
      className="bg-brand-ink relative isolate overflow-hidden py-12 text-white sm:py-20 lg:py-24"
      aria-labelledby="hero-title"
    >
      <Image
        src={settings.heroImage}
        alt=""
        fill
        priority
        fetchPriority="high"
        sizes="100vw"
        className="-z-20 object-cover opacity-35"
      />
      <div className="bg-brand-ink/75 absolute inset-0 -z-10" />
      <Container className="text-center">
        <h1 id="hero-title" className="text-3xl font-bold sm:text-5xl lg:text-6xl">
          ابحث عن معدات المطاعم
        </h1>
        <form
          action="/shop"
          className="mx-auto mt-6 flex max-w-4xl rounded-2xl bg-white p-2 shadow-2xl sm:mt-8"
        >
          <label className="relative flex-1">
            <span className="sr-only">
              ابحث عن منتج أو موديل أو علامة تجارية
            </span>
            <Search
              className="text-brand-petroleum absolute top-1/2 right-4 size-6 -translate-y-1/2"
              aria-hidden
            />
            <input
              name="q"
              type="search"
              placeholder="اسم المعدة، SKU، الموديل أو العلامة التجارية"
              className="text-brand-ink min-h-12 w-full rounded-xl ps-3 pe-12 text-sm outline-none sm:min-h-14 sm:ps-4 sm:pe-14 sm:text-lg"
            />
          </label>
          <button
            type="submit"
            className="bg-brand-cyan min-h-12 rounded-xl px-5 font-bold text-white sm:min-h-14 sm:px-9"
          >
            بحث
          </button>
        </form>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <ButtonLink href="#best-sellers" variant="light">
            الأكثر طلباً
          </ButtonLink>
          <ButtonLink
            href="/quote"
            variant="outline"
            className="hover:text-brand-ink border-white/50 bg-white/10 text-white hover:bg-white"
          >
            احصل على عرض سعر
          </ButtonLink>
        </div>
      </Container>
    </section>
  );
}
