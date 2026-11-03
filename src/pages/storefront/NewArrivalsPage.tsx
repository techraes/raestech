import { newArrivals } from "@/data/catalog";
import { ProductGrid } from "@/components/product-card";

export function NewArrivalsPage() {
  const products = newArrivals();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">New Arrivals</h1>
        <p className="text-sm text-muted-foreground">Freshly listed smartphones.</p>
      </div>
      <ProductGrid products={products} />
    </div>
  );
}
