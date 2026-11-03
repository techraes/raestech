import { useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingBag } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BankTransferDetails } from "@/components/bank-transfer-details";
import { FileUploadField } from "@/components/file-upload-field";
import { useOrders } from "@/features/orders/store";
import { submitReceipt } from "@/lib/receipts";
import { formatPKR } from "@/lib/utils";

function OrderReceiptUpload({ orderId, amount, onDone }: { orderId: string; amount: number; onDone: () => void }) {
  const [receipt, setReceipt] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!receipt) {
      setError("Please attach your receipt first.");
      return;
    }
    setSubmitting(true);
    const result = await submitReceipt(orderId, amount, receipt);
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setDone(true);
    onDone();
  }

  if (done) {
    return <p className="text-sm text-emerald-700">✓ Receipt submitted — payment pending verification.</p>;
  }

  return (
    <form onSubmit={submit} className="mt-4 space-y-3 rounded-xl border border-dashed p-4">
      <p className="text-sm font-medium">Upload your bank transfer receipt</p>
      <FileUploadField
        id={`receipt-${orderId}`}
        label="Payment receipt"
        accept=".jpg,.jpeg,.png,.pdf"
        required
        value={receipt}
        onChange={setReceipt}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" size="sm" variant="outline" disabled={submitting || !receipt}>
        {submitting ? "Uploading…" : "Submit receipt"}
      </Button>
    </form>
  );
}

export function AccountOrders() {
  const orders = useOrders((s) => s.orders);
  const [refresh, setRefresh] = useState(0);

  if (!orders.length) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">My Orders</h1>
        <Card>
          <CardContent className="flex flex-col items-center py-16 text-center">
            <ShoppingBag className="mb-3 h-10 w-10 text-muted-foreground" />
            <p className="font-medium">No orders yet</p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              When you place an order, it will appear here with its payment and tracking status.
            </p>
            <Button asChild className="mt-5">
              <Link to="/phones">Browse phones</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">My Orders</h1>
      <div className="space-y-3">
        {orders.map((o) => (
          <Card key={o.id}>
            <CardContent className="p-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="font-semibold">{o.orderNumber}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(o.createdAt).toLocaleDateString()} · {o.items.reduce((sum, i) => sum + i.quantity, 0)} item(s)
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{o.status}</Badge>
                  <p className="font-bold">{formatPKR(o.total)}</p>
                </div>
              </div>

              <div className="mt-4 space-y-1.5 border-t pt-3 text-sm">
                {o.items.map((i, idx) => (
                  <div key={i.sku + idx} className="flex items-center justify-between gap-2">
                    <span className="min-w-0">
                      <span className="line-clamp-1 text-muted-foreground">{i.name} × {i.quantity}</span>
                      {i.color && <span className="block text-xs text-muted-foreground/70">Colour: {i.color}</span>}
                    </span>
                    <span className="font-medium">{formatPKR(i.unitPrice * i.quantity)}</span>
                  </div>
                ))}
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t pt-3 text-sm">
                <span className="text-muted-foreground">Payment: {o.paymentStatus}</span>
                <Button asChild variant="outline" size="sm">
                  <Link to={`/payment-instructions?order=${encodeURIComponent(o.orderNumber)}&amount=${o.total}`}>Payment instructions</Link>
                </Button>
              </div>

              {o.paymentStatus === "unpaid" && (
                <>
                  <div className="mt-4">
                    <BankTransferDetails orderNumber={`Order: ${o.orderNumber}`} amountText={formatPKR(o.total)} />
                  </div>
                  <OrderReceiptUpload
                    orderId={o.id}
                    amount={o.total}
                    onDone={() => setRefresh((r) => r + 1)}
                  />
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
