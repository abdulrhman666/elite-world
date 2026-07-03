import { Mail, MapPin, Phone } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { SocialPlaceholders } from "@/components/layout/footer-actions";
import { Container } from "@/components/ui/container";
import { formatCurrentYear } from "@/lib/utils";
import type { SiteSettingsData } from "@/types/site-settings";

const productLinks = [
  ["معدات الطبخ", "/categories/cooking-equipment"],
  ["معدات المخابز", "/categories/bakery-equipment"],
  ["معدات الكافيهات", "/categories/cafe-equipment"],
  ["التبريد والتجميد", "/categories/refrigeration"],
];
const serviceLinks = [
  ["تصنيع الستانلس", "/stainless"],
  ["تجهيز المشاريع", "/project-solutions"],
  ["الصيانة والضمان", "/maintenance"],
  ["طلب عرض سعر", "/quote"],
];
const policyLinks = [
  ["معلومات الضمان", "/maintenance"],
  ["الشحن والتسليم", "/contact"],
  ["تواصل معنا", "/contact"],
];

function FooterLinks({ title, links }: { title: string; links: string[][] }) {
  return (
    <div>
      <h2 className="font-bold text-white">{title}</h2>
      <ul className="mt-4 space-y-3 text-sm text-slate-300">
        {links.map(([label, href]) => (
          <li key={label}>
            <Link
              href={href}
              className="hover:text-brand-cyan inline-flex min-h-8 items-center"
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Footer({ settings }: { settings: SiteSettingsData }) {
  return (
    <footer className="bg-brand-ink pb-20 text-slate-300 lg:pb-0">
      <Container className="grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-[1.4fr_.8fr_.8fr_.8fr_1.35fr] lg:py-18">
        <div>
          <Image
            src={settings.logo}
            width={126}
            height={100}
            alt={`شعار ${settings.companyNameEn}`}
            className="h-24 w-auto rounded-xl bg-white object-contain p-2"
          />
          <p className="mt-5 max-w-sm text-sm leading-7">
            {settings.footerDescription}
          </p>
          {settings.showSocialLinks && (
            <div className="mt-5">
              <SocialPlaceholders
                links={{
                  instagram: settings.instagramUrl,
                  x: settings.xUrl,
                  linkedin: settings.linkedinUrl,
                  tiktok: settings.tiktokUrl,
                }}
              />
            </div>
          )}
        </div>
        <FooterLinks title="الأقسام" links={productLinks} />
        <FooterLinks title="الخدمات" links={serviceLinks} />
        <FooterLinks title="السياسات" links={policyLinks} />
        <div className="space-y-7">
          <h2 className="font-bold text-white">التواصل</h2>
          {settings.showContactDetails && (
            <div className="space-y-3 text-sm">
              <p className="flex gap-2">
                <Phone
                  className="text-brand-cyan mt-0.5 size-4 shrink-0"
                  aria-hidden
                />
                {settings.phone}
              </p>
              <p className="flex gap-2">
                <Mail
                  className="text-brand-cyan mt-0.5 size-4 shrink-0"
                  aria-hidden
                />
                {settings.email}
              </p>
              <p className="flex gap-2">
                <MapPin
                  className="text-brand-cyan mt-0.5 size-4 shrink-0"
                  aria-hidden
                />
                {settings.address}
              </p>
            </div>
          )}
        </div>
      </Container>
      <div className="border-t border-white/10">
        <Container className="flex flex-col gap-2 py-5 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {formatCurrentYear()} {settings.companyNameEn}.{" "}
            {settings.copyrightText}
          </p>
          {settings.showContactDetails && <p>{settings.city}</p>}
        </Container>
      </div>
    </footer>
  );
}
