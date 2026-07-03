"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { getCustomerSession } from "@/lib/auth/customer-auth";
import { normalizeRequestedItems } from "@/lib/commerce/domain";
import {
  createDirectOrder,
  createQuoteRequest,
} from "@/lib/commerce/public-service";

function requiredValue(
  formData: FormData,
  name: string,
  label: string,
  maximum: number,
) {
  const value = String(formData.get(name) ?? "").trim();
  if (!value) throw new Error(`الحقل «${label}» مطلوب.`);
  if (value.length > maximum) throw new Error(`الحقل «${label}» طويل جداً.`);
  return value;
}

function optionalValue(formData: FormData, name: string, maximum: number) {
  const value = String(formData.get(name) ?? "").trim();
  if (value.length > maximum) {
    throw new Error("أحد الحقول الاختيارية طويل جداً.");
  }
  return value || null;
}

function phoneValue(formData: FormData) {
  const value = requiredValue(formData, "phone", "رقم الهاتف", 50);
  if (value.replace(/\D/g, "").length < 7) {
    throw new Error("أدخل رقم هاتف صالحاً.");
  }
  return value;
}

function checkoutError(error: unknown) {
  if (error instanceof Error) {
    if (error.message === "SERVICE_UNAVAILABLE") {
      return "خدمة الطلبات غير متاحة حالياً.";
    }
    if (error.message === "INVALID_ITEMS") {
      return "السلة فارغة أو تحتوي على كمية غير صالحة.";
    }
    if (error.message === "PRODUCT_NOT_FOUND") {
      return "أحد المنتجات لم يعد متاحاً. راجع السلة وحاول مجدداً.";
    }
    if (error.message === "DIRECT_ORDER_REQUIRES_PRICES") {
      return "الطلب المباشر متاح فقط عندما تكون أسعار جميع المنتجات محددة.";
    }
    if (error.message === "INSUFFICIENT_STOCK") {
      return "الكمية المطلوبة لأحد المنتجات لم تعد متوفرة. راجع السلة.";
    }
    if (error.message === "DIRECT_ORDER_ACCOUNT_REQUIRED") {
      return "سجّل الدخول بحساب العميل لإكمال الطلب المباشر.";
    }
    if (error.message.startsWith("الحقل") || error.message.startsWith("أدخل")) {
      return error.message;
    }
  }
  return "تعذر إرسال الطلب. حاول مرة أخرى لاحقاً.";
}

export async function submitCheckoutAction(formData: FormData) {
  if (String(formData.get("website") ?? "")) {
    redirect("/checkout?error=" + encodeURIComponent("تعذر إرسال الطلب."));
  }

  const intent = formData.get("intent") === "order" ? "order" : "quote";
  const session = await getCustomerSession();
  if (intent === "order" && !session) {
    redirect("/auth/login?next=%2Fcheckout%3Fmode%3Dorder");
  }
  let record:
    | Awaited<ReturnType<typeof createDirectOrder>>
    | Awaited<ReturnType<typeof createQuoteRequest>>
    | undefined;
  try {
    const customer = {
      userId: session?.userId ?? null,
      customerName: requiredValue(formData, "customerName", "الاسم", 120),
      phone: phoneValue(formData),
      city: requiredValue(formData, "city", "المدينة", 120),
      customerNotes: optionalValue(formData, "customerNotes", 2000),
    };
    const rawItems = JSON.parse(String(formData.get("itemsJson") ?? "[]"));
    const items = normalizeRequestedItems(rawItems);
    record =
      intent === "order"
        ? await createDirectOrder(customer, items)
        : await createQuoteRequest(customer, items);
  } catch (error) {
    redirect(
      `/checkout?mode=${intent}&error=${encodeURIComponent(checkoutError(error))}`,
    );
  }
  if (intent === "order") updateTag("catalog");
  redirect(
    `/checkout/success?type=${intent}&number=${encodeURIComponent(record!.number)}&token=${encodeURIComponent(record!.trackingToken)}`,
  );
}
