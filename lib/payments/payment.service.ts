import "server-only";
import { Prisma, type PaymentStatus } from "@prisma/client";
import type {
  PaymentProviderStatus,
  PaymentWebhookEvent,
} from "@/lib/payments/providers/IPaymentProvider";
import { getPaymentProvider } from "@/lib/payments/providers/provider.factory";
import { getPrismaClient } from "@/lib/prisma";

const zeroAmount = new Prisma.Decimal(0);

export class PaymentServiceError extends Error {
  constructor(
    readonly code: string,
    message = code,
  ) {
    super(message);
    this.name = "PaymentServiceError";
  }
}

function paymentError(code: string) {
  return new PaymentServiceError(code);
}

function logPaymentEvent(event: string, details: Record<string, unknown> = {}) {
  console.info("[payments]", event, details);
}

function providerStatusToPaymentStatus(
  status: PaymentProviderStatus,
): PaymentStatus {
  return status;
}

function resolveOrderPaymentStatus({
  totalAmount,
  paidAmount,
}: {
  totalAmount: Prisma.Decimal;
  paidAmount: Prisma.Decimal;
}) {
  if (paidAmount.lte(zeroAmount)) return "UNPAID" as const;
  if (totalAmount.gt(zeroAmount) && paidAmount.gte(totalAmount)) {
    return "PAID" as const;
  }
  return "PARTIALLY_PAID" as const;
}

function resolveOrderStatus(status: PaymentStatus) {
  if (status === "PENDING") return "PENDING_PAYMENT" as const;
  if (status === "PAID") return "CONFIRMED" as const;
  if (status === "FAILED" || status === "CANCELLED")
    return "CANCELLED" as const;
  return "NEW" as const;
}

function jsonObject(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : {};
}

async function syncOrderAfterPayment(orderId: string, status: PaymentStatus) {
  const prisma = getPrismaClient();
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, totalAmount: true, status: true },
  });
  if (!order) throw paymentError("ORDER_NOT_FOUND");

  const paid = await prisma.payment.aggregate({
    where: { orderId, status: "PAID" },
    _sum: { amount: true },
  });
  const paidAmount = paid._sum.amount ?? zeroAmount;
  const nextStatus = resolveOrderStatus(status);
  return prisma.$transaction(async (transaction) => {
    const updated = await transaction.order.update({
      where: { id: orderId },
      data: {
        status: nextStatus,
        paidAmount,
        paymentStatus: resolveOrderPaymentStatus({
          totalAmount: order.totalAmount,
          paidAmount,
        }),
      },
    });
    if (order.status !== nextStatus) {
      await transaction.orderStatusHistory.create({
        data: { orderId, status: nextStatus },
      });
    }
    return updated;
  });
}

async function resolveProvider(providerName?: string) {
  try {
    return await getPaymentProvider(providerName);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "PAYMENT_PROVIDER_NOT_CONFIGURED"
    ) {
      throw paymentError("PAYMENT_PROVIDER_NOT_CONFIGURED");
    }
    throw error;
  }
}

export async function createPayment(orderId: string, providerName?: string) {
  const prisma = getPrismaClient();
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      number: true,
      totalAmount: true,
      paidAmount: true,
      payment: true,
    },
  });
  if (!order) throw paymentError("ORDER_NOT_FOUND");
  if (order.payment) return order.payment;
  if (order.totalAmount.lte(zeroAmount))
    throw paymentError("ORDER_TOTAL_REQUIRED");

  const amount = order.totalAmount.minus(order.paidAmount);
  if (amount.lte(zeroAmount)) throw paymentError("ORDER_ALREADY_PAID");

  const provider = await resolveProvider(providerName);
  const providerResult = await provider.createPayment({
    orderId,
    amount,
    currency: "SAR",
    metadata: { orderId, orderNumber: order.number },
  });

  const payment = await prisma.payment.create({
    data: {
      orderId,
      amount,
      currency: "SAR",
      status: providerStatusToPaymentStatus(providerResult.status),
      provider: provider.name,
      providerRef: providerResult.transactionId,
      method: providerResult.method ?? null,
      metadata: (providerResult.metadata ?? {}) as Prisma.InputJsonValue,
    },
  });

  await syncOrderAfterPayment(orderId, payment.status);
  logPaymentEvent("payment.created", {
    paymentId: payment.id,
    orderId,
    provider: payment.provider,
    status: payment.status,
  });
  return payment;
}

export async function initializeOrderPayment(orderId: string) {
  try {
    return await createPayment(orderId);
  } catch (error) {
    logPaymentEvent("payment.initialization_skipped", {
      orderId,
      reason:
        error instanceof PaymentServiceError
          ? error.code
          : "PROVIDER_REQUEST_FAILED",
    });
    return null;
  }
}

export async function processPayment(orderId: string) {
  const prisma = getPrismaClient();
  const payment = await prisma.payment.findUnique({
    where: { orderId },
  });
  if (!payment) throw paymentError("PAYMENT_NOT_FOUND");

  const provider = await resolveProvider(payment.provider);
  const result = await provider.verifyPayment({
    paymentId: payment.id,
    orderId,
    providerRef: payment.providerRef,
    metadata: jsonObject(payment.metadata),
  });

  const nextMetadata = result.metadata ?? payment.metadata ?? {};
  const updated = await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: providerStatusToPaymentStatus(result.status),
      providerRef: result.providerRef ?? payment.providerRef,
      method: result.method ?? payment.method,
      metadata: nextMetadata as Prisma.InputJsonValue,
    },
  });

  await syncOrderAfterPayment(orderId, updated.status);
  logPaymentEvent("payment.verified", {
    paymentId: updated.id,
    orderId,
    provider: updated.provider,
    status: updated.status,
  });
  return updated;
}

export async function updateStatus(
  paymentId: string,
  status: PaymentProviderStatus,
) {
  const prisma = getPrismaClient();
  const payment = await prisma.payment.update({
    where: { id: paymentId },
    data: { status: providerStatusToPaymentStatus(status) },
  });
  await syncOrderAfterPayment(payment.orderId, payment.status);
  logPaymentEvent("payment.status_updated", {
    paymentId,
    orderId: payment.orderId,
    status: payment.status,
  });
  return payment;
}

export async function recordManualPayment({
  orderId,
  amount,
  method,
  attachmentUrl,
}: {
  orderId: string;
  amount: Prisma.Decimal;
  method: string;
  attachmentUrl: string | null;
}) {
  const prisma = getPrismaClient();
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, totalAmount: true, paidAmount: true, payment: true },
  });
  if (!order) throw paymentError("ORDER_NOT_FOUND");
  if (amount.lte(zeroAmount)) throw paymentError("INVALID_AMOUNT");
  if (order.totalAmount.lte(zeroAmount))
    throw paymentError("ORDER_TOTAL_REQUIRED");
  if (amount.gt(order.totalAmount.minus(order.paidAmount))) {
    throw paymentError("PAYMENT_EXCEEDS_TOTAL");
  }

  const payment = order.payment
    ? await prisma.payment.update({
        where: { id: order.payment.id },
        data: {
          amount,
          currency: "SAR",
          status: "PAID",
          provider: "manual",
          providerRef: null,
          method,
          attachmentUrl,
          metadata: { source: "admin-manual-payment" },
        },
      })
    : await prisma.payment.create({
        data: {
          orderId,
          amount,
          currency: "SAR",
          status: "PAID",
          provider: "manual",
          providerRef: null,
          method,
          attachmentUrl,
          metadata: { source: "admin-manual-payment" },
        },
      });

  await syncOrderAfterPayment(orderId, payment.status);
  logPaymentEvent("payment.manual_recorded", {
    paymentId: payment.id,
    orderId,
    amount: amount.toString(),
  });
  return payment;
}

async function findPaymentForWebhook(
  event: PaymentWebhookEvent,
  providerName: string,
) {
  const prisma = getPrismaClient();
  if (event.paymentId) {
    const byId = await prisma.payment.findUnique({
      where: { id: event.paymentId, provider: providerName },
    });
    if (byId) return byId;
  }
  if (event.providerRef) {
    const byProviderRef = await prisma.payment.findFirst({
      where: { provider: providerName, providerRef: event.providerRef },
    });
    if (byProviderRef) return byProviderRef;
  }
  if (event.orderId) {
    const byOrder = await prisma.payment.findUnique({
      where: { orderId: event.orderId, provider: providerName },
    });
    if (byOrder) return byOrder;
  }
  return null;
}

export async function handlePaymentWebhook({
  providerName,
  payload,
  headers,
}: {
  providerName: string;
  payload: unknown;
  headers: Headers;
}) {
  const provider = await resolveProvider(providerName);
  if (!provider.parseWebhookEvent) {
    throw paymentError("WEBHOOK_NOT_SUPPORTED");
  }

  const event = await provider.parseWebhookEvent(payload, headers);
  const prisma = getPrismaClient();
  const existingEvent = await prisma.payment.findFirst({
    where: { provider: provider.name, webhookEventId: event.eventId },
  });
  if (existingEvent) {
    logPaymentEvent("webhook.duplicate", {
      paymentId: existingEvent.id,
      provider: provider.name,
      eventId: event.eventId,
    });
    return { duplicate: true, payment: existingEvent };
  }

  const payment = await findPaymentForWebhook(event, provider.name);
  if (!payment) throw paymentError("PAYMENT_NOT_FOUND");

  const updated = await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: providerStatusToPaymentStatus(event.status),
      providerRef: event.providerRef ?? payment.providerRef,
      method: event.method ?? payment.method,
      webhookEventId: event.eventId,
      webhookReceivedAt: new Date(),
      metadata: {
        ...jsonObject(payment.metadata),
        ...(event.metadata ?? {}),
      } as Prisma.InputJsonValue,
    },
  });

  await syncOrderAfterPayment(payment.orderId, updated.status);
  logPaymentEvent("webhook.processed", {
    paymentId: updated.id,
    provider: provider.name,
    eventId: event.eventId,
    status: updated.status,
  });
  return { duplicate: false, payment: updated };
}
