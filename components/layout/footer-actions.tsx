import { AtSign, BriefcaseBusiness, Camera, Music2 } from "lucide-react";

export function SocialPlaceholders({
  links,
}: {
  links: {
    instagram: string | null;
    x: string | null;
    linkedin: string | null;
    tiktok: string | null;
  };
}) {
  const social = [
    { label: "إنستغرام", icon: Camera, href: links.instagram },
    { label: "X", icon: AtSign, href: links.x },
    { label: "لينكدإن", icon: BriefcaseBusiness, href: links.linkedin },
    { label: "تيك توك", icon: Music2, href: links.tiktok },
  ].filter((item) => Boolean(item.href && item.href !== "#"));
  if (!social.length) return null;
  return (
    <div className="flex gap-2">
      {social.map(({ label, icon: Icon, href }) => {
        const className =
          "hover:border-brand-cyan focus-visible:ring-brand-cyan/30 grid size-11 place-items-center rounded-xl border border-white/15 text-slate-200 transition hover:text-white focus-visible:ring-3 focus-visible:outline-none";
        return (
          <a
            key={label}
            href={href ?? undefined}
            target="_blank"
            rel="noreferrer"
            aria-label={label}
            className={className}
          >
            <Icon className="size-5" aria-hidden />
          </a>
        );
      })}
    </div>
  );
}
