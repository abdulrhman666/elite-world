import "server-only";
import { cache } from "react";
import { ADMIN_PAGE_SIZE, normalizeAdminPage } from "@/lib/admin/pagination";
import { getPrismaClient } from "@/lib/prisma";

export type BlogPostInput = {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  image: string;
  published: boolean;
  seoTitle: string | null;
  seoDescription: string | null;
};

export const getPublishedBlogPosts = cache(async () => {
  if (!process.env.DATABASE_URL) return [];
  try {
    return await getPrismaClient().blogPost.findMany({
      where: { published: true },
      select: {
        slug: true,
        title: true,
        excerpt: true,
        category: true,
        image: true,
        createdAt: true,
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: 24,
    });
  } catch {
    return [];
  }
});

export const getPublishedBlogPost = cache(async (slug: string) => {
  if (!process.env.DATABASE_URL) return null;
  try {
    return await getPrismaClient().blogPost.findFirst({
      where: { slug, published: true },
      select: {
        slug: true,
        title: true,
        excerpt: true,
        content: true,
        category: true,
        image: true,
        seoTitle: true,
        seoDescription: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  } catch {
    return null;
  }
});

export async function getAdminBlogPosts(page: number | string = 1) {
  const safePage = normalizeAdminPage(page);
  if (!process.env.DATABASE_URL) {
    return { records: [], page: safePage, hasNext: false, readOnly: true };
  }
  try {
    const records = await getPrismaClient().blogPost.findMany({
      select: {
        id: true,
        slug: true,
        title: true,
        category: true,
        published: true,
        updatedAt: true,
      },
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
      skip: (safePage - 1) * ADMIN_PAGE_SIZE,
      take: ADMIN_PAGE_SIZE + 1,
    });
    return {
      records: records.slice(0, ADMIN_PAGE_SIZE),
      page: safePage,
      hasNext: records.length > ADMIN_PAGE_SIZE,
      readOnly: false,
    };
  } catch {
    return { records: [], page: safePage, hasNext: false, readOnly: true };
  }
}

export async function getAdminBlogPost(id: string) {
  if (!process.env.DATABASE_URL) return null;
  return getPrismaClient().blogPost.findUnique({ where: { id } });
}

export function createBlogPost(input: BlogPostInput) {
  return getPrismaClient().blogPost.create({ data: input });
}

export function updateBlogPost(id: string, input: BlogPostInput) {
  return getPrismaClient().blogPost.update({ where: { id }, data: input });
}

export function deleteBlogPost(id: string) {
  return getPrismaClient().blogPost.delete({ where: { id } });
}
