import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

export function FinalCta() {
  return (
    <section
      className="bg-brand-petroleum py-14 text-white"
      aria-labelledby="cta-title"
    >
      <Container className="text-center">
        <h2 id="cta-title" className="text-3xl font-bold sm:text-4xl">
          جاهز للطلب؟
        </h2>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <ButtonLink href="/shop" size="lg" variant="light">
            اطلب الآن
          </ButtonLink>
          <ButtonLink
            href="/quote"
            size="lg"
            variant="outline"
            className="border-white/30 text-white hover:bg-white/10"
          >
            احصل على عرض سعر
          </ButtonLink>
        </div>
      </Container>
    </section>
  );
}
