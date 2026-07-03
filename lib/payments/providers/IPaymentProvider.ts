import type { Prisma } from "@prisma/client";

export type PaymentProviderStatus = "PENDING" | "PAID" | "FAILED" | "CANCELLED";

export type CreatePaymentInput = {
  orderId: string;
  amount: Prisma.Decimal;
  currency: string;
  metadata?: Record<string, unknown>;
};

export type CreatePaymentResult = {
  transactionId: string;
  status: PaymentProviderStatus;
  method?: string | null;
  metadata?: Record<string, unknown>;
};

export type VerifyPaymentInput = {
  paymentId: string;
  providerRef: string | null;
  orderId?: string;
  metadata?: Record<string, unknown>;
};

export type VerifyPaymentResult = {
  status: PaymentProviderStatus;
  providerRef?: string | null;
  method?: string | null;
  metadata?: Record<string, unknown>;
};

export type RefundPaymentInput = {
  paymentId: string;
  providerRef: string | null;
  amount: Prisma.Decimal;
  currency: string;
};

export type RefundPaymentResult = {
  status: "PENDING" | "REFUNDED" | "FAILED";
  providerRef?: string | null;
  metadata?: Record<string, unknown>;
};

export type PaymentWebhookEvent = {
  eventId: string;
  providerRef: string | null;
  status: PaymentProviderStatus;
  paymentId?: string | null;
  orderId?: string | null;
  method?: string | null;
  metadata?: Record<string, unknown>;
};

export interface IPaymentProvider {
  readonly name: string;
  createPayment(data: CreatePaymentInput): Promise<CreatePaymentResult>;
  verifyPayment(data: VerifyPaymentInput): Promise<VerifyPaymentResult>;
  refundPayment(data: RefundPaymentInput): Promise<RefundPaymentResult>;
  parseWebhookEvent?(
    payload: unknown,
    headers: Headers,
  ): Promise<PaymentWebhookEvent>;
}
