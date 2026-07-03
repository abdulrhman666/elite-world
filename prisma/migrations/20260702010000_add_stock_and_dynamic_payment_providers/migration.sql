-- Add non-negative stock quantities without changing existing product identities.
ALTER TABLE "Product"
ADD COLUMN "stockQuantity" INTEGER NOT NULL DEFAULT 0;

UPDATE "Product"
SET "stockQuantity" = CASE
  WHEN "availability" = 'IN_STOCK' THEN 1
  ELSE 0
END;

ALTER TABLE "Product"
ADD CONSTRAINT "Product_stockQuantity_nonnegative"
CHECK ("stockQuantity" >= 0);

CREATE INDEX "Product_stockQuantity_idx" ON "Product"("stockQuantity");

-- Provider records are fully dynamic; credentials remain encrypted at rest.
CREATE TABLE "PaymentProvider" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "endpoint" TEXT NOT NULL,
  "apiKeyEncrypted" TEXT,
  "secretKeyEncrypted" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "PaymentProvider_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PaymentProvider_name_key" ON "PaymentProvider"("name");
CREATE INDEX "PaymentProvider_isActive_idx" ON "PaymentProvider"("isActive");
CREATE UNIQUE INDEX "PaymentProvider_single_active_idx"
ON "PaymentProvider"("isActive")
WHERE "isActive" = true;
