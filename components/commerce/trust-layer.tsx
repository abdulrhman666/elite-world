import { Headphones, ShieldCheck, Truck } from "lucide-react";
import { Container } from "@/components/ui/container";
import { cn } from "@/lib/utils";

const trustItems = [
  {
    icon: ShieldCheck,
    title: "ضمان واضح",
    text: "مدة الضمان موضحة لكل منتج.",
  },
  {
    icon: Truck,
    title: "شحن منظم",
    text: "التكلفة والموعد يؤكدان قبل الدفع.",
  },
  {
    icon: Headphones,
    title: "تواصل مباشر",
    text: "فريقنا يراجع الطلب والمواصفات.",
  },
] as const;

export function CommerceTrustBadges({ className }: { className?: string }) {
  return (
    <div className={cn("grid gap-3 sm:grid-cols-3", className)}>
      {trustItems.map(({ icon: Icon, title, text }) => (
        <div
          key={title}
          className="border-brand-border flex gap-3 rounded-2xl border bg-white p-4"
        >
          <Icon
            className="text-brand-cyan mt-0.5 size-5 shrink-0"
            aria-hidden
          />
          <div>
            <p className="text-brand-ink text-sm font-bold">{title}</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">{text}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export function CommerceTrustBar() {
  return (
    <section
      className="border-brand-border border-b bg-white py-5"
      aria-label="معلومات الثقة والطلب"
    >
      <Container>
        <CommerceTrustBadges />
      </Container>
    </section>
  );
}
