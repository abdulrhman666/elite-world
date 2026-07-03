"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import {
  addOrderPayment,
  convertQuoteToOrder,
  saveOrderInvoice,
  updateAdminOrder,
  updateAdminQuote,
  updateOrderShipping,
  updateOrderTotalAmount,
} from "@/lib/admin/commerce-admin";
import { getAdminSession } from "@/lib/admin/auth";
import {
  orderStatusOptions,
  paymentMethodOptions,
  quoteStatusOptions,
  type OrderStatusValue,
  type PaymentMethodValue,
  type QuoteStatusValue,
} from "@/lib/commerce/status";
import { DocumentStorageError } from "@/lib/storage/local-storage-adapter";

async function requireAdmin() {
  if (!(await getAdminSession())) redirect("/admin/login?error=session");
}

function errorMessage(error: unknown) {
  if (error instanceof DocumentStorageError) return error.message;
  if (error instanceof Error) {
    if (error.message === "READ_ONLY")
      return "قاعدة البيانات غير مفعلة للكتابة.";
    if (error.message === "ALREADY_CONVERTED")
      return "تم تحويل هذا العرض إلى طلب مسبقاً.";
    if (error.message === "QUOTE_NOT_FOUND") return "عرض السعر غير موجود.";
    if (error.message === "INSUFFICIENT_STOCK")
      return "لا يمكن تحويل العرض: كمية أحد المنتجات غير متوفرة.";
    if (error.message === "ORDER_NOT_FOUND") return "الطلب غير موجود.";
    if (error.message === "INVALID_AMOUNT") return "أدخل مبلغاً صحيحاً.";
    if (error.message === "TOTAL_LESS_THAN_PAID")
      return "إجمالي الطلب لا يمكن أن يكون أقل من المدفوع.";
    if (error.message === "ORDER_TOTAL_REQUIRED")
      return "أدخل إجمالي الطلب قبل إضافة دفعة.";
    if (error.message === "PAYMENT_EXCEEDS_TOTAL")
      return "مبلغ الدفعة أكبر من المبلغ المتبقي.";
    if (error.message === "INVALID_SHIPPING")
      return "تحقق من مدة التوصيل وبيانات الشحن.";
  }
  return "تعذر حفظ العملية. تحقق من اتصال قاعدة البيانات وحاول مجدداً.";
}

function parseAmount(value: FormDataEntryValue | null) {
  const amountText = String(value ?? "")
    .trim()
    .replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(amountText)) {
    throw new Error("INVALID_AMOUNT");
  }
  return new Prisma.Decimal(amountText);
}

export async function updateQuoteStatusAction(id: string, formData: FormData) {
  await requireAdmin();
  const status = String(formData.get("status") ?? "") as QuoteStatusValue;
  if (!quoteStatusOptions.some((option) => option.value === status)) {
    redirect(
      `/admin/quotes/${id}?error=${encodeURIComponent("الحالة غير صحيحة.")}`,
    );
  }
  try {
    await updateAdminQuote(id, status);
  } catch (error) {
    redirect(
      `/admin/quotes/${id}?error=${encodeURIComponent(errorMessage(error))}`,
    );
  }
  revalidatePath("/admin/quotes");
  revalidatePath(`/admin/quotes/${id}`);
  redirect(`/admin/quotes/${id}?success=status`);
}

export async function convertQuoteAction(id: string) {
  await requireAdmin();
  let orderId = "";
  try {
    const order = await convertQuoteToOrder(id);
    orderId = order.id;
  } catch (error) {
    redirect(
      `/admin/quotes/${id}?error=${encodeURIComponent(errorMessage(error))}`,
    );
  }
  updateTag("catalog");
  revalidatePath("/admin/quotes");
  revalidatePath("/admin/orders");
  redirect(`/admin/orders/${orderId}?success=converted`);
}

export async function updateOrderStatusAction(id: string, formData: FormData) {
  await requireAdmin();
  const status = String(formData.get("status") ?? "") as OrderStatusValue;
  if (!orderStatusOptions.some((option) => option.value === status)) {
    redirect(
      `/admin/orders/${id}?error=${encodeURIComponent("الحالة غير صحيحة.")}`,
    );
  }
  try {
    const noteValue = String(formData.get("adminNote") ?? "").trim();
    const order = await updateAdminOrder(
      id,
      status,
      noteValue ? noteValue.slice(0, 1000) : null,
    );
    revalidatePath(`/track/${order.trackingToken}`);
  } catch (error) {
    redirect(
      `/admin/orders/${id}?error=${encodeURIComponent(errorMessage(error))}`,
    );
  }
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);
  redirect(`/admin/orders/${id}?success=status`);
}

export async function updateOrderShippingAction(
  id: string,
  formData: FormData,
) {
  await requireAdmin();
  const optional = (name: string, maximum: number) => {
    const value = String(formData.get(name) ?? "").trim();
    if (value.length > maximum) throw new Error("INVALID_SHIPPING");
    return value || null;
  };
  let order;
  try {
    const deliveryEstimate = String(
      formData.get("deliveryEstimate") ?? "",
    ).trim();
    if (!deliveryEstimate || deliveryEstimate.length > 120) {
      throw new Error("INVALID_SHIPPING");
    }
    order = await updateOrderShipping({
      orderId: id,
      shippingCarrier: optional("shippingCarrier", 120),
      trackingNumber: optional("trackingNumber", 160),
      deliveryEstimate,
    });
    revalidatePath(`/track/${order.trackingToken}`);
  } catch (error) {
    redirect(
      `/admin/orders/${id}?error=${encodeURIComponent(errorMessage(error))}`,
    );
  }
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);
  redirect(`/admin/orders/${id}?success=shipping`);
}

export async function uploadInvoiceAction(id: string, formData: FormData) {
  await requireAdmin();
  const invoiceNumber = String(formData.get("invoiceNumber") ?? "").trim();
  const file = formData.get("file");
  if (!invoiceNumber || invoiceNumber.length > 100) {
    redirect(
      `/admin/orders/${id}?error=${encodeURIComponent("أدخل رقم فاتورة صحيحاً.")}`,
    );
  }
  if (!(file instanceof File) || file.size === 0) {
    redirect(
      `/admin/orders/${id}?error=${encodeURIComponent("اختر ملف PDF.")}`,
    );
  }
  try {
    await saveOrderInvoice({ orderId: id, file, invoiceNumber });
  } catch (error) {
    redirect(
      `/admin/orders/${id}?error=${encodeURIComponent(errorMessage(error))}`,
    );
  }
  revalidatePath(`/admin/orders/${id}`);
  redirect(`/admin/orders/${id}?success=invoice`);
}

export async function updateOrderTotalAction(id: string, formData: FormData) {
  await requireAdmin();
  let order;
  try {
    order = await updateOrderTotalAmount({
      orderId: id,
      totalAmount: parseAmount(formData.get("totalAmount")),
    });
    revalidatePath(`/track/${order.trackingToken}`);
  } catch (error) {
    redirect(
      `/admin/orders/${id}?error=${encodeURIComponent(errorMessage(error))}`,
    );
  }
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);
  redirect(`/admin/orders/${id}?success=total`);
}

export async function addOrderPaymentAction(id: string, formData: FormData) {
  await requireAdmin();
  const method = String(formData.get("method") ?? "") as PaymentMethodValue;
  if (!paymentMethodOptions.some((option) => option.value === method)) {
    redirect(
      `/admin/orders/${id}?error=${encodeURIComponent("طريقة الدفع غير صحيحة.")}`,
    );
  }
  const attachmentValue = formData.get("attachment");
  const attachment =
    attachmentValue instanceof File && attachmentValue.size > 0
      ? attachmentValue
      : null;
  let order;
  try {
    order = await addOrderPayment({
      orderId: id,
      amount: parseAmount(formData.get("amount")),
      method,
      attachment,
    });
    revalidatePath(`/track/${order.trackingToken}`);
  } catch (error) {
    redirect(
      `/admin/orders/${id}?error=${encodeURIComponent(errorMessage(error))}`,
    );
  }
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);
  redirect(`/admin/orders/${id}?success=payment`);
}
