ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'PENDING_PAYMENT';
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'CONFIRMED';

ALTER TABLE "Payment"
ADD COLUMN "webhookEventId" TEXT,
ADD COLUMN "webhookReceivedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "Payment_orderId_key" ON "Payment"("orderId");
CREATE UNIQUE INDEX "Payment_provider_webhookEventId_key" ON "Payment"("provider", "webhookEventId");
