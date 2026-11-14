/**
 * Pure display helpers for the Admin → Orders “Ordered Mobile” section.
 * Kept free of React and of `@/` path-alias imports so they can be unit-tested
 * directly with Node.
 *
 * Ordering rules used across the admin UI:
 *  - Order-time snapshot columns are authoritative when present.
 *  - Missing fields are recovered ONLY from records reliably linked to the order
 *    (variant_id → product_variants → products, or the SKU in the local
 *    catalogue). We never infer a variant from the order amount, customer
 *    identity, or substitute the catalogue's current default variant.
 *  - Anything still missing is surfaced as “Not recorded” — a failed query is
 *    never silently shown as a missing value.
 */

export interface OrderedItemDisplay {
  productName?: string | null;
  model?: string | null;
  storage?: string | null;
  ram?: string | null;
  color?: string | null;
  ptaStatus?: string | null;
  jvStatus?: string | null;
  sku?: string | null;
  variantId?: string | null;
  quantity?: number;
}

export interface RawOrderedItem {
  product_name?: string | null;
  model?: string | null;
  storage?: string | null;
  ram?: string | null;
  color?: string | null;
  pta_status?: string | null;
  jv_status?: string | null;
  sku?: string | null;
  variant_id?: string | null;
  quantity?: number | null;
}

/** Resolver shape for looking a variant up in the local catalogue by SKU. */
export interface CatalogVariantRef {
  product: { name: string; model?: string | null };
  variant: { storage?: string | null; ram?: string | null; pta_status?: string | null; notes?: string | null };
}
export type VariantResolver = (sku: string) => CatalogVariantRef | undefined;

export function nullOrUndef(v?: string | null): string | null {
  return v && String(v).trim() ? String(v) : null;
}

export function jvDetected(v: { pta_status?: string | null; notes?: string | null }): boolean {
  return /jv|sim-locked|carrier-locked/i.test(`${v.pta_status ?? ""} ${v.notes ?? ""}`);
}

/** Fill missing fields from a record reliably linked to the order (variant_id → variant/product). */
export function applyVariantRecovery(raw: RawOrderedItem, vmap: Map<string, Record<string, unknown>>): RawOrderedItem {
  const vid = raw.variant_id;
  if (!vid || !vmap) return raw;
  const rec = vmap.get(vid);
  if (!rec) return raw;
  return {
    ...raw,
    sku: raw.sku || (rec.sku as string | undefined),
    model: raw.model || (rec.model as string | undefined),
    storage: raw.storage || (rec.storage as string | undefined),
    ram: raw.ram || (rec.ram as string | undefined),
    pta_status: raw.pta_status || (rec.ptaStatus as string | undefined),
    jv_status: raw.jv_status || (rec.jvStatus as string | undefined),
    product_name: raw.product_name || (rec.name as string | undefined),
  };
}

/**
 * Build the display fields for one ordered item. Order-time snapshot columns are
 * authoritative. Only fields that are missing are recovered from the stored SKU
 * / variant reference when it reliably identifies one — never by inferring a
 * variant from the order amount or substituting catalogue defaults.
 */
export function normalizeOrderedItem(raw: RawOrderedItem, resolveVariant?: VariantResolver): OrderedItemDisplay {
  const base: OrderedItemDisplay = {
    productName: nullOrUndef(raw.product_name),
    model: nullOrUndef(raw.model),
    storage: nullOrUndef(raw.storage),
    ram: nullOrUndef(raw.ram),
    color: nullOrUndef(raw.color),
    ptaStatus: nullOrUndef(raw.pta_status),
    jvStatus: nullOrUndef(raw.jv_status),
    sku: nullOrUndef(raw.sku),
    variantId: nullOrUndef(raw.variant_id),
    quantity: typeof raw.quantity === "number" && raw.quantity > 0 ? raw.quantity : 1,
  };

  if (raw.sku && resolveVariant) {
    const found = resolveVariant(raw.sku);
    if (found) {
      const { product, variant } = found;
      return {
        ...base,
        productName: base.productName || product.name,
        model: base.model || product.model || null,
        storage: base.storage || variant.storage || null,
        ram: base.ram || variant.ram || null,
        ptaStatus: base.ptaStatus || variant.pta_status || null,
        jvStatus: base.jvStatus || (jvDetected(variant) ? "JV / SIM-Locked" : null),
      };
    }
  }

  return base;
}

/** Compact one-line summary for the admin list: model · storage · colour (×qty). */
export function phoneSummary(items: OrderedItemDisplay[]): string {
  if (!items || !items.length) return "";
  return items
    .map((it) => {
      const title = it.model && it.productName ? `${it.productName} — ${it.model}` : it.productName || it.model;
      const parts = [title, it.storage, it.color].filter((x): x is string => !!x);
      const qty = it.quantity && it.quantity > 1 ? ` ×${it.quantity}` : "";
      return parts.length ? parts.join(" · ") + qty : it.sku || "Phone";
    })
    .join(", ");
}
