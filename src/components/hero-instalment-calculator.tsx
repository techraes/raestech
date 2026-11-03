import { useState } from "react";
import { Percent, CalendarClock } from "lucide-react";
import { instalmentPlan } from "@/lib/pricing";
import { formatPKR } from "@/lib/utils";

const TENURES = [3, 6, 9, 12];
const DEFAULT_PRICE = 150000;

/**
 * Compact instalment calculator used inside the homepage hero.
 * Replaces the old phone mockup on the right-hand side. Uses the same
 * pricing engine as the rest of the app (20% advance, 0% markup).
 */
export function HeroInstalmentCalculator() {
  const [priceInput, setPriceInput] = useState(String(DEFAULT_PRICE));
  const [tenure, setTenure] = useState(12);

  const price = Math.max(0, Number(priceInput.replace(/[^0-9]/g, "")) || 0);
  const plan = price > 0 ? instalmentPlan(price, tenure) : null;

  return (
    <div className="w-full max-w-sm rounded-3xl border border-white/15 bg-white/[0.06] p-5 shadow-2xl backdrop-blur-xl">
      <div className="flex items-center gap-2">
        <Percent className="h-4 w-4 text-white/80" />
        <h3 className="text-sm font-semibold text-white">Instalment Calculator</h3>
      </div>

      <label className="mt-4 block text-[11px] font-medium uppercase tracking-wider text-white/60">
        Device price (PKR)
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
            <span className="text-xs text-white/70">Advance (20%)</span>
            <span className="text-sm text-white/90">{formatPKR(plan.advance)}</span>
          </div>
          <div className="flex items-center justify-between gap-2 border-t border-white/10 pt-2">
            <span className="text-xs text-white/70">Monthly × {tenure}</span>
            <span className="text-sm font-bold text-white">{formatPKR(plan.monthly)}</span>
          </div>
          <p className="flex items-center gap-1.5 border-t border-white/10 pt-2 text-[11px] text-white/50">
            <CalendarClock className="h-3.5 w-3.5" />
            20% advance · 0% markup
          </p>
        </div>
      )}
    </div>
  );
}
