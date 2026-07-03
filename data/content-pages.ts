import type { ContentPageData } from "@/types/content-page";

export const editableContentPageSlugs = [
  "about",
  "brands",
  "projects",
  "project-solutions",
  "stainless",
  "maintenance",
] as const;

export type EditableContentPageSlug = (typeof editableContentPageSlugs)[number];

export const defaultContentPages: Record<
  EditableContentPageSlug,
  ContentPageData
> = {
  about: {
    slug: "about",
    title: "من نحن",
    eyebrow: "ELITE WORLD",
    heroTitle: "شريك تجهيز يفهم احتياجات التشغيل",
    heroDescription:
      "نساعد المطاعم والمخابز والمشاريع الغذائية في اختيار المعدات والحلول المناسبة، من دراسة الاحتياج وحتى التوريد والتشغيل.",
    heroImage: "/images/project-blueprint.svg",
    sections: [
      {
        id: "about-story",
        title: "خبرة عملية في التجهيز",
        description:
          "نعمل بمنهج واضح يربط اختيار المعدات بمساحة المشروع وحجم الإنتاج ومسار العمل اليومي، لتكون الحلول عملية وقابلة للتوسع.",
        items: [
          "دراسة الاحتياج قبل الترشيح",
          "مواصفات فنية واضحة",
          "حلول للمطاعم والمخابز والمطابخ المركزية",
          "متابعة التوريد والتركيب والتشغيل",
        ],
        image: "/images/equipment-blueprint.svg",
        layout: "cards",
      },
      {
        id: "about-values",
        title: "ما الذي نلتزم به؟",
        description:
          "نركز على جودة المعدة، وضوح العرض، وسهولة الخدمة بعد التسليم.",
        items: ["الجودة", "الوضوح", "الالتزام", "الدعم الفني"],
        image: null,
        layout: "list",
      },
    ],
    primaryCtaText: "تصفح المعدات",
    primaryCtaUrl: "/shop",
    secondaryCtaText: "تواصل معنا",
    secondaryCtaUrl: "/contact",
  },
  brands: {
    slug: "brands",
    title: "العلامات التجارية",
    eyebrow: "شركاء الجودة",
    heroTitle: "علامات مختارة لبيئات التشغيل المهنية",
    heroDescription:
      "نعرض علامات معدات مناسبة لقطاع الضيافة والأغذية، مع مراعاة الاعتمادية وتوفر الخدمة ووضوح المواصفات.",
    heroImage: "/images/equipment-blueprint.svg",
    sections: [
      {
        id: "brands-standards",
        title: "كيف نختار العلامات؟",
        description:
          "لا يعتمد الاختيار على الاسم فقط، بل على ملاءمة المعدة لطبيعة التشغيل وخطة المشروع.",
        items: [
          "اعتمادية التشغيل التجاري",
          "وضوح المواصفات الفنية",
          "توفر قطع الغيار والخدمة",
          "كفاءة استهلاك الطاقة",
        ],
        image: null,
        layout: "cards",
      },
      {
        id: "brands-featured",
        title: "علامات بارزة",
        description:
          "يمكن تعديل هذه القائمة والنصوص من لوحة الإدارة، بينما تظهر علامات المنتجات الفعلية تلقائياً أسفلها.",
        items: ["Rational", "Electrolux", "Bosch", "Hobart"],
        image: null,
        layout: "list",
      },
    ],
    primaryCtaText: "عرض المنتجات",
    primaryCtaUrl: "/shop",
    secondaryCtaText: "طلب ترشيح فني",
    secondaryCtaUrl: "/quote",
  },
  projects: {
    slug: "projects",
    title: "المشاريع السابقة",
    eyebrow: "خبرات متنوعة",
    heroTitle: "حلول تجهيز مصممة حول احتياج المشروع",
    heroDescription:
      "نماذج توضيحية لنطاقات العمل التي ندعمها في المطاعم والمخابز والمطابخ المركزية.",
    heroImage: "/images/project-blueprint.svg",
    sections: [
      {
        id: "projects-types",
        title: "نماذج المشاريع",
        description:
          "يمكن استبدال هذه النماذج بالمشاريع المعتمدة وصورها من لوحة الإدارة.",
        items: [
          "تجهيز مطعم متكامل — طبخ وتحضير وتبريد وغسيل",
          "تجهيز مخبز إنتاج — عجن وتخمير وخَبز وعرض",
          "مطبخ مركزي — دراسة تدفق وتوريد وتركيب وتشغيل",
          "منطقة تحضير ستانلس — تصنيع حسب المخطط والمقاسات",
        ],
        image: "/images/bakery-blueprint.svg",
        layout: "cards",
      },
      {
        id: "projects-delivery",
        title: "نطاق التنفيذ",
        description: "يتحدد نطاق كل مشروع حسب الاتفاق والعرض الفني المعتمد.",
        items: ["دراسة", "توريد", "تركيب", "تشغيل وتدريب"],
        image: null,
        layout: "steps",
      },
    ],
    primaryCtaText: "ابدأ مشروعك",
    primaryCtaUrl: "/quote",
    secondaryCtaText: "تجهيز المشاريع",
    secondaryCtaUrl: "/project-solutions",
  },
  "project-solutions": {
    slug: "project-solutions",
    title: "تجهيز المشاريع",
    eyebrow: "من الفكرة إلى التشغيل",
    heroTitle: "مسار واضح لتجهيز مشروعك",
    heroDescription:
      "ننسق احتياجات المعدات والتصنيع والتوريد ضمن خطوات واضحة تساعدك على اتخاذ القرار ومتابعة التنفيذ.",
    heroImage: "/images/project-blueprint.svg",
    sections: [
      {
        id: "solutions-steps",
        title: "مراحل العمل",
        description: "مسار مرن يتكيف مع حجم المشروع والمرحلة التي وصل إليها.",
        items: [
          "دراسة الاحتياج والمخططات",
          "اختيار المعدات والمواصفات",
          "إعداد العرض الفني والمالي",
          "التوريد والتركيب",
          "التشغيل والتدريب",
          "الدعم بعد التسليم",
        ],
        image: null,
        layout: "steps",
      },
      {
        id: "solutions-sectors",
        title: "القطاعات التي نخدمها",
        description: "حلول قابلة للتخصيص وفق طبيعة الإنتاج والخدمة.",
        items: [
          "المطاعم",
          "المخابز",
          "الكافيهات",
          "الفنادق",
          "المطابخ المركزية",
          "المصانع الغذائية",
        ],
        image: "/images/equipment-blueprint.svg",
        layout: "cards",
      },
    ],
    primaryCtaText: "طلب دراسة مشروع",
    primaryCtaUrl: "/quote",
    secondaryCtaText: "تصفح المعدات",
    secondaryCtaUrl: "/shop",
  },
  stainless: {
    slug: "stainless",
    title: "تصنيع الستانلس",
    eyebrow: "تصنيع حسب الطلب",
    heroTitle: "حلول ستانلس للمطابخ ومناطق الإنتاج",
    heroDescription:
      "طاولات وأحواض وخزائن وشفاطات ووحدات تحضير قابلة للتنفيذ حسب المقاسات والمخططات المعتمدة.",
    heroImage: "/images/stainless-blueprint.svg",
    sections: [
      {
        id: "stainless-products",
        title: "ما الذي نصنعه؟",
        description:
          "تتنوع القطع حسب موقع الاستخدام وطبيعة التشغيل والمقاسات النهائية.",
        items: [
          "طاولات التحضير والعمل",
          "الأحواض والمجالي",
          "الخزائن والأرفف",
          "الشفاطات والفلاتر",
          "العربات والكونترات",
          "وحدات التحضير الخاصة",
        ],
        image: null,
        layout: "cards",
      },
      {
        id: "stainless-process",
        title: "خطوات الطلب",
        description: "نراجع التفاصيل قبل اعتماد التصنيع لتقليل التعارضات.",
        items: [
          "إرسال المقاسات أو المخطط",
          "مراجعة الاستخدام والخامة",
          "اعتماد العرض والتفاصيل",
          "التصنيع والتسليم",
        ],
        image: "/images/stainless-blueprint.svg",
        layout: "steps",
      },
    ],
    primaryCtaText: "اطلب عرض سعر",
    primaryCtaUrl: "/quote",
    secondaryCtaText: "منتجات الستانلس",
    secondaryCtaUrl: "/categories/stainless-steel",
  },
  maintenance: {
    slug: "maintenance",
    title: "الصيانة والضمان",
    eyebrow: "دعم ما بعد البيع",
    heroTitle: "استمرارية التشغيل تبدأ من خدمة واضحة",
    heroDescription:
      "معلومات الضمان والدعم الفني والصيانة الوقائية للمعدات الموردة وفق شروط كل منتج وعقد.",
    heroImage: "/images/cooling-blueprint.svg",
    sections: [
      {
        id: "maintenance-services",
        title: "خدمات الدعم",
        description: "تُحدد التغطية الفعلية حسب المنتج والضمان وموقع التركيب.",
        items: [
          "استقبال البلاغات الفنية",
          "تشخيص الأعطال",
          "الصيانة الوقائية",
          "توفير قطع الغيار حسب التوفر",
          "إرشادات التشغيل والعناية",
        ],
        image: null,
        layout: "cards",
      },
      {
        id: "maintenance-request",
        title: "قبل طلب الخدمة",
        description: "جهّز البيانات التالية لتسريع مراجعة الطلب.",
        items: [
          "اسم المنتج والموديل",
          "رقم الفاتورة أو الطلب",
          "وصف واضح للعطل",
          "صور أو فيديو عند توفرها",
        ],
        image: "/images/equipment-blueprint.svg",
        layout: "steps",
      },
    ],
    primaryCtaText: "تواصل مع الدعم",
    primaryCtaUrl: "/contact",
    secondaryCtaText: "متابعة طلب",
    secondaryCtaUrl: "/track",
  },
};

export function isEditableContentPageSlug(
  value: string,
): value is EditableContentPageSlug {
  return editableContentPageSlugs.includes(value as EditableContentPageSlug);
}
