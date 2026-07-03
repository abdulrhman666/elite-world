-- AddEnum
CREATE TYPE "AdminRole" AS ENUM ('SUPER_ADMIN', 'ADMIN');

-- AlterTable
ALTER TABLE "Customer" ADD COLUMN "role" "AdminRole";

-- CreateIndex
CREATE INDEX "Customer_role_idx" ON "Customer"("role");
