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

/**
 * Resolve a variant by its canonical SKU. This is the ONLY way an offer should
 * be selected for a purchase/instalment flow. We deliberately return undefined
 * when zero OR more than one variant matches so the caller never guesses from a
 * display label, price, array position or "first matching row".
 */
export function getVariantBySku(
  variants: ProductVariant[],
  sku: string | null | undefined
): ProductVariant | undefined {
  if (!sku) return undefined;
  const matches = variants.filter((v) => v.sku === sku);
  return matches.length === 1 ? matches[0] : undefined;
}

/**
 * True when `color` is a legitimate colour for `variant`. A variant with no
 * colours accepts any colour (callers pass ""). A colour that is not listed is
 * never assumed to be available.
 */
export function isColorOfVariant(
  variant: Pick<ProductVariant, "colors"> | undefined,
  color: string | null | undefined
): boolean {
  if (!variant) return false;
  const colors = variant.colors ?? [];
  if (colors.length === 0) return true;
  if (!color) return false;
  return colors.includes(color);
}
