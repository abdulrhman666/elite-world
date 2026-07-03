export function isPlaceholderValue(value: string) {
  return value.includes("[") || value.includes("]") || value.trim() === "";
}

export function getWhatsAppInquiryUrl({
  whatsapp,
  productName,
  model,
  productUrl,
}: {
  whatsapp: string;
  productName: string;
  model: string;
  productUrl: string;
}) {
  if (isPlaceholderValue(whatsapp)) return null;
  const digits = whatsapp.replace(/\D/g, "");
  if (digits.length < 8) return null;
  const message = `مرحباً، أريد الاستفسار عن ${productName}، الموديل ${model}، رابط المنتج: ${productUrl}`;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export function getWhatsAppContactUrl(whatsapp: string) {
  if (isPlaceholderValue(whatsapp)) return null;
  const digits = whatsapp.replace(/\D/g, "");
  if (digits.length < 8) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent("مرحباً، أريد التواصل مع ELITE WORLD.")}`;
}
