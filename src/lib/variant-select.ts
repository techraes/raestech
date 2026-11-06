import type { ProductVariant } from "@/types";

/**
 * Variant selection helpers.
 *
 * Product variants are storage capacities (e.g. 256GB), each with a price and
 * a list of colours. A variant is purchasable when it has stock. Product pages
 * must default to the lowest-priced in-stock variant and its first colour so a
 * customer always lands on a buyable configuration.
 */

/** A variant is in stock when it has at least one unit. */
export function isInStock(v: Pick<ProductVariant, "stock">): boolean {
  return Number(v.stock) > 0;
}

/** Sort variants by listed price ascending (cheapest first). Never mutates input. */
export function sortVariantsByPrice(variants: ProductVariant[]): ProductVariant[] {
  return [...variants].sort((a, b) => a.listedPrice - b.listedPrice);
}

/**
 * Lowest-priced in-stock variant. If none are in stock we fall back to the
 * lowest-priced variant overall so the UI can still render a price.
 */
export function lowestPricedVariant(
  variants: ProductVariant[]
): ProductVariant | undefined {
  const sorted = sortVariantsByPrice(variants);
  return sorted.find(isInStock) ?? sorted[0];
}

/** Index of the default variant (lowest-priced in-stock). */
export function defaultVariantIndex(variants: ProductVariant[]): number {
  const chosen = lowestPricedVariant(variants);
  if (!chosen) return 0;
  const idx = variants.indexOf(chosen);
  return idx >= 0 ? idx : 0;
}

/** First colour of a variant, or "" when the variant has no colours configured. */
export function defaultColor(variant: ProductVariant | undefined): string {
  if (!variant || !Array.isArray(variant.colors) || variant.colors.length === 0) {
    return "";
  }
  return variant.colors[0];
}
