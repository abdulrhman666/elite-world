import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { parse } from "csv-parse/sync";
import { catalogCategories as categoryMetadata } from "@/data/categories";
import type { Category, Product } from "@/types";

export const DEFAULT_CATALOG_CSV_PATH = path.join(
  process.cwd(),
  "data/import/elite_world_products_catalog.csv",
);

type CsvRow = Record<string, string | undefined>;

export type CatalogImportReport = {
  sourceFile: string;
  sourceRows: number;
  acceptedProducts: number;
  excludedRows: Array<{ row: number; sku: string; reasons: string[] }>;
  potentialDuplicates: Array<{
    row: number;
    sku: string;
    slug: string;
    reference: string;
  }>;
  missingFields: Record<string, number>;
  missingImageFiles: number;
  missingDatasheetFiles: number;
  categoryCounts: Record<string, number>;
};

export type CatalogImportResult = {
  categories: Category[];
  products: Product[];
  report: CatalogImportReport;
};

const missingValues = new Set(["", "غير مذكور", "غير محدد"]);

const specificationFields: Array<[keyof CsvRow, string]> = [
  ["dimensions", "الأبعاد"],
  ["voltage", "الجهد"],
  ["frequency", "التردد"],
  ["phase", "عدد الفازات"],
  ["power", "القدرة"],
  ["capacity", "السعة"],
  ["temperature_range", "نطاق الحرارة"],
  ["productivity", "الطاقة الإنتاجية"],
  ["material", "الخامة"],
  ["stainless_grade", "نوع الستانلس"],
];

function clean(value: string | undefined) {
  return (value ?? "").trim();
}

function hasValue(value: string | undefined) {
  return !missingValues.has(clean(value));
}

function placeholder(value: string | undefined, fallback = "غير مذكور") {
  return hasValue(value) ? clean(value) : fallback;
}

function stableSubcategorySlug(name: string) {
  let hash = 2166136261;
  for (const character of name) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return `subcategory-${(hash >>> 0).toString(36)}`;
}

function parsePrice(row: CsvRow) {
  if (clean(row.price_type) !== "fixed" || !hasValue(row.price_sar)) {
    return null;
  }
  const price = Number(clean(row.price_sar).replace(/[\s,]/g, ""));
  return Number.isFinite(price) && price > 0 ? price : null;
}

function mapAvailability(value: string | undefined): Product["availability"] {
  const normalized = clean(value).toLowerCase();
  return /^(in-stock|in stock|متوفر)$/.test(normalized)
    ? "in-stock"
    : "on-request";
}

async function existingPublicFile(
  publicDirectory: string,
  folder: string,
  filename: string | undefined,
) {
  if (!hasValue(filename)) return null;
  const safeFilename = path.basename(clean(filename));
  try {
    await access(path.join(publicDirectory, folder, safeFilename));
    return `/${folder}/${safeFilename}`;
  } catch {
    return null;
  }
}

export async function importCatalogCsv({
  csvPath = DEFAULT_CATALOG_CSV_PATH,
  publicDirectory = path.join(process.cwd(), "public"),
}: {
  csvPath?: string;
  publicDirectory?: string;
} = {}): Promise<CatalogImportResult> {
  const csvText = await readFile(csvPath, "utf8");
  const rows = parse(csvText, {
    bom: true,
    columns: true,
    delimiter: ";",
    relax_column_count: true,
    skip_empty_lines: false,
    trim: true,
  }) as CsvRow[];

  const nonEmptyRows = rows.filter((row) =>
    Object.values(row).some((value) => clean(value).length > 0),
  );
  const excludedRows: CatalogImportReport["excludedRows"] = [];
  const potentialDuplicates: CatalogImportReport["potentialDuplicates"] = [];
  const acceptedRows: Array<{ row: CsvRow; rowNumber: number }> = [];
  const seenSkus = new Set<string>();
  const seenSlugs = new Set<string>();

  for (const [index, row] of nonEmptyRows.entries()) {
    const rowNumber = Number(clean(row.source_no)) || index + 2;
    const sku = clean(row.sku);
    const slug = clean(row.slug);
    const reasons: string[] = [];

    if (clean(row.status).toLowerCase() !== "active") {
      reasons.push("الحالة ليست active");
    }
    if (!sku) reasons.push("SKU مفقود");
    if (!slug) reasons.push("Slug مفقود");
    if (!clean(row.name_ar)) reasons.push("الاسم العربي مفقود");
    if (!clean(row.category_slug)) reasons.push("Slug القسم مفقود");
    if (sku && seenSkus.has(sku)) reasons.push("SKU مكرر");
    if (slug && seenSlugs.has(slug)) reasons.push("Slug مكرر");

    if (hasValue(row.possible_duplicate_of)) {
      potentialDuplicates.push({
        row: rowNumber,
        sku,
        slug,
        reference: clean(row.possible_duplicate_of),
      });
    }

    if (reasons.length > 0) {
      excludedRows.push({ row: rowNumber, sku, reasons });
      continue;
    }

    seenSkus.add(sku);
    seenSlugs.add(slug);
    acceptedRows.push({ row, rowNumber });
  }

  const missingFieldNames = [
    "name_en",
    "brand",
    "model",
    "country_of_origin",
    "price_sar",
    "availability",
    "warranty",
    "image_filename",
    "datasheet_filename",
  ] as const;
  const missingFields = Object.fromEntries(
    missingFieldNames.map((field) => [
      field,
      acceptedRows.filter(({ row }) => !hasValue(row[field])).length,
    ]),
  );

  const preparedProducts = await Promise.all(
    acceptedRows.map(async ({ row }, index) => {
      const categorySlug = clean(row.category_slug);
      const metadata = categoryMetadata.find(
        (category) => category.slug === categorySlug,
      );
      const image = await existingPublicFile(
        publicDirectory,
        "images/products",
        row.image_filename,
      );
      const additionalImages = (
        await Promise.all(
          clean(row.additional_image_filenames)
            .split("|")
            .map((filename) => filename.trim())
            .filter(Boolean)
            .map((filename) =>
              existingPublicFile(publicDirectory, "images/products", filename),
            ),
        )
      ).filter((imagePath): imagePath is string => Boolean(imagePath));
      const technicalFile = await existingPublicFile(
        publicDirectory,
        "datasheets",
        row.datasheet_filename,
      );
      const subcategoryName = placeholder(row.subcategory, "غير مصنف");

      const availability = mapAvailability(row.availability);
      const product: Product = {
        nameAr: clean(row.name_ar),
        nameEn: placeholder(row.name_en, "Not provided"),
        slug: clean(row.slug),
        sku: clean(row.sku),
        model: placeholder(row.model),
        categorySlug,
        subcategorySlug: stableSubcategorySlug(subcategoryName),
        brand: placeholder(row.brand, "غير محدد"),
        origin: placeholder(row.country_of_origin),
        shortDescription: placeholder(
          row.short_description_ar,
          "الوصف المختصر غير متوفر.",
        ),
        description: placeholder(
          row.full_description_ar,
          placeholder(row.short_description_ar, "الوصف غير متوفر."),
        ),
        price: parsePrice(row),
        stockQuantity: availability === "in-stock" ? 1 : 0,
        availability,
        leadTime: "غير محدد",
        warranty: placeholder(row.warranty),
        image: image ?? metadata?.image ?? "/images/equipment-blueprint.svg",
        imageAlt: `صورة المنتج ${clean(row.name_ar)}`,
        additionalImages,
        additionalImageAlts: Object.fromEntries(
          additionalImages.map((imagePath, imageIndex) => [
            imagePath,
            `صورة إضافية ${imageIndex + 1} للمنتج ${clean(row.name_ar)}`,
          ]),
        ),
        featured: index < 8,
        createdAt: "2026-06-28",
        features: [],
        uses: [],
        specifications: specificationFields.flatMap(([field, label]) =>
          hasValue(row[field]) ? [{ label, value: clean(row[field]) }] : [],
        ),
        technicalFile,
      };

      return {
        product,
        categoryName: placeholder(row.category, categorySlug),
        subcategoryName,
        hasImage: Boolean(image),
        hasDatasheet: Boolean(technicalFile),
        expectedDatasheet: hasValue(row.datasheet_filename),
      };
    }),
  );

  const categoryCounts: Record<string, number> = {};
  const subcategories = new Map<string, Map<string, string>>();
  for (const item of preparedProducts) {
    const slug = item.product.categorySlug;
    categoryCounts[slug] = (categoryCounts[slug] ?? 0) + 1;
    const categorySubcategories =
      subcategories.get(slug) ?? new Map<string, string>();
    categorySubcategories.set(
      item.product.subcategorySlug,
      item.subcategoryName,
    );
    subcategories.set(slug, categorySubcategories);
  }

  const sourceCategoryNames = new Map(
    preparedProducts.map((item) => [
      item.product.categorySlug,
      item.categoryName,
    ]),
  );
  const categories = [...sourceCategoryNames].map(([slug, name]) => {
    const metadata = categoryMetadata.find(
      (category) => category.slug === slug,
    );
    return {
      slug,
      name,
      nameEn: metadata?.nameEn ?? name,
      description:
        metadata?.description ?? `منتجات ${name} المستوردة من ملف الكتالوج.`,
      image: metadata?.image ?? "/images/equipment-blueprint.svg",
      icon: metadata?.icon ?? "panel",
      subcategories: [...(subcategories.get(slug) ?? [])].map(
        ([subcategorySlug, subcategoryName]) => ({
          slug: subcategorySlug,
          name: subcategoryName,
        }),
      ),
    } satisfies Category;
  });

  return {
    categories,
    products: preparedProducts.map((item) => item.product),
    report: {
      sourceFile: path.basename(csvPath),
      sourceRows: rows.length,
      acceptedProducts: preparedProducts.length,
      excludedRows,
      potentialDuplicates,
      missingFields,
      missingImageFiles: preparedProducts.filter((item) => !item.hasImage)
        .length,
      missingDatasheetFiles: preparedProducts.filter(
        (item) => item.expectedDatasheet && !item.hasDatasheet,
      ).length,
      categoryCounts,
    },
  };
}

export function formatCatalogImportReport(report: CatalogImportReport) {
  const missingFields = Object.entries(report.missingFields)
    .map(([field, count]) => `| \`${field}\` | ${count} |`)
    .join("\n");
  const categoryCounts = Object.entries(report.categoryCounts)
    .map(([category, count]) => `| \`${category}\` | ${count} |`)
    .join("\n");
  const excluded = report.excludedRows.length
    ? report.excludedRows
        .map(
          (row) =>
            `- الصف ${row.row} (${row.sku || "بدون SKU"}): ${row.reasons.join("، ")}`,
        )
        .join("\n")
    : "- لا توجد صفوف مستبعدة.";
  const duplicates = report.potentialDuplicates.length
    ? report.potentialDuplicates
        .map(
          (row) =>
            `- الصف ${row.row}: \`${row.sku}\` / \`${row.slug}\` — مرجع محتمل ${row.reference}.`,
        )
        .join("\n")
    : "- لا توجد تكرارات محتملة معلّمة في المصدر.";

  return `# تقرير استيراد كتالوج ELITE WORLD

- المصدر: \`${report.sourceFile}\`
- صفوف المصدر: ${report.sourceRows}
- المنتجات المقبولة: ${report.acceptedProducts}
- الصفوف المستبعدة: ${report.excludedRows.length}
- التكرارات المحتملة: ${report.potentialDuplicates.length}
- الصور المحلية المفقودة: ${report.missingImageFiles}
- الملفات الفنية المحلية المفقودة: ${report.missingDatasheetFiles}

## الأقسام

| Slug | المنتجات |
| --- | ---: |
${categoryCounts}

## الحقول الناقصة أو غير المحددة

| الحقل | العدد |
| --- | ---: |
${missingFields}

## الصفوف المستبعدة

${excluded}

## التكرارات المحتملة

${duplicates}
`;
}
