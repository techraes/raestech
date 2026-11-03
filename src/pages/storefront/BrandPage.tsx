import { useParams } from "react-router-dom";
import { getProductsByBrandName, getBrands } from "@/data/catalog";
import { ProductGrid } from "@/components/product-card";
import { NotFoundPage } from "./NotFoundPage";

export function BrandPage() {
  const { brand } = useParams<{ brand: string }>();
  const brandName = getBrands().find((b) => b.slug === brand)?.name ?? "";
  const products = brandName ? getProductsByBrandName(brandName) : [];

  if (!brandName) return <NotFoundPage />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">{brandName}</h1>
        <p className="text-sm text-muted-foreground">{products.length} phones</p>
      </div>
      <ProductGrid products={products} />
    </div>
  );
}
