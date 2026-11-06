import seed from "@/data/catalog_seed.json";
import type { Brand, Product, ProductVariant } from "@/types";
import { getAllProducts, useProductStore } from "@/store/products";

/**
 * Catalogue data layer.
 * The live catalogue is owned by the admin product store (src/store/products.ts),
 * which is seeded from `catalog_seed.json` but can be fully edited by the admin
 * panel. In production (Supabase configured) this same store layer can be backed
 * by live queries; for the bundled development build it reads the real catalog
 * seed that was generated from the RAES TECH product XLSX.
 */

interface SeedShape {
  brands: Brand[];
  products: Product[];
}

const data = seed as unknown as SeedShape;

export const allBrands: Brand[] = data.brands;

/** The current, admin-editable catalogue (reactively reflects edits). */
export function getProducts(): Product[] {
  return getAllProducts();
}

/** Convenience hook for live catalogue reads inside React components. */
export function useProducts(): Product[] {
  return useProductStore((s) => s.products);
}

export function getBrands(): Brand[] {
  return allBrands;
}

export function getBrandNames(): string[] {
  return allBrands.map((b) => b.name);
}

export function getProductBySlug(slug: string): Product | undefined {
  return getAllProducts().find((p) => p.slug === slug);
}

export function getProductsByBrand(brandSlug: string): Product[] {
  return getAllProducts().filter((p) => p.brand.toLowerCase() === brandSlug.toLowerCase());
}

export function getProductsByBrandName(brandName: string): Product[] {
  return getAllProducts().filter((p) => p.brand.toLowerCase() === brandName.toLowerCase());
}

export function getProductById(id: number | string): Product | undefined {
  return getAllProducts().find((p) => String(p.id) === String(id));
}

export function searchProducts(query: string): Product[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return getAllProducts().filter((p) => {
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
  for (const p of getAllProducts()) {
    const v = p.variants.find((x) => x.sku === sku);
    if (v) return { product: p, variant: v };
  }
  return undefined;
}

export function relatedProducts(product: Product, limit = 4): Product[] {
  const all = getAllProducts();
  const sameBrand = all.filter((p) => p.brand === product.brand && p.id !== product.id);
  if (sameBrand.length >= limit) return sameBrand.slice(0, limit);
  const others = all.filter((p) => p.id !== product.id && p.brand !== product.brand);
  return [...sameBrand, ...others].slice(0, limit);
}

export function featuredProducts(): Product[] {
  const all = getAllProducts();
  const featured = all.filter((p) => p.featured);
  return featured.length ? featured : all.slice(0, 8);
}

export function newArrivals(): Product[] {
  const all = getAllProducts();
  const n = all.filter((p) => p.new_arrival);
  return n.length ? n : all.slice(0, 8);
}

export function bestSellers(): Product[] {
  const all = getAllProducts();
  const b = all.filter((p) => p.bestseller);
  return b.length ? b : all.slice(0, 8);
}
