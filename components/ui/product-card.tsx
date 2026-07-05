import { PackageCheck } from "lucide-react";
import Image from "next/image";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { WhatsAppButton } from "@/components/catalog/whatsapp-button";
import { AddToQuoteButton } from "@/components/quote/add-to-quote-button";
import { WishlistButton } from "@/components/account/wishlist-button";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { formatProductPrice, getAvailabilityLabel } from "@/lib/catalog";
import type { Product } from "@/types";

export function ProductCard({
  product,
  compact = false,
}: {
  product: Product;
  compact?: boolean;
}) {
  const available = product.stockQuantity > 0;

  if (compact) {
    return (
      <article className="group border-brand-border shadow-soft hover:shadow-card min-w-0 overflow-hidden rounded-2xl border bg-white transition duration-300 hover:-translate-y-1">
        <div className="relative aspect-square overflow-hidden bg-gradient-to-b from-slate-50 to-cyan-50/60">
          <Image
            src={product.image}
            alt={product.imageAlt ?? `صورة المنتج ${product.nameAr}`}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 25vw"
            className="object-contain p-3 mix-blend-multiply transition duration-500 group-hover:scale-[1.03] sm:p-4"
          />
          <span
            className={`absolute top-2 right-2 rounded-lg px-2 py-1 text-[10px] font-bold ${available ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-900"}`}
          >
            {available ? "متوفر" : "غير متوفر"}
          </span>
        </div>
        <div className="p-3 sm:p-4">
          <p className="font-latin text-brand-cyan truncate text-[10px] font-bold tracking-wide sm:text-xs">
            {product.model}
          </p>
          <h3 className="text-brand-ink mt-1 line-clamp-2 min-h-10 text-sm leading-5 font-bold sm:min-h-12 sm:text-base sm:leading-6">
            {product.nameAr}
          </h3>
          <p className="mt-1 truncate text-[11px] text-slate-500 sm:text-xs">
            {product.brand}
          </p>
          <p className="text-brand-petroleum mt-2 text-sm font-bold sm:text-base">
            {formatProductPrice(product.price)}
          </p>
          <div className="mt-3 grid gap-2">
            <ButtonLink
              href={`/products/${product.slug}`}
              variant="outline"
              size="sm"
              className="min-h-10 w-full px-2 text-xs"
            >
              التفاصيل
            </ButtonLink>
            {product.price === null ? (
              <AddToQuoteButton
                productSlug={product.slug}
                productName={product.nameAr}
                label="عرض سعر"
                className="min-h-10 w-full px-2 text-xs"
              />
            ) : (
              <AddToCartButton
                productSlug={product.slug}
                productName={product.nameAr}
                stockQuantity={product.stockQuantity}
                label="إضافة"
                className="min-h-10 w-full px-2 text-xs"
              />
            )}
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="group border-brand-border shadow-soft hover:shadow-card overflow-hidden rounded-3xl border bg-white transition duration-300 hover:-translate-y-1">
      <div className="bg-brand-petroleum relative aspect-[4/3] overflow-hidden">
        <Image
          src={product.image}
          alt={product.imageAlt ?? `صورة المنتج ${product.nameAr}`}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="object-cover transition duration-500 group-hover:scale-[1.04]"
        />
        <div className="from-brand-ink/30 absolute inset-0 bg-gradient-to-t to-transparent" />
        {product.badge && (
          <Badge className="absolute top-4 right-4 border-white/20 bg-white/90">
            {product.badge}
          </Badge>
        )}
      </div>

      <div className="p-5">
        <div className="flex items-center justify-between gap-3">
          <p className="font-latin text-brand-cyan text-xs font-bold tracking-wider">
            {product.model}
          </p>
          <span
            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium ${available ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-900"}`}
          >
            <PackageCheck className="size-3.5" aria-hidden />
            {getAvailabilityLabel(product.availability)}
          </span>
        </div>

        <h3 className="text-brand-ink mt-3 min-h-14 text-lg leading-7 font-bold">
          {product.nameAr}
        </h3>
        <p className="mt-1 text-sm text-slate-500">{product.brand}</p>
        <p className="mt-4 min-h-14 text-sm leading-7 text-slate-600">
          {product.shortDescription}
        </p>
        <p className="text-brand-petroleum mt-5 text-lg font-bold">
          {formatProductPrice(product.price)}
        </p>

        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          <ButtonLink
            href={`/products/${product.slug}`}
            variant="outline"
            size="sm"
            className="w-full"
          >
            عرض المنتج
          </ButtonLink>
          {product.price === null ? (
            <AddToQuoteButton
              productSlug={product.slug}
              productName={product.nameAr}
              className="w-full"
            />
          ) : (
            <AddToCartButton
              productSlug={product.slug}
              productName={product.nameAr}
              stockQuantity={product.stockQuantity}
              className="w-full"
            />
          )}
        </div>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <WhatsAppButton
            productName={product.nameAr}
            model={product.model}
            productSlug={product.slug}
            className="w-full"
          />
          <WishlistButton productSlug={product.slug} />
        </div>
      </div>
    </article>
  );
}
