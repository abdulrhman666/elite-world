-- نظام الأنشطة: جداول إضافية فقط، دون تغيير أو حذف بيانات الكتالوج الحالية.
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "eyebrow" TEXT NOT NULL,
    "heroTitle" TEXT NOT NULL,
    "heroDescription" TEXT NOT NULL,
    "introduction" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "primaryCtaText" TEXT NOT NULL DEFAULT 'اطلب عرض تجهيز كامل',
    "published" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "canonicalUrl" TEXT,
    "seoIndexable" BOOLEAN NOT NULL DEFAULT true,
    "ogTitle" TEXT,
    "ogDescription" TEXT,
    "ogImage" TEXT,
    "seoImageAlt" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ActivityProduct" (
    "activityId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "equipmentGroup" TEXT NOT NULL,
    "essential" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "ActivityProduct_pkey" PRIMARY KEY ("activityId", "productId")
);

CREATE UNIQUE INDEX "Activity_slug_key" ON "Activity"("slug");
CREATE INDEX "Activity_published_sortOrder_idx" ON "Activity"("published", "sortOrder");
CREATE INDEX "ActivityProduct_productId_idx" ON "ActivityProduct"("productId");
CREATE INDEX "ActivityProduct_activityId_equipmentGroup_essential_sortOrder_idx" ON "ActivityProduct"("activityId", "equipmentGroup", "essential", "sortOrder");

ALTER TABLE "ActivityProduct" ADD CONSTRAINT "ActivityProduct_activityId_fkey"
  FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ActivityProduct" ADD CONSTRAINT "ActivityProduct_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "Activity" (
  "id", "slug", "name", "eyebrow", "heroTitle", "heroDescription", "introduction", "image",
  "primaryCtaText", "published", "sortOrder", "seoTitle", "seoDescription", "canonicalUrl",
  "seoIndexable", "ogTitle", "ogDescription", "ogImage", "seoImageAlt"
) VALUES (
  'activity_burger_restaurant',
  'burger-restaurant',
  'مطعم برجر',
  'جهّز مشروعك مع عالم النخبة',
  'تجهيز مطعم برجر متكامل',
  'حلول عملية لمطبخ برجر سريع ومنظم، من خط الطبخ والتحضير إلى التبريد والغسيل والستانلس.',
  'نجاح مطعم البرجر يبدأ بخط تشغيل متوازن يقلل الحركة والهدر ويحافظ على جودة المنتج في أوقات الذروة. جمعنا هنا المعدات الأساسية والمكملة لتكوين تصور واضح، مع إمكانية تخصيص التجهيز حسب المساحة والطاقة الإنتاجية والميزانية.',
  '/images/hero-industrial-kitchen.png',
  'اطلب عرض تجهيز كامل',
  true,
  10,
  'تجهيز مطعم برجر بالرياض | معدات مطاعم برجر | عالم النخبة',
  'جهّز مطعم برجر احترافي في الرياض مع معدات الطبخ والتبريد والتحضير والستانلس والغسيل، واطلب عرض تجهيز متكامل من عالم النخبة.',
  '/activities/burger-restaurant',
  true,
  'تجهيز مطعم برجر متكامل | عالم النخبة',
  'معدات وحلول متكاملة لتجهيز مطاعم البرجر بالرياض حسب المساحة والطاقة التشغيلية.',
  '/images/hero-industrial-kitchen.png',
  'معدات تجهيز مطعم برجر من عالم النخبة'
) ON CONFLICT ("slug") DO NOTHING;

INSERT INTO "ActivityProduct" ("activityId", "productId", "equipmentGroup", "essential", "sortOrder")
SELECT 'activity_burger_restaurant', "id",
  CASE
    WHEN "sku" IN ('EW-QT-0056', 'EW-QT-0132') THEN 'الطبخ'
    WHEN "sku" IN ('EW-QT-0073', 'EW-QT-0051') THEN 'التبريد'
    WHEN "sku" IN ('EW-QT-0061', 'EW-QT-0083') THEN 'التحضير'
    WHEN "sku" IN ('EW-QT-0038', 'EW-QT-0027') THEN 'الستانلس'
    ELSE 'الغسيل والتخزين'
  END,
  "sku" IN ('EW-QT-0056', 'EW-QT-0132', 'EW-QT-0073', 'EW-QT-0061', 'EW-QT-0038', 'EW-QT-0034'),
  CASE "sku"
    WHEN 'EW-QT-0132' THEN 10 WHEN 'EW-QT-0056' THEN 20
    WHEN 'EW-QT-0073' THEN 30 WHEN 'EW-QT-0051' THEN 40
    WHEN 'EW-QT-0061' THEN 50 WHEN 'EW-QT-0083' THEN 60
    WHEN 'EW-QT-0038' THEN 70 WHEN 'EW-QT-0027' THEN 80
    WHEN 'EW-QT-0034' THEN 90 WHEN 'EW-QT-0036' THEN 100
    ELSE 999
  END
FROM "Product"
WHERE "sku" IN (
  'EW-QT-0132', 'EW-QT-0056', 'EW-QT-0073', 'EW-QT-0051', 'EW-QT-0061',
  'EW-QT-0083', 'EW-QT-0038', 'EW-QT-0027', 'EW-QT-0034', 'EW-QT-0036'
)
ON CONFLICT ("activityId", "productId") DO NOTHING;
