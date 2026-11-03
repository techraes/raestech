import { useSearchParams } from "react-router-dom";
import { searchProducts } from "@/data/catalog";
import { ProductGrid } from "@/components/product-card";

export function SearchResultsPage() {
  const [params] = useSearchParams();
  const q = params.get("q") ?? "";
  const products = searchProducts(q);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Search results</h1>
        <p className="text-sm text-muted-foreground">
          {q ? `for “${q}” · ` : ""}{products.length} results
        </p>
      </div>
      <ProductGrid products={products} />
    </div>
  );
}
