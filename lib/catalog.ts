import type { Category, Product } from "@/types";

export type CatalogSort = "best-selling" | "newest" | "price" | "name";
export type AvailabilityFilter = "all" | Product["availability"];

export function normalizeArabic(value: string) {
  return value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[\u064b-\u065f\u0670]/g, "")
    .replace(/ـ/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/\s+/g, " ")
    .trim();
}

export function getSubcategoryName(product: Product, categories: Category[]) {
  return categories
    .find((category) => category.slug === product.categorySlug)
    ?.subcategories.find(
      (subcategory) => subcategory.slug === product.subcategorySlug,
    )?.name;
}

export function formatProductPrice(price: number | null) {
  if (price === null) return "اطلب عرض سعر";
  return `${new Intl.NumberFormat("ar-SA-u-nu-latn", {
    maximumFractionDigits: 0,
  }).format(price)} ر.س`;
}

export function getAvailabilityLabel(availability: Product["availability"]) {
  return availability === "in-stock" ? "متوفر" : "غير متوفر";
}

function matchesProductSearch(
  product: Product,
  normalizedQuery: string,
  categories: Category[],
) {
  if (!normalizedQuery) return true;
  const category = categories.find(
    (item) => item.slug === product.categorySlug,
  );
  const searchable = normalizeArabic(
    [
      product.nameAr,
      product.nameEn,
      product.sku,
      product.model,
      product.brand,
      category?.name ?? "",
      category?.nameEn ?? "",
    ].join(" "),
  );
  return searchable.includes(normalizedQuery);
}

export function filterCatalogProducts({
  products,
  categories,
  query = "",
  category = "all",
  availability = "all",
  sort = "best-selling",
}: {
  products: Product[];
  categories: Category[];
  query?: string;
  category?: string;
  availability?: AvailabilityFilter;
  sort?: CatalogSort;
}) {
  const normalizedQuery = normalizeArabic(query);
  const filtered = products.filter((product) => {
    const categoryMatches =
      category === "all" || product.categorySlug === category;
    const availabilityMatches =
      availability === "all" || product.availability === availability;
    return (
      categoryMatches &&
      availabilityMatches &&
      matchesProductSearch(product, normalizedQuery, categories)
    );
  });

  return filtered.sort((first, second) => {
    if (sort === "best-selling") {
      const salesDifference =
        (second.salesCount ?? 0) - (first.salesCount ?? 0);
      if (salesDifference) return salesDifference;
      if (first.featured !== second.featured) return first.featured ? -1 : 1;
      return first.nameAr.localeCompare(second.nameAr, "ar");
    }
    if (sort === "price") {
      if (first.price === null && second.price === null) return 0;
      if (first.price === null) return 1;
      if (second.price === null) return -1;
      return first.price - second.price;
    }
    if (sort === "name") {
      return first.nameAr.localeCompare(second.nameAr, "ar");
    }
    return second.createdAt.localeCompare(first.createdAt);
  });
}

function editDistance(first: string, second: string) {
  const previous = Array.from(
    { length: second.length + 1 },
    (_, index) => index,
  );
  for (let firstIndex = 1; firstIndex <= first.length; firstIndex += 1) {
    const current = [firstIndex];
    for (let secondIndex = 1; secondIndex <= second.length; secondIndex += 1) {
      current[secondIndex] = Math.min(
        current[secondIndex - 1] + 1,
        previous[secondIndex] + 1,
        previous[secondIndex - 1] +
          (first[firstIndex - 1] === second[secondIndex - 1] ? 0 : 1),
      );
    }
    previous.splice(0, previous.length, ...current);
  }
  return previous[second.length];
}

export function suggestCatalogProducts(products: Product[], query: string) {
  const normalized = normalizeArabic(query);
  if (normalized.length < 2) return [];
  const maximumDistance = normalized.length <= 5 ? 1 : 2;
  const matches = products
    .map((product) => {
      const candidates = [
        product.nameAr,
        product.nameEn,
        product.sku,
        product.model,
        product.brand,
      ].map(normalizeArabic);
      const exact = candidates.some((value) => value.includes(normalized));
      const distance = Math.min(
        ...candidates.flatMap((value) =>
          value.split(" ").map((word) => editDistance(word, normalized)),
        ),
      );
      return { product, score: exact ? 0 : distance };
    })
    .filter((item) => item.score <= maximumDistance)
    .sort((first, second) => first.score - second.score)
    .map((item) => item.product.nameAr);
  return [...new Set(matches)].slice(0, 6);
}
