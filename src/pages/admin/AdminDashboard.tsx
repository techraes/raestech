import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Info } from "lucide-react";
import { allProducts } from "@/data/catalog";
import { useSettings } from "@/features/settings/store";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { formatPKR } from "@/lib/utils";
import { Stat } from "./_ui";

interface DbStats {
  orders: number;
  completedOrders: number;
  pendingOrders: number;
  customers: number;
  revenue: number | null;
}

export function AdminDashboard() {
  const { settings } = useSettings();
  const [db, setDb] = useState<DbStats | null>(null);

  const products = allProducts.length;
  const active = allProducts.length;
  const variants = allProducts.reduce((n, p) => n + p.variants.length, 0);
  const outOfStock = allProducts.reduce((n, p) => n + p.variants.filter((v) => v.stock === 0).length, 0);
  const lowStock = allProducts.reduce(
    (n, p) => n + p.variants.filter((v) => v.stock > 0 && v.stock <= 5).length,
    0
  );

  useEffect(() => {
    if (!supabase) {
      setDb(null);
      return;
    }
    Promise.all([
      supabase.from("orders").select("id", { count: "exact", head: true }),
      supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "completed"),
      supabase.from("orders").select("id", { count: "exact", head: true }).in("status", ["pending", "processing"]),
      supabase.from("profiles").select("id", { count: "exact", head: true }),
    ]).then(([o, c, pen, cust]) => {
      setDb({
        orders: o.count ?? 0,
        completedOrders: c.count ?? 0,
        pendingOrders: pen.count ?? 0,
        customers: cust.count ?? 0,
        revenue: null,
      });
    });
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Live business overview for {settings.storeName}.</p>
        </div>
        <Badge variant="outline">{settings.currency} {settings.currencySymbol}</Badge>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Stat label="Products (live)" value={products} />
        <Stat label="Active products" value={active} tone="info" />
        <Stat label="Variants / SKUs" value={variants} />
        <Stat label="Out of stock" value={outOfStock} tone={outOfStock > 0 ? "destructive" : "success"} />
        <Stat label="Low stock" value={lowStock} tone={lowStock > 0 ? "warning" : "muted"} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Orders &amp; customers</CardTitle>
        </CardHeader>
        <CardContent>
          {db ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat label="Total orders" value={db.orders} />
              <Stat label="Completed" value={db.completedOrders} tone="success" />
              <Stat label="Pending" value={db.pendingOrders} tone="info" />
              <Stat label="Customers" value={db.customers} />
            </div>
          ) : (
            <div className="flex items-start gap-2 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              <Info className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                Order and customer statistics load here once Supabase is configured (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).
                Product and stock figures above are computed live from the catalogue.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pricing rules (active)</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <Stat label="Buy Now discount" value={`${settings.buyNowDiscountPercent}%`} />
          <Stat label="Instalment advance" value={`${settings.instalmentAdvancePercent}%`} />
          <Stat label="Instalment markup" value={`${settings.instalmentMarkupPercent}%`} />
          <Stat label="Tenures" value={settings.instalmentTenures.join(" / ")} />
          <Stat label="Shipping" value={formatPKR(settings.shippingCharge)} tone="info" />
        </CardContent>
      </Card>
    </div>
  );
}
