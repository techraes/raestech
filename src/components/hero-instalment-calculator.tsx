import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Percent, CalendarClock, Sparkles, ArrowRight } from "lucide-react";
import { instalmentPlan } from "@/lib/pricing";
import { formatPKR } from "@/lib/utils";
import { useSettings } from "@/features/settings/store";
import { useProducts } from "@/data/catalog";

interface HeroInstalmentCalculatorProps {
  /**
   * Listed price to prefill when no phone/variant is selected yet. The pricing
   * engine applies the instalment discount once internally, so pass the
   * *listed* price (never an already-discounted figure).
   */
  initialPrice?: number;
  /** Show the phone/variant picker (homepage hero). Default false. */
  enableSelect?: boolean;
  className?: string;
}

/**
 * Instalment calculator — same pricing engine and settings as checkout. Lets a
 * customer pick an orderable phone + variant and a term, shows the instalment
 * price, advance due, remaining balance and monthly amount, and opens the real
 * application with that variant + term preselected. Uses semantic theme tokens
 * so it stays readable in light and dark modes.
 */
export function HeroInstalmentCalculator({ initialPrice, enableSelect = false, className }: HeroInstalmentCalculatorProps) {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const products = useProducts();

  const discountPercent = settings.instalmentDiscountPercent;
  const advancePercent = settings.instalmentAdvancePercent;
  const markupPercent = settings.instalmentMarkupPercent;
  const tenures = settings.instalmentTenures?.length ? settings.instalmentTenures : [3, 6, 9, 12];

  // Only orderable variants (stock > 0) are selectable.
  const orderable = useMemo(
    () => products.filter((p) => p.variants.some((v) => Number(v.stock) > 0)),
    [products]
  );

  const [productSlug, setProductSlug] = useState(() => orderable[0]?.slug ?? "");
  const product = orderable.find((p) => p.slug === productSlug) ?? orderable[0];

  const variants = useMemo(
    () => (product ? product.variants.filter((v) => Number(v.stock) > 0) : []),
    [product]
  );
  const [variantSku, setVariantSku] = useState<string>(() => variants[0]?.sku ?? "");
  const variant = variants.find((v) => v.sku === variantSku) ?? variants[0];

  const color = variant?.colors?.[0] ?? "";

  const [tenure, setTenure] = useState<number>(() => (tenures.includes(12) ? 12 : tenures[0] ?? 12));

  const fallbackPrice = initialPrice && initialPrice > 0 ? initialPrice : 0;
  const allowSelect = enableSelect && orderable.length > 0;
  const listed = allowSelect ? (variant?.listedPrice ?? fallbackPrice) : fallbackPrice;
  const plan = listed > 0 ? instalmentPlan(listed, tenure, advancePercent, markupPercent, discountPercent) : null;

  const appHref =
    product && variant
      ? `/instalments/apply?product=${product.slug}&sku=${encodeURIComponent(variant.sku)}&color=${encodeURIComponent(color)}&tenure=${tenure}`
      : "";

  return (
    <div className={`w-full rounded-3xl border border-border bg-card p-5 shadow-xl ${className ?? ""}`} id="instalment-calculator">
      <div className="flex items-center gap-2">
        <Percent className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-card-foreground">Instalment Calculator</h3>
      </div>

      {allowSelect && (
        <>
          <label className="mt-4 block text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Phone</label>
          <select
            value={product?.slug ?? ""}
            onChange={(e) => {
              setProductSlug(e.target.value);
              const p = orderable.find((x) => x.slug === e.target.value);
              setVariantSku(p?.variants.find((v) => Number(v.stock) > 0)?.sku ?? "");
            }}
            className="mt-1.5 h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30"
            aria-label="Select phone"
          >
            {orderable.map((p) => (
              <option key={p.slug} value={p.slug}>{p.name}</option>
            ))}
          </select>

          <label className="mt-3 block text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Variant</label>
          <select
            value={variant?.sku ?? ""}
            onChange={(e) => setVariantSku(e.target.value)}
            className="mt-1.5 h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30"
            aria-label="Select variant"
          >
            {variants.map((v) => (
              <option key={v.sku} value={v.sku}>
                {v.storage} · {(v.colors?.[0] ?? "") || "No colour"} · {formatPKR(v.listedPrice)}
              </option>
            ))}
          </select>
        </>
      )}

      <label className="mt-4 block text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Term</label>
      <div className="mt-1.5 flex gap-1.5">
        {tenures.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTenure(t)}
            aria-pressed={tenure === t}
            className={`flex-1 rounded-lg border px-2 py-2 text-xs font-semibold transition-colors ${
              tenure === t
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-muted-foreground hover:border-primary/40"
            }`}
          >
            {t} mo
          </button>
        ))}
      </div>

      {plan && (
        <div className="mt-5 space-y-2 rounded-2xl border border-border bg-muted/40 p-4">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Instalment price ({discountPercent}% off)
            </span>
            <span className="text-sm font-semibold text-foreground">{formatPKR(plan.total)}</span>
          </div>
          <div className="flex items-center justify-between gap-2 border-t border-border pt-2">
            <span className="text-xs text-muted-foreground">Advance due today ({advancePercent}%)</span>
            <span className="text-sm font-medium text-foreground">{formatPKR(plan.advance)}</span>
          </div>
          <div className="flex items-center justify-between gap-2 border-t border-border pt-2">
            <span className="text-xs text-muted-foreground">Remaining balance</span>
            <span className="text-sm font-medium text-foreground">{formatPKR(plan.remaining)}</span>
          </div>
          <div className="flex items-center justify-between gap-2 border-t border-border pt-2">
            <span className="text-xs text-muted-foreground">Monthly × {tenure}</span>
            <span className="text-sm font-bold text-foreground">{formatPKR(plan.monthly)}</span>
          </div>
          <p className="flex items-center gap-1.5 border-t border-border pt-2 text-[11px] text-muted-foreground">
            <CalendarClock className="h-3.5 w-3.5" />
            {advancePercent}% advance · {markupPercent}% markup · final month adjusted
          </p>
        </div>
      )}

      <button
        type="button"
        disabled={!appHref}
        onClick={() => appHref && navigate(appHref)}
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        Apply for Instalment <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}
