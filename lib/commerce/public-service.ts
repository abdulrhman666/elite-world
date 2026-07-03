import "server-only";
import { Prisma } from "@prisma/client";
import {
  generateReferenceNumber,
  generateTrackingToken,
  type RequestedQuoteItem,
} from "@/lib/commerce/domain";
import {
  deliveryEstimateForCity,
  getDeliveryEstimates,
} from "@/lib/commerce/shipping";
import { initializeOrderPayment } from "@/lib/payments/payment.service";
import { getPrismaClient } from "@/lib/prisma";

export type QuoteCustomerInput = {
  userId?: string | null;
  customerName: string;
  phone: string;
  city: string;
  customerNotes: string | null;
};

export function commerceConfigurationIssue() {
  if (!process.env.DATABASE_URL) {
    return "خدمة عروض الأسعار غير متاحة حالياً. يجب تفعيل PostgreSQL أولاً.";
  }
  return null;
}

export async function getQuoteServiceAvailability() {
  const issue = commerceConfigurationIssue();
  if (issue) return { available: false as const, message: issue };
  try {
    await getPrismaClient().quote.count();
    return { available: true as const, message: null };
  } catch {
    return {
      available: false as const,
      message:
        "خدمة عروض الأسعار غير متاحة حتى تطبيق Migration المرحلة التاسعة.",
    };
  }
}

export async function getCheckoutServiceAvailability() {
  const issue = commerceConfigurationIssue();
  if (issue) return { available: false as const, message: issue };
  try {
    await Promise.all([
      getPrismaClient().order.count(),
      getPrismaClient().payment.count(),
    ]);
    return { available: true as const, message: null };
  } catch {
    return {
      available: false as const,
      message: "خدمة إكمال الطلب غير متاحة حتى تطبيق Migrations التجارة.",
    };
  }
}

function isUniqueConstraintError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  );
}

export async function createQuoteRequest(
  customer: QuoteCustomerInput,
  requestedItems: RequestedQuoteItem[],
) {
  if (commerceConfigurationIssue()) throw new Error("SERVICE_UNAVAILABLE");
  const products = await getPrismaClient().product.findMany({
    where: { slug: { in: requestedItems.map((item) => item.slug) } },
    select: {
      id: true,
      slug: true,
      nameAr: true,
      sku: true,
      model: true,
      price: true,
    },
  });
  if (products.length !== requestedItems.length) {
    throw new Error("PRODUCT_NOT_FOUND");
  }
  const quantities = new Map(
    requestedItems.map((item) => [item.slug, item.quantity]),
  );
  const items = products.map((product) => ({
    productId: product.id,
    productSlug: product.slug,
    productName: product.nameAr,
    sku: product.sku,
    model: product.model,
    quantity: quantities.get(product.slug) ?? 1,
    unitPrice: product.price,
  }));

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await getPrismaClient().quote.create({
        data: {
          number: generateReferenceNumber("Q"),
          trackingToken: generateTrackingToken(),
          ...customer,
          items: { create: items },
        },
      });
    } catch (error) {
      if (!isUniqueConstraintError(error) || attempt === 2) throw error;
    }
  }
  throw new Error("REFERENCE_GENERATION_FAILED");
}

export async function createDirectOrder(
  customer: QuoteCustomerInput,
  requestedItems: RequestedQuoteItem[],
) {
  if (commerceConfigurationIssue()) throw new Error("SERVICE_UNAVAILABLE");
  if (!customer.userId) throw new Error("DIRECT_ORDER_ACCOUNT_REQUIRED");
  const prisma = getPrismaClient();
  const deliveryEstimate = deliveryEstimateForCity(
    customer.city,
    await getDeliveryEstimates(),
  );
  const quantities = new Map(
    requestedItems.map((item) => [item.slug, item.quantity]),
  );

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const trackingToken = generateTrackingToken();
    try {
      const order = await prisma.$transaction(async (transaction) => {
        const products = await transaction.product.findMany({
          where: { slug: { in: requestedItems.map((item) => item.slug) } },
          select: {
            id: true,
            slug: true,
            nameAr: true,
            sku: true,
            model: true,
            price: true,
            stockQuantity: true,
          },
        });
        if (products.length !== requestedItems.length) {
          throw new Error("PRODUCT_NOT_FOUND");
        }
        if (products.some((product) => product.price === null)) {
          throw new Error("DIRECT_ORDER_REQUIRES_PRICES");
        }

        const items = products.map((product) => ({
          productId: product.id,
          productSlug: product.slug,
          productName: product.nameAr,
          sku: product.sku,
          model: product.model,
          quantity: quantities.get(product.slug) ?? 1,
          unitPrice: product.price!,
        }));
        const totalAmount = items.reduce(
          (total, item) =>
            total.plus(item.unitPrice.mul(new Prisma.Decimal(item.quantity))),
          new Prisma.Decimal(0),
        );

        for (const product of products) {
          const quantity = quantities.get(product.slug) ?? 1;
          const result = await transaction.product.updateMany({
            where: { id: product.id, stockQuantity: { gte: quantity } },
            data: { stockQuantity: { decrement: quantity } },
          });
          if (result.count !== 1) throw new Error("INSUFFICIENT_STOCK");
          await transaction.product.updateMany({
            where: { id: product.id, stockQuantity: 0 },
            data: { availability: "ON_REQUEST" },
          });
        }

        const internalQuote = await transaction.quote.create({
          data: {
            number: generateReferenceNumber("D"),
            trackingToken,
            status: "RESPONDED",
            ...customer,
            items: { create: items },
          },
        });
        const createdOrder = await transaction.order.create({
          data: {
            number: generateReferenceNumber("O"),
            trackingToken,
            quoteId: internalQuote.id,
            totalAmount,
            deliveryEstimate,
            ...customer,
            items: { create: items },
            statusHistory: { create: { status: "NEW" } },
          },
        });
        await transaction.cart.deleteMany({
          where: { userId: customer.userId! },
        });
        return createdOrder;
      });
      await initializeOrderPayment(order.id);
      return order;
    } catch (error) {
      if (!isUniqueConstraintError(error) || attempt === 2) throw error;
    }
  }
  throw new Error("REFERENCE_GENERATION_FAILED");
}

const publicItemSelect = {
  productSlug: true,
  productName: true,
  sku: true,
  model: true,
  quantity: true,
} as const;

export async function getTrackingRecord(token: string) {
  if (commerceConfigurationIssue()) return { unavailable: true as const };
  if (!/^[A-Za-z0-9_-]{40,80}$/.test(token)) return null;
  try {
    const order = await getPrismaClient().order.findUnique({
      where: { trackingToken: token },
      select: {
        number: true,
        status: true,
        totalAmount: true,
        paidAmount: true,
        paymentStatus: true,
        deliveryEstimate: true,
        shippingCarrier: true,
        trackingNumber: true,
        customerNotes: true,
        items: { select: publicItemSelect },
        invoice: { select: { invoiceNumber: true } },
        statusHistory: {
          select: { status: true, createdAt: true },
          orderBy: { createdAt: "asc" },
        },
      },
    });
    if (order) {
      return { unavailable: false as const, type: "order" as const, ...order };
    }
    const quote = await getPrismaClient().quote.findUnique({
      where: { trackingToken: token },
      select: {
        number: true,
        status: true,
        customerNotes: true,
        items: { select: publicItemSelect },
      },
    });
    return quote
      ? { unavailable: false as const, type: "quote" as const, ...quote }
      : null;
  } catch {
    return { unavailable: true as const };
  }
}

export async function getTrackedInvoice(token: string) {
  if (commerceConfigurationIssue()) return null;
  if (!/^[A-Za-z0-9_-]{40,80}$/.test(token)) return null;
  try {
    return await getPrismaClient().invoice.findFirst({
      where: { order: { trackingToken: token } },
      select: { filePath: true, originalName: true, mimeType: true },
    });
  } catch {
    return null;
  }
}
