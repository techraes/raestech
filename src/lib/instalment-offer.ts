import type { InstalmentPlan } from "@/types";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { getVariantBySku, isColorOfVariant } from "@/lib/variant-select";
import { getProductBySlug } from "@/data/catalog";
import { instalmentPlan, SALE_INSTALMENT_DISCOUNT_PERCENT } from "@/lib/pricing";
import { ptaInfo } from "@/lib/pta";

/**
 * Offer selection & validation for the instalment flow.
 *
 * The storefront catalogue (src/data/catalog_seed.json) is the source of truth
 * for which offers are presented to the customer; the Supabase
 * `product_variants` table is the authoritative record used when an application
 * is submitted. We therefore resolve a selection by its canonical SKU + colour
 * (never by label/price/array-position) and confirm availability + the payable
 * amount on the backend just before the customer advances to payment.
 */

export type OfferStatus = "ok" | "unavailable" | "retry";

export interface OfferContext {
  slug: string;
  sku: string;
  color: string;
  tenure: number;
}

export interface OfferResolution {
  status: OfferStatus;
  /** Set when the resolution failed and the caller should not proceed. */
  error?: string;
  /** Machine-readable reason for retry (e.g. missing backend function). */
  code?: string;
  variantId?: string;
  productName?: string;
  model?: string;
  storage?: string;
  ram?: string;
  color?: string;
  ptaLabel?: string;
  ptaCode?: string;
  conditionNote?: string;
  listed?: number;
  instalmentTotal?: number;
  plan?: InstalmentPlan;
}

/**
 * Resolve an offer against the storefront catalogue by canonical SKU + colour.
 * Returns "unavailable" when the SKU is missing/ambiguous or the colour is not
 * actually offered for that variant — no guesses are made.
 */
export function resolveOfferLocally(
  ctx: OfferContext,
  discountPercent = SALE_INSTALMENT_DISCOUNT_PERCENT
): OfferResolution {
  const product = getProductBySlug(ctx.slug);
  const variant = product ? getVariantBySku(product.variants, ctx.sku) : undefined;

  if (!product || !variant) {
    return { status: "unavailable", error: "This option is no longer available." };
  }
  if (!isColorOfVariant(variant, ctx.color)) {
    return { status: "unavailable", error: "This option is no longer available." };
  }

  const pta = ptaInfo(variant);
  const plan = instalmentPlan(
    variant.listedPrice,
    ctx.tenure,
    undefined,
    undefined,
    discountPercent
  );
  const instalmentTotal = Math.round(
    variant.listedPrice * (1 - discountPercent / 100)
  );

  return {
    status: "ok",
    variantId: variant.sku,
    productName: product.name,
    model: product.model,
    storage: variant.storage,
    ram: variant.ram,
    color: ctx.color || (variant.colors[0] ?? ""),
    ptaLabel: pta.label,
    ptaCode: pta.code,
    conditionNote: variant.box_pack || variant.condition,
    listed: variant.listedPrice,
    instalmentTotal,
    plan,
  };
}

/**
 * Confirm the offer on the backend (Supabase RPC `instalment_confirm_offer`).
 * This is the authoritative availability + pricing check that must succeed
 * before the customer advances to payment. A network/RPC failure is reported
 * as "retry" so the customer keeps their selection, never as a hard error.
 */
export async function confirmOfferOnBackend(ctx: OfferContext): Promise<OfferResolution> {
  if (!isSupabaseConfigured || !supabase) {
    return { status: "retry", code: "not_configured", error: "Instalment applications are not available on this deployment." };
  }

  try {
    const { data, error } = await supabase.rpc("instalment_confirm_offer", {
      p_sku: ctx.sku,
      p_color: ctx.color,
      p_tenure: ctx.tenure,
    });

    if (error) {
      const code = (error as { code?: string }).code ?? "";
      // RPC not deployed yet → treat as a temporary failure we can retry.
      if (code === "PGRST202" || /does not exist|function.*not found/i.test(error.message)) {
        return { status: "retry", code: "rpc_missing", error: "We couldn't confirm this offer right now. Please try again." };
      }
      return { status: "retry", code, error: "We couldn't confirm this offer right now. Please try again." };
    }

    const row = data as {
      ok?: boolean;
      found?: boolean;
      reason?: string;
      variant_id?: string;
      product_name?: string;
      storage?: string;
      ram?: string;
      pta_status?: string;
      condition_note?: string;
      listed_price?: number;
      instalment_total?: number;
      advance?: number;
      remaining?: number;
      monthly?: number;
      total?: number;
      last?: number;
    } | null;

    if (!row || row.found === false || row.ok === false) {
      return { status: "unavailable", error: "This option is no longer available." };
    }

    const pta = ptaInfo({ pta_status: row.pta_status ?? "", notes: "" });
    return {
      status: "ok",
      variantId: row.variant_id,
      productName: row.product_name,
      storage: row.storage,
      ram: row.ram,
      color: ctx.color,
      ptaLabel: pta.label,
      ptaCode: pta.code,
      conditionNote: row.condition_note,
      listed: row.listed_price,
      instalmentTotal: row.instalment_total,
      plan: {
        advance: row.advance ?? 0,
        remaining: row.remaining ?? 0,
        monthly: row.monthly ?? 0,
        total: row.total ?? 0,
        last: row.last ?? 0,
      },
    };
  } catch (e) {
    return { status: "retry", code: "exception", error: "We couldn't confirm this offer right now. Please try again." };
  }
}
