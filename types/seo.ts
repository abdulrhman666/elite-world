export type SeoFormValues = {
  seoTitle: string | null;
  seoDescription: string | null;
  canonicalUrl: string | null;
  seoIndexable: boolean;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
  seoImageAlt: string | null;
};

export type SeoSuggestion = {
  title: string;
  description: string;
  slug: string;
  imageAlt: string;
  ogTitle: string;
  ogDescription: string;
};

export type SeoSuggestionInput = {
  entityType: "product" | "category" | "page";
  nameAr: string;
  nameEn?: string;
  description: string;
  slug: string;
};
