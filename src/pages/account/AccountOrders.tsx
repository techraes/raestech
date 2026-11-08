import { useCallback, useEffect, useState } from "react";
import { ShoppingBag, RefreshCw, CheckCircle2, Clock, XCircle, Wallet } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/features/auth/AuthContext";
import { formatPKR } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface OrderItemRow {
  product_name: string;
  variant_name?: string | null;
  color?: string | null;
  quantity: number;
  unit_price: number;
}

interface OrderRow {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  total: number;
  placed_at: string;
  payment_method?: string | null;
  items: OrderItemRow[];
}

const STATUS_LABEL: Record<string, { label: string; tone: "success" | "secondary" | "destructive" | "warning" | "muted" }> = {
  pending: { label: "Pending", tone: "warning" },
  payment_pending: { label: "Awaiting Payment", tone: "warning" },
  payment_verification: { label: "Payment Under Review", tone: "secondary" },
  pending_verification: { label: "Payment Under Review", tone: "secondary" },
  verified: { label: "Verified", tone: "success" },
  approved: { label: "Approved", tone: "success" },
  processing: { label: "Processing", tone: "secondary" },
  shipped: { label: "Shipped", tone: "secondary" },
  delivered: { label: "Delivered", tone: "success" },
  cancelled: { label: "Cancelled", tone: "destructive" },
  rejected: { label: "Rejected", tone: "destructive" },
};

export function AccountOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!supabase || !user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const { data: o, error: oErr } = await supabase
        .from("orders")
        .select("id,order_number,status,payment_status,total,placed_at,payment_method")
        .eq("user_id", user.id)
        .order("placed_at", { ascending: false })
        .limit(100);
      if (oErr) throw oErr;
      const rows = (o ?? []) as any[];
      const ids = rows.map((r) => r.id);
      let itemMap = new Map<string, OrderItemRow[]>();
      if (ids.length) {
        const { data: items, error: iErr } = await supabase
          .from("order_items")
          .select("order_id,product_name,variant_name,color,quantity,unit_price")
          .in("order_id", ids as string[]);
        if (iErr) throw iErr;
        for (const it of (items ?? []) as any[]) {
          const arr = itemMap.get(it.order_id) ?? [];
          arr.push({
            product_name: it.product_name,
            variant_name: it.variant_name,
            color: it.color,
            quantity: it.quantity,
            unit_price: it.unit_price,
          });
          itemMap.set(it.order_id, arr);
        }
      }
      const mapped: OrderRow[] = rows.map((r) => ({
        id: r.id,
        order_number: r.order_number,
        status: r.status,
        payment_status: r.payment_status,
        total: Number(r.total ?? 0),
        placed_at: r.placed_at,
        payment_method: r.payment_method,
        items: itemMap.get(r.id) ?? [],
      }));
      setOrders(mapped);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load your orders.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { void load(); }, [load]);

  const payStatus = (o: OrderRow) => {
    const s = STATUS_LABEL[o.payment_status] ?? STATUS_LABEL.payment_pending;
    return s;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">My Orders</h1>
        <Button variant="outline" size="sm" onClick={() => void load()}>
          <RefreshCw className="h-4 w-4" /> Refresh
        </Button>
      </div>

      {loading && <p className="text-sm text-muted-foreground">Loading your orders…</p>}

      {!loading && error && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <Wallet className="h-8 w-8 text-red-500" />
            <p className="text-sm text-red-600">{error}</p>
            <Button size="sm" variant="outline" onClick={() => void load()}>
              <RefreshCw className="mr-1.5 h-4 w-4" /> Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {!loading && !error && orders.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center py-14 text-center">
            <ShoppingBag className="mb-3 h-10 w-10 text-muted-foreground" />
            <p className="font-medium">No orders</p>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              When you place a Buy Now order it will appear here with its reference, items and status.
            </p>
            <Button asChild className="mt-5"><a href="/phones">Shop phones</a></Button>
          </CardContent>
        </Card>
      )}

      {!loading && !error && orders.length > 0 && (
        <div className="space-y-4">
          {orders.map((o) => {
            const ps = payStatus(o);
            return (
              <Card key={o.id}>
                <CardContent className="space-y-4 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold">{o.order_number}</p>
                      <p className="text-xs text-muted-foreground">{new Date(o.placed_at).toLocaleString()}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={ps.tone}>{ps.label}</Badge>
                      <Badge variant={STATUS_LABEL[o.status]?.tone ?? "muted"}>{STATUS_LABEL[o.status]?.label ?? o.status}</Badge>
                    </div>
                  </div>

                  <div className="divide-y rounded-lg border">
                    {o.items.map((it, idx) => (
                      <div key={idx} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm">
                        <div className="min-w-0">
                          <p className="font-medium">{it.product_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {it.variant_name || "Standard"} {it.color ? `· ${it.color}` : ""} × {it.quantity}
                          </p>
                        </div>
                        <span className="font-medium">{formatPKR(it.unit_price * it.quantity)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between border-t pt-3">
                    <span className="text-sm text-muted-foreground">Total</span>
                    <span className="text-base font-bold">{formatPKR(o.total)}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
