export type ContentSectionLayout = "cards" | "steps" | "list";

export type ContentPageSection = {
  id: string;
  title: string;
  description: string;
  items: string[];
  image: string | null;
  layout: ContentSectionLayout;
};

export type ContentPageData = {
  slug: string;
  title: string;
  eyebrow: string;
  heroTitle: string;
  heroDescription: string;
  heroImage: string;
  sections: ContentPageSection[];
  primaryCtaText: string;
  primaryCtaUrl: string;
  secondaryCtaText: string | null;
  secondaryCtaUrl: string | null;
};
