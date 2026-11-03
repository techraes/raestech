import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, Heart } from "lucide-react";
import type { Product } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/features/settings/store";
import { buyNowPrice } from "@/lib/pricing";
import { formatPKR, displayCondition } from "@/lib/utils";
import { useCart } from "@/store/cart";
import { ProductImage } from "@/components/product-image";
import { ptaInfo } from "@/lib/pta";
import { cn } from "@/lib/utils";

const TONE_BADGE: Record<string, "success" | "warning" | "secondary" | "muted"> = {
  success: "success",
  warning: "warning",
  outline: "secondary",
  unknown: "muted",
};

export function ProductCard({ product }: { product: Product }) {
  const { settings } = useSettings();
  const addItem = useCart((s) => s.addItem);
  const variant = product.variants[0];
  if (!variant) return null;

  const pta = ptaInfo(variant);
  const bn = buyNowPrice(variant.listedPrice, settings.buyNowDiscountPercent);
  const savings = variant.listedPrice - bn;

  const bnPrices = product.variants.map((v) => buyNowPrice(v.listedPrice, settings.buyNowDiscountPercent)).filter((n) => Number.isFinite(n));
  const minBn = bnPrices.length ? Math.min(...bnPrices) : 0;
  const maxBn = bnPrices.length ? Math.max(...bnPrices) : 0;
  const hasRange = maxBn > minBn;

  // Anchor all discount references on the variant priced at the Buy-Now minimum
  // so the badge, the "From" line, and the range always describe the same variant.
  const minIdx = bnPrices.indexOf(minBn);
  const minVar = product.variants[minIdx];
  const minListed = minVar.listedPrice;
  const minSavings = minListed - minBn;
  const pctOff = Math.round(((hasRange ? minSavings : savings) / (hasRange ? minListed : variant.listedPrice)) * 100);

  const listedPrices = product.variants.map((v) => v.listedPrice);
  const minListedAll = Math.min(...listedPrices);
  const maxListedAll = Math.max(...listedPrices);
  const hasListedRange = maxListedAll > minListedAll;

  const navigate = useNavigate();
  const [liked, setLiked] = useState(false);

  function quickAdd(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    // Cards have no colour picker; default to the first listed colour so the item
    // is never added without a colour. Detailed choice happens on the product page.
    const defaultColor = variant.colors.length ? variant.colors[0] : "";
    addItem(product, variant, 1, defaultColor);
  }

  return (
    <Card className="card-lift group relative overflow-hidden border bg-card shadow-card hover:border-foreground/20">
      <Link to={`/product/${product.slug}`} className="block">
        <div className="relative aspect-square overflow-hidden bg-gradient-to-b from-muted/60 to-muted/30">
          <ProductImage product={product} variant={variant} className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-[1.06]" />
          <div className="pointer-events-none absolute inset-0 bg-foreground/0 transition-colors duration-300 group-hover:bg-foreground/[0.03]" />

          <div className="absolute left-2.5 top-2.5 flex flex-col gap-1.5">
            {pta.code === "jv" && <Badge variant="warning">JV / SIM-Locked</Badge>}
            {product.new_arrival && <Badge variant="success">New</Badge>}
            {product.bestseller && <Badge variant="secondary">Best seller</Badge>}
          </div>

          {pctOff > 0 && (
            <div className="absolute right-2.5 top-2.5 rounded-full bg-emerald-600 px-2 py-1 text-[10px] font-bold text-white shadow-sm">
              −{pctOff}%
            </div>
          )}

          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setLiked((v) => !v); }}
            className="absolute bottom-2.5 right-2.5 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow transition-transform active:scale-90 max-sm:bottom-2.5 sm:translate-y-1 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100"
            aria-label="Add to wishlist"
          >
            <Heart className={cn("h-4 w-4", liked ? "fill-red-500 text-red-500" : "text-neutral-600")} />
          </button>
        </div>

        <p className="px-3 pt-1 text-center text-[9px] leading-none text-neutral-400">Representative image — colour may vary</p>

        <CardContent className="space-y-1.5 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {product.brand}
          </p>
          <h3 className="line-clamp-2 min-h-[2.4em] text-[15px] font-bold leading-snug">{product.name}</h3>

          <p className="text-xs text-muted-foreground">
            {variant.storage} · {variant.ram} · {variant.colors[0] ?? "—"}
          </p>

          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            <Badge variant={TONE_BADGE[pta.tone]} className="text-[10px]">
              {pta.label}
            </Badge>
            <Badge variant="muted" className="text-[10px]">
              {displayCondition()}
            </Badge>
          </div>

          <div className="flex items-baseline gap-2 pt-1.5">
            {hasRange ? (
              <>
                <span className="text-base font-extrabold tracking-tight">
                  {formatPKR(minBn)} – {formatPKR(maxBn)}
                </span>
                <span className="text-xs text-muted-foreground line-through">
                  {hasListedRange ? `${formatPKR(minListedAll)} – ${formatPKR(maxListedAll)}` : formatPKR(minListedAll)}
                </span>
              </>
            ) : (
              <>
                <span className="text-lg font-extrabold tracking-tight">{formatPKR(bn)}</span>
                <span className="text-xs text-muted-foreground line-through">{formatPKR(variant.listedPrice)}</span>
              </>
            )}
          </div>
          <p className="text-[11px] font-medium text-emerald-700">
            {hasRange ? (
              <>From {formatPKR(minBn)} with Buy Now ({pctOff}% off)</>
            ) : (
              <>Save {formatPKR(savings)} with Buy Now</>
            )}
          </p>
        </CardContent>
      </Link>

      <div className="grid grid-cols-2 gap-2 p-4 pt-0">
        <Button size="sm" className="rounded-full" onClick={(e) => { e.preventDefault(); e.stopPropagation(); quickAdd(e); navigate("/checkout"); }}>
          Buy Now
        </Button>
        <Button size="sm" variant="outline" className="rounded-full" asChild>
          <Link to={`/instalments/apply?product=${product.slug}`}>Instalments</Link>
        </Button>
      </div>
    </Card>
  );
}

export function ProductGrid({ products, className }: { products: Product[]; className?: string }) {
  if (!products.length) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-16 text-center">
        <p className="text-muted-foreground">No phones found.</p>
      </div>
    );
  }
  return (
    <div className={cn("grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 sm:gap-4", className)}>
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
