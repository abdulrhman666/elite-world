import { describe, expect, it } from "vitest";
import { mainNavigation, siteConfig } from "../config/site";
import { editableContentPageSlugs } from "../data/content-pages";
import { placeholderPages } from "../data/pages";
import {
  filterCatalogProducts,
  normalizeArabic,
  suggestCatalogProducts,
} from "../lib/catalog";
import { importCatalogCsv } from "../lib/catalog/csv-import";
import {
  createAdminSessionToken,
  verifyAdminSessionToken,
} from "../lib/admin/session-token";
import {
  createCustomerSessionToken,
  verifyCustomerSessionToken,
} from "../lib/auth/session-token";
import { normalizeAdminPage } from "../lib/admin/pagination";
import { cn, formatCurrentYear } from "../lib/utils";
import {
  categoryIconOptions,
  getCategoryIconSource,
} from "../lib/category-icons";
import { buildSeoMetadata } from "../lib/seo/metadata";
import { orderSourceLabel } from "../lib/commerce/status";
import { getWhatsAppInquiryUrl } from "../lib/whatsapp";
import {
  MAX_IMAGE_SIZE_BYTES,
  MAX_PDF_SIZE_BYTES,
  hasPdfSignature,
  validateImageFileMetadata,
  validatePdfFileMetadata,
} from "../lib/storage/storage-adapter";
import {
  assertQuoteConvertible,
  generateReferenceNumber,
  generateTrackingToken,
  normalizeRequestedItems,
} from "../lib/commerce/domain";

const importedCatalog = importCatalogCsv();

const filterProducts = async (
  filters: Omit<
    Parameters<typeof filterCatalogProducts>[0],
    "products" | "categories"
  > = {},
) => {
  const { products, categories } = await importedCatalog;
  return filterCatalogProducts({
    products,
    categories,
    ...filters,
  });
};

describe("كتالوج CSV", () => {
  it("يطبع رقم صفحة الإدارة ضمن حدود آمنة", () => {
    expect(normalizeAdminPage("3")).toBe(3);
    expect(normalizeAdminPage("0")).toBe(1);
    expect(normalizeAdminPage("invalid")).toBe(1);
  });

  it("يوقّع جلسة العميل ويرفض العبث بها", () => {
    const secret = "customer-session-secret-with-at-least-32-characters";
    const token = createCustomerSessionToken(
      { userId: "customer-1", email: "buyer@example.com", expiresAt: 5000 },
      secret,
    );
    expect(verifyCustomerSessionToken(token, secret, 1000)?.userId).toBe(
      "customer-1",
    );
    expect(verifyCustomerSessionToken(`${token}x`, secret, 1000)).toBeNull();
  });

  it("يستخدم رسومات معدات واضحة ومحدودة للأقسام", () => {
    expect(categoryIconOptions).toHaveLength(9);
    expect(getCategoryIconSource("commercial-oven")).toBe(
      "/images/category-icons/commercial-oven.svg",
    );
    expect(getCategoryIconSource("flame")).toBe(
      "/images/category-icons/commercial-oven.svg",
    );
  });

  it("يستخدم قيم SEO التلقائية ويطبق noindex عند الطلب", () => {
    const metadata = buildSeoMetadata({
      fallbackTitle: "عنوان تلقائي",
      fallbackDescription: "وصف تلقائي",
      defaultPath: "/shop",
      forceNoIndex: true,
    });
    expect(metadata.title).toEqual({ absolute: "عنوان تلقائي" });
    expect(metadata.description).toBe("وصف تلقائي");
    expect(metadata.robots).toMatchObject({ index: false, follow: false });
  });

  it("يتحقق من نوع الصورة وحد 8 MB قبل الرفع", () => {
    expect(
      validateImageFileMetadata({ type: "image/jpeg", size: 1024 }),
    ).toBeNull();
    expect(
      validateImageFileMetadata({ type: "image/gif", size: 1024 }),
    ).toContain("JPG");
    expect(
      validateImageFileMetadata({
        type: "image/png",
        size: MAX_IMAGE_SIZE_BYTES + 1,
      }),
    ).toContain("8 MB");
  });

  it("ينشئ طلب عرض صالحاً بمنتجات وكميات ورقم آمن", () => {
    const items = normalizeRequestedItems([
      { slug: "commercial-oven", quantity: 2 },
      { slug: "commercial-oven", quantity: 1 },
    ]);
    expect(items).toEqual([{ slug: "commercial-oven", quantity: 3 }]);
    expect(generateReferenceNumber("Q")).toMatch(/^Q-\d{8}-[A-F0-9]{6}$/);
    expect(generateReferenceNumber("O")).toMatch(/^O-\d{8}-[A-F0-9]{6}$/);
    expect(generateReferenceNumber("D")).toMatch(/^D-\d{8}-[A-F0-9]{6}$/);
    expect(orderSourceLabel("DIRECT")).toBe("طلب مباشر");
    expect(generateTrackingToken()).toMatch(/^[A-Za-z0-9_-]{40,80}$/);
  });

  it("يسمح بتحويل العرض مرة واحدة ويتحقق من PDF", () => {
    expect(() => assertQuoteConvertible({ hasOrder: false })).not.toThrow();
    expect(() => assertQuoteConvertible({ hasOrder: true })).toThrow(
      "ALREADY_CONVERTED",
    );
    expect(
      validatePdfFileMetadata({
        name: "invoice.pdf",
        type: "application/pdf",
        size: MAX_PDF_SIZE_BYTES,
      }),
    ).toBeNull();
    expect(hasPdfSignature(new TextEncoder().encode("%PDF-1.7"))).toBe(true);
  });

  it("يوقّع جلسة الإدارة ويرفض العبث والانتهاء", () => {
    const secret = "a-secure-test-secret-with-at-least-32-characters";
    const expiresAt = Date.now() + 60_000;
    const token = createAdminSessionToken(
      "admin@example.com",
      "SUPER_ADMIN",
      secret,
      expiresAt,
    );
    expect(verifyAdminSessionToken(token, secret)?.email).toBe(
      "admin@example.com",
    );
    expect(verifyAdminSessionToken(token, secret)?.role).toBe("SUPER_ADMIN");
    expect(verifyAdminSessionToken(`${token}x`, secret)).toBeNull();
    expect(verifyAdminSessionToken(token, secret, expiresAt + 1)).toBeNull();
  });

  it("يستورد المنتجات الصالحة ويصدر تقريراً واضحاً", async () => {
    const { categories, products, report } = await importedCatalog;
    expect(categories).toHaveLength(9);
    expect(products).toHaveLength(214);
    expect(products.filter((product) => product.featured)).toHaveLength(8);
    expect(report.acceptedProducts).toBe(214);
    expect(report.excludedRows).toHaveLength(0);
    expect(report.potentialDuplicates).toHaveLength(4);
  });

  it("يحافظ على Slug وSKU فريدين دون اختراع أسعار", async () => {
    const { categories, products } = await importedCatalog;
    expect(new Set(products.map((product) => product.slug)).size).toBe(
      products.length,
    );
    expect(new Set(products.map((product) => product.sku)).size).toBe(
      products.length,
    );
    expect(products.filter((product) => product.price === null)).toHaveLength(
      211,
    );
    for (const product of products) {
      expect(
        categories.some((category) => category.slug === product.categorySlug),
      ).toBe(true);
      expect(product.price === null || product.price > 0).toBe(true);
    }
  });

  it("يبحث عربياً وبالرموز ويطبق الفلاتر", async () => {
    expect(normalizeArabic("  إسبريسو   احترافية ")).toBe("اسبريسو احترافية");
    expect(
      (await filterProducts({ query: "فرن كونفكشن" })).length,
    ).toBeGreaterThan(0);
    expect(await filterProducts({ query: "EW-QT-0005" })).toHaveLength(1);
    expect(await filterProducts({ category: "stainless-steel" })).toHaveLength(
      26,
    );
    expect(
      (await filterProducts({ availability: "on-request" })).every(
        (product) => product.availability === "on-request",
      ),
    ).toBe(true);
  });

  it("يقدم اقتراحات بحث محلية خفيفة", async () => {
    const { products } = await importedCatalog;
    const product = products[0];
    expect(
      suggestCatalogProducts(products, product.nameEn.slice(0, -1)),
    ).toContain(product.nameAr);
  });

  it("لا ينشئ رابط واتساب لرقم Placeholder", () => {
    expect(
      getWhatsAppInquiryUrl({
        whatsapp: "[أدخل رقم واتساب]",
        productName: "منتج تجريبي",
        model: "DEMO-1",
        productUrl: "https://example.com/products/demo",
      }),
    ).toBeNull();
    expect(
      getWhatsAppInquiryUrl({
        whatsapp: "+966500000000",
        productName: "منتج تجريبي",
        model: "DEMO-1",
        productUrl: "https://example.com/products/demo",
      }),
    ).toContain("https://wa.me/966500000000?text=");
  });

  it("يغطي روابط التنقل ويحتفظ بالإعدادات الأساسية", () => {
    const implementedRoutes = new Set([
      "shop",
      "categories",
      "cart",
      "blog",
      ...editableContentPageSlugs,
    ]);
    for (const item of mainNavigation.filter((item) => item.href !== "/")) {
      const slug = item.href.slice(1);
      expect(
        Boolean(placeholderPages[slug]) || implementedRoutes.has(slug),
      ).toBe(true);
    }
    expect(siteConfig.currency).toBe("SAR");
    expect(siteConfig.vat).toBe(0.15);
    expect(cn("a", false, "b", undefined)).toBe("a b");
    expect(formatCurrentYear()).toMatch(/\d{4}/);
  });
});
