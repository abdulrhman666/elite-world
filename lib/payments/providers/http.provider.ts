import type {
  CreatePaymentInput,
  CreatePaymentResult,
  IPaymentProvider,
  PaymentProviderStatus,
  PaymentWebhookEvent,
  RefundPaymentInput,
  RefundPaymentResult,
  VerifyPaymentInput,
  VerifyPaymentResult,
} from "@/lib/payments/providers/IPaymentProvider";
import type { ActivePaymentProviderConfig } from "@/lib/payments/settings";

function objectValue(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("INVALID_PROVIDER_RESPONSE");
  }
  return value as Record<string, unknown>;
}

function optionalString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function paymentStatus(value: unknown): PaymentProviderStatus {
  const status = String(value ?? "").toUpperCase();
  if (
    status === "PENDING" ||
    status === "PAID" ||
    status === "FAILED" ||
    status === "CANCELLED"
  ) {
    return status;
  }
  throw new Error("INVALID_PROVIDER_STATUS");
}

function metadataValue(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

export class HttpPaymentProvider implements IPaymentProvider {
  readonly name: string;

  constructor(private readonly config: ActivePaymentProviderConfig) {
    this.name = config.name;
  }

  private async request(action: string, data: Record<string, unknown>) {
    const response = await fetch(this.config.endpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json",
        ...(this.config.apiKey
          ? { authorization: `Bearer ${this.config.apiKey}` }
          : {}),
        ...(this.config.secretKey
          ? { "x-payment-secret": this.config.secretKey }
          : {}),
      },
      body: JSON.stringify({ action, data }),
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) throw new Error("PAYMENT_PROVIDER_REQUEST_FAILED");
    return objectValue(await response.json());
  }

  async createPayment(data: CreatePaymentInput): Promise<CreatePaymentResult> {
    const result = await this.request("createPayment", {
      ...data,
      amount: data.amount.toString(),
    });
    const transactionId = optionalString(
      result.transactionId ?? result.providerRef ?? result.id,
    );
    if (!transactionId) throw new Error("INVALID_PROVIDER_RESPONSE");
    return {
      transactionId,
      status: paymentStatus(result.status),
      method: optionalString(result.method),
      metadata: metadataValue(result.metadata),
    };
  }

  async verifyPayment(data: VerifyPaymentInput): Promise<VerifyPaymentResult> {
    const result = await this.request("verifyPayment", { ...data });
    return {
      status: paymentStatus(result.status),
      providerRef: optionalString(result.providerRef),
      method: optionalString(result.method),
      metadata: metadataValue(result.metadata),
    };
  }

  async refundPayment(data: RefundPaymentInput): Promise<RefundPaymentResult> {
    const result = await this.request("refundPayment", {
      ...data,
      amount: data.amount.toString(),
    });
    const status = String(result.status ?? "").toUpperCase();
    if (status !== "PENDING" && status !== "REFUNDED" && status !== "FAILED") {
      throw new Error("INVALID_PROVIDER_STATUS");
    }
    return {
      status,
      providerRef: optionalString(result.providerRef),
      metadata: metadataValue(result.metadata),
    };
  }

  async parseWebhookEvent(
    payload: unknown,
    headers: Headers,
  ): Promise<PaymentWebhookEvent> {
    const forwardedHeaders = Object.fromEntries(
      [...headers.entries()].filter(
        ([name]) =>
          !["authorization", "cookie", "host", "content-length"].includes(
            name.toLowerCase(),
          ),
      ),
    );
    const result = await this.request("verifyWebhook", {
      payload,
      headers: forwardedHeaders,
    });
    const eventId = optionalString(result.eventId);
    if (!eventId) throw new Error("INVALID_WEBHOOK_EVENT");
    return {
      eventId,
      providerRef: optionalString(result.providerRef),
      status: paymentStatus(result.status),
      paymentId: optionalString(result.paymentId),
      orderId: optionalString(result.orderId),
      method: optionalString(result.method),
      metadata: metadataValue(result.metadata),
    };
  }
}
