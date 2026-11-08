import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, ChevronLeft, ChevronRight, Loader2, RefreshCw, ShieldCheck, UploadCloud } from "lucide-react";
import { getProductBySlug } from "@/data/catalog";
import { getAllProducts } from "@/store/products";
import { useSettings } from "@/features/settings/store";
import { useAuth } from "@/features/auth/AuthContext";
import { instalmentPlan } from "@/lib/pricing";
import { formatPKR, cn } from "@/lib/utils";
import { submitInstalmentApplication } from "@/lib/instalments";
import { getVariantBySku, canonicalColor, displayRamLabel } from "@/lib/variant-select";
import { ptaInfo } from "@/lib/pta";
import { confirmOfferOnBackend } from "@/lib/instalment-offer";
import type { InstalmentPlan, Product, ProductVariant } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { FileUploadField } from "@/components/file-upload-field";
import { ProductImage } from "@/components/product-image";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const STEPS = ["Product & Plan", "Personal Info", "CNIC & Verification", "Delivery", "Review"];
const SELECTION_STORAGE_KEY = "raestech:instalment-selection";
const FORM_STORAGE_KEY = "raestech:instalment-form-draft";

type InstalmentFormFields = {
  fullName: string; mobile: string; email: string; cnic: string;
  address: string; city: string; province: string; postalCode: string; area: string; employment: string; income: string;
};

/** Mask a CNIC for Review display (never show the full number). */
function maskCnic(value: string): string {
  const digits = value.replace(/[^0-9]/g, "");
  if (digits.length < 4) return "••••";
  return `${digits.slice(0, 3)}-${"•".repeat(Math.max(0, digits.length - 5))}-${digits.slice(-2)}`;
}

export function InstalmentApplyPage() {
  const [params] = useSearchParams();
  const { settings } = useSettings();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const productSlug = params.get("product") ?? "";
  const skuParam = params.get("sku");
  const colorParam = params.get("color");

  const product = useMemo(() => (productSlug ? getProductBySlug(productSlug) : undefined), [productSlug]);
  // Canonical offer resolution — the ONLY way a variant may be selected.
  const variant = useMemo(
    () => (product ? getVariantBySku(product.variants, skuParam) : undefined),
    [product, skuParam]
  );
  // Colour is only accepted when the variant actually lists it; the canonical
  // stored label is used (case-insensitive) so the backend always receives the
  // exact colour from the DB row.
  const offeredColor = useMemo(() => {
    if (!variant || !colorParam) return "";
    return canonicalColor(variant, colorParam);
  }, [variant, colorParam]);

  const hasColors = !!variant && variant.colors.length > 0;
  const selectionComplete = !!variant && (!hasColors || !!offeredColor);
  const localUnavailable = !!variant && hasColors && !offeredColor;

  // Ambiguous SKU in a legacy link (more than one product/variant matches). We
  // ask the customer to pick BEFORE collecting personal details — never a silent
  // substitution based on display text.
  const skuCandidates = useMemo(() => {
    const out: { product: Product; variant: ProductVariant }[] = [];
    if (!skuParam) return out;
    for (const p of getAllProducts()) {
      for (const v of p.variants) {
        if (v.sku === skuParam) out.push({ product: p, variant: v });
      }
    }
    return out;
  }, [skuParam]);
  const needClarification = skuCandidates.length > 1;

  const [step, setStep] = useState(0);
  const [tenure, setTenure] = useState<number>(() => {
    const allowed = settings.instalmentTenures?.length ? settings.instalmentTenures : [3, 6, 9, 12];
    const raw = Number(params.get("tenure"));
    return allowed.includes(raw) ? raw : (allowed[0] ?? 12);
  });
  const [consent, setConsent] = useState(false);
  const [form, setForm] = useState<InstalmentFormFields>(() => {
    const empty: InstalmentFormFields = {
      fullName: "", mobile: "", email: "", cnic: "",
      address: "", city: "", province: "", postalCode: "", area: "", employment: "", income: "",
    };
    try {
      const raw = sessionStorage.getItem(FORM_STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved && typeof saved === "object" && saved.fields) {
          return { ...empty, ...saved.fields };
        }
      }
    } catch {
      /* ignore quota / parse errors */
    }
    return empty;
  });
  const [documents, setDocuments] = useState<{ cnic?: File | null; incomeProof?: File | null }>({});
  const [submitBusy, setSubmitBusy] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [stepError, setStepError] = useState("");
  const [unavailable, setUnavailable] = useState(false);
  const [needRetry, setNeedRetry] = useState(false);
  const [confirmBusy, setConfirmBusy] = useState(false);
  // Guard against duplicate submissions (double-click / rapid re-trigger).
  const submittingLock = useRef(false);
  const [pendingServerPlan, setPendingServerPlan] = useState<InstalmentPlan | null>(null);

  // Availability state — distinguishes loading / network failure / genuinely
  // unavailable stock so a failed query is never shown as "no longer available".
  const [availStatus, setAvailStatus] = useState<"idle" | "checking" | "ok" | "retry" | "unavailable">("idle");
  const [availError, setAvailError] = useState("");
  // The DB variant id resolved by a successful backend confirm — carried through
  // the steps so submission uses the same identity the customer reviewed.
  const [resolvedVariantId, setResolvedVariantId] = useState<string | null>(null);
  const availCheckedFor = useRef("");

  const plan = useMemo(
    () => (variant ? instalmentPlan(variant.listedPrice, tenure, settings.instalmentAdvancePercent, settings.instalmentMarkupPercent, settings.instalmentDiscountPercent) : null),
    [variant, tenure, settings.instalmentAdvancePercent, settings.instalmentMarkupPercent, settings.instalmentDiscountPercent]
  );

  const durations = settings.instalmentTenures?.length ? settings.instalmentTenures : [3, 6, 9, 12];
  const pta = variant ? ptaInfo(variant) : null;

  // Incomplete / unresolvable selection must never proceed — send the customer to
  // the product page so they choose the required options exactly once.
  useEffect(() => {
    if (needClarification) return;
    if (selectionComplete) return;
    const target = productSlug ? `/product/${productSlug}` : "/catalog";
    navigate(target, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectionComplete, productSlug, needClarification]);

  // Persist the confirmed selection so refresh / back / sign-in return keeps it.
  useEffect(() => {
    if (selectionComplete && variant) {
      try {
        sessionStorage.setItem(
          SELECTION_STORAGE_KEY,
          JSON.stringify({ slug: productSlug, sku: variant.sku, color: offeredColor })
        );
      } catch {
        /* ignore quota errors */
      }
    }
  }, [selectionComplete, variant, offeredColor, productSlug]);

  // Persist entered form + plan selections so choosing another variant (or a
  // refresh) retains safely held progress.
  useEffect(() => {
    try {
      sessionStorage.setItem(FORM_STORAGE_KEY, JSON.stringify({ fields: form, tenure, consent }));
    } catch {
      /* ignore quota errors */
    }
  }, [form, tenure, consent]);

  function setField(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setStepError("");
  }

  function validateStep(s: number): string {
    if (s === 1) {
      if (!form.fullName.trim()) return "Full name is required.";
      if (!form.mobile.trim()) return "Mobile number is required.";
      if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) return "Enter a valid email address.";
    }
    if (s === 2) {
      if (!form.cnic.trim()) return "CNIC number is required.";
      if (!/^\d{5}-\d{7}-\d{1}$/.test(form.cnic.trim()) && !/^\d{13}$/.test(form.cnic.replace(/-/g, ""))) return "CNIC must be like 12345-1234567-1.";
      if (!documents.cnic) return "A clear copy of your CNIC is required.";
      if (!consent) return "Please accept the consent and privacy statement.";
    }
    if (s === 3) {
      if (!form.address.trim()) return "Delivery address is required.";
      if (!form.city.trim()) return "City is required.";
      if (!form.province.trim()) return "Province is required.";
    }
    return "";
  }

  function goBack() {
    setStepError("");
    setStep((s) => Math.max(s - 1, 0));
  }

  /**
   * Authoritative availability check against the same backend rule used at
   * submission. "unavailable" is a genuine stock/colour/catalogue rejection;
   * "retry" is a network/RPC failure and must never be shown as unavailability.
   */
  const checkAvailability = async (): Promise<"ok" | "unavailable" | "retry"> => {
    if (!variant || !selectionComplete) return "retry";
    setAvailStatus("checking");
    setAvailError("");
    const res = await confirmOfferOnBackend({
      slug: productSlug,
      sku: variant.sku,
      color: offeredColor,
      tenure,
    });
    if (res.status === "ok") {
      setResolvedVariantId(res.variantId ?? null);
      setAvailStatus("ok");
      setUnavailable(false);
      return "ok";
    }
    if (res.status === "unavailable") {
      setAvailStatus("unavailable");
      setAvailError(res.error ?? "");
      setUnavailable(true);
      return "unavailable";
    }
    setAvailStatus("retry");
    setAvailError(res.error ?? "We couldn't check availability right now. Please try again.");
    setUnavailable(false);
    return "retry";
  };

  function goNext() {
    const err = validateStep(step);
    if (err) {
      setStepError(err);
      return;
    }
    setStepError("");
    // Validate availability before CNIC & verification. Genuine unavailability
    // blocks; a network failure (retry) surfaces a notice but does not
    // hard-block progress (the final submit rechecks server-side).
    if (step === 1) {
      void (async () => {
        const status = await checkAvailability();
        if (status !== "unavailable") {
          setStep((s) => Math.min(s + 1, STEPS.length - 1));
        }
      })();
      return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  async function doSubmit() {
    if (!variant || !plan) {
      setSubmitError("Please select a product from the catalog before submitting.");
      return;
    }
    setSubmitBusy(true);
    setSubmitError("");
    setNeedRetry(false);
    const fullAddress = [form.address, form.city, form.province, form.postalCode].filter(Boolean).join(", ");
    const result = await submitInstalmentApplication({
      variantSku: variant.sku,
      variantId: resolvedVariantId ?? undefined,
      color: offeredColor,
      fullName: form.fullName,
      mobile: form.mobile,
      email: form.email || undefined,
      cnic: form.cnic || undefined,
      currentAddress: fullAddress || undefined,
      deliveryFullName: form.fullName,
      deliveryPhone: form.mobile,
      deliveryAddress: form.address || undefined,
      deliveryArea: form.area || undefined,
      deliveryCity: form.city || undefined,
      deliveryProvince: form.province || undefined,
      deliveryPostalCode: form.postalCode || undefined,
      employmentStatus: form.employment || undefined,
      monthlyIncome: form.income || undefined,
      tenureMonths: tenure,
      listedPrice: variant.listedPrice,
      advancePayment: plan.advance,
      remainingBalance: plan.remaining,
      monthlyPayment: plan.monthly,
      totalPayable: plan.total,
      consent,
      cnicFile: documents.cnic,
      incomeProofFile: documents.incomeProof,
    });
    setSubmitBusy(false);

    const summaryPayload = {
      productName: product?.name ?? variant.sku,
      sku: variant.sku,
      variantId: resolvedVariantId,
      storage: variant.storage,
      color: offeredColor,
      ptaStatus: variant.pta_status,
      listedPrice: variant.listedPrice,
      tenure,
      advance: plan.advance,
      monthly: plan.monthly,
      remaining: plan.remaining,
      total: plan.total,
      fullName: form.fullName,
      mobile: form.mobile,
      email: form.email,
      address: fullAddress,
    };

    if (!result.ok) {
      if (result.code === "unavailable") {
        setUnavailable(true);
        return;
      }
      if (result.applicationId) {
        navigate(`/installments/payment/${result.applicationId}`, {
          state: { summary: summaryPayload, applicationSubmitWarning: result.error },
        });
        return;
      }
      setSubmitError(result.error || "We couldn't confirm your application. Please review and try again.");
      setNeedRetry(result.code === "retry");
      return;
    }
    navigate(`/installments/payment/${result.id}`, {
      state: { summary: summaryPayload },
    });
  }

  async function handleSubmit() {
    setSubmitError("");
    setNeedRetry(false);
    setUnavailable(false);
    setPendingServerPlan(null);

    if (!isAuthenticated) {
      navigate("/login", { state: { from: location.pathname + location.search } });
      return;
    }
    if (!variant || !plan) {
      setSubmitError("Please select a product from the catalog before submitting.");
      return;
    }
    const err = validateStep(3);
    if (err) {
      setStepError(err);
      return;
    }

    // Revalidate availability and recalculate the payable amount on the backend
    // BEFORE advancing to payment. The lock prevents duplicate submissions.
    if (submittingLock.current) return;
    submittingLock.current = true;
    try {
      setConfirmBusy(true);
      const confirmRes = await confirmOfferOnBackend({
        slug: productSlug,
        sku: variant.sku,
        color: offeredColor,
        tenure,
      });

      if (confirmRes.status === "unavailable") {
        setUnavailable(true);
        return;
      }
      if (confirmRes.status !== "ok") {
        setSubmitError(confirmRes.error ?? "We couldn't confirm this offer right now. Please try again.");
        setNeedRetry(true);
        return;
      }

      // Carry the resolved DB variant id through to submission so the saved
      // application uses the same identity the customer reviewed.
      setResolvedVariantId(confirmRes.variantId ?? null);

      // If the server-side price differs from what the customer reviewed, surface
      // the updated breakdown and ask them to confirm before proceeding.
      const serverTotal = confirmRes.plan?.total ?? plan.total;
      if (Math.abs(serverTotal - plan.total) > 0.01) {
        setPendingServerPlan(confirmRes.plan!);
        return;
      }

      await doSubmit();
    } finally {
      setConfirmBusy(false);
      submittingLock.current = false;
    }
  }

  if (needClarification && skuCandidates.length > 1) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <h1 className="text-2xl font-bold">Choose the exact phone</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          This link matches more than one phone. Please pick the exact one before continuing.
        </p>
        <ul className="mt-6 space-y-3">
          {skuCandidates.map((c) => (
            <li key={`${c.product.slug}-${c.variant.sku}`}>
              <Button asChild variant="outline" className="w-full justify-start">
                <Link to={`/product/${c.product.slug}?sku=${encodeURIComponent(c.variant.sku)}&color=${encodeURIComponent(offeredColor)}`}>
                  {c.product.name} — {c.variant.storage}{displayRamLabel(c.variant.ram) ? ` / ${displayRamLabel(c.variant.ram)}` : ""} · {c.variant.sku}
                </Link>
              </Button>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (!product || !variant) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-lg font-semibold">Product not found</p>
        <p className="mt-2 text-sm text-muted-foreground">
          {productSlug ? "This phone is not available in the catalogue." : "Select a phone to apply for an instalment."}
        </p>
        <Button asChild className="mt-6"><Link to="/catalog">Browse catalogue</Link></Button>
      </div>
    );
  }

  // `plan` is only null when the variant is missing, which is handled above.
  if (!plan) return null;

  const changeHref = `/product/${product.slug}?sku=${encodeURIComponent(variant.sku)}&color=${encodeURIComponent(offeredColor)}`;

  // Customer-facing spec label: storage + RAM, omitting internal/unresolved notes
  // that may be stored in the `ram` field (e.g. "Model-dependent; verify exact RAM").
  const ramLabel = displayRamLabel(variant.ram);
  const specLabel = `${variant.storage}${ramLabel ? ` / ${ramLabel}` : ""}`;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* Stepper */}
      <ol className="mb-8 flex items-center gap-1 overflow-x-auto">
        {STEPS.map((label, i) => (
          <li key={label} className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => i < step && setStep(i)}
              className={cn(
                "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                i === step ? "bg-primary text-primary-foreground" : i < step ? "text-foreground" : "text-muted-foreground"
              )}
            >
              <span className={cn("inline-flex h-5 w-5 items-center justify-center rounded-full", i < step ? "bg-emerald-500 text-white" : i === step ? "bg-white/20" : "bg-muted")}>
                {i < step ? <CheckCircle2 className="h-3.5 w-3.5" /> : i + 1}
              </span>
              {label}
            </button>
            {i < STEPS.length - 1 && <span className="h-px w-3 bg-border" />}
          </li>
        ))}
      </ol>

      <Card>
        <CardContent className="space-y-6 p-6 sm:p-8">
          {/* Loading / network status — never shown as unavailability */}
          {availStatus === "checking" && (
            <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Checking availability…
            </div>
          )}
          {availStatus === "retry" && (
            <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10">
              <div className="flex items-center justify-between gap-3">
                <span>{availError || "We couldn't check availability right now."}</span>
                <Button type="button" variant="outline" size="sm" onClick={() => void checkAvailability()}>
                  <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Retry
                </Button>
              </div>
            </div>
          )}

          {/* Unavailable block — a rejected/unresolved selection must never advance */}
          {unavailable ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-500/30 dark:bg-red-500/10">
              <p className="text-lg font-semibold text-red-800 dark:text-red-300">This option is no longer available</p>
              <p className="mt-1 text-sm text-red-700/80 dark:text-red-300/80">
                The {specLabel} · {offeredColor || "selected colour"} offer for {product.name} can't be ordered right now.
              </p>
              <Button asChild className="mt-5" variant="outline">
                <Link to={changeHref}>Choose another option</Link>
              </Button>
            </div>
          ) : (
            <>
              {/* STEP 1 — Product & Plan */}
              {step === 0 && (
                <>
                  <div>
                    <h1 className="text-2xl font-extrabold tracking-tight">Instalment — Step 1</h1>
                    <p className="mt-1 text-sm text-muted-foreground">Review your selected phone and choose a payment plan.</p>
                  </div>

                  {/* Read-only "Selected phone" summary (no editable storage/RAM/colour) */}
                  <section className="rounded-2xl border bg-card p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Selected phone</p>
                      <Link to={changeHref} className="text-xs font-semibold text-primary underline underline-offset-2 hover:text-primary/80">
                        Change selection
                      </Link>
                    </div>

                    <div className="mt-3 flex items-center gap-4">
                      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-card">
                        <ProductImage product={product} variant={variant} color={offeredColor} className="h-full w-full object-cover" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-bold">{product.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {specLabel} · {offeredColor || (hasColors ? "Colour required" : "—")}
                        </p>
                      </div>
                    </div>

                    <dl className="mt-4 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                      {pta && (
                        <div className="flex items-center justify-between gap-2">
                          <dt className="text-muted-foreground">PTA status</dt>
                          <dd className="inline-flex items-center gap-1.5 font-medium">
                            <ShieldCheck
                              className={cn(
                                "h-4 w-4",
                                pta.tone === "success" ? "text-emerald-600" : pta.tone === "warning" ? "text-amber-600" : "text-muted-foreground"
                              )}
                            />
                            {pta.label}
                          </dd>
                        </div>
                      )}
                      {variant.box_pack && (
                        <div className="flex items-center justify-between gap-2">
                          <dt className="text-muted-foreground">Condition</dt>
                          <dd className="text-right font-medium">{variant.box_pack}</dd>
                        </div>
                      )}
                      <div className="flex items-center justify-between gap-2">
                        <dt className="text-muted-foreground">Listed price</dt>
                        <dd className="font-medium line-through text-muted-foreground">{formatPKR(variant.listedPrice)}</dd>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <dt className="text-muted-foreground">Instalment price</dt>
                        <dd className="text-base font-black text-primary">{plan ? formatPKR(plan.total) : formatPKR(variant.instalmentTotal)}</dd>
                      </div>
                    </dl>
                    <p className="mt-3 rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
                      An {settings.instalmentDiscountPercent ?? 11}% instalment discount is applied with 0% markup.
                    </p>
                  </section>

                  {/* Duration — keeps editable */}
                  <div className="rounded-2xl border p-4">
                    <Label htmlFor="tenure" className="text-sm">Instalment duration</Label>
                    <Select value={String(tenure)} onValueChange={(v) => setTenure(Number(v))}>
                      <SelectTrigger id="tenure" className="mt-2 w-full sm:w-48"><SelectValue placeholder="Choose duration" /></SelectTrigger>
                      <SelectContent>
                        {durations.map((d) => (
                          <SelectItem key={d} value={String(d)}>{d} months</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {plan && (
                      <div className="mt-4 grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
                        <div className="flex justify-between"><span className="text-muted-foreground">Advance ({settings.instalmentAdvancePercent}%)</span><span className="font-semibold">{formatPKR(plan.advance)}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Remaining balance</span><span className="font-semibold">{formatPKR(plan.remaining)}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Monthly ({tenure} months)</span><span className="font-semibold">{formatPKR(plan.monthly)}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Total payable</span><span className="font-semibold">{formatPKR(plan.total)}</span></div>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* STEP 2 — Personal info */}
              {step === 1 && (
                <>
                  <div>
                    <h1 className="text-2xl font-extrabold tracking-tight">Personal information</h1>
                    <p className="mt-1 text-sm text-muted-foreground">Tell us who you are so we can prepare your application.</p>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2"><Label htmlFor="fullName">Full name</Label><Input id="fullName" value={form.fullName} onChange={(e) => setField("fullName", e.target.value)} placeholder="e.g. Ahmed Khan" /></div>
                    <div><Label htmlFor="mobile">Mobile number</Label><Input id="mobile" inputMode="tel" value={form.mobile} onChange={(e) => setField("mobile", e.target.value)} placeholder="03XX-XXXXXXX" /></div>
                    <div><Label htmlFor="email">Email (optional)</Label><Input id="email" type="email" value={form.email} onChange={(e) => setField("email", e.target.value)} placeholder="you@example.com" /></div>
                  </div>
                </>
              )}

              {/* STEP 3 — CNIC & verification */}
              {step === 2 && (
                <>
                  <div>
                    <h1 className="text-2xl font-extrabold tracking-tight">CNIC & verification</h1>
                    <p className="mt-1 text-sm text-muted-foreground">We verify identities before approving instalment applications.</p>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2"><Label htmlFor="cnic">CNIC number</Label><Input id="cnic" value={form.cnic} onChange={(e) => setField("cnic", e.target.value)} placeholder="12345-1234567-1" /></div>
                    <div><Label htmlFor="employment">Employment status</Label><Select value={form.employment} onValueChange={(v) => setField("employment", v)}><SelectTrigger id="employment"><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{["Employed","Self-employed","Student","Unemployed","Retired"].map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent></Select></div>
                    <div><Label htmlFor="income">Monthly income (PKR)</Label><Input id="income" inputMode="numeric" value={form.income} onChange={(e) => setField("income", e.target.value)} placeholder="e.g. 150000" /></div>
                    <div className="sm:col-span-2"><FileUploadField id="cnicFile" label="CNIC copy (front/back)" accept=".jpg,.jpeg,.png,.pdf" required value={documents.cnic ?? null} onChange={(f) => setDocuments((d) => ({ ...d, cnic: f }))} helperText="JPG, PNG or PDF, max 5 MB." /></div>
                    <div className="sm:col-span-2"><FileUploadField id="incomeProof" label="Proof of income (optional)" accept=".jpg,.jpeg,.png,.pdf" value={documents.incomeProof ?? null} onChange={(f) => setDocuments((d) => ({ ...d, incomeProof: f }))} helperText="Salary slip or bank statement. JPG, PNG or PDF, max 5 MB." /></div>
                  </div>
                  <label className="flex items-start gap-3 rounded-2xl border p-4 text-sm">
                    <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 h-4 w-4" />
                    <span>I agree that RAES TECH may collect, verify and securely store my personal and CNIC information and identity documents solely to process this instalment application, in line with the privacy policy.</span>
                  </label>
                </>
              )}

              {/* STEP 4 — Delivery */}
              {step === 3 && (
                <>
                  <div>
                    <h1 className="text-2xl font-extrabold tracking-tight">Delivery information</h1>
                    <p className="mt-1 text-sm text-muted-foreground">We deliver nationwide across Pakistan.</p>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2"><Label htmlFor="address">Street address</Label><Textarea id="address" value={form.address} onChange={(e) => setField("address", e.target.value)} placeholder="House / street" rows={2} /></div>
                    <div><Label htmlFor="area">Area</Label><Input id="area" value={form.area} onChange={(e) => setField("area", e.target.value)} placeholder="Area / neighbourhood" /></div>
                    <div><Label htmlFor="city">City</Label><Input id="city" value={form.city} onChange={(e) => setField("city", e.target.value)} placeholder="e.g. Lahore" /></div>
                    <div><Label htmlFor="province">Province</Label><Select value={form.province} onValueChange={(v) => setField("province", v)}><SelectTrigger id="province"><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{["Punjab","Sindh","Khyber Pakhtunkhwa","Balochistan","Islamabad Capital Territory"].map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent></Select></div>
                    <div><Label htmlFor="postal">Postal code (optional)</Label><Input id="postal" value={form.postalCode} onChange={(e) => setField("postalCode", e.target.value)} placeholder="e.g. 54000" /></div>
                    <div><Label htmlFor="mobile2">Contact number</Label><Input id="mobile2" inputMode="tel" value={form.mobile} onChange={(e) => setField("mobile", e.target.value)} placeholder="03XX-XXXXXXX" /></div>
                  </div>
                </>
              )}

              {/* STEP 5 — Review */}
              {step === 4 && (
                <>
                  <div>
                    <h1 className="text-2xl font-extrabold tracking-tight">Review & confirm</h1>
                    <p className="mt-1 text-sm text-muted-foreground">Please check every detail before continuing to payment.</p>
                  </div>
                  <div className="space-y-4">
                    <section className="rounded-2xl border p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Product</p>
                        <Link to={changeHref} className="text-xs font-semibold text-primary underline underline-offset-2">Change selection</Link>
                      </div>
                      <p className="mt-1 font-semibold">{product.name}</p>
                      <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                        <span>{specLabel} · {offeredColor || "—"}</span>
                        {pta && (
                          <span className={cn("inline-flex items-center gap-1 font-medium", pta.tone === "success" ? "text-emerald-700 dark:text-emerald-400" : pta.tone === "warning" ? "text-amber-700 dark:text-amber-400" : "text-muted-foreground")}>
                            <ShieldCheck className="h-4 w-4" /> {pta.label}
                          </span>
                        )}
                      </p>
                      <p className="mt-2 text-lg font-black text-primary">{plan ? formatPKR(plan.total) : formatPKR(variant.instalmentTotal)}</p>
                    </section>
                    <section className="rounded-2xl border p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Instalment plan</p>
                      <div className="mt-2 space-y-1.5 text-sm">
                        <div className="flex justify-between"><span className="text-muted-foreground">Duration</span><span className="font-medium">{tenure} months</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Advance ({settings.instalmentAdvancePercent}%)</span><span className="font-medium">{formatPKR(plan.advance)}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Remaining balance</span><span className="font-medium">{formatPKR(plan.remaining)}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Monthly</span><span className="font-medium">{formatPKR(plan.monthly)}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">0% markup</span><span className="font-medium text-emerald-700 dark:text-emerald-400">Yes</span></div>
                      </div>
                    </section>
                    <section className="rounded-2xl border p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Customer</p>
                      <div className="mt-2 space-y-1.5 text-sm">
                        <p>{form.fullName} · {form.mobile}{form.email ? ` · ${form.email}` : ""}</p>
                        <p className="text-muted-foreground">CNIC: {maskCnic(form.cnic)}</p>
                        <p className="text-muted-foreground">{[form.address, form.city, form.province, form.postalCode].filter(Boolean).join(", ")}</p>
                      </div>
                    </section>
                  </div>
                </>
              )}

              {/* Updated price confirmation (server said price changed) */}
              {pendingServerPlan && (
                <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-500/30 dark:bg-amber-500/10">
                  <p className="text-sm font-semibold text-amber-900 dark:text-amber-300">The price has been updated — please review and confirm.</p>
                  <div className="mt-2 space-y-1 text-sm text-amber-800 dark:text-amber-200">
                    <div className="flex justify-between"><span>Advance</span><span className="font-semibold">{formatPKR(pendingServerPlan.advance)}</span></div>
                    <div className="flex justify-between"><span>Remaining balance</span><span className="font-semibold">{formatPKR(pendingServerPlan.remaining)}</span></div>
                    <div className="flex justify-between"><span>Monthly</span><span className="font-semibold">{formatPKR(pendingServerPlan.monthly)}</span></div>
                    <div className="flex justify-between"><span>Total payable</span><span className="font-semibold">{formatPKR(pendingServerPlan.total)}</span></div>
                  </div>
                  <Button type="button" size="sm" className="mt-3" onClick={() => { setPendingServerPlan(null); doSubmit(); }}>
                    Confirm updated price
                  </Button>
                </div>
              )}

              {stepError && <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">{stepError}</p>}
              {submitError && (
                <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-500/10 dark:text-red-300">
                  <p>{submitError}</p>
                  {needRetry && (
                    <Button type="button" variant="outline" size="sm" className="mt-2" disabled={confirmBusy} onClick={handleSubmit}>
                      <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Try again
                    </Button>
                  )}
                </div>
              )}

              {/* Footer nav */}
              <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  {step > 0 && (
                    <Button type="button" variant="outline" onClick={goBack}>
                      <ChevronLeft className="mr-1 h-4 w-4" /> Back
                    </Button>
                  )}
                </div>
                {step < STEPS.length - 1 ? (
                  <Button type="button" size="lg" onClick={goNext}>
                    Continue <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                ) : (
                  <Button type="button" size="lg" disabled={submitBusy || confirmBusy || needRetry} onClick={handleSubmit}>
                    {confirmBusy ? "Checking availability…" : submitBusy ? "Submitting…" : "Agree & Continue to Payment"}
                  </Button>
                )}
              </div>

              {!isAuthenticated && (
                <p className="text-center text-xs text-muted-foreground">
                  You'll need to be signed in to submit. <Link to="/login" className="underline">Login</Link> or <Link to="/register" className="underline">create an account</Link>.
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
