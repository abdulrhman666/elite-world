export const quoteStatusOptions = [
  { value: "NEW", label: "جديد" },
  { value: "RESPONDED", label: "تم الرد" },
  { value: "CANCELLED", label: "ملغي" },
] as const;

export const orderSourceOptions = [
  { value: "QUOTE", label: "من عرض سعر" },
  { value: "DIRECT", label: "طلب مباشر" },
] as const;

export const orderStatusOptions = [
  { value: "NEW", label: "جديد" },
  { value: "PENDING_PAYMENT", label: "بانتظار الدفع" },
  { value: "CONFIRMED", label: "تم التأكيد" },
  { value: "IN_PROGRESS", label: "قيد التجهيز" },
  { value: "READY_TO_SHIP", label: "جاهز للشحن" },
  { value: "SHIPPED", label: "تم الشحن" },
  { value: "OUT_FOR_DELIVERY", label: "خرج للتوصيل" },
  { value: "DELIVERED", label: "تم التسليم" },
  { value: "CANCELLED", label: "ملغي" },
] as const;

export const paymentMethodOptions = [
  { value: "BANK_TRANSFER", label: "تحويل بنكي" },
  { value: "CASH", label: "نقدي" },
  { value: "CARD", label: "بطاقة" },
  { value: "STC_PAY", label: "STC Pay" },
] as const;

export const paymentStatusOptions = [
  { value: "PENDING", label: "قيد المراجعة" },
  { value: "PAID", label: "مدفوع" },
  { value: "FAILED", label: "فشل" },
  { value: "CANCELLED", label: "ملغي" },
] as const;

export const orderPaymentStatusOptions = [
  { value: "UNPAID", label: "غير مدفوع" },
  { value: "PARTIALLY_PAID", label: "مدفوع جزئياً" },
  { value: "PAID", label: "مدفوع" },
] as const;

export type QuoteStatusValue = (typeof quoteStatusOptions)[number]["value"];
export type OrderSourceValue = (typeof orderSourceOptions)[number]["value"];
export type OrderStatusValue = (typeof orderStatusOptions)[number]["value"];
export type PaymentMethodValue = (typeof paymentMethodOptions)[number]["value"];
export type PaymentStatusValue = (typeof paymentStatusOptions)[number]["value"];
export type OrderPaymentStatusValue =
  (typeof orderPaymentStatusOptions)[number]["value"];

export function quoteStatusLabel(value: string) {
  return (
    quoteStatusOptions.find((item) => item.value === value)?.label ?? value
  );
}

export function orderSourceLabel(value: string) {
  return (
    orderSourceOptions.find((item) => item.value === value)?.label ?? value
  );
}

export function orderStatusLabel(value: string) {
  return (
    orderStatusOptions.find((item) => item.value === value)?.label ?? value
  );
}

export function paymentMethodLabel(value: string) {
  return (
    paymentMethodOptions.find((item) => item.value === value)?.label ?? value
  );
}

export function paymentStatusLabel(value: string) {
  return (
    paymentStatusOptions.find((item) => item.value === value)?.label ?? value
  );
}

export function orderPaymentStatusLabel(value: string) {
  return (
    orderPaymentStatusOptions.find((item) => item.value === value)?.label ??
    value
  );
}
