import type { InstalmentPlan } from "@/types";

/**
 * Pricing engine — pure functions. Server-side equivalents exist in
 * supabase/migrations/00003_functions.sql and are the source of truth for
 * real orders. These client helpers are for display only.
 */

/** Buy Now price = listed * (1 - discount%). Default discount 10%. */
export function buyNowPrice(listed: number, discountPercent = 10): number {
  return Math.round(listed * (1 - discountPercent / 100));
}

/** Savings amount by paying Buy Now. */
export function buyNowSavings(listed: number, discountPercent = 10): number {
  return listed - buyNowPrice(listed, discountPercent);
}

/**
 * Instalment plan — full listed price (no Buy-Now discount), 0% markup by
 * default, advance = advancePercent% of listed. The last installment absorbs
 * rounding so the remaining balance reaches exactly zero.
 */
export function instalmentPlan(
  listed: number,
  tenureMonths: number,
  advancePercent = 20,
  markupPercent = 0
): InstalmentPlan {
  const total = listed * (1 + markupPercent / 100);
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
