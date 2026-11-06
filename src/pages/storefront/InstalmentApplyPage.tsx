import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, ChevronLeft, ChevronRight, ShieldCheck, UploadCloud } from "lucide-react";
import { getProductBySlug } from "@/data/catalog";
import { useSettings } from "@/features/settings/store";
import { useAuth } from "@/features/auth/AuthContext";
import { instalmentPlan } from "@/lib/pricing";
import { formatPKR, cn } from "@/lib/utils";
import { submitInstalmentApplication } from "@/lib/instalments";
import { defaultVariantIndex, defaultColor } from "@/lib/variant-select";
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

export function InstalmentApplyPage() {
  const [params] = useSearchParams();
  const { settings } = useSettings();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const productSlug = params.get("product") ?? "";
  const product = productSlug ? getProductBySlug(productSlug) : undefined;
  const variants = product?.variants ?? [];

  const skuParam = params.get("sku");
  const initialIndex = skuParam
    ? Math.max(0, variants.findIndex((v) => v.sku === skuParam))
    : defaultVariantIndex(variants);
  const [vIndex, setVIndex] = useState<number>(initialIndex);
  const variant = variants[vIndex];
  const [color, setColor] = useState<string>(() => params.get("color") || defaultColor(variant));

  const [step, setStep] = useState(0);
  const [tenure, setTenure] = useState<number>(settings.instalmentTenures?.[0] ?? 12);
  const [consent, setConsent] = useState(false);
  const [form, setForm] = useState({
    fullName: "", mobile: "", email: "", cnic: "",
    address: "", city: "", province: "", postalCode: "", employment: "", income: "",
  });
  const [documents, setDocuments] = useState<{ cnic?: File | null; incomeProof?: File | null }>({});
  const [submitBusy, setSubmitBusy] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [stepError, setStepError] = useState("");

  const plan = useMemo(
    () => (variant ? instalmentPlan(variant.listedPrice, tenure, settings.instalmentAdvancePercent, settings.instalmentMarkupPercent) : null),
    [variant, tenure, settings.instalmentAdvancePercent, settings.instalmentMarkupPercent]
  );

  const durations = settings.instalmentTenures?.length ? settings.instalmentTenures : [3, 6, 9, 12];

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

  function goNext() {
    const err = validateStep(step);
    if (err) {
      setStepError(err);
      return;
    }
    setStepError("");
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function goBack() {
    setStepError("");
    setStep((s) => Math.max(s - 1, 0));
  }

  async function handleSubmit() {
    setSubmitError("");
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
    setSubmitBusy(true);
    const fullAddress = [form.address, form.city, form.province, form.postalCode].filter(Boolean).join(", ");
    const result = await submitInstalmentApplication({
      variantSku: variant.sku,
      fullName: form.fullName,
      mobile: form.mobile,
      email: form.email || undefined,
      cnic: form.cnic || undefined,
      currentAddress: fullAddress || undefined,
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
      storage: variant.storage,
      color,
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

    if (!result.ok || !result.id) {
      // Only continue to the payment page when a real application id exists so
      // we never navigate to /installments/payment/undefined. On failure the
      // form state is preserved so the customer can correct and resubmit.
      if (result.ok === false && result.applicationId) {
        navigate(`/installments/payment/${result.applicationId}`, {
          state: { summary: summaryPayload, applicationSubmitWarning: result.error },
        });
      } else {
        setSubmitError(result.ok ? "We couldn't confirm your application. Please review and try again." : result.error);
      }
      return;
    }

    navigate(`/installments/payment/${result.id}`, {
      state: { summary: summaryPayload },
    });
  }

  if (!product || !variant || !plan) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-lg font-semibold">Product not found</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Please choose a phone from the catalogue to start an instalment application.
        </p>
        <Button asChild className="mt-6"><Link to="/catalog">Browse catalogue</Link></Button>
      </div>
    );
  }

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
          {/* STEP 1 — Product & Plan */}
          {step === 0 && (
            <>
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight">Instalment — Step 1</h1>
                <p className="mt-1 text-sm text-muted-foreground">Choose your phone configuration and payment plan.</p>
              </div>

              <div className="flex items-center gap-4 rounded-2xl border bg-muted/40 p-4">
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border bg-card">
                  <ProductImage product={product} variant={variant} color={color} className="h-full w-full object-cover" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold">{product.name}</p>
                  <p className="text-sm text-muted-foreground">{variant.storage} / {variant.ram} · {color || "—"}</p>
                  <p className="mt-1 text-lg font-bold">{formatPKR(variant.listedPrice)}</p>
                </div>
              </div>

              {variants.length > 1 && (
                <div>
                  <Label>Storage / RAM</Label>
                  <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {variants.map((v, i) => (
                      <button
                        key={v.sku}
                        type="button"
                        onClick={() => { setVIndex(i); setColor(defaultColor(v)); }}
                        className={cn(
                          "rounded-xl border p-3 text-left text-sm transition-all",
                          i === vIndex ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:border-primary"
                        )}
                      >
                        <span className="block font-bold">{v.storage} / {v.ram}</span>
                        <span className="mt-0.5 block text-xs opacity-80">{formatPKR(v.listedPrice)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {variant.colors.length > 0 && (
                <div>
                  <Label>Colour</Label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {variant.colors.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setColor(c)}
                        className={cn(
                          "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                          color === c ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:border-primary"
                        )}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <Separator />

              <div className="space-y-3">
                <div>
                  <Label>Instalment duration</Label>
                  <Select value={String(tenure)} onValueChange={(v) => setTenure(Number(v))}>
                    <SelectTrigger className="mt-2 w-full sm:w-56"><SelectValue placeholder="Select duration" /></SelectTrigger>
                    <SelectContent>
                      {durations.map((m) => (
                        <SelectItem key={m} value={String(m)}>{m} months</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="rounded-2xl border bg-muted/40 p-4 text-sm">
                  <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                    <ShieldCheck className="h-4 w-4" /> 0% markup — pay exactly the listed price
                  </div>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <div className="flex justify-between"><span className="text-muted-foreground">Total price</span><span className="font-semibold">{formatPKR(plan.total)}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Advance ({settings.instalmentAdvancePercent}%)</span><span className="font-semibold">{formatPKR(plan.advance)}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Remaining balance</span><span className="font-semibold">{formatPKR(plan.remaining)}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Monthly ({tenure} months)</span><span className="font-semibold">{formatPKR(plan.monthly)}</span></div>
                  </div>
                </div>
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
                <div className="sm:col-span-2"><Label htmlFor="address">Street address</Label><Textarea id="address" value={form.address} onChange={(e) => setField("address", e.target.value)} placeholder="House / street / area" rows={2} /></div>
                <div><Label htmlFor="city">City</Label><Input id="city" value={form.city} onChange={(e) => setField("city", e.target.value)} placeholder="e.g. Lahore" /></div>
                <div><Label htmlFor="province">Province</Label><Select value={form.province} onValueChange={(v) => setField("province", v)}><SelectTrigger id="province"><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{["Punjab","Sindh","Khyber Pakhtunkhwa","Balochistan","Islamabad","Gilgit-Baltistan","Azad Kashmir"].map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent></Select></div>
                <div><Label htmlFor="postal">Postal code (optional)</Label><Input id="postal" value={form.postalCode} onChange={(e) => setField("postalCode", e.target.value)} placeholder="e.g. 54000" /></div>
                <div><Label htmlFor="mobile2">Contact number</Label><Input id="mobile2" inputMode="tel" value={form.mobile} onChange={(e) => setField("mobile", e.target.value)} placeholder="03XX-XXXXXXX" /></div>
              </div>
            </>
          )}

          {/* STEP 5 — Review & confirm */}
          {step === 4 && (
            <>
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight">Review & confirm</h1>
                <p className="mt-1 text-sm text-muted-foreground">Please check every detail before continuing to payment.</p>
              </div>
              <div className="space-y-4">
                <section className="rounded-2xl border p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Product</p>
                  <p className="mt-1 font-semibold">{product.name}</p>
                  <p className="text-sm text-muted-foreground">{variant.storage} / {variant.ram} · {color || "—"}</p>
                  <p className="mt-1 font-bold">{formatPKR(variant.listedPrice)}</p>
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
                    <p className="text-muted-foreground">CNIC: {form.cnic}</p>
                    <p className="text-muted-foreground">{[form.address, form.city, form.province, form.postalCode].filter(Boolean).join(", ")}</p>
                  </div>
                </section>
              </div>
            </>
          )}

          {stepError && <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">{stepError}</p>}
          {submitError && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-500/10 dark:text-red-300">{submitError}</p>}

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
              <Button type="button" size="lg" disabled={submitBusy} onClick={handleSubmit}>
                {submitBusy ? "Submitting…" : "Agree & Continue to Payment"}
              </Button>
            )}
          </div>

          {!isAuthenticated && (
            <p className="text-center text-xs text-muted-foreground">
              You'll need to be signed in to submit. <Link to="/login" className="underline">Login</Link> or <Link to="/register" className="underline">create an account</Link>.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
