import { bestSellers } from "@/data/catalog";
import { ProductGrid } from "@/components/product-card";

export function BestSellersPage() {
  const products = bestSellers();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">Best Sellers</h1>
        <p className="text-sm text-muted-foreground">Our most-requested phones.</p>
      </div>
      <ProductGrid products={products} />
    </div>
  );
}
