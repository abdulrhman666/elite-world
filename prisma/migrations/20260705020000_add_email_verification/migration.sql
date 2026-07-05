-- Existing accounts are trusted so this safe migration does not lock current customers out.
CREATE TYPE "EmailCodePurpose" AS ENUM ('VERIFY_ACCOUNT', 'RESET_PASSWORD');

ALTER TABLE "Customer" ADD COLUMN "emailVerifiedAt" TIMESTAMP(3);

UPDATE "Customer"
SET "emailVerifiedAt" = CURRENT_TIMESTAMP
WHERE "emailVerifiedAt" IS NULL;

CREATE TABLE "EmailCode" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "purpose" "EmailCodePurpose" NOT NULL,
    "codeHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailCode_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "EmailCode_userId_purpose_createdAt_idx"
ON "EmailCode"("userId", "purpose", "createdAt");

CREATE INDEX "EmailCode_expiresAt_idx" ON "EmailCode"("expiresAt");

ALTER TABLE "EmailCode"
ADD CONSTRAINT "EmailCode_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "Customer"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
