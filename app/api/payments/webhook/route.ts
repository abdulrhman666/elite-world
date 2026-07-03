import { type NextRequest, NextResponse } from "next/server";
import { commerceConfigurationIssue } from "@/lib/commerce/public-service";
import {
  handlePaymentWebhook,
  PaymentServiceError,
} from "@/lib/payments/payment.service";

function providerFromRequest(request: NextRequest, body: unknown) {
  const urlProvider = request.nextUrl.searchParams.get("provider");
  if (urlProvider) return urlProvider;
  if (typeof body === "object" && body !== null && "provider" in body) {
    const provider = (body as { provider?: unknown }).provider;
    if (typeof provider === "string") return provider;
  }
  return "";
}

export async function POST(request: NextRequest) {
  if (commerceConfigurationIssue()) {
    return NextResponse.json(
      { error: "PAYMENTS_UNAVAILABLE" },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }

  const providerName = providerFromRequest(request, body);
  if (!providerName) {
    return NextResponse.json(
      { error: "PAYMENT_PROVIDER_REQUIRED" },
      { status: 400 },
    );
  }
  try {
    const result = await handlePaymentWebhook({
      providerName,
      payload: body,
      headers: request.headers,
    });
    return NextResponse.json({
      ok: true,
      duplicate: result.duplicate,
      paymentId: result.payment.id,
      status: result.payment.status,
      provider: result.payment.provider,
      providerRef: result.payment.providerRef,
      webhookReceivedAt: result.payment.webhookReceivedAt,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof PaymentServiceError
            ? error.code
            : "WEBHOOK_PROCESSING_FAILED",
      },
      { status: 400 },
    );
  }
}
