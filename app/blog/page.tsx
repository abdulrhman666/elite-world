import type { Metadata } from "next";
import Image from "next/image";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/feedback";
import { getPublishedBlogPosts } from "@/lib/blog/service";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "مدونة تجهيز المطاعم والمخابز",
  description: "نصائح شراء وتجهيز وتشغيل معدات المطاعم والمخابز.",
  alternates: { canonical: "/blog" },
  openGraph: {
    title: "مدونة تجهيز المطاعم والمخابز",
    description: "نصائح شراء وتجهيز وتشغيل معدات المطاعم والمخابز.",
    type: "website",
    url: "/blog",
  },
};

export default async function BlogPage() {
  const posts = await getPublishedBlogPosts();
  return (
    <section className="bg-brand-surface py-12 sm:py-16">
      <Container>
        <p className="text-brand-cyan text-sm font-bold">المعرفة المهنية</p>
        <h1 className="text-brand-ink mt-2 text-3xl font-bold sm:text-5xl">
          مدونة ELITE WORLD
        </h1>
        <p className="mt-4 max-w-2xl leading-8 text-slate-600">
          محتوى عملي عن تجهيز المطاعم ونصائح الشراء والتشغيل.
        </p>
        {posts.length ? (
          <div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <article
                key={post.slug}
                className="border-brand-border overflow-hidden rounded-3xl border bg-white"
              >
                <div className="relative aspect-[16/9] bg-slate-100">
                  <Image
                    src={post.image}
                    alt={post.title}
                    fill
                    sizes="(max-width:768px) 100vw, 33vw"
                    className="object-cover"
                  />
                </div>
                <div className="p-5">
                  <p className="text-brand-cyan text-xs font-bold">
                    {post.category}
                  </p>
                  <h2 className="text-brand-ink mt-2 text-xl font-bold">
                    {post.title}
                  </h2>
                  <p className="mt-3 line-clamp-3 text-sm leading-7 text-slate-600">
                    {post.excerpt}
                  </p>
                  <ButtonLink
                    href={`/blog/${post.slug}`}
                    size="sm"
                    variant="outline"
                    className="mt-5"
                  >
                    قراءة المقال
                  </ButtonLink>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-9">
            <EmptyState
              title="لا توجد مقالات منشورة"
              description="ستظهر المقالات هنا بعد نشرها من لوحة الإدارة."
            />
          </div>
        )}
      </Container>
    </section>
  );
}
