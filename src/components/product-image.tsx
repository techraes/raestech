import { useState } from "react";
import { cn } from "@/lib/utils";
import type { Product, ProductVariant } from "@/types";

interface ProductImageProps {
  product: Product;
  variant?: ProductVariant;
  className?: string;
  /** Optional override — real upload / AI image URL. */
  photoUrl?: string;
  /** Selected colour — if a matching <image>-<colour>.jpg exists it is used, otherwise the base product image is shown. */
  color?: string;
}

function slugifyColor(c: string): string {
  return c.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

/**
 * Renders the representative product photo from /images/products/<product.image>.
 * When a colour is selected, it first tries /images/products/<image>-<colour>.jpg
 * and falls back to the base product image (then the placeholder) if that file
 * is absent. Never shows a random/stock photo.
 */
export function ProductImage({ product, variant, className, photoUrl, color }: ProductImageProps) {
  const v = variant ?? product.variants[0];
  const [imgFailed, setImgFailed] = useState(false);

  const baseSrc = product.image ? `/images/products/${product.image}` : undefined;
  const colorSrc = baseSrc && color ? baseSrc.replace(/\.(jpe?g|png|webp)$/i, `-${slugifyColor(color)}.$1`) : undefined;
  // Use the colour-specific image, otherwise the base image.
  const primarySrc = photoUrl ?? colorSrc ?? baseSrc;
  const [triedColor, setTriedColor] = useState(false);
  const src = triedColor ? baseSrc : primarySrc;
  const showImg = Boolean(src) && !imgFailed;

  if (!v) {
    return <div className={cn("bg-muted", className)} />;
  }

  if (showImg) {
    return (
      <img
        src={src}
        alt={`${product.name} — ${v.storage} ${v.ram}`}
        loading="lazy"
        decoding="async"
        onError={() => {
          if (!triedColor && colorSrc && colorSrc !== baseSrc) {
            setTriedColor(true);
          } else {
            setImgFailed(true);
          }
        }}
        className={cn("h-full w-full object-cover", className)}
      />
    );
  }

  return (
    <div className={cn("flex h-full w-full flex-col items-center justify-center gap-1 bg-neutral-200 p-4 text-center", className)}>
      <span className="text-xs font-bold uppercase tracking-widest text-neutral-500">{product.brand}</span>
      <span className="text-base font-extrabold leading-tight text-neutral-700">{product.model}</span>
      {v.storage && <span className="text-xs text-neutral-500">{v.storage} · {v.ram}</span>}
    </div>
  );
}
