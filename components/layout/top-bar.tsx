import { Clock3, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { Container } from "@/components/ui/container";
import type { SiteSettingsData } from "@/types/site-settings";

export function TopBar({ settings }: { settings: SiteSettingsData }) {
  if (!settings.showAnnouncement && !settings.showContactDetails) return null;

  return (
    <>
      {settings.showAnnouncement && (
        <div className="bg-brand-cyan px-4 py-2 text-center text-xs font-bold text-white sm:text-sm">
          {settings.announcementText}
        </div>
      )}
      {settings.showContactDetails && (
        <div className="bg-brand-ink hidden text-xs text-slate-200 md:block">
          <Container className="flex min-h-10 items-center justify-between gap-6">
            <p className="flex items-center gap-2">
              <MapPin className="text-brand-cyan size-3.5" aria-hidden />
              {settings.city} · {settings.address}
            </p>
            <div className="flex items-center gap-5">
              <span className="flex items-center gap-1.5">
                <Phone className="text-brand-cyan size-3.5" aria-hidden />
                {settings.phone}
              </span>
              <span className="hidden items-center gap-1.5 lg:flex">
                <MessageCircle
                  className="text-brand-cyan size-3.5"
                  aria-hidden
                />
                {settings.whatsapp}
              </span>
              <span className="hidden items-center gap-1.5 xl:flex">
                <Mail className="text-brand-cyan size-3.5" aria-hidden />
                {settings.email}
              </span>
              <span className="hidden items-center gap-1.5 xl:flex">
                <Clock3 className="text-brand-cyan size-3.5" aria-hidden />
                {settings.workingHours}
              </span>
            </div>
          </Container>
        </div>
      )}
    </>
  );
}
