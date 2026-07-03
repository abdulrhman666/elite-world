import { getAdminSession } from "@/lib/admin/auth";
import { commerceConfigurationIssue } from "@/lib/commerce/public-service";
import { getPrismaClient } from "@/lib/prisma";
import { getStorageAdapter } from "@/lib/storage";

function attachmentContentType(filePath: string) {
  return filePath.toLowerCase().endsWith(".pdf")
    ? "application/pdf"
    : "image/webp";
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; paymentId: string }> },
) {
  if (!(await getAdminSession())) {
    return new Response("Unauthorized", { status: 401 });
  }
  if (commerceConfigurationIssue()) {
    return new Response("Not found", { status: 404 });
  }

  const { id, paymentId } = await params;
  const payment = await getPrismaClient().payment.findUnique({
    where: { id: paymentId },
    select: { orderId: true, attachmentUrl: true },
  });
  if (!payment?.attachmentUrl || payment.orderId !== id) {
    return new Response("Not found", { status: 404 });
  }

  try {
    const bytes = await getStorageAdapter().readFile(payment.attachmentUrl);
    const extension = payment.attachmentUrl.toLowerCase().endsWith(".pdf")
      ? "pdf"
      : "webp";
    return new Response(Uint8Array.from(bytes).buffer, {
      headers: {
        "Content-Type": attachmentContentType(payment.attachmentUrl),
        "Content-Disposition": `attachment; filename="payment-proof.${extension}"`,
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
