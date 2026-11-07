import { useParams } from "react-router-dom";
import { getProductsByBrandName, getBrands } from "@/data/catalog";
import { ProductGrid } from "@/components/product-card";
import { Seo } from "@/lib/seo";
import { NotFoundPage } from "./NotFoundPage";

export function BrandPage() {
  const { brand } = useParams<{ brand: string }>();
  const brandName = getBrands().find((b) => b.slug === brand)?.name ?? "";
  const products = brandName ? getProductsByBrandName(brandName) : [];

  if (!brandName) return <NotFoundPage />;

  return (
    <div className="space-y-6">
      <Seo
        title={`${brandName} Phones in Pakistan | RAES TECH`}
        description={`${brandName} smartphones in Pakistan at transparent prices from RAES TECH. Buy Now discount or 0% markup instalments with nationwide delivery.`}
        canonicalPath={`/brand/${brand}`}
      />
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">{brandName}</h1>
        <p className="text-sm text-muted-foreground">{products.length} phones</p>
      </div>
      <ProductGrid products={products} />
    </div>
  );
}
