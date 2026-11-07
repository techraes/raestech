import { useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingBag } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BankTransferDetails } from "@/components/bank-transfer-details";
import { PaymentProofUpload } from "@/components/payment-proof-upload";
import { useOrders } from "@/features/orders/store";
import { formatPKR } from "@/lib/utils";

export function AccountOrders() {
  const orders = useOrders((s) => s.orders);

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
                  <PaymentProofUpload
                    kind="buy_now"
                    orderId={o.id}
                    amountDue={o.total}
                    context={`Order: ${o.orderNumber}`}
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
