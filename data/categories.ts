import type { Category } from "@/types";

/**
 * بيانات توصيف يستخدمها محول CSV وPrisma Seed فقط.
 * تُستبدل النصوص والصور عند اعتماد كتالوج ELITE WORLD الرسمي، ثم يُعاد Seed.
 */
export const catalogCategories: Category[] = [
  {
    slug: "cooking-equipment",
    name: "معدات الطبخ",
    nameEn: "Cooking Equipment",
    description:
      "أفران وقلايات وشوايات مصممة لوتيرة التشغيل اليومية في المطابخ التجارية.",
    image: "/images/equipment-blueprint.svg",
    icon: "commercial-oven",
    subcategories: [
      { slug: "ovens", name: "الأفران" },
      { slug: "fryers", name: "القلايات" },
      { slug: "grills", name: "الشوايات" },
    ],
  },
  {
    slug: "bakery-equipment",
    name: "معدات المخابز",
    nameEn: "Bakery Equipment",
    description:
      "حلول العجن والتشكيل والخبز للمخابز الحرفية وخطوط الإنتاج المتوسطة.",
    image: "/images/bakery-blueprint.svg",
    icon: "spiral-mixer",
    subcategories: [
      { slug: "mixers", name: "العجانات" },
      { slug: "dough-preparation", name: "تحضير وتشكيل العجين" },
      { slug: "bakery-ovens", name: "أفران المخابز" },
    ],
  },
  {
    slug: "cafe-equipment",
    name: "معدات الكافيهات",
    nameEn: "Cafe Equipment",
    description:
      "معدات تحضير القهوة الاحترافية لتدفق عمل ثابت وجودة متكررة طوال اليوم.",
    image: "/images/cafe-blueprint.svg",
    icon: "espresso-machine",
    subcategories: [
      { slug: "espresso-machines", name: "مكائن الإسبريسو" },
      { slug: "coffee-grinders", name: "مطاحن القهوة" },
      { slug: "beverage-preparation", name: "تحضير المشروبات" },
    ],
  },
  {
    slug: "refrigeration",
    name: "التبريد والتجميد",
    nameEn: "Refrigeration & Freezing",
    description:
      "ثلاجات وفريزرات تجارية لحفظ المكونات ضمن درجات حرارة مستقرة وآمنة.",
    image: "/images/cooling-blueprint.svg",
    icon: "upright-fridge",
    subcategories: [
      { slug: "refrigerators", name: "الثلاجات" },
      { slug: "freezers", name: "الفريزرات" },
      { slug: "undercounter-cooling", name: "تبريد تحت الكونتر" },
    ],
  },
  {
    slug: "preparation-equipment",
    name: "معدات التحضير",
    nameEn: "Preparation Equipment",
    description:
      "معدات تقطيع وفرم وتجهيز ترفع الإنتاجية وتحافظ على اتساق التحضير.",
    image: "/images/project-blueprint.svg",
    icon: "food-processor",
    subcategories: [
      { slug: "vegetable-cutters", name: "قطاعات الخضار" },
      { slug: "meat-processing", name: "تجهيز اللحوم" },
      { slug: "food-processors", name: "محضرات الطعام" },
    ],
  },
  {
    slug: "washing-equipment",
    name: "معدات الغسيل",
    nameEn: "Washing Equipment",
    description:
      "غسالات تجارية للأطباق والكؤوس تدعم النظافة وسرعة دوران أدوات الخدمة.",
    image: "/images/cooling-blueprint.svg",
    icon: "dishwasher",
    subcategories: [
      { slug: "dishwashers", name: "غسالات الصحون" },
      { slug: "glasswashers", name: "غسالات الكؤوس" },
      { slug: "washing-accessories", name: "ملحقات الغسيل" },
    ],
  },
  {
    slug: "buffet-display",
    name: "البوفيهات والعرض",
    nameEn: "Buffet & Display",
    description: "وحدات عرض وتسخين وتبريد تجمع بين وضوح المنتج وكفاءة الخدمة.",
    image: "/images/cafe-blueprint.svg",
    icon: "buffet-counter",
    subcategories: [
      { slug: "heated-display", name: "العرض الساخن" },
      { slug: "refrigerated-display", name: "العرض المبرد" },
      { slug: "buffet-lines", name: "خطوط البوفيه" },
    ],
  },
  {
    slug: "packaging",
    name: "معدات التعبئة",
    nameEn: "Packaging Equipment",
    description:
      "معدات تعبئة وتغليف مخصصة لتهيئة المنتجات الغذائية وحفظها للتداول.",
    image: "/images/equipment-blueprint.svg",
    icon: "vacuum-sealer",
    subcategories: [],
  },
  {
    slug: "stainless-steel",
    name: "منتجات الستانلس ستيل",
    nameEn: "Stainless Steel Products",
    description:
      "طاولات وأحواض وخزائن وشفاطات قابلة للتصنيع حسب أبعاد المشروع.",
    image: "/images/stainless-blueprint.svg",
    icon: "stainless-sink",
    subcategories: [
      { slug: "tables", name: "الطاولات" },
      { slug: "sinks", name: "الأحواض" },
      { slug: "cabinets", name: "الخزائن" },
      { slug: "hoods", name: "الشفاطات" },
    ],
  },
];
