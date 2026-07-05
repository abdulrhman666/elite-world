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
    <div className={cn("grid grid-cols-3 gap-2 sm:gap-3", className)}>
      {trustItems.map(({ icon: Icon, title, text }) => (
        <div
          key={title}
          className="border-brand-border flex min-w-0 flex-col items-center gap-1 rounded-xl border bg-white p-2 text-center sm:flex-row sm:items-start sm:gap-3 sm:rounded-2xl sm:p-4 sm:text-start"
        >
          <Icon
            className="text-brand-cyan size-4 shrink-0 sm:mt-0.5 sm:size-5"
            aria-hidden
          />
          <div>
            <p className="text-brand-ink text-[11px] leading-4 font-bold sm:text-sm">
              {title}
            </p>
            <p className="mt-1 hidden text-xs leading-5 text-slate-500 sm:block">
              {text}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

export function CommerceTrustBar() {
  return (
    <section
      className="border-brand-border border-b bg-white py-3 sm:py-5"
      aria-label="معلومات الثقة والطلب"
    >
      <Container>
        <CommerceTrustBadges />
      </Container>
    </section>
  );
}
