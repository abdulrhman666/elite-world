import type { Article } from "@/types";

/** محتوى تأسيسي يُنقل إلى Prisma بواسطة Seed ولا يُقرأ وقت تشغيل الصفحات. */
export const seedArticles: Article[] = [
  {
    category: "دليل المخابز",
    title: "كيف تختار فرن المخبز المناسب؟",
    excerpt:
      "دليل تمهيدي لفهم السعة ومصدر الطاقة ونمط الإنتاج قبل اتخاذ القرار.",
    date: "2026-06-30",
    image: "/images/bakery-blueprint.svg",
  },
  {
    category: "دليل الستانلس",
    title: "الفرق بين ستانلس 304 و316 و430",
    excerpt:
      "نظرة عملية على الخصائص والاستخدامات المناسبة لكل نوع في بيئات العمل.",
    date: "2026-06-30",
    image: "/images/stainless-blueprint.svg",
  },
  {
    category: "تجهيز المطاعم",
    title: "أهم المعدات الأساسية لتجهيز مطعم",
    excerpt: "قائمة منظمة تساعدك على بناء تصور أولي للمطبخ ومسار التشغيل.",
    date: "2026-06-30",
    image: "/images/project-blueprint.svg",
  },
];
