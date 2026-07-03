"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import {
  clearAdminSession,
  createAdminSession,
  getAdminAuthConfig,
  getAdminSession,
  validateAdminCredentials,
} from "@/lib/admin/auth";
import {
  createAdminBrand,
  createAdminCategory,
  createAdminProduct,
  deleteAdminBrand,
  deleteAdminCategory,
  deleteAdminProduct,
  updateAdminBrand,
  updateAdminCategory,
  updateAdminProduct,
  type AdminBrandInput,
  type AdminCategoryInput,
  type AdminProductInput,
} from "@/lib/admin/catalog-admin";
import {
  deleteProductImage,
  moveProductImage,
  setPrimaryProductImage,
  updateProductImageAlt,
  uploadProductImages,
} from "@/lib/admin/media-admin";
import {
  restoreDefaultSiteSettings,
  updateSiteSettings,
} from "@/lib/admin/site-settings-admin";
import {
  restoreDefaultContentPage,
  updateAdminContentPage,
} from "@/lib/admin/content-pages-admin";
import {
  getSeoAssistant,
  SeoAssistantUnavailableError,
} from "@/lib/ai/seo-assistant";
import { ImageStorageError } from "@/lib/storage/local-storage-adapter";
import { isValidCategoryIconValue } from "@/lib/category-icons";
import { updatePageSeo } from "@/lib/seo/page-seo";
import { isPlaceholderValue } from "@/lib/whatsapp";
import type { SeoFormValues, SeoSuggestionInput } from "@/types/seo";
import type { SiteSettingsData } from "@/types/site-settings";
import type { ContentPageData, ContentPageSection } from "@/types/content-page";

export async function loginAdminAction(formData: FormData) {
  const config = getAdminAuthConfig();
  if (!config.configured) redirect("/admin/login?error=config");
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const admin = await validateAdminCredentials(email, password);
  if (!admin) {
    redirect("/admin/login?error=credentials");
  }
  await createAdminSession(admin.email, admin.role);
  redirect("/admin");
}

export async function logoutAdminAction() {
  await clearAdminSession();
  redirect("/admin/login?success=logout");
}

async function requireAdminAction() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login?error=session");
  return session;
}

async function requireSuperAdminAction() {
  const session = await requireAdminAction();
  if (session.role !== "SUPER_ADMIN") redirect("/admin?error=forbidden");
  return session;
}

function requiredText(formData: FormData, name: string, label: string) {
  const value = String(formData.get(name) ?? "").trim();
  if (!value) throw new Error(`الحقل «${label}» مطلوب.`);
  return value;
}

function optionalLimitedText(
  formData: FormData,
  name: string,
  label: string,
  maximum: number,
) {
  const value = String(formData.get(name) ?? "").trim();
  if (value.length > maximum) {
    throw new Error(`الحقل «${label}» يجب ألا يتجاوز ${maximum} حرفاً.`);
  }
  return value || null;
}

function parseSeoInput(formData: FormData): SeoFormValues {
  const canonicalUrl = optionalLimitedText(
    formData,
    "canonicalUrl",
    "Canonical URL",
    500,
  );
  if (
    canonicalUrl &&
    !canonicalUrl.startsWith("/") &&
    !/^https?:\/\/[^\s]+$/i.test(canonicalUrl)
  ) {
    throw new Error(
      "الحقل «Canonical URL» يجب أن يكون مساراً داخلياً أو رابطاً كاملاً.",
    );
  }
  const ogImage = optionalLimitedText(
    formData,
    "ogImage",
    "صورة Open Graph",
    500,
  );
  if (ogImage && (!ogImage.startsWith("/") || ogImage.includes(".."))) {
    throw new Error("اختر صورة Open Graph من مكتبة الوسائط.");
  }
  return {
    seoTitle: optionalLimitedText(formData, "seoTitle", "SEO Title", 90),
    seoDescription: optionalLimitedText(
      formData,
      "seoDescription",
      "Meta Description",
      220,
    ),
    canonicalUrl,
    seoIndexable: formData.get("seoIndexable") === "on",
    ogTitle: optionalLimitedText(formData, "ogTitle", "OG Title", 100),
    ogDescription: optionalLimitedText(
      formData,
      "ogDescription",
      "OG Description",
      240,
    ),
    ogImage,
    seoImageAlt: optionalLimitedText(formData, "seoImageAlt", "Alt Text", 180),
  };
}

function parseProductInput(formData: FormData): AdminProductInput {
  const slug = requiredText(formData, "slug", "Slug");
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new Error(
      "Slug يقبل الأحرف الإنجليزية الصغيرة والأرقام والشرطات فقط.",
    );
  }

  const priceMode = String(formData.get("priceMode") ?? "quote");
  const priceValue = String(formData.get("price") ?? "").trim();
  let price: number | null = null;
  if (priceMode === "fixed") {
    price = Number(priceValue);
    if (!Number.isFinite(price) || price <= 0) {
      throw new Error("أدخل سعراً صحيحاً أكبر من صفر أو اختر طلب عرض سعر.");
    }
  }

  const stockQuantity = Number(String(formData.get("stockQuantity") ?? "0"));
  if (!Number.isInteger(stockQuantity) || stockQuantity < 0) {
    throw new Error("كمية المخزون يجب أن تكون عدداً صحيحاً لا يقل عن صفر.");
  }

  const specificationFields = [
    ["spec_dimensions", "الأبعاد"],
    ["spec_capacity", "السعة"],
    ["spec_power", "القدرة"],
    ["spec_voltage", "الجهد"],
    ["spec_temperature", "نطاق الحرارة"],
    ["spec_material", "الخامة"],
  ] as const;

  return {
    nameAr: requiredText(formData, "nameAr", "الاسم العربي"),
    nameEn: requiredText(formData, "nameEn", "الاسم الإنجليزي"),
    slug,
    sku: requiredText(formData, "sku", "SKU"),
    model: requiredText(formData, "model", "الموديل"),
    categoryId: requiredText(formData, "categoryId", "القسم"),
    brandId: requiredText(formData, "brandId", "العلامة التجارية"),
    origin: requiredText(formData, "origin", "بلد المنشأ"),
    description: requiredText(formData, "description", "الوصف"),
    price,
    stockQuantity,
    warranty: requiredText(formData, "warranty", "الضمان"),
    image: requiredText(formData, "image", "مسار الصورة"),
    specifications: Object.fromEntries(
      specificationFields.map(([name, label]) => [
        label,
        String(formData.get(name) ?? "").trim(),
      ]),
    ),
    ...parseSeoInput(formData),
  };
}

function mutationErrorMessage(error: unknown) {
  if (error instanceof Error) {
    if (error.message === "READ_ONLY")
      return "قاعدة البيانات غير مفعلة للكتابة.";
    if (error.message === "CATEGORY_NOT_FOUND")
      return "القسم المحدد غير موجود.";
    if (error.message === "BRAND_NOT_FOUND")
      return "العلامة التجارية المحددة غير موجودة.";
    if (error.message === "CATEGORY_IN_USE")
      return "لا يمكن حذف القسم لأنه مرتبط بمنتجات.";
    if (error.message === "BRAND_IN_USE")
      return "لا يمكن حذف العلامة التجارية لأنها مرتبطة بمنتجات.";
    if (error.message === "PRODUCT_NOT_FOUND") return "المنتج غير موجود.";
    if (
      error.message.startsWith("الحقل") ||
      error.message.startsWith("اختر") ||
      error.message.includes("Slug")
    ) {
      return error.message;
    }
    if (error.message.includes("سعراً") || error.message.includes("المخزون")) {
      return error.message;
    }
  }
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  ) {
    return "يوجد منتج آخر يستخدم SKU أو Slug نفسه.";
  }
  return "تعذر حفظ التغيير. تحقق من اتصال قاعدة البيانات وحاول مرة أخرى.";
}

function revalidateCatalogViews() {
  updateTag("catalog");
  revalidatePath("/");
  revalidatePath("/shop");
  revalidatePath("/search");
  revalidatePath("/categories", "layout");
  revalidatePath("/products", "layout");
  revalidatePath("/sitemap.xml");
  revalidatePath("/admin", "layout");
  revalidatePath("/admin/seo");
}

export async function createProductAction(formData: FormData) {
  await requireAdminAction();
  let createdProductId = "";
  try {
    const input = parseProductInput(formData);
    const product = await createAdminProduct(input);
    createdProductId = product.id;
  } catch (error) {
    redirect(
      `/admin/products/new?error=${encodeURIComponent(mutationErrorMessage(error))}`,
    );
  }
  revalidateCatalogViews();
  redirect(
    `/admin/products/${encodeURIComponent(createdProductId)}/edit?success=created`,
  );
}

export async function updateProductAction(
  productId: string,
  formData: FormData,
) {
  await requireAdminAction();
  let previousSlug = "";
  let nextSlug = "";
  try {
    const input = parseProductInput(formData);
    const result = await updateAdminProduct(productId, input);
    previousSlug = result.previousSlug;
    nextSlug = result.product.slug;
  } catch (error) {
    redirect(
      `/admin/products/${encodeURIComponent(productId)}/edit?error=${encodeURIComponent(mutationErrorMessage(error))}`,
    );
  }
  revalidateCatalogViews();
  if (previousSlug) revalidatePath(`/products/${previousSlug}`);
  if (nextSlug) revalidatePath(`/products/${nextSlug}`);
  redirect("/admin/products?success=updated");
}

export async function deleteProductAction(productId: string) {
  await requireAdminAction();
  try {
    await deleteAdminProduct(productId);
  } catch (error) {
    redirect(
      `/admin/products?error=${encodeURIComponent(mutationErrorMessage(error))}`,
    );
  }
  revalidateCatalogViews();
  redirect("/admin/products?success=deleted");
}

function parseCategoryInput(formData: FormData): AdminCategoryInput {
  const slug = requiredText(formData, "slug", "Slug");
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new Error(
      "Slug يقبل الأحرف الإنجليزية الصغيرة والأرقام والشرطات فقط.",
    );
  }
  const sortOrder = Number(String(formData.get("sortOrder") ?? "0"));
  if (!Number.isInteger(sortOrder) || sortOrder < 0) {
    throw new Error(
      "ترتيب الظهور يجب أن يكون رقماً صحيحاً يساوي صفراً أو أكثر.",
    );
  }
  const icon = requiredText(formData, "icon", "أيقونة القسم");
  if (!isValidCategoryIconValue(icon)) {
    throw new Error("اختر أيقونة قسم واضحة من القائمة أو مكتبة الوسائط.");
  }
  return {
    name: requiredText(formData, "name", "الاسم العربي"),
    nameEn: requiredText(formData, "nameEn", "الاسم الإنجليزي"),
    slug,
    description: requiredText(formData, "description", "الوصف"),
    image: requiredText(formData, "image", "مسار الصورة"),
    icon,
    sortOrder,
    ...parseSeoInput(formData),
  };
}

function optionalText(formData: FormData, name: string) {
  const value = String(formData.get(name) ?? "").trim();
  return value || null;
}

function parseBrandInput(formData: FormData): AdminBrandInput {
  return {
    name: requiredText(formData, "name", "اسم العلامة التجارية"),
    origin: optionalText(formData, "origin"),
    description: optionalText(formData, "description"),
  };
}

function adminRecordError(error: unknown) {
  const message = mutationErrorMessage(error);
  if (message.includes("SKU")) {
    return "يوجد سجل آخر يستخدم الاسم أو Slug نفسه.";
  }
  if (
    error instanceof Error &&
    (error.message.includes("ترتيب") || error.message.startsWith("الحقل"))
  ) {
    return error.message;
  }
  return message;
}

export async function createCategoryAction(formData: FormData) {
  await requireAdminAction();
  try {
    await createAdminCategory(parseCategoryInput(formData));
  } catch (error) {
    redirect(
      `/admin/categories?error=${encodeURIComponent(adminRecordError(error))}`,
    );
  }
  revalidateCatalogViews();
  redirect("/admin/categories?success=created");
}

export async function updateCategoryAction(
  categoryId: string,
  formData: FormData,
) {
  await requireAdminAction();
  let previousSlug = "";
  let nextSlug = "";
  try {
    const result = await updateAdminCategory(
      categoryId,
      parseCategoryInput(formData),
    );
    previousSlug = result.previousSlug;
    nextSlug = result.category.slug;
  } catch (error) {
    redirect(
      `/admin/categories?error=${encodeURIComponent(adminRecordError(error))}`,
    );
  }
  revalidateCatalogViews();
  if (previousSlug) revalidatePath(`/categories/${previousSlug}`);
  if (nextSlug) revalidatePath(`/categories/${nextSlug}`);
  redirect("/admin/categories?success=updated");
}

export async function deleteCategoryAction(categoryId: string) {
  await requireAdminAction();
  try {
    await deleteAdminCategory(categoryId);
  } catch (error) {
    redirect(
      `/admin/categories?error=${encodeURIComponent(adminRecordError(error))}`,
    );
  }
  revalidateCatalogViews();
  redirect("/admin/categories?success=deleted");
}

export async function createBrandAction(formData: FormData) {
  await requireAdminAction();
  try {
    await createAdminBrand(parseBrandInput(formData));
  } catch (error) {
    redirect(
      `/admin/brands?error=${encodeURIComponent(adminRecordError(error))}`,
    );
  }
  revalidateCatalogViews();
  redirect("/admin/brands?success=created");
}

export async function updateBrandAction(brandId: string, formData: FormData) {
  await requireAdminAction();
  try {
    await updateAdminBrand(brandId, parseBrandInput(formData));
  } catch (error) {
    redirect(
      `/admin/brands?error=${encodeURIComponent(adminRecordError(error))}`,
    );
  }
  revalidateCatalogViews();
  redirect("/admin/brands?success=updated");
}

export async function deleteBrandAction(brandId: string) {
  await requireAdminAction();
  try {
    await deleteAdminBrand(brandId);
  } catch (error) {
    redirect(
      `/admin/brands?error=${encodeURIComponent(adminRecordError(error))}`,
    );
  }
  revalidateCatalogViews();
  redirect("/admin/brands?success=deleted");
}

function mediaErrorMessage(error: unknown) {
  if (error instanceof ImageStorageError) return error.message;
  if (error instanceof Error) {
    if (error.message === "READ_ONLY")
      return "قاعدة البيانات غير مفعلة للكتابة.";
    if (error.message === "INVALID_FILE_COUNT")
      return "اختر من صورة واحدة إلى 8 صور في كل عملية رفع.";
    if (error.message === "ALT_TEXT_ARABIC_REQUIRED")
      return "يجب كتابة Alt Text عربي واضح لكل صورة.";
    if (error.message === "IMAGE_NOT_FOUND") return "الصورة غير موجودة.";
    if (error.message === "PRODUCT_NOT_FOUND") return "المنتج غير موجود.";
    if (error.message === "DELETE_CONFIRMATION_REQUIRED")
      return "يجب تأكيد حذف الصورة المرتبطة بالمنتج.";
  }
  return "تعذرت معالجة الصورة. حاول مرة أخرى بملف صالح.";
}

function mediaRedirect(
  productId: string,
  type: "success" | "error",
  value: string,
) {
  return `/admin/products/${encodeURIComponent(productId)}/edit?${type}=${encodeURIComponent(value)}`;
}

export async function uploadProductImagesAction(
  productId: string,
  formData: FormData,
) {
  await requireAdminAction();
  const files = formData
    .getAll("files")
    .filter((value): value is File => value instanceof File && value.size > 0);
  const altTexts = files.map((_, index) =>
    String(formData.get(`altText_${index}`) ?? ""),
  );
  try {
    await uploadProductImages({
      productId,
      files,
      altTexts,
      makeFirstPrimary: formData.get("uploadMode") === "primary",
    });
  } catch (error) {
    redirect(mediaRedirect(productId, "error", mediaErrorMessage(error)));
  }
  revalidateCatalogViews();
  redirect(mediaRedirect(productId, "success", "images-uploaded"));
}

export async function updateProductImageAltAction(
  imageId: string,
  productId: string,
  formData: FormData,
) {
  await requireAdminAction();
  try {
    await updateProductImageAlt(imageId, String(formData.get("altText") ?? ""));
  } catch (error) {
    redirect(mediaRedirect(productId, "error", mediaErrorMessage(error)));
  }
  revalidateCatalogViews();
  redirect(mediaRedirect(productId, "success", "alt-updated"));
}

export async function setPrimaryProductImageAction(
  imageId: string,
  productId: string,
) {
  await requireAdminAction();
  try {
    await setPrimaryProductImage(imageId);
  } catch (error) {
    redirect(mediaRedirect(productId, "error", mediaErrorMessage(error)));
  }
  revalidateCatalogViews();
  redirect(mediaRedirect(productId, "success", "primary-updated"));
}

export async function moveProductImageAction(
  imageId: string,
  productId: string,
  direction: "up" | "down",
) {
  await requireAdminAction();
  try {
    await moveProductImage(imageId, direction);
  } catch (error) {
    redirect(mediaRedirect(productId, "error", mediaErrorMessage(error)));
  }
  revalidateCatalogViews();
  redirect(mediaRedirect(productId, "success", "order-updated"));
}

export async function deleteProductImageAction(
  imageId: string,
  productId: string,
  formData: FormData,
) {
  await requireAdminAction();
  const returnTo =
    formData.get("returnTo") === "media"
      ? "/admin/media"
      : `/admin/products/${encodeURIComponent(productId)}/edit`;
  try {
    await deleteProductImage(
      imageId,
      formData.get("confirmDelete") === "confirmed",
    );
  } catch (error) {
    redirect(
      `${returnTo}?error=${encodeURIComponent(mediaErrorMessage(error))}`,
    );
  }
  revalidateCatalogViews();
  redirect(`${returnTo}?success=image-deleted`);
}

function boundedText(
  formData: FormData,
  name: string,
  label: string,
  maximum: number,
) {
  const value = requiredText(formData, name, label);
  if (value.length > maximum) {
    throw new Error(`الحقل «${label}» يجب ألا يتجاوز ${maximum} حرفاً.`);
  }
  return value;
}

function validateEmail(value: string) {
  if (!isPlaceholderValue(value) && !/^\S+@\S+\.\S+$/.test(value)) {
    throw new Error("أدخل بريداً إلكترونياً صالحاً.");
  }
  return value;
}

function validatePhone(value: string, label: string, minimumDigits: number) {
  if (!isPlaceholderValue(value)) {
    const digits = value.replace(/\D/g, "");
    if (digits.length < minimumDigits) {
      throw new Error(`أدخل ${label} صالحاً مع مفتاح الدولة عند الحاجة.`);
    }
  }
  return value;
}

function validatePageUrl(value: string, label: string) {
  if (value.startsWith("/") && !value.includes("..")) return value;
  try {
    const parsed = new URL(value);
    if (parsed.protocol === "https:" || parsed.protocol === "http:") {
      return value;
    }
  } catch {
    // The friendly validation message below is more useful than URL errors.
  }
  throw new Error(
    `الحقل «${label}» يجب أن يكون مساراً داخلياً أو رابطاً آمناً.`,
  );
}

function validateImagePath(value: string, label: string) {
  if (!value.startsWith("/") || value.includes("..")) {
    throw new Error(`اختر ${label} من مكتبة الوسائط الحالية.`);
  }
  return value;
}

function optionalExternalUrl(formData: FormData, name: string, label: string) {
  const value = String(formData.get(name) ?? "").trim();
  if (!value || value === "#") return value || null;
  try {
    const parsed = new URL(value);
    if (parsed.protocol === "https:" || parsed.protocol === "http:") {
      return value;
    }
  } catch {
    // Use a consistent Arabic validation message.
  }
  throw new Error(`رابط ${label} غير صالح.`);
}

function parseSiteSettingsInput(formData: FormData): SiteSettingsData {
  return {
    companyNameAr: boundedText(formData, "companyNameAr", "الاسم العربي", 120),
    companyNameEn: boundedText(
      formData,
      "companyNameEn",
      "الاسم الإنجليزي",
      120,
    ),
    phone: validatePhone(
      boundedText(formData, "phone", "الهاتف", 50),
      "رقم هاتف",
      7,
    ),
    whatsapp: validatePhone(
      boundedText(formData, "whatsapp", "واتساب", 50),
      "رقم واتساب",
      8,
    ),
    email: validateEmail(boundedText(formData, "email", "البريد", 160)),
    city: boundedText(formData, "city", "المدينة", 120),
    address: boundedText(formData, "address", "العنوان", 300),
    workingHours: boundedText(formData, "workingHours", "ساعات العمل", 200),
    riyadhDeliveryEstimate: boundedText(
      formData,
      "riyadhDeliveryEstimate",
      "مدة التوصيل داخل الرياض",
      120,
    ),
    outsideDeliveryEstimate: boundedText(
      formData,
      "outsideDeliveryEstimate",
      "مدة التوصيل خارج الرياض",
      120,
    ),
    companyDescription: boundedText(
      formData,
      "companyDescription",
      "وصف الشركة",
      800,
    ),
    commercialRegistration: optionalText(formData, "commercialRegistration"),
    taxNumber: optionalText(formData, "taxNumber"),
    heroTitle: boundedText(formData, "heroTitle", "عنوان Hero", 180),
    heroText: boundedText(formData, "heroText", "نص Hero", 600),
    heroPrimaryButtonText: boundedText(
      formData,
      "heroPrimaryButtonText",
      "نص الزر الأول",
      60,
    ),
    heroPrimaryButtonUrl: validatePageUrl(
      boundedText(formData, "heroPrimaryButtonUrl", "رابط الزر الأول", 500),
      "رابط الزر الأول",
    ),
    heroSecondaryButtonText: boundedText(
      formData,
      "heroSecondaryButtonText",
      "نص الزر الثاني",
      60,
    ),
    heroSecondaryButtonUrl: validatePageUrl(
      boundedText(formData, "heroSecondaryButtonUrl", "رابط الزر الثاني", 500),
      "رابط الزر الثاني",
    ),
    heroTertiaryButtonText: boundedText(
      formData,
      "heroTertiaryButtonText",
      "نص الزر الثالث",
      60,
    ),
    heroTertiaryButtonUrl: validatePageUrl(
      boundedText(formData, "heroTertiaryButtonUrl", "رابط الزر الثالث", 500),
      "رابط الزر الثالث",
    ),
    heroImage: validateImagePath(
      boundedText(formData, "heroImage", "صورة Hero", 500),
      "صورة Hero",
    ),
    announcementText: boundedText(
      formData,
      "announcementText",
      "نص شريط الإعلان",
      220,
    ),
    showAnnouncement: formData.get("showAnnouncement") === "on",
    logo: validateImagePath(
      boundedText(formData, "logo", "الشعار", 500),
      "الشعار",
    ),
    favicon: validateImagePath(
      boundedText(formData, "favicon", "Favicon", 500),
      "Favicon",
    ),
    instagramUrl: optionalExternalUrl(formData, "instagramUrl", "Instagram"),
    xUrl: optionalExternalUrl(formData, "xUrl", "X"),
    linkedinUrl: optionalExternalUrl(formData, "linkedinUrl", "LinkedIn"),
    tiktokUrl: optionalExternalUrl(formData, "tiktokUrl", "TikTok"),
    showFloatingWhatsapp: formData.get("showFloatingWhatsapp") === "on",
    showContactDetails: formData.get("showContactDetails") === "on",
    footerDescription: boundedText(
      formData,
      "footerDescription",
      "وصف الفوتر",
      700,
    ),
    copyrightText: boundedText(formData, "copyrightText", "حقوق النشر", 220),
    showSocialLinks: formData.get("showSocialLinks") === "on",
  };
}

function settingsErrorMessage(error: unknown) {
  if (error instanceof Error) {
    if (error.message === "READ_ONLY") {
      return "قاعدة PostgreSQL غير مفعلة؛ الإعدادات متاحة للقراءة فقط.";
    }
    if (
      error.message.startsWith("الحقل") ||
      error.message.startsWith("أدخل") ||
      error.message.startsWith("اختر") ||
      error.message.startsWith("رابط")
    ) {
      return error.message;
    }
  }
  return "تعذر حفظ الإعدادات. تحقق من اتصال قاعدة البيانات وحاول مرة أخرى.";
}

function revalidateSiteSettingsViews() {
  updateTag("site-settings");
  revalidatePath("/", "layout");
  revalidatePath("/");
  revalidatePath("/contact");
  revalidatePath("/checkout");
  revalidatePath("/cart");
  revalidatePath("/admin/settings");
}

export async function updateSiteSettingsAction(formData: FormData) {
  await requireSuperAdminAction();
  try {
    await updateSiteSettings(parseSiteSettingsInput(formData));
  } catch (error) {
    redirect(
      `/admin/settings?error=${encodeURIComponent(settingsErrorMessage(error))}`,
    );
  }
  revalidateSiteSettingsViews();
  redirect("/admin/settings?success=saved");
}

export async function restoreSiteSettingsAction(formData: FormData) {
  await requireSuperAdminAction();
  if (formData.get("confirmRestore") !== "confirmed") {
    redirect(
      "/admin/settings?error=" +
        encodeURIComponent("يجب تأكيد استعادة القيم الافتراضية."),
    );
  }
  try {
    await restoreDefaultSiteSettings();
  } catch (error) {
    redirect(
      `/admin/settings?error=${encodeURIComponent(settingsErrorMessage(error))}`,
    );
  }
  revalidateSiteSettingsViews();
  redirect("/admin/settings?success=restored");
}

function requiredLimitedText(
  formData: FormData,
  name: string,
  label: string,
  maximum: number,
) {
  const value = requiredText(formData, name, label);
  if (value.length > maximum) {
    throw new Error(`الحقل «${label}» يجب ألا يتجاوز ${maximum} حرفاً.`);
  }
  return value;
}

function contentPath(value: string, label: string) {
  if (!value.startsWith("/") || value.includes("..")) {
    throw new Error(`الحقل «${label}» يجب أن يكون مساراً داخلياً يبدأ بـ /.`);
  }
  return value;
}

function parseContentPageInput(
  slug: string,
  formData: FormData,
): ContentPageData {
  let parsedSections: unknown;
  try {
    parsedSections = JSON.parse(String(formData.get("sectionsJson") ?? "[]"));
  } catch {
    throw new Error("تعذر قراءة أقسام الصفحة.");
  }
  if (!Array.isArray(parsedSections) || parsedSections.length < 1) {
    throw new Error("أضف قسماً واحداً على الأقل للصفحة.");
  }
  if (parsedSections.length > 8) {
    throw new Error("لا يمكن إضافة أكثر من 8 أقسام للصفحة.");
  }
  const sections: ContentPageSection[] = parsedSections.map((value, index) => {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      throw new Error(`بيانات القسم ${index + 1} غير صحيحة.`);
    }
    const section = value as Record<string, unknown>;
    const title = String(section.title ?? "").trim();
    const description = String(section.description ?? "").trim();
    const items = Array.isArray(section.items)
      ? section.items
          .map((item) => String(item).trim())
          .filter(Boolean)
          .slice(0, 20)
      : [];
    const image = String(section.image ?? "").trim();
    const layout = String(section.layout ?? "cards");
    if (!title || title.length > 140) {
      throw new Error(`عنوان القسم ${index + 1} مطلوب وبحد أقصى 140 حرفاً.`);
    }
    if (!description || description.length > 1200) {
      throw new Error(`وصف القسم ${index + 1} مطلوب وبحد أقصى 1200 حرف.`);
    }
    if (!items.length) {
      throw new Error(`أضف عنصراً واحداً على الأقل في القسم ${index + 1}.`);
    }
    if (!new Set(["cards", "steps", "list"]).has(layout)) {
      throw new Error(`طريقة عرض القسم ${index + 1} غير صحيحة.`);
    }
    if (image) contentPath(image, `صورة القسم ${index + 1}`);
    return {
      id: String(section.id || `section-${index + 1}`).slice(0, 100),
      title,
      description,
      items,
      image: image || null,
      layout: layout as ContentPageSection["layout"],
    };
  });
  const secondaryCtaText = optionalLimitedText(
    formData,
    "secondaryCtaText",
    "نص الزر الثانوي",
    80,
  );
  const secondaryCtaUrlValue = optionalLimitedText(
    formData,
    "secondaryCtaUrl",
    "رابط الزر الثانوي",
    300,
  );
  if (Boolean(secondaryCtaText) !== Boolean(secondaryCtaUrlValue)) {
    throw new Error("أدخل نص ورابط الزر الثانوي معاً، أو اتركهما فارغين.");
  }
  const heroImage = requiredLimitedText(
    formData,
    "heroImage",
    "صورة رأس الصفحة",
    500,
  );
  const primaryCtaUrl = requiredLimitedText(
    formData,
    "primaryCtaUrl",
    "رابط الزر الرئيسي",
    300,
  );
  return {
    slug,
    title: requiredLimitedText(formData, "title", "اسم الصفحة", 100),
    eyebrow: requiredLimitedText(formData, "eyebrow", "النص الصغير", 100),
    heroTitle: requiredLimitedText(
      formData,
      "heroTitle",
      "العنوان الرئيسي",
      180,
    ),
    heroDescription: requiredLimitedText(
      formData,
      "heroDescription",
      "وصف الصفحة",
      700,
    ),
    heroImage: contentPath(heroImage, "صورة رأس الصفحة"),
    sections,
    primaryCtaText: requiredLimitedText(
      formData,
      "primaryCtaText",
      "نص الزر الرئيسي",
      80,
    ),
    primaryCtaUrl: contentPath(primaryCtaUrl, "رابط الزر الرئيسي"),
    secondaryCtaText,
    secondaryCtaUrl: secondaryCtaUrlValue
      ? contentPath(secondaryCtaUrlValue, "رابط الزر الثانوي")
      : null,
  };
}

function contentPageError(error: unknown) {
  if (error instanceof Error) {
    if (error.message === "READ_ONLY")
      return "قاعدة البيانات غير مفعلة للكتابة.";
    if (error.message === "PAGE_NOT_FOUND") return "الصفحة غير موجودة.";
    if (
      error.message.startsWith("الحقل") ||
      error.message.startsWith("أضف") ||
      error.message.startsWith("تعذر") ||
      error.message.startsWith("لا يمكن") ||
      error.message.startsWith("بيانات") ||
      error.message.startsWith("عنوان") ||
      error.message.startsWith("وصف") ||
      error.message.startsWith("طريقة") ||
      error.message.startsWith("أدخل")
    ) {
      return error.message;
    }
  }
  return "تعذر حفظ الصفحة. تحقق من اتصال PostgreSQL وتطبيق Migration.";
}

function revalidateContentPage(slug: string) {
  revalidatePath(`/${slug}`);
  revalidatePath("/admin/pages");
  revalidatePath(`/admin/pages/${slug}`);
  revalidatePath("/sitemap.xml");
}

export async function updateContentPageAction(
  slug: string,
  formData: FormData,
) {
  await requireAdminAction();
  try {
    await updateAdminContentPage(parseContentPageInput(slug, formData));
  } catch (error) {
    redirect(
      `/admin/pages/${slug}?error=${encodeURIComponent(contentPageError(error))}`,
    );
  }
  revalidateContentPage(slug);
  redirect(`/admin/pages/${slug}?success=saved`);
}

export async function restoreDefaultContentPageAction(
  slug: string,
  formData: FormData,
) {
  await requireAdminAction();
  if (formData.get("confirmRestore") !== "confirmed") {
    redirect(
      `/admin/pages/${slug}?error=${encodeURIComponent("يجب تأكيد الاستعادة.")}`,
    );
  }
  try {
    await restoreDefaultContentPage(slug);
  } catch (error) {
    redirect(
      `/admin/pages/${slug}?error=${encodeURIComponent(contentPageError(error))}`,
    );
  }
  revalidateContentPage(slug);
  redirect(`/admin/pages/${slug}?success=restored`);
}

export async function updatePageSeoAction(path: string, formData: FormData) {
  await requireAdminAction();
  try {
    await updatePageSeo(path, parseSeoInput(formData));
  } catch (error) {
    redirect(
      `/admin/seo?error=${encodeURIComponent(mutationErrorMessage(error))}`,
    );
  }
  revalidatePath(path);
  revalidatePath("/sitemap.xml");
  revalidatePath("/admin/seo");
  redirect("/admin/seo?success=page-updated");
}

export async function suggestSeoAction(input: SeoSuggestionInput) {
  await requireAdminAction();
  const assistant = getSeoAssistant();
  if (!assistant.enabled) {
    return {
      ok: false as const,
      disabled: true,
      error: "مساعد AI غير مفعّل. أضف OPENAI_API_KEY لتشغيله.",
    };
  }
  const safeInput: SeoSuggestionInput = {
    entityType: input.entityType,
    nameAr: String(input.nameAr).trim().slice(0, 160),
    nameEn: String(input.nameEn ?? "")
      .trim()
      .slice(0, 160),
    description: String(input.description).trim().slice(0, 1600),
    slug: String(input.slug).trim().slice(0, 180),
  };
  try {
    const suggestion = await assistant.suggest(safeInput);
    return { ok: true as const, suggestion, model: assistant.model };
  } catch (error) {
    if (error instanceof SeoAssistantUnavailableError) {
      return {
        ok: false as const,
        disabled: true,
        error: "مساعد AI غير مفعّل.",
      };
    }
    return {
      ok: false as const,
      disabled: false,
      error: "تعذر إنشاء الاقتراح الآن. لم يتم تغيير أو حفظ أي حقل.",
    };
  }
}
