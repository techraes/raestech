import type { InstalmentPlan } from "@/types";

/**
 * Pricing engine — pure functions. Server-side equivalents exist in
 * supabase/migrations/00003_functions.sql and are the source of truth for
 * real orders. These client helpers are for display only.
 *
 * RAES TECH 11.11 Sale: every phone carries one discount depending on the
 * customer's final purchase method.
 *   - Buy Now (prepaid, full payment): 22% off the listed price.
 *   - Instalments: 11% off the listed price, then 20% advance on the
 *     discounted price and the remainder split over the tenure at 0% markup.
 *   - Cash on Delivery is disabled.
 */

/** Sale discount (%) applied to Buy Now (prepaid) orders. */
export const SALE_PREPAID_DISCOUNT_PERCENT = 22;
/** Sale discount (%) applied to Instalment orders (every tenure). */
export const SALE_INSTALMENT_DISCOUNT_PERCENT = 11;

export type SalePaymentMethod = "prepaid" | "instalments";

/** Discount percent (0-100) for a given sale payment method. */
export function saleDiscountPercent(method: SalePaymentMethod): number {
  if (method === "instalments") return SALE_INSTALMENT_DISCOUNT_PERCENT;
  return SALE_PREPAID_DISCOUNT_PERCENT;
}

/** Discounted price = listed * (1 - discount%). Always >= 0. */
export function discountedPrice(listed: number, discountPercent: number): number {
  const d = Math.max(0, Math.min(100, Number(discountPercent) || 0));
  return Math.max(0, Math.round((listed * (100 - d)) / 100));
}

/** Buy Now price = listed * (1 - discount%). Default discount 10%. */
export function buyNowPrice(listed: number, discountPercent = SALE_PREPAID_DISCOUNT_PERCENT): number {
  return discountedPrice(listed, discountPercent);
}

/** Savings amount by paying Buy Now. */
export function buyNowSavings(listed: number, discountPercent = SALE_PREPAID_DISCOUNT_PERCENT): number {
  return listed - buyNowPrice(listed, discountPercent);
}

/** Complete price breakdown for a listed price under a given sale method. */
export interface PriceBreakdown {
  listed: number;
  discount: number;
  final: number;
}

/** Compute { listed, discount, final } for a method (shared display rule). */
export function priceForMethod(listed: number, method: SalePaymentMethod): PriceBreakdown {
  const final = discountedPrice(listed, saleDiscountPercent(method));
  return { listed, discount: listed - final, final };
}

/**
 * Instalment plan — RAES TECH 11.11 Sale.
 *
 * An 11% sale discount is applied to the listed price first, then:
 *   - advance = advancePercent% of the *discounted* price,
 *   - remaining = discounted price - advance,
 *   - monthly = remaining / tenure at 0% markup by default.
 * The last installment absorbs rounding so the remaining balance reaches
 * exactly zero.
 */
export function instalmentPlan(
  listed: number,
  tenureMonths: number,
  advancePercent = 20,
  markupPercent = 0,
  discountPercent = SALE_INSTALMENT_DISCOUNT_PERCENT
): InstalmentPlan {
  const base = discountedPrice(listed, discountPercent);
  const total = base * (1 + markupPercent / 100);
  const advance = Math.round((total * advancePercent) / 100);
  const remaining = total - advance;
  const monthly = Math.round((remaining / tenureMonths) * 100) / 100;
  // last payment adjusted to clear the balance exactly
  const last = Math.round((remaining - monthly * (tenureMonths - 1)) * 100) / 100;
  return {
    advance,
    remaining,
    monthly,
    total: Math.round(total * 100) / 100,
    last,
  };
}

export interface ScheduleRow extends InstalmentPlan {
  last: number;
}

/** Produce a full per-month schedule including the adjusted final payment. */
export function instalmentSchedule(
  listed: number,
  tenureMonths: number,
  advancePercent = 20,
  markupPercent = 0
): number[] {
  const plan = instalmentPlan(listed, tenureMonths, advancePercent, markupPercent);
  const rows: number[] = [];
  for (let i = 0; i < tenureMonths; i++) {
    rows.push(i === tenureMonths - 1 ? (plan as ScheduleRow).last : plan.monthly);
  }
  return rows;
}
