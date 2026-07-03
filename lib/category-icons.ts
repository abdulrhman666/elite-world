export const categoryIconOptions = [
  { value: "commercial-oven", label: "فرن تجاري" },
  { value: "spiral-mixer", label: "عجانة مخابز" },
  { value: "espresso-machine", label: "ماكينة إسبريسو" },
  { value: "upright-fridge", label: "ثلاجة عمودية" },
  { value: "food-processor", label: "محضّرة طعام" },
  { value: "dishwasher", label: "غسالة صحون" },
  { value: "buffet-counter", label: "كاونتر بوفيه" },
  { value: "vacuum-sealer", label: "ماكينة تغليف" },
  { value: "stainless-sink", label: "حوض ستانلس" },
] as const;

const legacyIconMap: Record<string, string> = {
  flame: "commercial-oven",
  wheat: "spiral-mixer",
  coffee: "espresso-machine",
  snowflake: "upright-fridge",
  "cooking-pot": "food-processor",
  "washing-machine": "dishwasher",
  utensils: "buffet-counter",
  panel: "stainless-sink",
};

export function getCategoryIconSource(value: string, categorySlug?: string) {
  if (value.startsWith("media:")) {
    return value.slice("media:".length) || "/images/equipment-blueprint.svg";
  }
  const normalized =
    value === "panel" && categorySlug === "packaging"
      ? "vacuum-sealer"
      : (legacyIconMap[value] ?? value);
  const valid = categoryIconOptions.some((item) => item.value === normalized);
  return `/images/category-icons/${valid ? normalized : "commercial-oven"}.svg`;
}

export function normalizeCategoryIconValue(value: string) {
  if (value.startsWith("media:")) return value;
  const normalized = legacyIconMap[value] ?? value;
  return categoryIconOptions.some((item) => item.value === normalized)
    ? normalized
    : "commercial-oven";
}

export function isValidCategoryIconValue(value: string) {
  if (value.startsWith("media:/") && !value.includes("..")) return true;
  return categoryIconOptions.some((item) => item.value === value);
}
