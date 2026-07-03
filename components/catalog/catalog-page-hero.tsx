import { Badge } from "@/components/ui/badge";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Container } from "@/components/ui/container";

export function CatalogPageHero({
  title,
  description,
  eyebrow = "كتالوج المعدات",
  breadcrumbItems,
}: {
  title: string;
  description: string;
  eyebrow?: string;
  breadcrumbItems?: Array<{ label: string; href: string }>;
}) {
  return (
    <header className="bg-brand-surface border-brand-border relative overflow-hidden border-b py-10 sm:py-14">
      <div className="from-brand-cyan/10 absolute inset-x-0 top-0 h-64 bg-gradient-to-b to-transparent" />
      <Container className="relative">
        <Breadcrumb current={title} items={breadcrumbItems} />
        <div className="mt-9 max-w-4xl">
          <Badge>{eyebrow}</Badge>
          <h1 className="text-brand-ink mt-4 text-3xl leading-tight font-bold sm:text-5xl">
            {title}
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600 sm:text-lg">
            {description}
          </p>
        </div>
      </Container>
    </header>
  );
}
