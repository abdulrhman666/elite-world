-- Expand the existing order timeline instead of creating a duplicate shipping status system.
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'READY_TO_SHIP';
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'SHIPPED';
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'OUT_FOR_DELIVERY';

-- Editable defaults for new orders.
ALTER TABLE "SiteSettings"
ADD COLUMN "riyadhDeliveryEstimate" TEXT NOT NULL DEFAULT '3–7 أيام عمل',
ADD COLUMN "outsideDeliveryEstimate" TEXT NOT NULL DEFAULT '5–10 أيام عمل';

-- Per-order shipping snapshot and tracking information.
ALTER TABLE "Order"
ADD COLUMN "shippingCarrier" TEXT,
ADD COLUMN "trackingNumber" TEXT,
ADD COLUMN "deliveryEstimate" TEXT;

UPDATE "Order"
SET "deliveryEstimate" = CASE
  WHEN LOWER("city") LIKE '%الرياض%' OR LOWER("city") LIKE '%riyadh%'
    THEN '3–7 أيام عمل'
  ELSE '5–10 أيام عمل'
END
WHERE "deliveryEstimate" IS NULL;

CREATE INDEX "Order_trackingNumber_idx" ON "Order"("trackingNumber");
