ALTER TYPE "PaymentStatus" ADD VALUE IF NOT EXISTS 'CANCELLED';

ALTER TABLE "Payment"
ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'SAR',
ADD COLUMN "provider" TEXT NOT NULL DEFAULT 'manual',
ADD COLUMN "providerRef" TEXT,
ADD COLUMN "metadata" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "Payment"
ALTER COLUMN "method" DROP NOT NULL,
ALTER COLUMN "method" TYPE TEXT USING "method"::TEXT;

ALTER TABLE "Payment"
RENAME COLUMN "transactionRef" TO "providerRefLegacy";

UPDATE "Payment"
SET "providerRef" = "providerRefLegacy"
WHERE "providerRefLegacy" IS NOT NULL;

ALTER TABLE "Payment"
DROP COLUMN "providerRefLegacy";

CREATE INDEX "Payment_provider_idx" ON "Payment"("provider");
CREATE INDEX "Payment_providerRef_idx" ON "Payment"("providerRef");

DROP TYPE IF EXISTS "PaymentMethod";
