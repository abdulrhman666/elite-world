import type { NavItem } from "@/types";

export const brandColors = {
  cyan: "#0099BF",
  petroleum: "#00677F",
  white: "#FFFFFF",
  surface: "#F3F6F7",
  steel: "#B8C2C7",
  ink: "#102A33",
  border: "#D8E2E6",
} as const;

export const mainNavigation: NavItem[] = [
  { label: "الرئيسية", href: "/" },
  { label: "المتجر", href: "/shop" },
  { label: "الأقسام", href: "/categories" },
  { label: "تصنيع الستانلس", href: "/stainless" },
  { label: "تجهيز المشاريع", href: "/project-solutions" },
  { label: "العلامات التجارية", href: "/brands" },
  { label: "المشاريع السابقة", href: "/projects" },
  { label: "المدونة", href: "/blog" },
  { label: "الصيانة والضمان", href: "/maintenance" },
  { label: "من نحن", href: "/about" },
  { label: "تواصل معنا", href: "/contact" },
];

export const siteConfig = {
  name: "ELITE WORLD",
  arabicName: "[أدخل الاسم العربي]",
  description:
    "معدات وحلول صناعية احترافية للمطاعم والمخابز والكافيهات والمشاريع الغذائية.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://example.com",
  logo: "/brand/elite-world-logo.png",
  phone: "[أدخل رقم الهاتف]",
  whatsapp: "[أدخل رقم واتساب]",
  email: "[أدخل البريد الإلكتروني]",
  city: "[أدخل المدينة]",
  address: "[أدخل العنوان]",
  commercialRegistration: "",
  taxNumber: "",
  currency: "SAR",
  vat: 0.15,
  delivery: "التوصيل إلى جميع مناطق المملكة",
  shipping: {
    riyadhEstimate: "3–7 أيام عمل",
    outsideRiyadhEstimate: "5–10 أيام عمل",
  },
  workingHours: "[أدخل ساعات العمل]",
  hero: {
    title: "نجهّز نجاحك بأعلى معايير الجودة",
    text: "معدات مطاعم ومخابز وحلول ستانلس ستيل احترافية، مصممة لتتحمل أقوى ظروف التشغيل اليومية.",
    primaryButtonText: "تصفح المعدات",
    primaryButtonUrl: "/shop",
    secondaryButtonText: "اطلب عرض سعر",
    secondaryButtonUrl: "/quote",
    tertiaryButtonText: "أرسل مخطط مشروعك",
    tertiaryButtonUrl: "/quote",
    image: "/images/hero-industrial-kitchen.png",
  },
  announcement: {
    text: "حلول معدات صناعية متكاملة",
    visible: false,
  },
  favicon: "/favicon.ico",
  showFloatingWhatsapp: true,
  showContactDetails: true,
  footer: {
    description:
      "حلول صناعية متكاملة لمعدات المطاعم والمخابز والكافيهات، وتصنيع الستانلس وتجهيز المشاريع من الدراسة إلى التشغيل.",
    copyright: "جميع الحقوق محفوظة.",
    showSocialLinks: true,
  },
  social: {
    instagram: "#",
    x: "#",
    linkedin: "#",
    tiktok: "#",
    youtube: "#",
  },
  colors: brandColors,
  navigation: mainNavigation,
} as const;
