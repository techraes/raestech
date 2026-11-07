import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { useSettings } from "@/features/settings/store";
import { useCan } from "@/features/auth/permissions";
import { useAudit } from "@/features/audit/useAudit";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SectionCard, Field, NumberInput, TextInput, PageHeader, Stat } from "./_ui";
import { discountedPrice, instalmentPlan } from "@/lib/pricing";
import { formatPKR } from "@/lib/utils";

const SAMPLE_LISTED = 100000;

/**
 * Super Admin discount management dashboard. Controls the 11.11 sale pricing
 * that the whole storefront shares (product cards, checkout, cart, instalment
 * plans). Values are persisted through the settings store (→ website_settings)
 * so the change applies live everywhere.
 */
export function AdminDiscounts() {
  const { settings, patchSettings } = useSettings();
  const can = useCan();
  const canEdit = can("discounts");
  const { log } = useAudit();

  const [buyNowPct, setBuyNowPct] = useState(settings.buyNowDiscountPercent);
  const [instalmentPct, setInstalmentPct] = useState(settings.instalmentDiscountPercent);
  const [advancePct, setAdvancePct] = useState(settings.instalmentAdvancePercent);
  const [markupPct, setMarkupPct] = useState(settings.instalmentMarkupPercent);
  const [tenuresText, setTenuresText] = useState(settings.instalmentTenures.join(", "));
  const [shipping, setShipping] = useState(settings.shippingCharge);
  const [freeThreshold, setFreeThreshold] = useState(settings.freeShippingThreshold);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setBuyNowPct(settings.buyNowDiscountPercent);
    setInstalmentPct(settings.instalmentDiscountPercent);
    setAdvancePct(settings.instalmentAdvancePercent);
    setMarkupPct(settings.instalmentMarkupPercent);
    setTenuresText(settings.instalmentTenures.join(", "));
    setShipping(settings.shippingCharge);
    setFreeThreshold(settings.freeShippingThreshold);
  }, [
    settings.buyNowDiscountPercent,
    settings.instalmentDiscountPercent,
    settings.instalmentAdvancePercent,
    settings.instalmentMarkupPercent,
    settings.instalmentTenures,
    settings.shippingCharge,
    settings.freeShippingThreshold,
  ]);

  const parseTenures = (): number[] => {
    const nums = tenuresText
      .split(",")
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => Number.isFinite(n) && n > 0);
    return nums.length ? Array.from(new Set(nums)).sort((a, b) => a - b) : [];
  };

  const save = async () => {
    setError("");
    const tenures = parseTenures();
    if (tenures.length === 0) {
      setError("Enter at least one valid tenure (months).");
      return;
    }
    if (buyNowPct < 0 || buyNowPct > 100 || instalmentPct < 0 || instalmentPct > 100 || advancePct < 0 || advancePct > 100) {
      setError("Discount and advance percentages must be between 0 and 100.");
      return;
    }
    if (markupPct < 0) {
      setError("Markup cannot be negative.");
      return;
    }

    const previous = {
      buyNowDiscountPercent: settings.buyNowDiscountPercent,
      instalmentDiscountPercent: settings.instalmentDiscountPercent,
      instalmentAdvancePercent: settings.instalmentAdvancePercent,
      instalmentMarkupPercent: settings.instalmentMarkupPercent,
      instalmentTenures: settings.instalmentTenures,
      shippingCharge: settings.shippingCharge,
      freeShippingThreshold: settings.freeShippingThreshold,
    };

    const next = {
      buyNowDiscountPercent: Math.round(buyNowPct * 10) / 10,
      instalmentDiscountPercent: Math.round(instalmentPct * 10) / 10,
      instalmentAdvancePercent: Math.round(advancePct * 10) / 10,
      instalmentMarkupPercent: Math.round(markupPct * 10) / 10,
      instalmentTenures: tenures,
      shippingCharge: Math.max(0, Math.round(shipping)),
      freeShippingThreshold: Math.max(0, Math.round(freeThreshold)),
    };

    // Server-side enforcement: write via the Super-Admin-only RPC when Supabase
    // is configured. Fall back to the local settings mirror in dev mode.
    if (isSupabaseConfigured && supabase) {
      const payload = {
        buy_now_discount_percent: String(next.buyNowDiscountPercent),
        instalment_discount_percent: String(next.instalmentDiscountPercent),
        instalment_advance_percent: String(next.instalmentAdvancePercent),
        instalment_markup_percent: String(next.instalmentMarkupPercent),
        instalment_tenures: JSON.stringify(next.instalmentTenures),
        shipping_charge: String(next.shippingCharge),
        free_shipping_threshold: String(next.freeShippingThreshold),
      };
      const res = await supabase.rpc("upsert_discount_config", { p_settings: payload });
      if (res.error) {
        setError(res.error.message || "Could not save discount configuration.");
        return;
      }
    }
    patchSettings(next);
    void log({ action: "discounts.update", entity: "pricing_settings", previousValue: previous, newValue: next });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const prepaidFinal = discountedPrice(SAMPLE_LISTED, buyNowPct);
  const prepaidDiscount = Math.max(0, SAMPLE_LISTED - prepaidFinal);
  const plan12 = instalmentPlan(SAMPLE_LISTED, 12, advancePct, markupPct, instalmentPct);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Discount Management"
        subtitle="Control the 11.11 sale discounts shared by product cards, checkout, cart and instalment plans. Changes apply storewide immediately."
        actions={
          canEdit ? (
            <Button onClick={save} disabled={saved}>
              {saved ? "Saved" : <><Save className="h-4 w-4" /> Save discounts</>}
            </Button>
          ) : (
            <Badge variant="outline">Read-only</Badge>
          )
        }
      />

      {!canEdit && <p className="text-sm text-muted-foreground">Only a Super Admin can modify discount configuration.</p>}
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Buy-now discount" value={`${settings.buyNowDiscountPercent}%`} tone="success" />
        <Stat label="Instalment discount" value={`${settings.instalmentDiscountPercent}%`} tone="info" />
        <Stat label="Instalment advance" value={`${settings.instalmentAdvancePercent}%`} />
        <Stat label="Delivery charge" value={formatPKR(settings.shippingCharge)} />
      </div>

      <SectionCard title="Sale discounts (percent)">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Buy Now discount %" hint="Prepaid full-payment discount.">
            <NumberInput value={buyNowPct} onChange={setBuyNowPct} disabled={!canEdit} />
          </Field>
          <Field label="Instalment discount %" hint="Applied to the listed price before the advance is calculated.">
            <NumberInput value={instalmentPct} onChange={setInstalmentPct} disabled={!canEdit} />
          </Field>
          <Field label="Instalment advance %" hint="Percent of the discounted price collected upfront.">
            <NumberInput value={advancePct} onChange={setAdvancePct} disabled={!canEdit} />
          </Field>
          <Field label="Instalment markup %" hint="Keep at 0 to honour the '0% markup' promise.">
            <NumberInput value={markupPct} onChange={setMarkupPct} disabled={!canEdit} />
          </Field>
        </div>
      </SectionCard>

      <SectionCard title="Instalment tenures & delivery">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Tenures (months, comma separated)" hint="e.g. 3, 6, 9, 12">
            <TextInput value={tenuresText} onChange={setTenuresText} placeholder="3, 6, 9, 12" disabled={!canEdit} />
          </Field>
          <Field label="Delivery charge (PKR)">
            <NumberInput value={shipping} onChange={setShipping} disabled={!canEdit} />
          </Field>
          <Field label="Free-shipping threshold (PKR)">
            <NumberInput value={freeThreshold} onChange={setFreeThreshold} disabled={!canEdit} />
          </Field>
        </div>
      </SectionCard>

      <SectionCard title={`Live preview (sample listed price ${formatPKR(SAMPLE_LISTED)})`}>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border bg-muted/30 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Buy Now (prepaid)</p>
            <p className="mt-2 text-2xl font-extrabold">{formatPKR(prepaidFinal)}</p>
            <p className="text-sm text-emerald-700">You save {formatPKR(prepaidDiscount)} ({buyNowPct}%)</p>
          </div>
          <div className="rounded-xl border bg-muted/30 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Instalments (12 months)</p>
            <p className="mt-2 text-2xl font-extrabold">{formatPKR(plan12.total)}</p>
            <p className="text-sm text-muted-foreground">Advance {formatPKR(plan12.advance)} · Remaining {formatPKR(plan12.remaining)}</p>
            <p className="text-sm text-muted-foreground">Monthly {formatPKR(plan12.monthly)} × 11 + {formatPKR(plan12.last)}</p>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
