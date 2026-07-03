import "server-only";
import { Prisma } from "@prisma/client";
import { unstable_cache } from "next/cache";
import {
  assertQuoteConvertible,
  generateReferenceNumber,
} from "@/lib/commerce/domain";
import type {
  OrderStatusValue,
  PaymentMethodValue,
  QuoteStatusValue,
} from "@/lib/commerce/status";
import { commerceConfigurationIssue } from "@/lib/commerce/public-service";
import {
  deliveryEstimateForCity,
  getDeliveryEstimates,
} from "@/lib/commerce/shipping";
import { ADMIN_PAGE_SIZE, normalizeAdminPage } from "@/lib/admin/pagination";
import { recordManualPayment } from "@/lib/payments/payment.service";
import { getPrismaClient } from "@/lib/prisma";
import { getStorageAdapter } from "@/lib/storage";

const unavailableMessage =
  "عروض الأسعار والطلبات للقراءة فقط حتى ربط قاعدة بيانات الموقع.";

function configured() {
  return !commerceConfigurationIssue();
}

export async function getAdminQuotes(query = "", page: number | string = 1) {
  const safePage = normalizeAdminPage(page);
  if (!configured()) {
    return {
      records: [],
      page: safePage,
      hasNext: false,
      readOnly: true,
      message: unavailableMessage,
    };
  }
  try {
    const visibleQuoteFilter: Prisma.QuoteWhereInput = {
      number: { startsWith: "Q-" },
    };
    const where: Prisma.QuoteWhereInput = query
      ? {
          AND: [
            visibleQuoteFilter,
            {
              OR: [
                { number: { contains: query, mode: "insensitive" } },
                { customerName: { contains: query, mode: "insensitive" } },
                { phone: { contains: query } },
              ],
            },
          ],
        }
      : visibleQuoteFilter;
    const records = await getPrismaClient().quote.findMany({
      where,
      select: {
        id: true,
        number: true,
        status: true,
        customerName: true,
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
      message: null,
    };
  } catch {
    return {
      records: [],
      page: safePage,
      hasNext: false,
      readOnly: true,
      message: unavailableMessage,
    };
  }
}

export async function getAdminQuote(id: string) {
  if (!configured()) {
    return { record: null, readOnly: true, message: unavailableMessage };
  }
  try {
    const record = await getPrismaClient().quote.findUnique({
      where: { id },
      select: {
        number: true,
        status: true,
        customerName: true,
        phone: true,
        city: true,
        customerNotes: true,
        items: {
          select: { id: true, productName: true, sku: true, quantity: true },
          orderBy: { productName: "asc" },
        },
        order: { select: { id: true, number: true } },
      },
    });
    return { record, readOnly: false, message: null };
  } catch {
    return { record: null, readOnly: true, message: unavailableMessage };
  }
}

export async function updateAdminQuote(id: string, status: QuoteStatusValue) {
  if (!configured()) throw new Error("READ_ONLY");
  return getPrismaClient().quote.update({ where: { id }, data: { status } });
}

function uniqueError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  );
}

const zeroAmount = new Prisma.Decimal(0);

export async function convertQuoteToOrder(quoteId: string) {
  if (!configured()) throw new Error("READ_ONLY");
  const prisma = getPrismaClient();
  const deliveryEstimates = await getDeliveryEstimates();

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await prisma.$transaction(async (transaction) => {
        const quote = await transaction.quote.findUnique({
          where: { id: quoteId },
          include: { items: true, order: { select: { id: true } } },
        });
        if (!quote) throw new Error("QUOTE_NOT_FOUND");
        assertQuoteConvertible({ hasOrder: Boolean(quote.order) });

        for (const item of quote.items) {
          if (!item.productId) throw new Error("INSUFFICIENT_STOCK");
          const result = await transaction.product.updateMany({
            where: {
              id: item.productId,
              stockQuantity: { gte: item.quantity },
            },
            data: { stockQuantity: { decrement: item.quantity } },
          });
          if (result.count !== 1) throw new Error("INSUFFICIENT_STOCK");
          await transaction.product.updateMany({
            where: { id: item.productId, stockQuantity: 0 },
            data: { availability: "ON_REQUEST" },
          });
        }

        return transaction.order.create({
          data: {
            number: generateReferenceNumber("O"),
            trackingToken: quote.trackingToken,
            quoteId: quote.id,
            userId: quote.userId,
            customerName: quote.customerName,
            phone: quote.phone,
            city: quote.city,
            deliveryEstimate: deliveryEstimateForCity(
              quote.city,
              deliveryEstimates,
            ),
            customerNotes: quote.customerNotes,
            items: {
              create: quote.items.map((item) => ({
                productId: item.productId,
                productSlug: item.productSlug,
                productName: item.productName,
                sku: item.sku,
                model: item.model,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
              })),
            },
            statusHistory: { create: { status: "NEW" } },
          },
        });
      });
    } catch (error) {
      if (uniqueError(error)) {
        const existing = await prisma.order.findUnique({
          where: { quoteId },
          select: { id: true },
        });
        if (existing) throw new Error("ALREADY_CONVERTED");
        if (attempt < 2) continue;
      }
      throw error;
    }
  }
  throw new Error("REFERENCE_GENERATION_FAILED");
}

export async function getAdminOrders(query = "", page: number | string = 1) {
  const safePage = normalizeAdminPage(page);
  if (!configured()) {
    return {
      records: [],
      page: safePage,
      hasNext: false,
      readOnly: true,
      message: unavailableMessage,
    };
  }
  try {
    const where: Prisma.OrderWhereInput = query
      ? {
          OR: [
            { number: { contains: query, mode: "insensitive" } },
            { customerName: { contains: query, mode: "insensitive" } },
          ],
        }
      : {};
    const records = await getPrismaClient().order.findMany({
      where,
      select: {
        id: true,
        number: true,
        status: true,
        customerName: true,
        deliveryEstimate: true,
        trackingNumber: true,
        quote: { select: { number: true } },
        payment: {
          select: {
            amount: true,
            provider: true,
            providerRef: true,
            status: true,
            webhookReceivedAt: true,
          },
        },
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: (safePage - 1) * ADMIN_PAGE_SIZE,
      take: ADMIN_PAGE_SIZE + 1,
    });
    const hasNext = records.length > ADMIN_PAGE_SIZE;
    return {
      records: records
        .slice(0, ADMIN_PAGE_SIZE)
        .map(({ quote, ...record }) => ({
          ...record,
          source: quote.number.startsWith("D-") ? "DIRECT" : "QUOTE",
        })),
      page: safePage,
      hasNext,
      readOnly: false,
      message: null,
    };
  } catch {
    return {
      records: [],
      page: safePage,
      hasNext: false,
      readOnly: true,
      message: unavailableMessage,
    };
  }
}

export async function getAdminOrder(id: string) {
  if (!configured()) {
    return { record: null, readOnly: true, message: unavailableMessage };
  }
  try {
    const record = await getPrismaClient().order.findUnique({
      where: { id },
      select: {
        number: true,
        status: true,
        customerName: true,
        phone: true,
        city: true,
        customerNotes: true,
        totalAmount: true,
        paidAmount: true,
        paymentStatus: true,
        deliveryEstimate: true,
        shippingCarrier: true,
        trackingNumber: true,
        items: {
          select: { id: true, productName: true, model: true, quantity: true },
          orderBy: { productName: "asc" },
        },
        quote: { select: { number: true } },
        user: { select: { email: true } },
        invoice: {
          select: {
            invoiceNumber: true,
            filePath: true,
            originalName: true,
          },
        },
        payment: {
          select: {
            id: true,
            amount: true,
            provider: true,
            providerRef: true,
            method: true,
            status: true,
            webhookReceivedAt: true,
            createdAt: true,
            attachmentUrl: true,
          },
        },
        statusHistory: {
          select: { id: true, status: true, note: true, createdAt: true },
          orderBy: { createdAt: "asc" },
        },
      },
    });
    return { record, readOnly: false, message: null };
  } catch {
    return { record: null, readOnly: true, message: unavailableMessage };
  }
}

export async function updateAdminOrder(
  id: string,
  status: OrderStatusValue,
  note: string | null,
) {
  if (!configured()) throw new Error("READ_ONLY");
  return getPrismaClient().$transaction(async (transaction) => {
    const current = await transaction.order.findUnique({
      where: { id },
      select: { status: true },
    });
    if (!current) throw new Error("ORDER_NOT_FOUND");
    const order = await transaction.order.update({
      where: { id },
      data: { status },
    });
    if (current.status !== status || note) {
      await transaction.orderStatusHistory.create({
        data: { orderId: id, status, note },
      });
    }
    return order;
  });
}

export async function updateOrderShipping({
  orderId,
  shippingCarrier,
  trackingNumber,
  deliveryEstimate,
}: {
  orderId: string;
  shippingCarrier: string | null;
  trackingNumber: string | null;
  deliveryEstimate: string;
}) {
  if (!configured()) throw new Error("READ_ONLY");
  const order = await getPrismaClient().order.update({
    where: { id: orderId },
    data: { shippingCarrier, trackingNumber, deliveryEstimate },
  });
  return order;
}

export async function updateOrderTotalAmount({
  orderId,
  totalAmount,
}: {
  orderId: string;
  totalAmount: Prisma.Decimal;
}) {
  if (!configured()) throw new Error("READ_ONLY");
  if (totalAmount.lt(zeroAmount)) throw new Error("INVALID_AMOUNT");
  const order = await getPrismaClient().order.findUnique({
    where: { id: orderId },
    select: { id: true, paidAmount: true },
  });
  if (!order) throw new Error("ORDER_NOT_FOUND");
  if (totalAmount.lt(order.paidAmount)) throw new Error("TOTAL_LESS_THAN_PAID");
  return getPrismaClient().order.update({
    where: { id: orderId },
    data: {
      totalAmount,
      paymentStatus: order.paidAmount.lte(zeroAmount)
        ? "UNPAID"
        : order.paidAmount.gte(totalAmount)
          ? "PAID"
          : "PARTIALLY_PAID",
    },
  });
}

export async function addOrderPayment({
  orderId,
  amount,
  method,
  attachment,
}: {
  orderId: string;
  amount: Prisma.Decimal;
  method: PaymentMethodValue;
  attachment: File | null;
}) {
  if (!configured()) throw new Error("READ_ONLY");
  if (amount.lte(zeroAmount)) throw new Error("INVALID_AMOUNT");
  const prisma = getPrismaClient();
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, totalAmount: true, paidAmount: true },
  });
  if (!order) throw new Error("ORDER_NOT_FOUND");
  if (order.totalAmount.lte(zeroAmount))
    throw new Error("ORDER_TOTAL_REQUIRED");
  if (amount.gt(order.totalAmount.minus(order.paidAmount))) {
    throw new Error("PAYMENT_EXCEEDS_TOTAL");
  }

  const storage = getStorageAdapter();
  const stored = attachment
    ? await storage.savePaymentAttachment(attachment)
    : null;
  try {
    const payment = await recordManualPayment({
      orderId,
      amount,
      method,
      attachmentUrl: stored?.path ?? null,
    });
    return prisma.order.findUniqueOrThrow({ where: { id: payment.orderId } });
  } catch (error) {
    if (stored) await storage.deleteFile(stored.path).catch(() => undefined);
    throw error;
  }
}

export async function saveOrderInvoice({
  orderId,
  file,
  invoiceNumber,
}: {
  orderId: string;
  file: File;
  invoiceNumber: string;
}) {
  if (!configured()) throw new Error("READ_ONLY");
  const existing = await getPrismaClient().invoice.findUnique({
    where: { orderId },
  });
  const storage = getStorageAdapter();
  const stored = await storage.saveDocument(file);
  let invoice;
  try {
    invoice = await getPrismaClient().invoice.upsert({
      where: { orderId },
      create: {
        orderId,
        invoiceNumber,
        filePath: stored.path,
        originalName: stored.originalName,
        mimeType: stored.mimeType,
        sizeBytes: stored.sizeBytes,
      },
      update: {
        invoiceNumber,
        filePath: stored.path,
        originalName: stored.originalName,
        mimeType: stored.mimeType,
        sizeBytes: stored.sizeBytes,
      },
    });
  } catch (error) {
    await storage.deleteFile(stored.path);
    throw error;
  }
  if (existing?.filePath && existing.filePath !== stored.path) {
    await storage.deleteFile(existing.filePath).catch(() => undefined);
  }
  return invoice;
}

async function readAdminCommerceStats() {
  if (!configured()) return { newQuotes: 0, activeOrders: 0, delivered: 0 };
  try {
    const [newQuotes, orderCounts] = await Promise.all([
      getPrismaClient().quote.count({ where: { status: "NEW" } }),
      getPrismaClient().order.groupBy({
        by: ["status"],
        where: {
          status: {
            in: [
              "IN_PROGRESS",
              "READY_TO_SHIP",
              "SHIPPED",
              "OUT_FOR_DELIVERY",
              "DELIVERED",
            ],
          },
        },
        _count: { _all: true },
      }),
    ]);
    const countByStatus = new Map(
      orderCounts.map((entry) => [entry.status, entry._count._all]),
    );
    const activeOrders = (
      ["IN_PROGRESS", "READY_TO_SHIP", "SHIPPED", "OUT_FOR_DELIVERY"] as const
    ).reduce((total, status) => total + (countByStatus.get(status) ?? 0), 0);
    const delivered = countByStatus.get("DELIVERED") ?? 0;
    return { newQuotes, activeOrders, delivered };
  } catch {
    return { newQuotes: 0, activeOrders: 0, delivered: 0 };
  }
}

export const getAdminCommerceStats = unstable_cache(
  readAdminCommerceStats,
  ["admin-commerce-stats"],
  { revalidate: 20 },
);
