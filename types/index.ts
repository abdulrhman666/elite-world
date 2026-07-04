import type { LucideIcon } from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
};

export type Category = {
  slug: string;
  name: string;
  nameEn: string;
  description: string;
  image: string;
  cardImage?: string;
  icon: string;
  subcategories: Array<{ slug: string; name: string }>;
  productCount?: number;
  seo?: SeoMetadata;
};

export type SeoMetadata = {
  title?: string | null;
  description?: string | null;
  canonicalUrl?: string | null;
  indexable?: boolean;
  ogTitle?: string | null;
  ogDescription?: string | null;
  ogImage?: string | null;
  imageAlt?: string | null;
};

export type Product = {
  nameAr: string;
  nameEn: string;
  slug: string;
  sku: string;
  model: string;
  categorySlug: string;
  categoryName?: string;
  subcategorySlug: string;
  brand: string;
  origin: string;
  shortDescription: string;
  description: string;
  price: number | null;
  stockQuantity: number;
  availability: "in-stock" | "on-request";
  leadTime: string;
  warranty: string;
  image: string;
  imageAlt?: string;
  additionalImages?: string[];
  additionalImageAlts?: Record<string, string>;
  badge?: string;
  featured?: boolean;
  salesCount?: number;
  createdAt: string;
  features: string[];
  uses: string[];
  specifications: Array<{ label: string; value: string }>;
  technicalFile: string | null;
  seo?: SeoMetadata;
};

export type CatalogOrderProduct = Pick<
  Product,
  "slug" | "nameAr" | "sku" | "model" | "image" | "price" | "stockQuantity"
>;

export type Article = {
  category: string;
  title: string;
  excerpt: string;
  date: string;
  image: string;
};

export type PlaceholderPage = {
  title: string;
  description: string;
  icon: LucideIcon;
};
