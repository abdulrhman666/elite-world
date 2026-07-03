import { Compass } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

export default function NotFound() {
  return (
    <section className="bg-brand-surface grid min-h-[65vh] place-items-center py-16 text-center">
      <Container>
        <Compass className="text-brand-cyan mx-auto size-16" aria-hidden />
        <p className="font-latin text-brand-petroleum mt-5 text-sm font-bold tracking-[.2em]">
          404
        </p>
        <h1 className="text-brand-ink mt-3 text-4xl font-bold">
          الصفحة غير موجودة
        </h1>
        <p className="mt-4 text-slate-600">
          ربما تغير الرابط أو لم تُنشأ هذه الصفحة بعد.
        </p>
        <ButtonLink href="/" className="mt-7">
          العودة إلى الرئيسية
        </ButtonLink>
      </Container>
    </section>
  );
}
