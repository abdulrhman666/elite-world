import "server-only";
import { getPrismaClient } from "@/lib/prisma";
import { ADMIN_PAGE_SIZE, normalizeAdminPage } from "@/lib/admin/pagination";

const ACCOUNT_PAGE_SIZE = 10;

export async function getCheckoutCustomer(userId: string) {
  if (!process.env.DATABASE_URL) return null;
  try {
    return await getPrismaClient().user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        name: true,
        phone: true,
        city: true,
        address: true,
      },
    });
  } catch {
    return null;
  }
}

export async function getCustomerAccount(userId: string, page = 1) {
  if (!process.env.DATABASE_URL) return null;
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  try {
    const customer = await getPrismaClient().user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        companyName: true,
        phone: true,
        city: true,
        address: true,
        orders: {
          select: {
            id: true,
            number: true,
            status: true,
            trackingToken: true,
            totalAmount: true,
            paymentStatus: true,
            deliveryEstimate: true,
            trackingNumber: true,
            createdAt: true,
            items: {
              select: { productSlug: true, productName: true, quantity: true },
            },
          },
          orderBy: [{ createdAt: "desc" }, { id: "desc" }],
          skip: (safePage - 1) * ACCOUNT_PAGE_SIZE,
          take: ACCOUNT_PAGE_SIZE + 1,
        },
        wishlist: {
          select: {
            id: true,
            product: {
              select: {
                slug: true,
                nameAr: true,
                model: true,
                image: true,
                price: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 24,
        },
      },
    });
    if (!customer) return null;
    return {
      ...customer,
      orders: customer.orders.slice(0, ACCOUNT_PAGE_SIZE),
      page: safePage,
      hasNext: customer.orders.length > ACCOUNT_PAGE_SIZE,
    };
  } catch {
    return null;
  }
}

export async function getAdminCustomers(page: number | string = 1) {
  const safePage = normalizeAdminPage(page);
  if (!process.env.DATABASE_URL) {
    return { records: [], page: safePage, hasNext: false, readOnly: true };
  }
  try {
    const records = await getPrismaClient().user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        companyName: true,
        phone: true,
        city: true,
        role: true,
        createdAt: true,
        _count: { select: { orders: true } },
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
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

export async function getAdminUser(id: string) {
  if (!process.env.DATABASE_URL) return null;
  try {
    return await getPrismaClient().user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        companyName: true,
        phone: true,
        city: true,
        address: true,
        role: true,
        _count: { select: { orders: true, quotes: true, cart: true } },
      },
    });
  } catch {
    return null;
  }
}
