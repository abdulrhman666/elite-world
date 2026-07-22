"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin/auth";
import { createBulkPreview } from "@/lib/admin/product-transfer-admin";
import {
  analyzeProductWorkbook,
  ProductTransferError,
} from "@/lib/product-transfer/analyze";
import {
  executeImportRun,
  rollbackImportRun,
} from "@/lib/product-transfer/execute";

async function requireAdmin() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login?error=session");
  return session;
}

function fail(error: unknown): never {
  const raw = error instanceof Error ? error.message : "";
  const messages: Record<string, string> = {
    IMPORT_RUN_NOT_FOUND:
      "عملية الاستيراد غير موجودة أو لا تخص المستخدم الحالي.",
    IMPORT_ALREADY_PROCESSED: "تم تنفيذ هذه العملية سابقًا ولا يمكن تكرارها.",
    IMPORT_HAS_ERRORS: "لا يمكن التنفيذ قبل إصلاح أخطاء المعاينة.",
    ROLLBACK_NOT_AVAILABLE: "التراجع غير متاح لهذه العملية.",
    ZIP_TOO_LARGE: "ملف ZIP يتجاوز الحد الآمن 50MB.",
  };
  const message =
    error instanceof ProductTransferError
      ? raw
      : (messages[raw] ??
        (/^[\u0600-\u06FF]/.test(raw) && raw.length <= 240
          ? raw
          : "تعذر تنفيذ العملية بأمان. راجع الملف وحاول مجددًا."));
  redirect(`/admin/product-transfer?error=${encodeURIComponent(message)}`);
}

function refreshCatalog() {
  updateTag("catalog");
  revalidatePath("/admin/product-transfer");
  revalidatePath("/admin/products");
  revalidatePath("/shop");
  revalidatePath("/products", "layout");
}

export async function analyzeProductImportAction(formData: FormData) {
  const session = await requireAdmin();
  const xlsxFile = formData.get("xlsxFile");
  const zipValue = formData.get("zipFile");
  if (!(xlsxFile instanceof File))
    redirect("/admin/product-transfer?error=ارفع ملف Excel.");
  let runId: string;
  try {
    runId = await analyzeProductWorkbook({
      xlsxFile,
      zipFile: zipValue instanceof File ? zipValue : null,
      adminEmail: session.email,
    });
  } catch (error) {
    fail(error);
  }
  redirect(`/admin/product-transfer?run=${runId}&success=analyzed`);
}

export async function confirmProductImportAction(
  runId: string,
  formData: FormData,
) {
  const session = await requireAdmin();
  const zipValue = formData.get("zipFile");
  try {
    await executeImportRun({
      runId,
      zipFile: zipValue instanceof File ? zipValue : null,
      adminEmail: session.email,
    });
  } catch (error) {
    fail(error);
  }
  refreshCatalog();
  redirect(`/admin/product-transfer?run=${runId}&success=completed`);
}

export async function rollbackProductImportAction(
  runId: string,
  formData: FormData,
) {
  const session = await requireAdmin();
  if (formData.get("confirmRollback") !== "confirmed")
    redirect("/admin/product-transfer?error=يلزم تأكيد التراجع.");
  try {
    await rollbackImportRun(runId, session.email);
  } catch (error) {
    fail(error);
  }
  refreshCatalog();
  redirect(`/admin/product-transfer?run=${runId}&success=rolled-back`);
}

export async function previewBulkEditAction(formData: FormData) {
  const session = await requireAdmin();
  let runId: string;
  try {
    runId = await createBulkPreview({
      adminEmail: session.email,
      productIds: formData.getAll("productIds").map(String),
      action: String(formData.get("bulkAction") ?? ""),
      value: String(formData.get("bulkValue") ?? ""),
    });
  } catch (error) {
    fail(error);
  }
  redirect(`/admin/product-transfer?run=${runId}&success=bulk-preview`);
}
