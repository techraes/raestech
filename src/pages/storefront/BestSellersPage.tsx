import { bestSellers } from "@/data/catalog";
import { ProductGrid } from "@/components/product-card";
import { Seo } from "@/lib/seo";

export function BestSellersPage() {
  const products = bestSellers();
  return (
    <div className="space-y-6">
      <Seo title="Best Sellers | Smartphones in Pakistan | RAES TECH" canonicalPath="/best-sellers" />
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">Best Sellers</h1>
        <p className="text-sm text-muted-foreground">Our most-requested phones.</p>
      </div>
      <ProductGrid products={products} />
    </div>
  );
}
