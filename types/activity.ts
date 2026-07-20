import type { Product, SeoMetadata } from "@/types";

export type ActivitySummary = {
  slug: string;
  name: string;
  heroTitle: string;
  heroDescription: string;
  image: string;
};

export type ActivityProduct = {
  product: Product;
  equipmentGroup: string;
  essential: boolean;
  sortOrder: number;
};

export type ActivityDetail = ActivitySummary & {
  eyebrow: string;
  introduction: string;
  primaryCtaText: string;
  seo: SeoMetadata;
  products: ActivityProduct[];
};
