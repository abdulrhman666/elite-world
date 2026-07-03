"use client";

import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { siteConfig } from "@/config/site";
import { getWhatsAppInquiryUrl } from "@/lib/whatsapp";

export function WhatsAppButton({
  productName,
  model,
  productSlug,
  label = "استفسار واتساب",
  className,
}: {
  productName: string;
  model: string;
  productSlug: string;
  label?: string;
  className?: string;
}) {
  const { showToast } = useToast();

  const handleClick = () => {
    const productUrl = `${window.location.origin}/products/${productSlug}`;
    const whatsappUrl = getWhatsAppInquiryUrl({
      whatsapp: siteConfig.whatsapp,
      productName,
      model,
      productUrl,
    });

    if (!whatsappUrl) {
      showToast(
        "رقم واتساب ما زال Placeholder. أدخله في config/site.ts لتفعيل الاستفسار.",
      );
      return;
    }

    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      className={className}
      icon={<MessageCircle className="size-4" aria-hidden />}
      onClick={handleClick}
    >
      {label}
    </Button>
  );
}
