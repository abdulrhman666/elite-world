"use client";

import { AlertTriangle } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

export default function AppError({ reset }: { reset: () => void }) {
  return (
    <section className="bg-brand-surface grid min-h-[65vh] place-items-center py-16 text-center">
      <Container>
        <div className="border-brand-border mx-auto max-w-xl rounded-3xl border bg-white p-8 shadow-sm sm:p-12">
          <AlertTriangle
            className="text-brand-cyan mx-auto size-14"
            aria-hidden
          />
          <h1 className="text-brand-ink mt-5 text-3xl font-bold">
            تعذر تحميل الصفحة
          </h1>
          <p className="mt-3 leading-7 text-slate-600">
            حدث خطأ مؤقت. أعد المحاولة، وإذا استمرت المشكلة ارجع إلى الصفحة
            الرئيسية.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Button type="button" onClick={reset}>
              إعادة المحاولة
            </Button>
            <ButtonLink href="/" variant="outline">
              العودة إلى الرئيسية
            </ButtonLink>
          </div>
        </div>
      </Container>
    </section>
  );
}
