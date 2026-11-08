import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Percent, CalendarClock, Sparkles } from "lucide-react";
import { instalmentPlan, discountedPrice } from "@/lib/pricing";
import { formatPKR } from "@/lib/utils";
import { useProducts } from "@/data/catalog";
import { useSettings } from "@/features/settings/store";
import { Button } from "@/components/ui/button";

const FALLBACK_TENURES = [3, 6, 9, 12];

/**
 * Selectable instalment estimator used inside the homepage hero.
 *
 * Reuses the exact pricing engine that powers the product page, the
 * instalment application and checkout (instalmentPlan). The instalment
 * discount is applied once to the listed price, then the advance is taken on
 * that discounted price — the Buy Now discount never enters here.
 */
export function HeroInstalmentPanel() {
  const { settings } = useSettings();
  const all = useProducts();

  const products = useMemo(
    () => all.filter((p) => p.variants.some((v) => v.listedPrice > 0)),
    [all]
  );

  const allowedTenures = useMemo(() => {
    const configured = (settings.instalmentTenures || []).filter((t) =>
      FALLBACK_TENURES.includes(t)
    );
    return configured.length ? configured : FALLBACK_TENURES;
  }, [settings.instalmentTenures]);

  const [slug, setSlug] = useState<string>(products[0]?.slug ?? "");
  const product = products.find((p) => p.slug === slug) || products[0];

  const variants = useMemo(
    () => (product?.variants || []).filter((v) => v.listedPrice > 0),
    [product]
  );

  const [sku, setSku] = useState<string>("");
  const variant = variants.find((v) => v.sku === sku) || variants[0];

  const [tenure, setTenure] = useState<number>(allowedTenures[0] ?? 12);

  const plan = useMemo(() => {
    if (!variant || !tenure) return null;
    try {
      return instalmentPlan(
        variant.listedPrice,
        tenure,
        settings.instalmentAdvancePercent,
        settings.instalmentMarkupPercent,
        settings.instalmentDiscountPercent
      );
    } catch {
      return null;
    }
  }, [variant, tenure, settings.instalmentAdvancePercent, settings.instalmentMarkupPercent, settings.instalmentDiscountPercent]);

  if (!products.length) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-white/60">
        Select a phone to see your instalment estimate.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/15 bg-white/[0.06] p-4 backdrop-blur-sm sm:p-5">
      <div className="mb-3 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-white/70" />
        <h3 className="text-sm font-bold text-white">Estimate monthly payment</h3>
      </div>

      <div className="space-y-2.5">
        <label className="block">
          <span className="text-[11px] font-medium uppercase tracking-wide text-white/50">Phone</span>
          <select
            value={product?.slug ?? ""}
            onChange={(e) => {
              const next = products.find((p) => p.slug === e.target.value);
              setSlug(e.target.value);
              setSku("");
              if (next) {
                const first = next.variants.find((v) => v.listedPrice > 0);
                setSku(first?.sku ?? "");
              }
            }}
            className="mt-1 h-9 w-full rounded-lg border border-white/15 bg-neutral-900 px-2.5 text-sm text-white outline-none focus:border-white/40"
          >
            {products.map((p) => (
              <option key={p.slug} value={p.slug}>{p.name}</option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-[11px] font-medium uppercase tracking-wide text-white/50">Variant</span>
          <select
            value={variant?.sku ?? ""}
            onChange={(e) => setSku(e.target.value)}
            className="mt-1 h-9 w-full rounded-lg border border-white/15 bg-neutral-900 px-2.5 text-sm text-white outline-none focus:border-white/40"
          >
            {variants.map((v) => (
              <option key={v.sku} value={v.sku}>
                {v.storage}{v.ram ? ` · ${v.ram}` : ""}
              </option>
            ))}
          </select>
        </label>

        <div>
          <span className="text-[11px] font-medium uppercase tracking-wide text-white/50">Term</span>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {allowedTenures.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTenure(t)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                  t === tenure
                    ? "bg-white text-black"
                    : "border border-white/20 text-white/70 hover:border-white/40 hover:text-white"
                }`}
              >
                {t} mo
              </button>
            ))}
          </div>
        </div>
      </div>

      {!variant ? (
        <p className="mt-4 text-sm text-white/60">
          This phone has no available variant right now.
        </p>
      ) : !plan ? (
        <p className="mt-4 text-sm text-white/60">
          We couldn't price this variant right now. Please check back shortly.
        </p>
      ) : (
        <>
          <div className="mt-4 space-y-1.5 border-t border-white/10 pt-3 text-sm">
            <Row label="Listed price" value={formatPKR(variant.listedPrice)} />
            <Row
              label={`Instalment discount (${settings.instalmentDiscountPercent}%)`}
              value={`−${formatPKR(Math.max(0, variant.listedPrice - discountedPrice(variant.listedPrice, settings.instalmentDiscountPercent)))}`}
              valueClass="text-emerald-300"
            />
            <Row
              label="Price after discount"
              value={formatPKR(discountedPrice(variant.listedPrice, settings.instalmentDiscountPercent))}
              bold
            />
            <Row label={`Advance due (${settings.instalmentAdvancePercent}%)`} value={formatPKR(plan.advance)} />
            <Row label="Remaining balance" value={formatPKR(plan.remaining)} />
            <div className="flex items-center justify-between gap-2 border-t border-white/10 pt-2">
              <span className="text-xs text-white/70">Estimated monthly × {tenure}</span>
              <span className="flex items-center gap-1.5 text-sm font-bold text-white">
                {formatPKR(plan.monthly)}
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                  <Percent className="h-3 w-3" /> 0% markup
                </span>
              </span>
            </div>
            <p className="flex items-center gap-1.5 text-[11px] text-white/50">
              <CalendarClock className="h-3.5 w-3.5" />
              The final month is adjusted so instalments clear the balance exactly.
            </p>
          </div>

          <Button asChild size="sm" className="mt-4 w-full">
            <Link
              to={`/instalments/apply?product=${encodeURIComponent(product?.slug ?? "")}&sku=${encodeURIComponent(variant.sku)}&tenure=${tenure}`}
            >
              Apply for Instalment
            </Link>
          </Button>
        </>
      )}
    </div>
  );
}

function Row({
  label,
  value,
  valueClass = "",
  bold = false,
}: {
  label: string;
  value: string;
  valueClass?: string;
  bold?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs text-white/70">{label}</span>
      <span className={`text-sm ${bold ? "font-bold text-white" : "text-white/90"} ${valueClass}`}>
        {value}
      </span>
    </div>
  );
}
