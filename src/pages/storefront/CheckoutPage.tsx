import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CheckCircle2, Loader2, MailCheck, RefreshCw } from "lucide-react";
import { useCart } from "@/store/cart";
import { useOrders } from "@/features/orders/store";
import { useSettings } from "@/features/settings/store";
import { useAuth } from "@/features/auth/AuthContext";
import { discountedPrice } from "@/lib/pricing";
import { formatPKR } from "@/lib/utils";
import type { CartItem } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { BankTransferDetails } from "@/components/bank-transfer-details";
import { PaymentQr } from "@/components/payment-qr";
import { FileUploadField } from "@/components/file-upload-field";
import { uploadReceipt, attachReceiptToOrder } from "@/lib/receipts";
import { isSupabaseConfigured } from "@/lib/supabase";

type CheckoutStep = "details" | "otp" | "payment" | "receipt";

const EMAIL_OTP_NOTE =
  "We'll create your RAES TECH account automatically from the email above and send a 6-digit verification code to confirm it.";

export function CheckoutPage() {
  const { items, subtotal, clear } = useCart();
  const { settings, ready, loadError, refreshSettings } = useSettings();
  const { user, isAuthenticated, loading: authLoading, requestOtp, confirmOtp } = useAuth();
  const navigate = useNavigate();
  const placeOrderToStore = useOrders((s) => s.placeOrder);

  // Refs mirror the latest auth state so async handlers can observe updates that
  // are dispatched after the current render (e.g. Supabase session propagation).
  const userRef = useRef(user);
  userRef.current = user;
  const authLoadingRef = useRef(authLoading);
  authLoadingRef.current = authLoading;

  const [form, setForm] = useState({
    fullName: user?.fullName ?? "",
    email: user?.email ?? "",
    phone: "",
    city: "",
    province: "",
    address: "",
    notes: "",
  });
  const [step, setStep] = useState<CheckoutStep>("details");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpSubmitting, setOtpSubmitting] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [receipt, setReceipt] = useState<File | null>(null);
  const [orderNumber, setOrderNumber] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [placed, setPlaced] = useState(false);
  const [selectedMethodId, setSelectedMethodId] = useState("");
  // Phase of the manual-transfer submission: idle (file selected) -> uploading.
  const [uploadStage, setUploadStage] = useState<"idle" | "uploading">("idle");
  // Guard against duplicate order submissions (double-click / rapid re-trigger).
  const placingRef = useRef(false);
  // Path of the receipt already uploaded to storage. Kept so a retry after a
  // payment-record failure reuses the same file without asking the customer to
  // transfer again or re-upload.
  const [receiptPath, setReceiptPath] = useState<string | null>(null);
  // True only after the backend confirms the receipt is stored and linked to a
  // payment row. The "Receipt received — awaiting payment review" success
  // message is shown ONLY when this is true.
  const [receiptAttached, setReceiptAttached] = useState(false);
  const [receiptLinking, setReceiptLinking] = useState(false);
  const [placedOrderId, setPlacedOrderId] = useState<string | null>(null);

  // ---- 11.11 Sale pricing: one shared rule for the Buy Now (prepaid) flow.
  // Instalments (11% off) are handled on the instalment pages. COD is disabled.
  const effectiveDiscountPercent = settings.buyNowDiscountPercent;
  const subtotalAmount = items.reduce((s, i) => s + discountedPrice(i.variant.listedPrice, effectiveDiscountPercent) * i.quantity, 0);
  const listedAmount = items.reduce((s, i) => s + i.variant.listedPrice * i.quantity, 0);
  const discountAmount = Math.max(0, listedAmount - subtotalAmount);
  const shipping = subtotalAmount >= settings.freeShippingThreshold || subtotalAmount === 0 ? 0 : settings.shippingCharge;
  const total = subtotalAmount + shipping;

  // All payment methods enabled by the admin (bank, mobile wallet, crypto, card).
  const enabledMethods = settings.paymentMethods?.filter((m) => m.enabled) ?? [];
  const selectedMethod = enabledMethods.find((m) => m.id === selectedMethodId) ?? enabledMethods[0] ?? null;
  const bankDetails = selectedMethod
    ? {
        bankName: selectedMethod.bankName ?? "",
        accountTitle: selectedMethod.accountTitle ?? "",
        accountNumber: selectedMethod.accountNumber ?? "",
        iban: selectedMethod.iban ?? "",
        instructions: selectedMethod.instructions ?? "",
      }
    : undefined;

  // Payment-option states used to render loading / load-failure / no-enabled
  // / ready UI. Progress is preserved across a Retry by keeping the step state.
  const payLoading = !ready;
  const payLoadFailed = !!loadError;
  const canPay = enabledMethods.length > 0;
  const isManualSelected = !!selectedMethod && selectedMethod.type === "manual";

  function setField(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  // When the customer reaches the OTP step, automatically (re)send the code and
  // auto-register their account so checkout is one seamless process.
  const sendOtp = async () => {
    setOtpError("");
    setOtpSubmitting(true);
    try {
      const result = await requestOtp(form.email, form.fullName);
      if (result.error) {
        setOtpError(result.error);
        return;
      }
      setOtpSent(true);
    } finally {
      setOtpSubmitting(false);
    }
  };

  async function submitDetails(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!isAuthenticated) {
      setStep("otp");
      // send the OTP on entry to this step
      await sendOtp();
    } else {
      setStep("payment");
    }
  }

  async function submitOtp(e: React.FormEvent) {
    e.preventDefault();
    setOtpError("");
    setOtpSubmitting(true);
    try {
      const result = await confirmOtp(form.email, otp.trim());
      if (result.error) {
        setOtpError(result.error);
        return;
      }
      // Supabase verifies the OTP and then propagates the session asynchronously
      // via onAuthStateChange. Wait (up to a few seconds) for `user` to be set
      // so the payment step never runs before the session exists.
      if (isSupabaseConfigured) {
        const deadline = Date.now() + 5000;
        while (Date.now() < deadline && (authLoadingRef.current || !userRef.current)) {
          await new Promise((r) => setTimeout(r, 50));
        }
      }
      setStep("payment");
    } finally {
      setOtpSubmitting(false);
    }
  }

  async function placeOrder(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    // Block submission unless an enabled payment method is available (and, for
    // manual transfer, the receipt upload is present). Never submit blind.
    if (!canPay) {
      setError("Payments are temporarily unavailable. Please contact us to complete your order.");
      return;
    }
    if (isManualSelected && !receipt) {
      setError("Please upload your payment receipt before generating the order.");
      return;
    }
    if (placingRef.current) return;
    placingRef.current = true;
    setSubmitting(true);
    setUploadStage("uploading");
    try {
      const userId = user?.id ?? null;

      // Guard against a race where the user reaches this step before the auth
      // session (propagated asynchronously by Supabase) has landed. Without this,
      // an order could be created with no linked account.
      if (!userId) {
        setError("Your session is still being verified. Please wait a moment and place the order again.");
        return;
      }

      // 1. Upload/verify the payment receipt FIRST. The order is only created
      //    after this upload succeeds, so a failed upload never leaves an
      //    order without payment evidence.
      // Reuse a previously uploaded receipt path on retry so the customer is
      // never asked to transfer again or re-upload after a payment-record
      // failure. Only upload when we have no reusable path yet.
      let effectiveReceiptPath = receiptPath;
      if (!effectiveReceiptPath && receipt && isSupabaseConfigured) {
        const uploaded = await uploadReceipt(receipt);
        if (!uploaded.ok) {
          setUploadStage("idle");
          setError(uploaded.error);
          return;
        }
        effectiveReceiptPath = uploaded.path;
        setReceiptPath(effectiveReceiptPath);
      }

      // 2. Generate the order (only reached if the upload succeeded).
      const result = await placeOrderToStore(
        {
          fullName: form.fullName,
          email: form.email,
          phone: form.phone,
          city: form.city,
          province: form.province,
          address: form.address,
          notes: form.notes,
          items,
          subtotal: subtotalAmount,
          shipping,
          discountPercent: effectiveDiscountPercent,
          paymentMethod: selectedMethod?.code ?? "manual_bank_transfer",
        },
        userId
      );
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setOrderNumber(result.order.orderNumber);
      setPlacedOrderId(result.order.id);

      // 3. Attach the uploaded receipt to the created order (pending verification).
      let receiptError = "";
      if (effectiveReceiptPath && receipt && isSupabaseConfigured) {
        const rc = await attachReceiptToOrder(result.order.id, total, effectiveReceiptPath, receipt);
        if (rc.ok) {
          setReceiptAttached(true);
        } else {
          receiptError = rc.error;
        }
      }

      setPlaced(true);
      clear();
      if (receiptError) setError(receiptError);
    } finally {
      setSubmitting(false);
      placingRef.current = false;
    }
  }

  // Retry linking an already-uploaded receipt to a saved order (recovery path
  // shown when the order saved but the payment-record/receipt link failed).
  async function retryLinkReceipt() {
    if (!placedOrderId || !receiptPath || !receipt) return;
    setReceiptLinking(true);
    setError("");
    const rc = await attachReceiptToOrder(placedOrderId, total, receiptPath, receipt);
    setReceiptLinking(false);
    if (rc.ok) setReceiptAttached(true);
    else setError(rc.error);
  }

  if (placed) {
    return (
      <div className="mx-auto max-w-xl py-10 text-center">
        <CheckCircle2 className="mx-auto mb-4 h-14 w-14 text-emerald-600" />
        <h1 className="text-2xl font-bold">Order placed</h1>
        {receiptAttached ? (
          <p className="mt-2 text-muted-foreground">
            Order <span className="font-semibold text-foreground">{orderNumber}</span>: Receipt received — awaiting payment review.
          </p>
        ) : (
          <>
            <p className="mt-2 text-muted-foreground">
              Order <span className="font-semibold text-foreground">{orderNumber}</span> saved. Your receipt is still needed.
            </p>
            <Button
              className="mt-4"
              disabled={receiptLinking || !receiptPath}
              onClick={() => void retryLinkReceipt()}
            >
              {receiptLinking ? "Linking…" : "Upload receipt for this order"}
            </Button>
          </>
        )}
        {!receiptAttached && error && (
          <div className="mt-4 rounded-xl border border-amber-500/40 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {error}
          </div>
        )}
        <div className="mt-6 rounded-2xl border bg-card p-5 text-left text-sm">
          <p className="font-semibold">What happens next?</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
            <li>Our team verifies your bank transfer.</li>
            <li>Your order moves to processing, then dispatch.</li>
            <li>Track it anytime under My Orders.</li>
          </ul>
          <div className="mt-5 grid gap-2">
            <Button asChild>
              <Link to="/account/orders">Go to My Orders</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/">Continue shopping</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold sm:text-3xl">Checkout</h1>
        <div className="rounded-2xl border border-dashed p-16 text-center">
          <p className="text-muted-foreground">Your cart is empty.</p>
          <Button asChild className="mt-4"><Link to="/phones">Browse Phones</Link></Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold sm:text-3xl">Checkout</h1>
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          {(["details", "otp", "payment", "receipt"] as CheckoutStep[]).map((s, i) => (
            <span key={s} className="flex items-center gap-1.5">
              <span
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full border",
                  step === s && "border-primary bg-primary text-primary-foreground",
                  stepIndex(step) > i && "border-emerald-500 bg-emerald-500 text-white"
                )}
              >
                {stepIndex(step) > i ? "✓" : i + 1}
              </span>
            </span>
          ))}
        </div>
      </div>

      {step === "details" && (
        <form onSubmit={submitDetails} className="grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            <Card className="p-5">
              <h2 className="mb-4 text-lg font-bold">Contact &amp; delivery</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Full name</Label>
                  <Input required value={form.fullName} onChange={(e) => setField("fullName", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input required type="email" value={form.email} onChange={(e) => setField("email", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Phone</Label>
                  <Input required value={form.phone} onChange={(e) => setField("phone", e.target.value)} placeholder="03XX-XXXXXXX" />
                </div>
                <div className="space-y-1.5">
                  <Label>City</Label>
                  <Input required value={form.city} onChange={(e) => setField("city", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Province</Label>
                  <Input value={form.province} onChange={(e) => setField("province", e.target.value)} />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Street address</Label>
                  <Input required value={form.address} onChange={(e) => setField("address", e.target.value)} />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Order notes (optional)</Label>
                  <Textarea value={form.notes} onChange={(e) => setField("notes", e.target.value)} />
                </div>
              </div>
              <div className="mt-5 rounded-xl border bg-muted/40 p-4 text-sm">
                <p className="flex items-center gap-2 font-medium">
                  <MailCheck className="h-4 w-4 text-primary" /> Account will be created automatically
                </p>
                <p className="mt-1 text-muted-foreground">{EMAIL_OTP_NOTE}</p>
              </div>
            </Card>
          </div>

          <SummaryCard
            items={items}
            subtotal={subtotalAmount}
            listedTotal={listedAmount}
            discount={discountAmount}
            discountPercent={effectiveDiscountPercent}
            methodLabel="Buy Now (22% off)"
            shipping={shipping}
            total={total}
            cta="Continue to payment"
            submitting={false}
          />
        </form>
      )}

      {step === "otp" && (
        <div className="mx-auto max-w-lg space-y-6">
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <MailCheck className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold">Verify your email</h2>
                <p className="text-sm text-muted-foreground">Account created for {form.email}</p>
              </div>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">{EMAIL_OTP_NOTE}</p>

            {!isSupabaseConfigured && (
              <div className="mt-2 rounded-lg border border-amber-500/40 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                Dev (offline) mode: this build has no mail server — use verification code{" "}
                <span className="font-mono font-bold">123456</span>.
              </div>
            )}

            <form onSubmit={submitOtp} className="mt-5 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="otp">6-digit code</Label>
                <Input
                  id="otp"
                  required
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  placeholder="Enter the code from your email"
                />
              </div>

              {otpError && (
                <p className="text-sm text-red-600 dark:text-red-300">{otpError}</p>
              )}

              <div className="flex items-center justify-between gap-3">
                <Button type="button" variant="ghost" onClick={sendOtp} disabled={otpSubmitting}>
                  {otpSubmitting ? "Sending…" : otpSent ? "Resend code" : "Send code"}
                </Button>
                <Button type="submit" disabled={otpSubmitting || otp.length < 4}>
                  {otpSubmitting ? "Verifying…" : "Verify & continue"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {step === "payment" && (
        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            {payLoading ? (
              <div className="flex items-center gap-2 rounded-xl border p-4 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading payment options…
              </div>
            ) : payLoadFailed ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
                <p>We couldn’t load payment options. Try again.</p>
                <Button type="button" variant="outline" size="sm" className="mt-3" onClick={refreshSettings}>
                  <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Retry
                </Button>
              </div>
            ) : !canPay ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                Payments are temporarily unavailable. Please contact us to complete your order.
              </div>
            ) : (
              <>
                {/* Payment method selector */}
                <div className="grid gap-2 sm:grid-cols-2">
                  {enabledMethods.map((m) => {
                    const active = selectedMethod?.id === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setSelectedMethodId(m.id)}
                        className={`rounded-xl border p-3 text-left transition-colors ${
                          active ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:bg-muted/50"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-semibold">{m.name}</span>
                          <span className={`h-3.5 w-3.5 rounded-full border ${active ? "border-primary bg-primary" : "border-muted-foreground/40"}`} />
                        </div>
                        {m.customerDescription && <p className="mt-1 text-xs text-muted-foreground">{m.customerDescription}</p>}
                      </button>
                    );
                  })}
                </div>

                {selectedMethod && (
                  <>
                    {selectedMethod.kind === "crypto" ? (
                      <Card className="p-5">
                        <h2 className="mb-3 text-lg font-bold">Crypto payment</h2>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2">
                            <span className="text-muted-foreground">Asset</span>
                            <span className="font-semibold">{selectedMethod.coinSymbol ?? "USDT"} · {selectedMethod.network ?? "TRC-20"}</span>
                          </div>
                          <div className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2">
                            <span className="text-muted-foreground">Amount due</span>
                            <span className="font-semibold">{formatPKR(total)}</span>
                          </div>
                          <div className="rounded-lg border px-3 py-2">
                            <p className="text-muted-foreground">Wallet address</p>
                            <p className="break-all font-mono text-xs">{selectedMethod.walletAddress}</p>
                          </div>
                          {selectedMethod.instructions && <p className="pt-1 text-xs text-muted-foreground">{selectedMethod.instructions}</p>}
                        </div>
                        <PaymentQr amount={total} className="mt-4" imageUrl={selectedMethod.qrImageUrl} payload={selectedMethod.qrPayload} />
                      </Card>
                    ) : selectedMethod.kind === "card" ? (
                      <Card className="p-5">
                        <h2 className="mb-3 text-lg font-bold">Card payment</h2>
                        <p className="text-sm text-muted-foreground">
                          Pay securely by card{selectedMethod.cardProcessor ? ` via ${selectedMethod.cardProcessor}` : ""}. Amount due:{" "}
                          <span className="font-bold text-foreground">{formatPKR(total)}</span>.
                        </p>
                        {selectedMethod.instructions && <p className="mt-3 text-sm text-muted-foreground">{selectedMethod.instructions}</p>}
                        <PaymentQr amount={total} className="mt-4" imageUrl={selectedMethod.qrImageUrl} payload={selectedMethod.qrPayload} />
                      </Card>
                    ) : (
                      <>
                        <BankTransferDetails amountText={formatPKR(total)} bank={bankDetails} />
                        <Card className="p-5">
                          <h2 className="mb-3 text-lg font-bold">Pay the exact amount</h2>
                          <p className="text-sm text-muted-foreground">
                            Please transfer <span className="font-bold text-foreground">{formatPKR(total)}</span> to the account above (or scan the QR code
                            to confirm the details). The order will only be confirmed after we receive your payment screenshot.
                          </p>
                          <PaymentQr amount={total} className="mt-4" bank={bankDetails} payload={selectedMethod?.qrPayload} imageUrl={selectedMethod?.qrImageUrl} />
                        </Card>
                      </>
                    )}
                  </>
                )}
              </>
            )}

            {canPay && isManualSelected ? (
              <>
                <Card className="p-5">
                  <h2 className="mb-3 text-lg font-bold">Upload payment receipt</h2>
                  <p className="mb-3 text-sm text-muted-foreground">
                    After transferring, upload your payment screenshot/confirmation below. Our team verifies it before the order is generated.
                  </p>
                  <FileUploadField
                    id="receipt"
                    label="Payment screenshot / receipt"
                    accept=".jpg,.jpeg,.png,.pdf"
                    maxSize={5 * 1024 * 1024}
                    value={receipt}
                    onChange={(f) => { setReceipt(f); setReceiptPath(null); setReceiptAttached(false); }}
                    helperText="JPG, PNG or PDF, up to 5 MB."
                  />
                </Card>

                <div className="space-y-2">
                  {receipt && uploadStage === "idle" && !submitting && (
                    <p className="text-xs text-muted-foreground">File selected — ready to submit for review.</p>
                  )}
                  {submitting && (
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Uploading… please wait.
                    </p>
                  )}
                  <Button size="lg" className="w-full" onClick={placeOrder} disabled={submitting || !receipt}>
                    {submitting ? "Uploading…" : "Submit payment for review"}
                  </Button>
                </div>
              </>
            ) : null}

            {error && (
              <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">{error}</div>
            )}
          </div>

          <SummaryCard
            items={items}
            subtotal={subtotalAmount}
            listedTotal={listedAmount}
            discount={discountAmount}
            discountPercent={effectiveDiscountPercent}
            methodLabel="Buy Now (22% off)"
            shipping={shipping}
            total={total}
            cta=""
            submitting={false}
          />
        </div>
      )}
    </div>
  );
}

function stepIndex(step: CheckoutStep): number {
  return ["details", "otp", "payment", "receipt"].indexOf(step);
}

function cn(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function SummaryCard({
  items,
  subtotal,
  listedTotal,
  discount,
  discountPercent,
  methodLabel = "Buy Now (22% off)",
  shipping,
  total,
  cta,
  submitting,
}: {
  items: CartItem[];
  subtotal: number;
  listedTotal: number;
  discount: number;
  discountPercent: number;
  methodLabel?: string;
  shipping: number;
  total: number;
  cta: string;
  submitting: boolean;
}) {
  return (
    <div>
      <Card className="p-5 lg:sticky lg:top-24">
        <h2 className="mb-3 text-lg font-bold">Summary</h2>
        <div className="space-y-3">
          {items.map((i) => (
            <div key={`${i.variant.sku}__${(i.color || "").toLowerCase()}`} className="flex justify-between gap-2 text-sm">
              <span className="min-w-0">
                <span className="line-clamp-1 text-muted-foreground">{i.product.name}</span>
                {i.color ? (
                  <span className="block text-xs text-muted-foreground/80">Colour: {i.color} · × {i.quantity}</span>
                ) : (
                  <span className="block text-xs text-muted-foreground/80">× {i.quantity}</span>
                )}
              </span>
              <span className="shrink-0 font-medium">{formatPKR(discountedPrice(i.variant.listedPrice, discountPercent) * i.quantity)}</span>
            </div>
          ))}
        </div>

        <Separator className="my-4" />

        <div className="space-y-1.5 text-sm">
          {discount > 0 && (
            <div className="flex justify-between"><span className="text-muted-foreground">Listed price</span><span className="line-through">{formatPKR(listedTotal)}</span></div>
          )}
          <div className="flex justify-between"><span className="text-muted-foreground">Subtotal ({methodLabel})</span><span>{formatPKR(subtotal)}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Discount</span><span className="font-medium text-emerald-700">−{formatPKR(discount)}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span>{shipping === 0 ? "Free" : formatPKR(shipping)}</span></div>
          <div className="flex justify-between text-base font-bold"><span>Total payable</span><span>{formatPKR(total)}</span></div>
        </div>

        {cta && (
          <Button type="submit" size="lg" className="mt-5 w-full" disabled={submitting}>
            {submitting ? "Working…" : cta}
          </Button>
        )}
      </Card>
    </div>
  );
}
