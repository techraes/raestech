import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CheckCircle2, Landmark, ShieldCheck } from "lucide-react";
import { useCart } from "@/store/cart";
import { useOrders } from "@/features/orders/store";
import { useSettings } from "@/features/settings/store";
import { useAuth } from "@/features/auth/AuthContext";
import { buyNowPrice } from "@/lib/pricing";
import { formatPKR } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export function CheckoutPage() {
  const { items, subtotal, clear } = useCart();
  const { settings } = useSettings();
  const { user } = useAuth();
  const navigate = useNavigate();
  const placeOrderToStore = useOrders((s) => s.placeOrder);

  const [form, setForm] = useState({
    fullName: user?.fullName ?? "",
    email: user?.email ?? "",
    phone: "",
    city: "",
    province: "",
    address: "",
    notes: "",
  });
  const [placed, setPlaced] = useState(false);
  const [orderNo, setOrderNo] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const buyNowSubtotal = subtotal("buyNow");
  const shipping = buyNowSubtotal >= settings.freeShippingThreshold || buyNowSubtotal === 0 ? 0 : settings.shippingCharge;
  const total = buyNowSubtotal + shipping;

  function setField(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function placeOrder(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
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
        user?.id
      );
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setOrderNo(result.order.orderNumber);
      setPlaced(true);
      clear();
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
          Your order <span className="font-semibold text-foreground">{orderNo}</span> has been received.
        </p>
        <div className="mt-6 rounded-2xl border bg-card p-5 text-left text-sm">
          <p className="font-semibold">Next step — pay by bank transfer</p>
          <p className="mt-2 text-muted-foreground">
            Please transfer <span className="font-bold text-foreground">{formatPKR(total)}</span> to the Faysal Bank account shown on your
            payment instructions, then upload your receipt from your account. Your payment will be verified manually before dispatch.
          </p>
          <Button asChild variant="outline" className="mt-4 w-full">
            <Link to={`/payment-instructions?order=${encodeURIComponent(orderNo)}&amount=${total}`}>View Payment Instructions</Link>
          </Button>
          <Button asChild className="mt-2 w-full">
            <Link to="/account/orders">Go to My Orders</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold sm:text-3xl">Checkout</h1>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-16 text-center">
          <p className="text-muted-foreground">Your cart is empty.</p>
          <Button asChild className="mt-4"><Link to="/phones">Browse Phones</Link></Button>
        </div>
      ) : (
        <form onSubmit={placeOrder} className="grid gap-8 lg:grid-cols-[1fr_360px]">
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
            </Card>

            <Card className="p-5">
              <h2 className="mb-4 text-lg font-bold">Payment method</h2>
              <div className="rounded-xl border bg-muted/40 p-4">
                <div className="flex items-center gap-3">
                  <Landmark className="h-6 w-6" />
                  <div>
                    <p className="font-semibold">Manual Faysal Bank Transfer</p>
                    <p className="text-xs text-muted-foreground">
                      You will receive bank details after placing your order. Cash on Delivery is not available.
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex items-start gap-2 text-xs text-muted-foreground">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <span>Your payment is verified manually by our staff before dispatch. A receipt upload is required.</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Summary */}
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
                    <span className="font-medium whitespace-nowrap">{formatPKR(buyNowPrice(i.variant.listedPrice, settings.buyNowDiscountPercent) * i.quantity)}</span>
                  </div>
                ))}
              </div>
              <Separator className="my-4" />
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal (Buy Now)</span><span className="font-medium">{formatPKR(buyNowSubtotal)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span>{shipping === 0 ? "Free" : formatPKR(shipping)}</span></div>
                <div className="flex justify-between text-base font-bold"><span>Total payable</span><span>{formatPKR(total)}</span></div>
              </div>
              {error && (
                <div className="mt-4 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {error}
                </div>
              )}
              <Button type="submit" size="lg" className="mt-5 w-full" disabled={submitting}>
                {submitting ? "Placing order…" : "Place Order"}
              </Button>
              <p className="mt-3 text-center text-xs text-muted-foreground">
                By placing this order you agree to our Terms &amp; Conditions.
              </p>
            </Card>
          </div>
        </form>
      )}
    </div>
  );
}
