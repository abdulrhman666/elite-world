import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import ExcelJS from "exceljs";
import sharp from "sharp";
import {
  PRODUCT_TRANSFER_COLUMNS,
  type ProductTransferRow,
} from "@/lib/product-transfer/columns";

const colors = {
  petroleum: "00677F",
  cyan: "0099BF",
  ink: "102A33",
  surface: "F3F6F7",
  border: "D8E2E6",
  white: "FFFFFF",
  protected: "E8EDF0",
};

export async function buildProductWorkbook(
  rows: ProductTransferRow[],
  options: { templateOnly?: boolean } = {},
) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Elite World";
  workbook.company = "Elite World";
  workbook.title = "Elite World Product Master Template";
  workbook.subject = "إدارة منتجات Elite World";
  workbook.created = new Date();

  const instructions = workbook.addWorksheet("التعليمات", {
    views: [{ rightToLeft: true, showGridLines: false }],
  });
  instructions.columns = [{ width: 4 }, { width: 27 }, { width: 95 }];
  instructions.mergeCells("B2:C2");
  instructions.getCell("B2").value = "Elite World Product Master Template";
  instructions.getCell("B2").style = {
    fill: {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: colors.petroleum },
    },
    font: { bold: true, color: { argb: colors.white }, size: 18 },
    alignment: { horizontal: "center", vertical: "middle" },
  };
  instructions.getRow(2).height = 38;
  const notes = [
    [
      "طريقة الاستخدام",
      "صدّر المنتجات، عدّل القيم أو أضف صفوفًا جديدة، ثم ارفع الملف في مركز الاستيراد.",
    ],
    [
      "Product ID",
      "لا تعدّله. الصف ذو Product ID موجود يحدّث المنتج نفسه؛ الصف الفارغ ينشئ منتجًا جديدًا.",
    ],
    [
      "الخلايا الفارغة",
      "في المنتجات الحالية تعني: لا تغيير. لا تمسح البيانات تلقائيًا.",
    ],
    ["المسح المتعمد", "اكتب __CLEAR__ فقط في الحقول الاختيارية المسموح مسحها."],
    [
      "التصنيف والماركة",
      "يجب أن يكونا موجودين مسبقًا. لا ينشئ النظام عناصر جديدة تلقائيًا.",
    ],
    [
      "الصور",
      "اترك المراجع كما هي للاحتفاظ بالصور. يمكن استخدام URL آمن أو imageFilename مع ZIP.",
    ],
    [
      "صور متعددة",
      "استخدم الأعمدة صورة إضافية 1–3. عدم تعبئتها لا يحذف الصور الحالية.",
    ],
    ["المواصفات", 'صيغة JSON: [{"label":"القدرة","value":"5 kW"}]'],
    [
      "التنفيذ",
      "الرفع ينشئ Preview فقط. لا تُكتب المنتجات قبل الضغط على تأكيد الاستيراد.",
    ],
  ];
  notes.forEach(([label, description], index) => {
    const rowNumber = index + 4;
    const labelCell = instructions.getCell(rowNumber, 2);
    const descriptionCell = instructions.getCell(rowNumber, 3);
    labelCell.value = label;
    descriptionCell.value = description;
    labelCell.style = {
      fill: {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: colors.surface },
      },
      font: { bold: true, color: { argb: colors.ink } },
      alignment: { horizontal: "right", vertical: "top", wrapText: true },
    };
    descriptionCell.style = {
      font: { color: { argb: "475569" } },
      alignment: { horizontal: "right", vertical: "top", wrapText: true },
    };
    for (const cell of [labelCell, descriptionCell]) {
      cell.border = {
        bottom: { style: "thin", color: { argb: colors.border } },
      };
    }
    instructions.getRow(rowNumber).height = 34;
  });

  const products = workbook.addWorksheet("المنتجات", {
    views: [
      {
        state: "frozen",
        ySplit: 1,
        xSplit: 2,
        rightToLeft: true,
        showGridLines: false,
      },
    ],
    properties: { defaultRowHeight: 22 },
  });
  products.columns = [
    { key: "thumbnail", header: "صورة", width: 14 },
    ...PRODUCT_TRANSFER_COLUMNS.map(([key, label, width]) => ({
      key,
      header: label,
      width,
    })),
  ];
  products.autoFilter = {
    from: "A1",
    to: `${products.getColumn(products.columnCount).letter}1`,
  };
  products.getRow(1).height = 34;
  products.getRow(1).eachCell((cell) => {
    cell.style = {
      fill: {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: colors.petroleum },
      },
      font: { bold: true, color: { argb: colors.white } },
      alignment: { horizontal: "center", vertical: "middle", wrapText: true },
    };
  });
  products.getColumn("id").eachCell((cell, rowNumber) => {
    if (rowNumber > 1)
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: colors.protected },
      };
  });
  products.getColumn("price").numFmt = '#,##0.00" ر.س"';
  products.getColumn("stockQuantity").numFmt = "0";
  products.getColumn("sortOrder").numFmt = "0";
  products.getColumn("sourceCreatedAt").numFmt = "yyyy-mm-dd";
  products.getColumn("updatedAt").numFmt = "yyyy-mm-dd hh:mm";
  const availabilityColumn = products.getColumn("availability").letter;
  const featuredColumn = products.getColumn("featured").letter;
  const seoIndexableColumn = products.getColumn("seoIndexable").letter;
  if (!options.templateOnly) {
    for (const data of rows) {
      const row = products.addRow({ thumbnail: "", ...data });
      row.height = 64;
      row.alignment = {
        vertical: "middle",
        horizontal: "right",
        wrapText: true,
      };
      row.eachCell((cell) => {
        cell.border = {
          bottom: { style: "hair", color: { argb: colors.border } },
        };
      });
      await addThumbnail(
        workbook,
        products,
        row.number,
        String(data.imageUrl ?? ""),
      );
    }
  } else {
    products.addRow({});
    products.getRow(2).height = 28;
  }

  const validationEndRow = Math.max(rows.length + 1, 1001);
  for (let row = 2; row <= validationEndRow; row += 1) {
    products.getCell(`${availabilityColumn}${row}`).dataValidation = {
      type: "list",
      allowBlank: true,
      formulae: ['"IN_STOCK,ON_REQUEST"'],
    };
    products.getCell(`${featuredColumn}${row}`).dataValidation = {
      type: "list",
      allowBlank: true,
      formulae: ['"TRUE,FALSE"'],
    };
    products.getCell(`${seoIndexableColumn}${row}`).dataValidation = {
      type: "list",
      allowBlank: true,
      formulae: ['"TRUE,FALSE"'],
    };
  }

  const lists = workbook.addWorksheet("القوائم", { state: "veryHidden" });
  lists.getCell("A1").value = "لا تعدل هذه الورقة";
  return workbook;
}

async function addThumbnail(
  workbook: ExcelJS.Workbook,
  sheet: ExcelJS.Worksheet,
  row: number,
  reference: string,
) {
  if (!reference) return;
  try {
    let bytes: Buffer;
    if (reference.startsWith("/")) {
      bytes = await readFile(path.join(process.cwd(), "public", reference));
    } else if (/^https:\/\//i.test(reference)) {
      const response = await fetch(reference, {
        signal: AbortSignal.timeout(5000),
      });
      if (!response.ok) return;
      bytes = Buffer.from(await response.arrayBuffer());
    } else return;
    const thumbnail = await sharp(bytes)
      .resize(72, 54, { fit: "contain", background: "white" })
      .png()
      .toBuffer();
    const imageId = workbook.addImage({
      buffer: thumbnail as unknown as ExcelJS.Buffer,
      extension: "png",
    });
    sheet.addImage(imageId, {
      tl: { col: 0.15, row: row - 0.9 },
      ext: { width: 72, height: 54 },
      editAs: "oneCell",
    });
  } catch {
    // مرجع الصورة يبقى محفوظًا حتى إن تعذر تضمين المصغّر.
  }
}

export async function workbookToBuffer(workbook: ExcelJS.Workbook) {
  return Buffer.from(await workbook.xlsx.writeBuffer());
}
