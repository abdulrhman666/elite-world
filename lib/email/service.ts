import "server-only";

type EmailCodePurpose = "VERIFY_ACCOUNT" | "RESET_PASSWORD";

export function emailConfigurationIssue() {
  if (!process.env.RESEND_API_KEY) return "مفتاح خدمة البريد غير مضبوط.";
  if (!process.env.EMAIL_FROM?.includes("@"))
    return "عنوان مرسل البريد غير مضبوط.";
  return null;
}

export async function sendCustomerEmailCode(input: {
  to: string;
  name: string;
  code: string;
  purpose: EmailCodePurpose;
}) {
  const issue = emailConfigurationIssue();
  if (issue) throw new Error("EMAIL_NOT_CONFIGURED");

  const verification = input.purpose === "VERIFY_ACCOUNT";
  const subject = verification
    ? "رمز تأكيد حسابك في ELITE WORLD"
    : "رمز استعادة كلمة المرور في ELITE WORLD";
  const action = verification ? "تأكيد حسابك" : "تعيين كلمة مرور جديدة";
  const text = [
    `مرحباً ${input.name}،`,
    "",
    `رمز ${action}: ${input.code}`,
    "الرمز صالح لمدة 10 دقائق ولا تشاركه مع أي شخص.",
    "",
    "إذا لم تطلب هذا الرمز، يمكنك تجاهل الرسالة.",
    "ELITE WORLD",
  ].join("\n");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM,
      to: [input.to],
      subject,
      text,
    }),
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) throw new Error("EMAIL_SEND_FAILED");
}
