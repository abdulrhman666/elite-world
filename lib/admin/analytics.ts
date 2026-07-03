import "server-only";
import { Prisma } from "@prisma/client";
import { unstable_cache } from "next/cache";
import { getPrismaClient } from "@/lib/prisma";

async function readAdminAnalytics() {
  const empty = {
    totalOrders: 0,
    revenue: 0,
    topProducts: [] as Array<{ name: string; quantity: number }>,
    topCategories: [] as Array<{ name: string; quantity: number }>,
    dailyOrders: [] as Array<{ date: string; count: number }>,
  };
  if (!process.env.DATABASE_URL) return empty;
  try {
    const since = new Date();
    since.setDate(since.getDate() - 13);
    since.setHours(0, 0, 0, 0);
    const prisma = getPrismaClient();
    const [orders, dailyRows, topProducts, topCategories] = await Promise.all([
      prisma.order.aggregate({
        _count: { _all: true },
        _sum: { paidAmount: true },
      }),
      prisma.$queryRaw<Array<{ date: string; count: number }>>(Prisma.sql`
          SELECT TO_CHAR(DATE_TRUNC('day', "createdAt"), 'YYYY-MM-DD') AS date,
                 COUNT(*)::int AS count
          FROM "Order"
          WHERE "createdAt" >= ${since}
          GROUP BY DATE_TRUNC('day', "createdAt")
          ORDER BY DATE_TRUNC('day', "createdAt") ASC
        `),
      prisma.orderItem.groupBy({
        by: ["productSlug", "productName"],
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: "desc" } },
        take: 5,
      }),
      prisma.$queryRaw<Array<{ name: string; quantity: number }>>(Prisma.sql`
          SELECT category.name AS name, SUM(item.quantity)::int AS quantity
          FROM "OrderItem" AS item
          INNER JOIN "Product" AS product ON product.id = item."productId"
          INNER JOIN "Category" AS category ON category.id = product."categoryId"
          GROUP BY category.id, category.name
          ORDER BY quantity DESC
          LIMIT 5
        `),
    ]);

    const daily = new Map<string, number>();
    for (let offset = 0; offset < 14; offset += 1) {
      const date = new Date(since);
      date.setDate(since.getDate() + offset);
      daily.set(date.toISOString().slice(0, 10), 0);
    }
    dailyRows.forEach((row) => {
      daily.set(row.date, row.count);
    });

    return {
      totalOrders: orders._count._all,
      revenue: Number(orders._sum.paidAmount ?? 0),
      topProducts: topProducts.map((item) => ({
        name: item.productName,
        quantity: item._sum.quantity ?? 0,
      })),
      topCategories,
      dailyOrders: [...daily].map(([date, count]) => ({ date, count })),
    };
  } catch {
    return empty;
  }
}

export const getAdminAnalytics = unstable_cache(
  readAdminAnalytics,
  ["admin-analytics-v2"],
  { revalidate: 20 },
);
