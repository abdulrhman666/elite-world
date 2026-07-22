import { readFile } from "node:fs/promises";
import path from "node:path";
import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";
import {
  areImportValuesEquivalent,
  calculateBulkPrice,
  chunkRecords,
  duplicateRowNumbers,
  evaluateProductIdentity,
  isSafeRollbackVersion,
  isValidSpecificationsJson,
  resolveImportedValue,
  validateImageReference,
  validateZipImageFilename,
  zipContainsFilename,
} from "../lib/product-transfer/domain";

describe("مركز استيراد وتصدير المنتجات", () => {
  it("يعيد استيراد القيم الفارغة دون تغيير المنتج الحالي", () => {
    expect(
      resolveImportedValue({
        current: "فرن قائم",
        incoming: "",
        clearable: false,
      }),
    ).toBe("فرن قائم");
  });

  it("يقبل تغيير السعر وحده", () => {
    expect(
      resolveImportedValue({ current: 1200, incoming: 1350, clearable: true }),
    ).toBe(1350);
  });

  it("يقسم 100 منتج إلى دفعات آمنة", () => {
    expect(
      chunkRecords(
        Array.from({ length: 100 }, (_, index) => index),
        50,
      ).map((batch) => batch.length),
    ).toEqual([50, 50]);
  });

  it("يصنف صف Product ID الفارغ بلا تعارض كمنتج جديد صالح", () => {
    expect(evaluateProductIdentity({ productId: "" })).toEqual({
      errors: [],
      duplicate: false,
    });
  });

  it("يرفض Product ID غير الموجود", () => {
    expect(
      evaluateProductIdentity({ productId: "missing-id" }).errors,
    ).toContain("Product ID غير موجود.");
  });

  it("يرفض SKU أو slug المملوك لمنتج آخر", () => {
    const result = evaluateProductIdentity({
      productId: "",
      skuOwnerId: "existing-product",
    });
    expect(result.duplicate).toBe(true);
    expect(result.errors[0]).toContain("تعارض");
  });

  it("يكشف التكرار داخل الملف دون حساسية لحالة الأحرف", () => {
    expect(
      duplicateRowNumbers([
        { rowNumber: 2, value: "EW-1" },
        { rowNumber: 8, value: "ew-1" },
      ]).get(8),
    ).toBe(2);
  });

  it("لا يسمح لـ CLEAR بمسح حقل غير قابل للمسح", () => {
    expect(
      resolveImportedValue({
        current: "اسم المنتج",
        incoming: "__CLEAR__",
        clearable: false,
      }),
    ).toBe("اسم المنتج");
  });

  it("يمسح الحقل الاختياري فقط عند CLEAR الصريح", () => {
    expect(
      resolveImportedValue({
        current: "شارة",
        incoming: "__CLEAR__",
        clearable: true,
      }),
    ).toBeNull();
  });

  it("يبقي مرجع الصورة الحالية عند ترك الصورة فارغة", () => {
    expect(
      resolveImportedValue({
        current: "/images/product.webp",
        incoming: null,
        clearable: false,
      }),
    ).toBe("/images/product.webp");
  });

  it("يتجاهل اختلاف المسافات الطرفية فقط دون تغيير المحتوى", () => {
    expect(
      areImportValuesEquivalent("وصف المنتج   ", "وصف المنتج"),
    ).toBe(true);
    expect(
      areImportValuesEquivalent("وصف المنتج الأول", "وصف المنتج الثاني"),
    ).toBe(false);
  });

  it("يقبل مصادر الصور الآمنة المعتمدة فقط", () => {
    expect(validateImageReference("/images/products/oven.webp")).toBeNull();
    expect(
      validateImageReference(
        "https://7b5f6r4efbnzxijf.public.blob.vercel-storage.com/products/oven.webp",
      ),
    ).toBeNull();
    expect(validateImageReference("http://example.com/oven.png")).toContain(
      "HTTPS",
    );
    expect(validateImageReference("https://127.0.0.1/oven.png")).toContain(
      "خاص",
    );
    expect(validateImageReference("file:///tmp/oven.png")).not.toBeNull();
    expect(validateImageReference("/api/private/oven.png")).not.toBeNull();
  });

  it("يقبل أسماء صور ZIP المدعومة ويرفض المسارات والأنواع الأخرى", () => {
    expect(validateZipImageFilename("oven-001.JPG")).toBeNull();
    expect(validateZipImageFilename("../oven.png")).not.toBeNull();
    expect(validateZipImageFilename("oven.svg")).not.toBeNull();
  });

  it("يربط اسم صورة ZIP دون حساسية لحالة الأحرف", () => {
    expect(zipContainsFilename(["OVEN-001.JPG"], "oven-001.jpg")).toBe(true);
  });

  it("يرفض JSON مواصفات غير صالح", () => {
    expect(
      isValidSpecificationsJson('[{"label":"القدرة","value":"5 kW"}]'),
    ).toBe(true);
    expect(isValidSpecificationsJson('[{"label":""}]')).toBe(false);
  });

  it("لا يسمح بالتراجع إذا تغير المنتج بعد الاستيراد", () => {
    expect(
      isSafeRollbackVersion(
        "2026-07-20T10:01:00.000Z",
        "2026-07-20T10:00:00.000Z",
      ),
    ).toBe(false);
  });

  it("يحسب زيادة وخفض السعر بالنسبة والقيمة بثبات عشري", () => {
    expect(calculateBulkPrice(1000, "pricePercent", "5")).toBe(1050);
    expect(calculateBulkPrice(1000, "pricePercent", "-5")).toBe(950);
    expect(calculateBulkPrice(1000, "priceAmount", "125.55")).toBe(1125.55);
  });

  it("يحتوي Master Template الرسمي على الورقتين والأعمدة الأساسية", async () => {
    const file = path.join(
      process.cwd(),
      "public/templates/elite-world-product-master-template.xlsx",
    );
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(
      (await readFile(file)) as unknown as ExcelJS.Buffer,
    );
    expect(workbook.worksheets.map((sheet) => sheet.name)).toEqual([
      "التعليمات",
      "المنتجات",
      "القوائم",
    ]);
    const headers = workbook.getWorksheet("المنتجات")?.getRow(1).values;
    expect(headers).toContain("Product ID");
    expect(headers).toContain("مرجع الصورة الرئيسية");
  });

  it("يبقي Migration سجل العمليات إضافية فقط", async () => {
    const sql = await readFile(
      path.join(
        process.cwd(),
        "prisma/migrations/20260721090000_add_product_import_runs/migration.sql",
      ),
      "utf8",
    );
    expect(sql).toContain('CREATE TABLE "ProductImportRun"');
    expect(sql).not.toMatch(/\b(DROP|TRUNCATE|DELETE|ALTER\s+TABLE)\b/i);
  });
});
