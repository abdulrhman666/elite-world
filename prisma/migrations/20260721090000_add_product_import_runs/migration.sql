-- سجل استيراد المنتجات: جدول إضافي فقط، دون تعديل أو حذف أي بيانات حالية.
CREATE TABLE "ProductImportRun" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "checksum" TEXT NOT NULL,
    "adminEmail" TEXT NOT NULL,
    "operation" TEXT NOT NULL DEFAULT 'IMPORT',
    "status" TEXT NOT NULL DEFAULT 'ANALYZED',
    "sourceRows" INTEGER NOT NULL DEFAULT 0,
    "newCount" INTEGER NOT NULL DEFAULT 0,
    "updateCount" INTEGER NOT NULL DEFAULT 0,
    "unchangedCount" INTEGER NOT NULL DEFAULT 0,
    "errorCount" INTEGER NOT NULL DEFAULT 0,
    "duplicateCount" INTEGER NOT NULL DEFAULT 0,
    "missingImageCount" INTEGER NOT NULL DEFAULT 0,
    "analysis" JSONB,
    "snapshot" JSONB,
    "result" JSONB,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "rolledBackAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProductImportRun_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ProductImportRun_createdAt_idx" ON "ProductImportRun"("createdAt");
CREATE INDEX "ProductImportRun_status_createdAt_idx" ON "ProductImportRun"("status", "createdAt");
CREATE INDEX "ProductImportRun_adminEmail_createdAt_idx" ON "ProductImportRun"("adminEmail", "createdAt");
