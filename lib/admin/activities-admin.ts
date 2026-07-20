import "server-only";
import { getPrismaClient } from "@/lib/prisma";

export const EQUIPMENT_GROUPS = ["الطبخ", "التبريد", "التحضير", "الستانلس", "الغسيل والتخزين"] as const;

export type AdminActivityInput = {
  slug: string;
  name: string;
  eyebrow: string;
  heroTitle: string;
  heroDescription: string;
  introduction: string;
  image: string;
  primaryCtaText: string;
  published: boolean;
  sortOrder: number;
  seoTitle: string | null;
  seoDescription: string | null;
  canonicalUrl: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
  seoImageAlt: string | null;
  products: Array<{
    productId: string;
    equipmentGroup: string;
    essential: boolean;
    sortOrder: number;
  }>;
};

export async function getAdminActivities() {
  if (!process.env.DATABASE_URL) {
    return { records: [], products: [], readOnly: true, message: "اربط قاعدة البيانات لإدارة الأنشطة." };
  }
  try {
    const [records, products] = await Promise.all([
      getPrismaClient().activity.findMany({
        include: { productLinks: { orderBy: { sortOrder: "asc" } } },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      }),
      getPrismaClient().product.findMany({
        select: { id: true, nameAr: true, sku: true, category: { select: { name: true } } },
        orderBy: [{ category: { sortOrder: "asc" } }, { sortOrder: "asc" }],
      }),
    ]);
    return { records, products, readOnly: false, message: null };
  } catch {
    return { records: [], products: [], readOnly: true, message: "تعذر قراءة الأنشطة من قاعدة البيانات." };
  }
}

export async function createAdminActivity(input: AdminActivityInput) {
  const { products, ...data } = input;
  return getPrismaClient().activity.create({
    data: {
      ...data,
      seoIndexable: true,
      productLinks: { createMany: { data: products } },
    },
  });
}

export async function updateAdminActivity(id: string, input: AdminActivityInput) {
  const { products, ...data } = input;
  return getPrismaClient().$transaction(async (prisma) => {
    await prisma.activityProduct.deleteMany({ where: { activityId: id } });
    return prisma.activity.update({
      where: { id },
      data: {
        ...data,
        seoIndexable: true,
        productLinks: { createMany: { data: products } },
      },
    });
  });
}

export async function deleteAdminActivity(id: string) {
  return getPrismaClient().activity.delete({ where: { id } });
}
