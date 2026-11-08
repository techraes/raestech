import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { CheckCircle2, ShieldCheck, UploadCloud } from "lucide-react";
import { useSettings } from "@/features/settings/store";
import { useAuth } from "@/features/auth/AuthContext";
import { formatPKR } from "@/lib/utils";
import { uploadReceipt, attachReceiptToInstalment } from "@/lib/receipts";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { FileUploadField } from "@/components/file-upload-field";
import { PaymentQr } from "@/components/payment-qr";

interface PaymentSummary {
  productName: string;
  sku: string;
  storage: string;
  color?: string;
  listedPrice: number;
  tenure: number;
  advance: number;
  monthly: number;
  remaining: number;
  total: number;
  fullName: string;
  mobile: string;
  email?: string;
  address?: string;
}

/** Human-friendly reference derived from the application id (RT-XXXXXXXX). */
function referenceFromId(id: string): string {
  const clean = id.replace(/[^0-9a-zA-Z]/g, "").toUpperCase();
  return `RT-${clean.slice(-8).padStart(8, "0")}`;
}

export function InstalmentPaymentPage() {
  const { applicationId = "" } = useParams<{ applicationId: string }>();
  const { state } = useLocation();
  const navigate = useNavigate();
  const { settings } = useSettings();
  const { isAuthenticated } = useAuth();

  const summary: PaymentSummary | undefined = (state as { summary?: PaymentSummary })?.summary;
  const warning = (state as { applicationSubmitWarning?: string })?.applicationSubmitWarning;

  const [receipt, setReceipt] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  // Path of the advance receipt already uploaded to storage, kept so a retry
  // after a payment-record failure reuses the same file.
  const [receiptPath, setReceiptPath] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(!summary);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (summary) {
      setLoaded(true);
      return;
    }
    // Best-effort fallback: if the user arrived without navigation state (e.g.
    // refreshed), reload the application from the backend.
    let cancelled = false;
    void (async () => {
      try {
        if (!supabase) {
          if (!cancelled) setNotFound(true);
          return;
        }
        const { data } = await supabase.from("instalment_applications")
          .select("id, status, advance_payment, tenure_months")
          .eq("id", applicationId)
          .maybeSingle();
        if (cancelled) return;
        if (!data) {
          setNotFound(true);
        } else {
          setLoaded(true);
          // Without the product/variant summary we show only reference + status.
          setSummaryFallback({ advance: Number(data.advance_payment ?? 0), status: data.status });
        }
      } catch {
        if (!cancelled) setNotFound(true);
      }
    })();
    return () => { cancelled = true; };
  }, [applicationId, summary]);

  const [fallback, setSummaryFallback] = useState<{ advance: number; status?: string } | null>(null);
  const advance = summary?.advance ?? fallback?.advance ?? 0;

  const manualMethod = settings.paymentMethods?.find((m) => m.enabled && m.type === "manual") ?? null;
  const bankDetails = manualMethod
    ? {
        bankName: manualMethod.bankName ?? "",
        accountTitle: manualMethod.accountTitle ?? "",
        accountNumber: manualMethod.accountNumber ?? "",
        iban: manualMethod.iban ?? "",
        instructions: manualMethod.instructions ?? "",
      }
    : undefined;
  // Merchant QR configured by the admin for the bank method (data URL) or the
  // text payload used to render a scannable QR. Passed to the same PaymentQr
  // component used on Buy Now checkout.
  const merchantQrImageUrl = manualMethod?.qrImageUrl ?? "";
  const merchantQrPayload = manualMethod?.qrPayload ?? "";

  async function handleSubmitReceipt(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!isAuthenticated) {
      navigate("/login", { state: { from: `/installments/payment/${applicationId}` } });
      return;
    }
    if (!receipt) {
      setError("Please attach your payment receipt first.");
      return;
    }
    setSubmitting(true);
    // Reuse a previously uploaded path on retry so the customer is never asked
    // to transfer again or re-upload after a payment-record failure.
    let effectivePath = receiptPath;
    if (!effectivePath) {
      const uploaded = await uploadReceipt(receipt);
      if (!uploaded.ok) {
        setSubmitting(false);
        setError(uploaded.error);
        return;
      }
      effectivePath = uploaded.path;
      setReceiptPath(effectivePath);
    }
    const result = await attachReceiptToInstalment(applicationId, advance, effectivePath, receipt);
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setDone(true);
  }

  if (notFound) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-lg font-semibold">Application not found</p>
        <p className="mt-2 text-sm text-muted-foreground">We couldn't load this instalment application.</p>
        <Button asChild className="mt-6"><Link to="/account">Go to my account</Link></Button>
      </div>
    );
  }

  if (!loaded) {
    return <div className="mx-auto max-w-2xl px-4 py-20 text-center text-sm text-muted-foreground">Loading your payment page…</div>;
  }

  if (done) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <Card>
          <CardContent className="p-8 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-500/15">
              <CheckCircle2 className="h-9 w-9 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h1 className="mt-5 text-2xl font-extrabold tracking-tight">Thank You! Your Order Has Been Submitted Successfully.</h1>
            <p className="mt-2 text-4xl font-extrabold tracking-tight">Order Number: {referenceFromId(applicationId)}</p>
            <p className="mt-4 text-sm text-muted-foreground">
              Your instalment application and payment receipt have been received.
            </p>
            <div className="mx-auto mt-4 max-w-md rounded-2xl border bg-muted/40 p-4 text-left text-sm">
              <p className="font-medium">Your payment and application are currently under verification.</p>
              <p className="mt-2 text-muted-foreground">
                Our team will review the details and notify you of the next steps. Your order is <span className="font-semibold">not yet approved or paid</span> until verification is completed.
              </p>
            </div>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button asChild><Link to="/account">View My Order</Link></Button>
              <Button asChild variant="outline"><Link to="/account">Track Application Status</Link></Button>
              <Button asChild variant="outline"><Link to="/catalog">Continue Shopping</Link></Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Final Payment</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Complete your advance payment and upload the receipt. Ref: <span className="font-semibold text-foreground">{referenceFromId(applicationId)}</span>
        </p>
      </div>

      {warning && <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">{warning}</p>}

      <div className="mt-6 grid gap-6 md:grid-cols-5">
        <div className="space-y-4 md:col-span-3">
          {/* Product + amount summary */}
          <Card>
            <CardContent className="p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Application summary</p>
              {summary ? (
                <div className="mt-3 space-y-1.5 text-sm">
                  <p className="font-semibold">{summary.productName}</p>
                  <p className="text-muted-foreground">{summary.storage} · {summary.color || "—"}</p>
                  <div className="flex justify-between pt-2"><span className="text-muted-foreground">Total price</span><span className="font-semibold">{formatPKR(summary.total)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Instalment duration</span><span className="font-semibold">{summary.tenure} months</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Advance payment due now</span><span className="font-extrabold text-primary">{formatPKR(summary.advance)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Monthly instalment</span><span className="font-semibold">{formatPKR(summary.monthly)}</span></div>
                </div>
              ) : (
                <div className="mt-3 space-y-1.5 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Advance payment due now</span><span className="font-extrabold text-primary">{formatPKR(advance)}</span></div>
                  {fallback?.status && <div className="flex justify-between"><span className="text-muted-foreground">Status</span><span className="font-semibold">{fallback.status}</span></div>}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Bank details */}
          <Card>
            <CardContent className="p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Payment instructions</p>
              {bankDetails?.bankName ? (
                <div className="mt-3 space-y-1.5 text-sm">
                  <p className="font-semibold">{bankDetails.bankName}</p>
                  {bankDetails.accountTitle && <p className="text-muted-foreground">Account Title: <span className="text-foreground">{bankDetails.accountTitle}</span></p>}
                  {bankDetails.accountNumber && <p className="text-muted-foreground">Account Number: <span className="text-foreground">{bankDetails.accountNumber}</span></p>}
                  {bankDetails.iban && <p className="text-muted-foreground">IBAN: <span className="text-foreground">{bankDetails.iban}</span></p>}
                  {bankDetails.instructions && <p className="mt-2 rounded-xl bg-muted/50 p-3 text-xs">{bankDetails.instructions}</p>}
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> Use your application reference {referenceFromId(applicationId)} in the payment description.
                  </p>
                  {/* Merchant QR configured by the admin (or generated from the
                      bank payload). Only the advance due is requested. */}
                  <PaymentQr
                    amount={advance}
                    orderNumber={referenceFromId(applicationId)}
                    bank={bankDetails}
                    payload={merchantQrPayload}
                    imageUrl={merchantQrImageUrl}
                    className="mt-4"
                  />
                </div>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">
                  Bank transfer details will appear here once the administrator has configured a payment method. Please contact support for instructions.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Receipt upload */}
        <div className="md:col-span-2">
          <Card>
            <CardContent className="space-y-4 p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Upload payment receipt</p>
              <div className="flex items-center gap-2 rounded-xl border bg-muted/40 p-3 text-sm">
                <UploadCloud className="h-5 w-5 text-muted-foreground" />
                <span>Advance amount due: <span className="font-extrabold">{formatPKR(advance)}</span></span>
              </div>
              <form onSubmit={handleSubmitReceipt} className="space-y-4">
                <FileUploadField
                  id="receipt"
                  label="Payment receipt"
                  accept=".jpg,.jpeg,.png,.pdf"
                  required
                  value={receipt}
                  onChange={(f) => { setReceipt(f); setReceiptPath(null); }}
                  helperText="JPG, PNG or PDF, max 5 MB. Paste the transfer confirmation / screenshot."
                />
                {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-500/10 dark:text-red-300">{error}</p>}
                <Button type="submit" size="lg" className="w-full" disabled={submitting}>
                  {submitting ? "Submitting…" : "Submit Payment Receipt"}
                </Button>
              </form>
              <Separator />
              <p className="text-xs text-muted-foreground">
                Your payment will be verified by our team before your order is confirmed. Submitting the same receipt more than once is not allowed.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
