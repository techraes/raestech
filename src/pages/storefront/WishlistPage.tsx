import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Heart, Trash2 } from "lucide-react";
import { useProducts } from "@/data/catalog";
import { useSettings } from "@/features/settings/store";
import { useWishlist } from "@/features/wishlist/store";
import { buyNowPrice } from "@/lib/pricing";
import { formatPKR } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useCart } from "@/store/cart";

export function WishlistPage() {
  const allProducts = useProducts();
  const { slugs, count, toggle } = useWishlist();
  const { settings } = useSettings();
  const { addItem } = useCart();

  // Saved products resolved from the catalogue by slug (stable public identity).
  const products = useMemo(() => {
    const bySlug = new Map(allProducts.map((p) => [p.slug, p]));
    const seen = new Set<string>();
    const out: typeof allProducts = [];
    for (const slug of slugs) {
      const p = bySlug.get(slug);
      if (p && !seen.has(p.slug)) {
        seen.add(p.slug);
        out.push(p);
      }
    }
    return out;
  }, [allProducts, slugs]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold sm:text-3xl">Wishlist</h1>
      {count === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-20 text-center">
          <Heart className="mb-4 h-10 w-10 text-muted-foreground" />
          <p className="text-lg font-medium">No favourites yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Tap the heart on any phone to save it here.
          </p>
          <Button asChild className="mt-6"><Link to="/phones">Discover Phones</Link></Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => {
            const v = p.variants[0];
            const bn = buyNowPrice(v.listedPrice, settings.buyNowDiscountPercent);
            return (
              <Card key={p.slug} className="flex items-center gap-4 p-4">
                <Link to={`/product/${p.slug}`} className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-muted/50">
                  <span className="text-xl font-black text-muted-foreground">{p.model[0]}</span>
                </Link>
                <div className="min-w-0 flex-1">
                  <Link to={`/product/${p.slug}`} className="line-clamp-1 font-semibold hover:underline">{p.name}</Link>
                  <p className="text-sm font-bold">{formatPKR(bn)}</p>
                  <Button size="sm" variant="secondary" className="mt-1" onClick={() => addItem(p, v)}>
                    Add to Cart
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-red-600"
                  aria-label="Remove from wishlist"
                  onClick={() => void toggle(p.slug)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
