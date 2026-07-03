import { MessageCircle } from "lucide-react";
import { getWhatsAppContactUrl } from "@/lib/whatsapp";
import type { SiteSettingsData } from "@/types/site-settings";

export function FloatingWhatsApp({ settings }: { settings: SiteSettingsData }) {
  if (!settings.showFloatingWhatsapp) return null;
  const href = getWhatsAppContactUrl(settings.whatsapp);
  if (!href) return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label="التواصل عبر واتساب"
      className="focus-visible:ring-brand-cyan fixed right-5 bottom-20 z-40 grid size-14 place-items-center rounded-full bg-emerald-500 text-white shadow-xl transition hover:-translate-y-1 hover:bg-emerald-600 focus-visible:ring-3 focus-visible:outline-none lg:bottom-6"
    >
      <MessageCircle className="size-7" aria-hidden />
    </a>
  );
}
