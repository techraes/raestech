import { useMemo, useState } from "react";
import { Percent, CalendarClock, Sparkles } from "lucide-react";
import { instalmentPlan } from "@/lib/pricing";
import { formatPKR } from "@/lib/utils";
import { useSettings } from "@/features/settings/store";

const TENURES = [3, 6, 9, 12];
const DEFAULT_PRICE = 150000;

interface HeroInstalmentCalculatorProps {
  /**
   * Listed price to prefill the calculator with. The pricing engine applies
   * the instalment discount once internally, so pass the *listed* price
   * (never an already-discounted figure) to avoid double discounting.
   */
  initialPrice?: number;
  className?: string;
}

/**
 * Compact instalment calculator used inside the homepage hero and in the
 * "Estimate monthly payment" panel. Uses the same pricing engine as the rest
 * of the app, and honours the admin-editable instalment settings (discount,
 * advance %, markup %) so the figures and labels always match what HomePage
 * advertises. Shows the discounted instalment price, advance due and monthly
 * amount together for the selected term.
 */
export function HeroInstalmentCalculator({ initialPrice, className }: HeroInstalmentCalculatorProps) {
  const { settings } = useSettings();
  const discountPercent = settings.instalmentDiscountPercent;
  const advancePercent = settings.instalmentAdvancePercent;
  const markupPercent = settings.instalmentMarkupPercent;

  const [priceInput, setPriceInput] = useState(() => String(initialPrice && initialPrice > 0 ? initialPrice : DEFAULT_PRICE));
  const [tenure, setTenure] = useState(12);

  const price = useMemo(() => Math.max(0, Number(priceInput.replace(/[^0-9]/g, "")) || 0), [priceInput]);
  const plan = price > 0 ? instalmentPlan(price, tenure, advancePercent, markupPercent, discountPercent) : null;

  return (
    <div className={`w-full rounded-3xl border border-white/15 bg-white/[0.06] p-5 shadow-2xl backdrop-blur-xl ${className ?? ""}`}>
      <div className="flex items-center gap-2">
        <Percent className="h-4 w-4 text-white/80" />
        <h3 className="text-sm font-semibold text-white">Instalment Calculator</h3>
      </div>

      <label className="mt-4 block text-[11px] font-medium uppercase tracking-wider text-white/60">
        Listed price (PKR)
      </label>
      <div className="relative mt-1.5">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-white/60">
          Rs.
        </span>
        <input
          type="text"
          inputMode="numeric"
          value={priceInput}
          onChange={(e) => setPriceInput(e.target.value)}
          placeholder="e.g. 150000"
          className="w-full rounded-xl border border-white/15 bg-black/30 py-2.5 pl-10 pr-3 text-sm text-white outline-none transition focus:border-white/40"
        />
      </div>

      <label className="mt-4 block text-[11px] font-medium uppercase tracking-wider text-white/60">
        Tenure
      </label>
      <div className="mt-1.5 flex gap-1.5">
        {TENURES.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTenure(t)}
            aria-pressed={tenure === t}
            className={`flex-1 rounded-lg border px-2 py-2 text-xs font-semibold transition-colors ${
              tenure === t
                ? "border-white/60 bg-white text-neutral-900"
                : "border-white/15 bg-black/20 text-white/70 hover:border-white/40"
            }`}
          >
            {t} mo
          </button>
        ))}
      </div>

      {plan && (
        <div className="mt-5 space-y-2 rounded-2xl border border-white/10 bg-black/25 p-4">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs text-white/70">
              <Sparkles className="h-3.5 w-3.5 text-white/50" />
              Instalment price ({discountPercent}% off)
            </span>
            <span className="text-sm font-semibold text-white">{formatPKR(plan.total)}</span>
          </div>
          <div className="flex items-center justify-between gap-2 border-t border-white/10 pt-2">
            <span className="text-xs text-white/70">Advance due ({advancePercent}%)</span>
            <span className="text-sm text-white/90">{formatPKR(plan.advance)}</span>
          </div>
          <div className="flex items-center justify-between gap-2 border-t border-white/10 pt-2">
            <span className="text-xs text-white/70">Monthly × {tenure}</span>
            <span className="text-sm font-bold text-white">{formatPKR(plan.monthly)}</span>
          </div>
          <p className="flex items-center gap-1.5 border-t border-white/10 pt-2 text-[11px] text-white/50">
            <CalendarClock className="h-3.5 w-3.5" />
            {advancePercent}% advance · {markupPercent}% markup · final month adjusted
          </p>
        </div>
      )}
    </div>
  );
}
