import seed from "@/data/catalog_seed.json";
import type { Brand, Product, ProductVariant } from "@/types";

/**
 * Catalogue data layer.
 * In production (Supabase configured) this would be backed by live queries;
 * for the bundled development build it reads the real catalog seed that was
 * generated from the RAES TECH product XLSX.
 */

interface SeedShape {
  brands: Brand[];
  products: Product[];
}

const data = seed as unknown as SeedShape;

/**
 * Product conditions, PTA/SIM-lock status and prices are read directly from the
 * catalog data (rebuilt from the RaesTech "Product Catalog" workbook). No
 * normalisation is applied here — badges reflect the real per-SKU data.
 */
export const allProducts: Product[] = data.products;
export const allBrands: Brand[] = data.brands;

export function getProducts(): Product[] {
  return allProducts;
}

export function getBrands(): Brand[] {
  return allBrands;
}

export function getBrandNames(): string[] {
  return allBrands.map((b) => b.name);
}

export function getProductBySlug(slug: string): Product | undefined {
  return allProducts.find((p) => p.slug === slug);
}

export function getProductsByBrand(brandSlug: string): Product[] {
  return allProducts.filter((p) => p.brand.toLowerCase() === brandSlug.toLowerCase());
}

export function getProductsByBrandName(brandName: string): Product[] {
  return allProducts.filter((p) => p.brand.toLowerCase() === brandName.toLowerCase());
}

export function getProductById(id: number | string): Product | undefined {
  return allProducts.find((p) => String(p.id) === String(id));
}

export function searchProducts(query: string): Product[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return allProducts.filter((p) => {
    const haystack = [
      p.name,
      p.model,
      p.brand,
      p.category,
      ...p.variants.flatMap((v) => [v.storage, v.ram, v.sku, ...v.colors]),
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  });
}

export function getVariantBySku(sku: string): { product: Product; variant: ProductVariant } | undefined {
  for (const p of allProducts) {
    const v = p.variants.find((x) => x.sku === sku);
    if (v) return { product: p, variant: v };
  }
  return undefined;
}

export function relatedProducts(product: Product, limit = 4): Product[] {
  const sameBrand = allProducts.filter((p) => p.brand === product.brand && p.id !== product.id);
  if (sameBrand.length >= limit) return sameBrand.slice(0, limit);
  const others = allProducts.filter((p) => p.id !== product.id && p.brand !== product.brand);
  return [...sameBrand, ...others].slice(0, limit);
}

export function featuredProducts(): Product[] {
  const featured = allProducts.filter((p) => p.featured);
  return (featured.length ? featured : allProducts.slice(0, 8));
}

export function newArrivals(): Product[] {
  const n = allProducts.filter((p) => p.new_arrival);
  return (n.length ? n : allProducts.slice(0, 8));
}

export function bestSellers(): Product[] {
  const b = allProducts.filter((p) => p.bestseller);
  return (b.length ? b : allProducts.slice(0, 8));
}
