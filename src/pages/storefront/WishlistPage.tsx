import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Heart, Trash2 } from "lucide-react";
import { useProducts } from "@/data/catalog";
import { useSettings } from "@/features/settings/store";
import { buyNowPrice } from "@/lib/pricing";
import { formatPKR } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useCart } from "@/store/cart";

export function WishlistPage() {
  const allProducts = useProducts();
  // In dev mode we keep wishlist in memory; persisted in Supabase when configured.
  const [wish, setWish] = useState<number[]>(useMemo(() => allProducts.slice(0, 6).map((p) => p.id), [allProducts]));
  const { settings } = useSettings();
  const { addItem } = useCart();
  const products = allProducts.filter((p) => wish.includes(p.id));

  function toggle(id: number) {
    setWish((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold sm:text-3xl">Wishlist</h1>
      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-20 text-center">
          <Heart className="mb-4 h-10 w-10 text-muted-foreground" />
          <p className="text-lg font-medium">No favourites yet</p>
          <Button asChild className="mt-6"><Link to="/phones">Discover Phones</Link></Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => {
            const v = p.variants[0];
            const bn = buyNowPrice(v.listedPrice, settings.buyNowDiscountPercent);
            return (
              <Card key={p.id} className="flex items-center gap-4 p-4">
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
                <Button variant="ghost" size="icon" className="text-red-600" onClick={() => toggle(p.id)}>
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
