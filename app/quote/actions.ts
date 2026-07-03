"use server";

import { redirect } from "next/navigation";
import { getCustomerSession } from "@/lib/auth/customer-auth";
import { normalizeRequestedItems } from "@/lib/commerce/domain";
import { createQuoteRequest } from "@/lib/commerce/public-service";

function requiredValue(
  formData: FormData,
  name: string,
  label: string,
  maximum: number,
) {
  const value = String(formData.get(name) ?? "").trim();
  if (!value) throw new Error(`الحقل «${label}» مطلوب.`);
  if (value.length > maximum) {
    throw new Error(`الحقل «${label}» طويل جداً.`);
  }
  return value;
}

function optionalValue(formData: FormData, name: string, maximum: number) {
  const value = String(formData.get(name) ?? "").trim();
  if (value.length > maximum)
    throw new Error("أحد الحقول الاختيارية طويل جداً.");
  return value || null;
}

function phoneValue(formData: FormData, name: string, label: string) {
  const value = requiredValue(formData, name, label, 50);
  if (value.replace(/\D/g, "").length < 7) {
    throw new Error(`أدخل ${label} صالحاً.`);
  }
  return value;
}

function quoteError(error: unknown) {
  if (error instanceof Error) {
    if (error.message === "SERVICE_UNAVAILABLE")
      return "خدمة عروض الأسعار غير متاحة حالياً.";
    if (error.message === "INVALID_ITEMS")
      return "أضف منتجاً واحداً صالحاً على الأقل وحدد الكمية.";
    if (error.message === "PRODUCT_NOT_FOUND")
      return "أحد المنتجات المحددة لم يعد متاحاً. حدّث الصفحة وحاول مجدداً.";
    if (error.message.startsWith("الحقل") || error.message.startsWith("أدخل")) {
      return error.message;
    }
  }
  return "تعذر إرسال طلب عرض السعر. حاول مرة أخرى لاحقاً.";
}

export async function submitQuoteAction(formData: FormData) {
  if (String(formData.get("website") ?? "")) {
    redirect("/quote?error=" + encodeURIComponent("تعذر إرسال الطلب."));
  }
  let quote: Awaited<ReturnType<typeof createQuoteRequest>> | undefined;
  try {
    const session = await getCustomerSession();
    const rawItems = JSON.parse(String(formData.get("itemsJson") ?? "[]"));
    quote = await createQuoteRequest(
      {
        userId: session?.userId ?? null,
        customerName: requiredValue(formData, "customerName", "الاسم", 120),
        phone: phoneValue(formData, "phone", "رقم الهاتف"),
        city: requiredValue(formData, "city", "المدينة", 120),
        customerNotes: optionalValue(formData, "customerNotes", 2000),
      },
      normalizeRequestedItems(rawItems),
    );
  } catch (error) {
    redirect(`/quote?error=${encodeURIComponent(quoteError(error))}`);
  }
  redirect(
    `/quote/success?number=${encodeURIComponent(quote!.number)}&token=${encodeURIComponent(quote!.trackingToken)}`,
  );
}
