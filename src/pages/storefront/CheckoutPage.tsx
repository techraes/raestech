import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CheckCircle2, MailCheck } from "lucide-react";
import { useCart } from "@/store/cart";
import { useOrders } from "@/features/orders/store";
import { useSettings } from "@/features/settings/store";
import { useAuth } from "@/features/auth/AuthContext";
import { buyNowPrice } from "@/lib/pricing";
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
  const { settings } = useSettings();
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

  const buyNowSubtotal = subtotal("buyNow");
  const shipping = buyNowSubtotal >= settings.freeShippingThreshold || buyNowSubtotal === 0 ? 0 : settings.shippingCharge;
  const total = buyNowSubtotal + shipping;

  // Resolve the active manual payment method (bank/JazzCash/Easypaisa) so the
  // payment card and QR reflect the admin-configured details.
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
    setSubmitting(true);
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
      let receiptPath: string | null = null;
      if (receipt && isSupabaseConfigured) {
        const uploaded = await uploadReceipt(receipt);
        if (!uploaded.ok) {
          setError(uploaded.error);
          return;
        }
        receiptPath = uploaded.path;
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
          subtotal: buyNowSubtotal,
          shipping,
          discountPercent: settings.buyNowDiscountPercent,
        },
        userId
      );
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setOrderNumber(result.order.orderNumber);

      // 3. Attach the uploaded receipt to the created order (pending verification).
      let receiptError = "";
      if (receiptPath && receipt && isSupabaseConfigured) {
        const rc = await attachReceiptToOrder(result.order.id, total, receiptPath, receipt);
        if (!rc.ok) receiptError = rc.error;
      }

      setPlaced(true);
      clear();
      if (receiptError) setError(receiptError);
    } finally {
      setSubmitting(false);
    }
  }

  if (placed) {
    return (
      <div className="mx-auto max-w-xl py-10 text-center">
        <CheckCircle2 className="mx-auto mb-4 h-14 w-14 text-emerald-600" />
        <h1 className="text-2xl font-bold">Order placed</h1>
        <p className="mt-2 text-muted-foreground">
          Your order <span className="font-semibold text-foreground">{orderNumber}</span> has been received
          {isAuthenticated ? " and your payment receipt has been submitted for verification." : "."}
        </p>
        {error && (
          <div className="mt-4 rounded-xl border border-amber-500/40 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {error} You can also upload your receipt later from your order page.
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
            buyNowSubtotal={buyNowSubtotal}
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
                <p className="text-sm text-red-600">{otpError}</p>
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
            <BankTransferDetails amountText={formatPKR(total)} bank={bankDetails} />

            <Card className="p-5">
              <h2 className="mb-3 text-lg font-bold">Pay the exact amount</h2>
              <p className="text-sm text-muted-foreground">
                Please transfer <span className="font-bold text-foreground">{formatPKR(total)}</span> to the account above (or scan the QR code
                to confirm the details). The order will only be confirmed after we receive your payment screenshot.
              </p>
              <PaymentQr amount={total} className="mt-4" bank={bankDetails} payload={manualMethod?.qrPayload} />
            </Card>

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
                onChange={(f) => setReceipt(f)}
                helperText="JPG, PNG or PDF, up to 5 MB."
              />
            </Card>

            {error && (
              <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>
            )}

            <Button size="lg" className="w-full" onClick={placeOrder} disabled={submitting || !receipt}>
              {submitting ? "Placing order…" : "Generate order after uploading receipt"}
            </Button>
          </div>

          <SummaryCard
            items={items}
            buyNowSubtotal={buyNowSubtotal}
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
  buyNowSubtotal,
  shipping,
  total,
  cta,
  submitting,
}: {
  items: CartItem[];
  buyNowSubtotal: number;
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
              <span className="shrink-0 font-medium">{formatPKR(i.variant.buyNowPrice * i.quantity)}</span>
            </div>
          ))}
        </div>

        <Separator className="my-4" />

        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Subtotal (Buy Now)</span><span>{formatPKR(buyNowSubtotal)}</span></div>
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
