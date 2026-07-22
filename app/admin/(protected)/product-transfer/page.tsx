import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  History,
  RotateCcw,
  Upload,
  WandSparkles,
} from "lucide-react";
import {
  analyzeProductImportAction,
  confirmProductImportAction,
  previewBulkEditAction,
  rollbackProductImportAction,
} from "@/app/admin/product-transfer/actions";
import { AdminMessage } from "@/components/admin/admin-message";
import { BulkEditorFields } from "@/components/admin/product-transfer/bulk-editor-fields";
import { ProductPicker } from "@/components/admin/product-transfer/product-picker";
import { TransferSubmitButton } from "@/components/admin/product-transfer/submit-button";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button";
import { getProductTransferCenter } from "@/lib/admin/product-transfer-admin";
import type { ImportAnalysis } from "@/lib/product-transfer/types";

const control =
  "border-brand-border focus:border-brand-cyan min-h-12 w-full rounded-xl border bg-white px-4 text-sm text-brand-ink outline-none";
const successMessages: Record<string, string> = {
  analyzed: "تم تحليل الملف دون تعديل المنتجات.",
  completed: "اكتملت عملية الاستيراد بنجاح.",
  "bulk-preview": "تم إنشاء معاينة التعديل الجماعي.",
  "rolled-back": "اكتمل التراجع الآمن.",
};

export default async function ProductTransferPage({
  searchParams,
}: {
  searchParams: Promise<{ run?: string; success?: string; error?: string }>;
}) {
  const params = await searchParams;
  const data = await getProductTransferCenter(params.run);
  const analysis = data.selectedRun
    ?.analysis as unknown as ImportAnalysis | null;
  return (
    <div>
      <p className="text-brand-cyan text-sm font-bold">الكتالوج</p>
      <h1 className="text-brand-ink mt-2 text-3xl font-bold">
        استيراد وتصدير المنتجات
      </h1>
      <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">
        مركز آمن لإدارة ملف المنتجات الرئيسي: التصدير، الفحص المسبق، التنفيذ
        المؤكد، سجل العمليات والتعديل الجماعي.
      </p>
      <div className="mt-6 space-y-3">
        {params.success && (
          <AdminMessage tone="success">
            {successMessages[params.success] ?? "تمت العملية بنجاح."}
          </AdminMessage>
        )}
        {params.error && (
          <AdminMessage tone="error">{params.error}</AdminMessage>
        )}
        {!data.migrationReady && (
          <AdminMessage tone="error">
            ترحيل سجل الاستيراد غير مطبق بعد. التصدير متاح، أما التحليل والتنفيذ
            والتعديل الجماعي فستتاح بعد مراجعة وتطبيق الترحيل الإضافي.
          </AdminMessage>
        )}
      </div>

      <nav
        className="border-brand-border mt-8 flex gap-2 overflow-x-auto rounded-2xl border bg-white p-2"
        aria-label="أقسام المركز"
      >
        {[
          ["export", "تصدير المنتجات"],
          ["import", "استيراد المنتجات"],
          ["history", "سجل العمليات"],
          ["bulk", "تعديل جماعي"],
        ].map(([id, label]) => (
          <a
            key={id}
            href={`#${id}`}
            className="text-brand-petroleum hover:bg-brand-surface shrink-0 rounded-xl px-4 py-3 text-sm font-bold"
          >
            {label}
          </a>
        ))}
      </nav>

      <section
        id="export"
        className="border-brand-border mt-8 rounded-3xl border bg-white p-5 sm:p-7"
      >
        <Heading
          icon={Download}
          title="تصدير المنتجات"
          description="ملف Excel احترافي مع جميع الحقول والمواصفات ومراجع الصور وصور مصغرة قدر الإمكان."
        />
        <form
          action="/admin/product-transfer/export"
          method="post"
          className="mt-6 space-y-5"
        >
          <div className="grid gap-4 sm:grid-cols-3">
            <Select
              label="حسب التصنيف"
              name="categoryId"
              options={data.categories.map((item) => [item.id, item.name])}
            />
            <Select
              label="حسب الماركة"
              name="brandId"
              options={data.brands.map((item) => [item.id, item.name])}
            />
            <Select
              label="حسب التوفر"
              name="availability"
              options={[
                ["IN_STOCK", "متوفر"],
                ["ON_REQUEST", "حسب الطلب"],
              ]}
            />
          </div>
          <ProductPicker
            products={data.products}
            name="productIds"
            title="منتجات محددة يدويًا (اختياري)"
          />
          <div className="flex flex-wrap gap-3">
            <Button
              type="submit"
              icon={<FileSpreadsheet className="size-4" aria-hidden />}
            >
              تصدير المنتجات
            </Button>
            <ButtonLink
              href="/templates/elite-world-product-master-template.xlsx"
              variant="outline"
            >
              تنزيل Master Template فارغ
            </ButtonLink>
          </div>
        </form>
      </section>

      <section
        id="import"
        className="border-brand-border mt-8 rounded-3xl border bg-white p-5 sm:p-7"
      >
        <Heading
          icon={Upload}
          title="استيراد المنتجات"
          description="الخطوة الأولى تحليل وPreview فقط؛ لا يحدث أي تعديل قبل التأكيد."
        />
        <form action={analyzeProductImportAction} className="mt-6">
          <fieldset
            disabled={!data.migrationReady}
            className="grid gap-4 disabled:opacity-60 sm:grid-cols-2"
          >
            <FileField
              label="ملف Excel الرسمي"
              name="xlsxFile"
              accept=".xlsx"
              required
            />
            <FileField
              label="ZIP الصور (اختياري في التحليل)"
              name="zipFile"
              accept=".zip"
            />
            <TransferSubmitButton
              pendingLabel="جارٍ فحص الملف…"
              className="sm:col-span-2 sm:w-fit"
            >
              فحص وإنشاء معاينة
            </TransferSubmitButton>
          </fieldset>
        </form>
        <div className="border-brand-border bg-brand-surface mt-5 rounded-2xl border p-4 text-sm leading-7 text-slate-600">
          <strong className="text-brand-ink">قاعدة الحماية:</strong> الخلية
          الفارغة لا تغيّر القيمة الحالية. استخدم{" "}
          <code className="rounded bg-white px-2 py-1">__CLEAR__</code> للمسح
          المتعمد في الحقول الاختيارية فقط.
        </div>
      </section>

      {data.selectedRun && analysis && (
        <RunPreview run={data.selectedRun} analysis={analysis} />
      )}

      <section
        id="bulk"
        className="border-brand-border mt-8 rounded-3xl border bg-white p-5 sm:p-7"
      >
        <Heading
          icon={WandSparkles}
          title="التعديل الجماعي"
          description="اختر المنتجات والإجراء؛ سيُنشأ Preview قبل التنفيذ بنفس نظام الحماية والتراجع."
        />
        <form action={previewBulkEditAction} className="mt-6">
          <fieldset
            disabled={!data.migrationReady}
            className="space-y-5 disabled:opacity-60"
          >
            <ProductPicker
              products={data.products}
              name="productIds"
              title="حدد المنتجات"
            />
            <BulkEditorFields
              categories={data.categories.map((item) => ({
                name: item.name,
                value: item.slug,
              }))}
              brands={data.brands.map((item) => ({
                name: item.name,
                value: item.name,
              }))}
            />
            <TransferSubmitButton pendingLabel="جارٍ إنشاء المعاينة…">
              معاينة التعديل
            </TransferSubmitButton>
          </fieldset>
        </form>
      </section>

      <section
        id="history"
        className="border-brand-border mt-8 rounded-3xl border bg-white p-5 sm:p-7"
      >
        <Heading
          icon={History}
          title="سجل عمليات الاستيراد"
          description="آخر 30 عملية مع النتيجة والأعداد وإمكانية فتح التفاصيل."
        />
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[1080px] text-sm">
            <thead className="bg-brand-petroleum text-white">
              <tr>
                <th className="px-4 py-3 text-start">التاريخ</th>
                <th className="px-4 py-3 text-start">الملف/العملية</th>
                <th className="px-4 py-3 text-start">المستخدم</th>
                <th className="px-4 py-3 text-start">الحالة</th>
                <th className="px-4 py-3 text-start">جديد</th>
                <th className="px-4 py-3 text-start">تحديث</th>
                <th className="px-4 py-3 text-start">أخطاء</th>
                <th className="px-4 py-3 text-start">المدة</th>
                <th className="px-4 py-3 text-start">الإجراء</th>
              </tr>
            </thead>
            <tbody>
              {data.history.map((run) => (
                <tr key={run.id} className="border-brand-border border-b">
                  <td className="px-4 py-3">
                    {run.createdAt.toLocaleString("ar-SA")}
                  </td>
                  <td className="px-4 py-3 font-semibold">{run.fileName}</td>
                  <td className="font-latin px-4 py-3 text-xs">
                    {run.adminEmail}
                  </td>
                  <td className="px-4 py-3">{statusLabel(run.status)}</td>
                  <td className="px-4 py-3">{run.newCount}</td>
                  <td className="px-4 py-3">{run.updateCount}</td>
                  <td className="px-4 py-3">
                    {run.errorCount + run.duplicateCount}
                  </td>
                  <td className="px-4 py-3">
                    {elapsedLabel(run.startedAt, run.completedAt)}
                  </td>
                  <td className="px-4 py-3">
                    <a
                      className="text-brand-cyan font-bold"
                      href={`/admin/product-transfer?run=${run.id}`}
                    >
                      التفاصيل
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function RunPreview({
  run,
  analysis,
}: {
  run: {
    id: string;
    status: string;
    operation: string;
    newCount: number;
    updateCount: number;
    unchangedCount: number;
    errorCount: number;
    duplicateCount: number;
    missingImageCount: number;
    rolledBackAt: Date | null;
  };
  analysis: ImportAnalysis;
}) {
  const canConfirm =
    run.status === "ANALYZED" &&
    run.errorCount === 0 &&
    run.duplicateCount === 0;
  return (
    <section
      className="border-brand-cyan mt-8 rounded-3xl border-2 bg-white p-5 sm:p-7"
      aria-labelledby="preview-title"
    >
      <Heading
        icon={CheckCircle2}
        title="معاينة العملية"
        description="راجع الملخص والفروق قبل أي كتابة في قاعدة البيانات."
      />
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Stat label="جديد" value={run.newCount} tone="emerald" />
        <Stat label="تحديث" value={run.updateCount} tone="cyan" />
        <Stat label="بدون تغيير" value={run.unchangedCount} />
        <Stat label="أخطاء" value={run.errorCount} tone="amber" />
        <Stat label="تكرار" value={run.duplicateCount} tone="amber" />
        <Stat label="صور ناقصة" value={run.missingImageCount} tone="amber" />
      </div>
      <div className="mt-7 space-y-3">
        {analysis.rows
          .filter((row) => row.status !== "UNCHANGED")
          .slice(0, 300)
          .map((row) => (
            <details
              key={row.rowNumber}
              className="border-brand-border rounded-2xl border"
            >
              <summary className="cursor-pointer p-4 text-sm font-bold text-brand-ink">
                صف {row.rowNumber} — {row.nameAr || row.sku || "بدون اسم"}{" "}
                <span className="ms-2 text-xs text-slate-500">
                  {row.status}
                </span>
              </summary>
              <div className="border-brand-border border-t p-4 text-sm">
                {row.errors.map((error) => (
                  <p key={error} className="text-red-700">
                    ⚠ {error}
                  </p>
                ))}
                {row.warnings.map((warning) => (
                  <p key={warning} className="text-amber-700">
                    ⚠ {warning}
                  </p>
                ))}
                {row.changes.length > 0 && (
                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full min-w-[620px]">
                      <thead>
                        <tr className="bg-brand-surface">
                          <th className="p-2 text-start">الحقل</th>
                          <th className="p-2 text-start">قبل</th>
                          <th className="p-2 text-start">بعد</th>
                        </tr>
                      </thead>
                      <tbody>
                        {row.changes.map((change) => (
                          <tr
                            key={change.field}
                            className="border-brand-border border-t"
                          >
                            <td className="p-2 font-semibold">
                              {change.label}
                            </td>
                            <td className="p-2 text-slate-500">
                              {String(change.before ?? "فارغ")}
                            </td>
                            <td className="p-2 text-brand-petroleum">
                              {String(change.after ?? "سيُمسح")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </details>
          ))}
      </div>
      {canConfirm ? (
        <form
          action={confirmProductImportAction.bind(null, run.id)}
          className="border-brand-border mt-7 flex flex-col gap-4 rounded-2xl border bg-brand-surface p-5 sm:flex-row sm:items-end"
        >
          <FileField
            label="أعد إرفاق ZIP الصور عند استخدام imageFilename"
            name="zipFile"
            accept=".zip"
          />
          <TransferSubmitButton
            pendingLabel="جارٍ التنفيذ…"
            className="sm:mb-0.5"
          >
            تأكيد وتنفيذ العملية
          </TransferSubmitButton>
        </form>
      ) : run.status === "ANALYZED" ? (
        <AdminMessage tone="error">
          <AlertTriangle className="me-2 inline size-4" />
          لا يمكن التنفيذ قبل إصلاح الأخطاء والتعارضات في Excel وإعادة التحليل.
        </AdminMessage>
      ) : null}
      {["COMPLETED", "PARTIAL"].includes(run.status) && !run.rolledBackAt && (
        <form
          action={rollbackProductImportAction.bind(null, run.id)}
          className="mt-5 flex flex-wrap items-center gap-3"
        >
          <input type="hidden" name="confirmRollback" value="confirmed" />
          <TransferSubmitButton pendingLabel="جارٍ التراجع…">
            <RotateCcw className="size-4" aria-hidden />
            التراجع الآمن عن العملية
          </TransferSubmitButton>
          <span className="text-xs text-amber-700">
            لن يُرجع أي منتج تغيّر بعد هذه العملية.
          </span>
        </form>
      )}
    </section>
  );
}

function Heading({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Download;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="bg-brand-cyan/10 text-brand-cyan grid size-11 shrink-0 place-items-center rounded-xl">
        <Icon className="size-5" aria-hidden />
      </span>
      <div>
        <h2 className="text-brand-ink text-xl font-bold">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
      </div>
    </div>
  );
}
function Select({
  label,
  name,
  options,
}: {
  label: string;
  name: string;
  options: string[][];
}) {
  return (
    <label>
      <span className="text-brand-ink mb-2 block text-sm font-semibold">
        {label}
      </span>
      <select name={name} className={control}>
        <option value="">الكل</option>
        {options.map(([value, text]) => (
          <option key={value} value={value}>
            {text}
          </option>
        ))}
      </select>
    </label>
  );
}
function FileField({
  label,
  name,
  accept,
  required = false,
}: {
  label: string;
  name: string;
  accept: string;
  required?: boolean;
}) {
  return (
    <label className="block flex-1">
      <span className="text-brand-ink mb-2 block text-sm font-semibold">
        {label}
      </span>
      <input
        type="file"
        name={name}
        accept={accept}
        required={required}
        className={`${control} file:bg-brand-surface file:text-brand-petroleum file:me-3 file:rounded-lg file:border-0 file:px-3 file:py-2 file:font-bold`}
      />
    </label>
  );
}
function Stat({
  label,
  value,
  tone = "slate",
}: {
  label: string;
  value: number;
  tone?: string;
}) {
  const tones: Record<string, string> = {
    slate: "bg-slate-50 text-slate-700",
    emerald: "bg-emerald-50 text-emerald-800",
    cyan: "bg-cyan-50 text-brand-petroleum",
    amber: "bg-amber-50 text-amber-800",
  };
  return (
    <div className={`rounded-2xl p-4 text-center ${tones[tone]}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="mt-1 text-xs font-semibold">{label}</p>
    </div>
  );
}
function statusLabel(status: string) {
  return (
    (
      {
        ANALYZED: "جاهز للمراجعة",
        RUNNING: "قيد التنفيذ",
        COMPLETED: "مكتمل",
        PARTIAL: "مكتمل جزئيًا",
        FAILED: "فشل دون اكتمال",
        ROLLED_BACK: "تم التراجع",
        ROLLBACK_PARTIAL: "تراجع جزئي",
      } as Record<string, string>
    )[status] ?? status
  );
}
function elapsedLabel(startedAt: Date | null, completedAt: Date | null) {
  if (!startedAt || !completedAt) return "—";
  const seconds = Math.max(
    0,
    Math.round((completedAt.getTime() - startedAt.getTime()) / 1000),
  );
  return seconds < 60
    ? `${seconds} ث`
    : `${Math.floor(seconds / 60)} د ${seconds % 60} ث`;
}
