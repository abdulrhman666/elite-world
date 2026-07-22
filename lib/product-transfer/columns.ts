export const CLEAR_VALUE = "__CLEAR__";

export const PRODUCT_TRANSFER_COLUMNS = [
  ["id", "Product ID", 28],
  ["sku", "SKU", 18],
  ["nameAr", "الاسم العربي", 32],
  ["nameEn", "الاسم الإنجليزي", 30],
  ["slug", "Slug", 32],
  ["price", "السعر", 14],
  ["stockQuantity", "المخزون", 12],
  ["availability", "التوفر", 16],
  ["categorySlug", "Slug التصنيف", 22],
  ["categoryName", "اسم التصنيف", 24],
  ["subcategorySlug", "Slug التصنيف الفرعي", 24],
  ["brandName", "الماركة", 22],
  ["model", "الموديل", 18],
  ["origin", "بلد المنشأ", 18],
  ["shortDescription", "الوصف المختصر", 42],
  ["description", "الوصف الكامل", 55],
  ["leadTime", "مدة التوريد", 18],
  ["warranty", "الضمان", 18],
  ["imageUrl", "مرجع الصورة الرئيسية", 44],
  ["image1", "صورة إضافية 1", 38],
  ["image2", "صورة إضافية 2", 38],
  ["image3", "صورة إضافية 3", 38],
  ["imageFilename", "اسم صورة ZIP", 28],
  ["features", "المميزات | مفصولة", 40],
  ["uses", "الاستخدامات | مفصولة", 40],
  ["specifications", "المواصفات JSON", 55],
  ["technicalFile", "الملف الفني", 36],
  ["badge", "الشارة", 18],
  ["featured", "منتج مميز", 14],
  ["sortOrder", "الترتيب", 12],
  ["seoTitle", "SEO Title", 34],
  ["seoDescription", "SEO Description", 48],
  ["canonicalUrl", "Canonical URL", 36],
  ["seoIndexable", "SEO قابل للفهرسة", 18],
  ["ogTitle", "OG Title", 34],
  ["ogDescription", "OG Description", 48],
  ["ogImage", "OG Image", 38],
  ["seoImageAlt", "وصف صورة SEO", 32],
  ["sourceCreatedAt", "تاريخ المصدر", 18],
  ["updatedAt", "آخر تحديث (للقراءة)", 22],
] as const;

export type ProductTransferKey = (typeof PRODUCT_TRANSFER_COLUMNS)[number][0];
export type ProductTransferRow = Record<
  ProductTransferKey,
  string | number | boolean | null
>;

export const REQUIRED_NEW_FIELDS: ProductTransferKey[] = [
  "sku",
  "nameAr",
  "nameEn",
  "slug",
  "categorySlug",
  "subcategorySlug",
  "brandName",
  "model",
  "origin",
  "shortDescription",
  "description",
  "leadTime",
  "warranty",
];

export const CLEARABLE_FIELDS = new Set<ProductTransferKey>([
  "price",
  "technicalFile",
  "badge",
  "seoTitle",
  "seoDescription",
  "canonicalUrl",
  "ogTitle",
  "ogDescription",
  "ogImage",
  "seoImageAlt",
]);
