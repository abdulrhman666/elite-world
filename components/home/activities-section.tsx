import { ArrowLeft, ChefHat } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { getPublishedActivities } from "@/lib/activities";

export async function ActivitiesSection() {
  const activities = await getPublishedActivities();
  if (activities.length === 0) return null;

  return (
    <section className="bg-white py-10 sm:py-16 lg:py-20" aria-labelledby="activities-title">
      <Container>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeading
            id="activities-title"
            eyebrow="حلول تبدأ من نشاطك"
            title="جهّز مشروعك"
            description="ابدأ بنوع مشروعك لتتعرف على المعدات الأساسية والمكملة وخيارات التجهيز المناسبة."
          />
          <ButtonLink href="/project-solutions" variant="outline" className="self-start sm:self-auto">
            تجهيز المشاريع
          </ButtonLink>
        </div>
        <div className="-mx-4 mt-7 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-3 sm:mx-0 sm:mt-10 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-3">
          {activities.map((activity) => (
            <Link
              key={activity.slug}
              href={`/activities/${activity.slug}`}
              className="group border-brand-border shadow-soft relative min-w-[82%] snap-center overflow-hidden rounded-3xl border bg-brand-petroleum sm:min-w-0"
            >
              <div className="relative aspect-[16/10]">
                <Image
                  src={activity.image}
                  alt={activity.heroTitle}
                  fill
                  sizes="(max-width: 640px) 82vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover opacity-55 transition duration-500 group-hover:scale-105"
                />
                <div className="from-brand-ink via-brand-petroleum/35 absolute inset-0 bg-gradient-to-t to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5 text-white sm:p-6">
                  <ChefHat className="text-brand-cyan size-7" aria-hidden />
                  <h3 className="mt-3 text-2xl font-bold">{activity.name}</h3>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-200">
                    {activity.heroDescription}
                  </p>
                  <span className="text-brand-cyan mt-4 inline-flex items-center gap-2 text-sm font-bold">
                    اكتشف التجهيزات <ArrowLeft className="size-4" aria-hidden />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}
