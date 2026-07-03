import { Mail, ShieldCheck } from "lucide-react";
import type { PlaceholderPage } from "@/types";

export const placeholderPages: Record<string, PlaceholderPage> = {
  contact: {
    title: "تواصل معنا",
    description: "بيانات التواصل والعنوان وساعات العمل الرسمية.",
    icon: Mail,
  },
  compare: {
    title: "مقارنة المنتجات",
    description: "صفحة معلومات المنتجات والمواصفات الفنية.",
    icon: ShieldCheck,
  },
};
