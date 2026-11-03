import { useState } from "react";
import { cn } from "@/lib/utils";
import type { Product, ProductVariant } from "@/types";

interface ProductImageProps {
  product: Product;
  variant?: ProductVariant;
  className?: string;
  /** Optional override — real upload / AI image URL. */
  photoUrl?: string;
}

/**
 * Renders the representative product photo from /images/products/<product.image>.
 * When no image file is recorded (or the file fails to load) it falls back to a
 * neutral grey placeholder that names the model — never a random/stock photo.
 */
export function ProductImage({ product, variant, className, photoUrl }: ProductImageProps) {
  const v = variant ?? product.variants[0];
  const [imgFailed, setImgFailed] = useState(false);

  const src = photoUrl ?? (product.image ? `/images/products/${product.image}` : undefined);
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
        onError={() => setImgFailed(true)}
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
