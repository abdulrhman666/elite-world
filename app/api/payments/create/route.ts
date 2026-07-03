import { NextResponse } from "next/server";
import { getAdminMutationIssue } from "@/lib/api/admin-mutation";
import { commerceConfigurationIssue } from "@/lib/commerce/public-service";
import {
  createPayment,
  PaymentServiceError,
} from "@/lib/payments/payment.service";

export async function POST(request: Request) {
  const authorizationIssue = await getAdminMutationIssue(request, {
    superAdminOnly: true,
  });
  if (authorizationIssue) {
    return NextResponse.json(
      { error: authorizationIssue.error },
      { status: authorizationIssue.status },
    );
  }
  if (commerceConfigurationIssue()) {
    return NextResponse.json(
      { error: "PAYMENTS_UNAVAILABLE" },
      { status: 503 },
    );
  }

  try {
    const body = (await request.json()) as { orderId?: unknown };
    const orderId = typeof body.orderId === "string" ? body.orderId : "";
    if (!orderId) {
      return NextResponse.json({ error: "ORDER_ID_REQUIRED" }, { status: 400 });
    }
    const payment = await createPayment(orderId);
    return NextResponse.json({
      id: payment.id,
      orderId: payment.orderId,
      amount: payment.amount.toString(),
      currency: payment.currency,
      status: payment.status,
      provider: payment.provider,
      providerRef: payment.providerRef,
      method: payment.method,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof PaymentServiceError
            ? error.code
            : "PAYMENT_CREATE_FAILED",
      },
      {
        status:
          error instanceof PaymentServiceError &&
          error.code === "PAYMENT_PROVIDER_NOT_CONFIGURED"
            ? 503
            : 400,
      },
    );
  }
}
