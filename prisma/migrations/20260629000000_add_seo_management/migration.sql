-- Add optional SEO fields without replacing any existing catalog data.
ALTER TABLE "Product"
ADD COLUMN "seoTitle" TEXT,
ADD COLUMN "seoDescription" TEXT,
ADD COLUMN "canonicalUrl" TEXT,
ADD COLUMN "seoIndexable" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "ogTitle" TEXT,
ADD COLUMN "ogDescription" TEXT,
ADD COLUMN "ogImage" TEXT,
ADD COLUMN "seoImageAlt" TEXT;

ALTER TABLE "Category"
ADD COLUMN "seoTitle" TEXT,
ADD COLUMN "seoDescription" TEXT,
ADD COLUMN "canonicalUrl" TEXT,
ADD COLUMN "seoIndexable" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "ogTitle" TEXT,
ADD COLUMN "ogDescription" TEXT,
ADD COLUMN "ogImage" TEXT,
ADD COLUMN "seoImageAlt" TEXT;

CREATE TABLE "PageSeo" (
    "path" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "canonicalUrl" TEXT,
    "seoIndexable" BOOLEAN NOT NULL DEFAULT true,
    "ogTitle" TEXT,
    "ogDescription" TEXT,
    "ogImage" TEXT,
    "seoImageAlt" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PageSeo_pkey" PRIMARY KEY ("path")
);

CREATE TABLE "SlugRedirect" (
    "id" TEXT NOT NULL,
    "sourcePath" TEXT NOT NULL,
    "destinationPath" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SlugRedirect_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SlugRedirect_sourcePath_key" ON "SlugRedirect"("sourcePath");

-- Replace legacy generic symbols with explicit equipment illustration keys.
UPDATE "Category"
SET "icon" = CASE "icon"
    WHEN 'flame' THEN 'commercial-oven'
    WHEN 'wheat' THEN 'spiral-mixer'
    WHEN 'coffee' THEN 'espresso-machine'
    WHEN 'snowflake' THEN 'upright-fridge'
    WHEN 'cooking-pot' THEN 'food-processor'
    WHEN 'washing-machine' THEN 'dishwasher'
    WHEN 'utensils' THEN 'buffet-counter'
    WHEN 'panel' THEN CASE
        WHEN "slug" = 'packaging' THEN 'vacuum-sealer'
        ELSE 'stainless-sink'
    END
    ELSE "icon"
END;

INSERT INTO "PageSeo" ("path", "label", "updatedAt") VALUES
('/', 'الصفحة الرئيسية', CURRENT_TIMESTAMP),
('/shop', 'المتجر', CURRENT_TIMESTAMP),
('/categories', 'الأقسام', CURRENT_TIMESTAMP),
('/stainless', 'تصنيع الستانلس', CURRENT_TIMESTAMP),
('/project-solutions', 'تجهيز المشاريع', CURRENT_TIMESTAMP),
('/brands', 'العلامات التجارية', CURRENT_TIMESTAMP),
('/projects', 'المشاريع السابقة', CURRENT_TIMESTAMP),
('/maintenance', 'الصيانة والضمان', CURRENT_TIMESTAMP),
('/about', 'من نحن', CURRENT_TIMESTAMP),
('/contact', 'تواصل معنا', CURRENT_TIMESTAMP),
('/quote', 'طلب عرض سعر', CURRENT_TIMESTAMP),
('/account', 'الحساب', CURRENT_TIMESTAMP),
('/favorites', 'المفضلة', CURRENT_TIMESTAMP),
('/cart', 'السلة', CURRENT_TIMESTAMP),
('/compare', 'مقارنة المنتجات', CURRENT_TIMESTAMP);
