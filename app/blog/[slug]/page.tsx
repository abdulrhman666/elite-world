import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/seo/json-ld";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Container } from "@/components/ui/container";
import { getPublishedBlogPost } from "@/lib/blog/service";
import { absoluteSiteUrl } from "@/lib/seo/metadata";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getPublishedBlogPost((await params).slug);
  if (!post) return {};
  return {
    title: post.seoTitle ?? post.title,
    description: post.seoDescription ?? post.excerpt,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: [post.image],
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const post = await getPublishedBlogPost((await params).slug);
  if (!post) notFound();
  return (
    <article className="bg-brand-surface py-10 sm:py-14">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: post.title,
          description: post.excerpt,
          image: absoluteSiteUrl(post.image),
          datePublished: post.createdAt.toISOString(),
          dateModified: post.updatedAt.toISOString(),
          mainEntityOfPage: absoluteSiteUrl(`/blog/${post.slug}`),
        }}
      />
      <Container>
        <Breadcrumb
          current={post.title}
          items={[{ label: "المدونة", href: "/blog" }]}
        />
        <div className="mx-auto mt-8 max-w-4xl">
          <p className="text-brand-cyan text-sm font-bold">{post.category}</p>
          <h1 className="text-brand-ink mt-3 text-3xl leading-tight font-bold sm:text-5xl">
            {post.title}
          </h1>
          <p className="mt-5 text-lg leading-9 text-slate-600">
            {post.excerpt}
          </p>
          <div className="border-brand-border relative mt-8 aspect-[16/9] overflow-hidden rounded-3xl border bg-white">
            <Image
              src={post.image}
              alt={post.title}
              fill
              priority
              sizes="(max-width:1024px) 100vw, 900px"
              className="object-cover"
            />
          </div>
          <div className="mt-9 rounded-3xl bg-white p-6 text-base leading-9 whitespace-pre-line text-slate-700 sm:p-9">
            {post.content}
          </div>
        </div>
      </Container>
    </article>
  );
}
