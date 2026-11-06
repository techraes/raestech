import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Package, ShoppingBag, Users, AlertTriangle, Banknote, CalendarClock, ArrowUpRight,
} from "lucide-react";
import { useProducts } from "@/data/catalog";
import { Card, CardContent } from "@/components/ui/card";
import { useSettings } from "@/features/settings/store";

export function AdminIndex() {
  const { settings } = useSettings();
  const allProducts = useProducts();

  const stats = useMemo(() => {
    let totalVariants = 0;
    let lowStock = 0;
    let outOfStock = 0;
    for (const p of allProducts) {
      for (const v of p.variants) {
        totalVariants++;
        if (v.stock === 0) outOfStock++;
        else if (v.stock <= 5) lowStock++;
      }
    }
    return { products: allProducts.length, brands: new Set(allProducts.map((p) => p.brand)).size, totalVariants, lowStock, outOfStock };
  }, [allProducts]);

  const tiles = [
    { label: "Total products", value: stats.products, icon: Package },
    { label: "Total variants", value: stats.totalVariants, icon: Package },
    { label: "Brands", value: stats.brands, icon: Users },
    { label: "Low-stock variants", value: stats.lowStock, icon: AlertTriangle },
    { label: "Out-of-stock", value: stats.outOfStock, icon: AlertTriangle },
    { label: "Buy-Now discount", value: `${settings.buyNowDiscountPercent}%`, icon: Banknote },
    { label: "Instalment advance", value: `${settings.instalmentAdvancePercent}%`, icon: CalendarClock },
    { label: "COD", value: settings.codEnabled ? "On" : "Disabled", icon: Banknote },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Live store overview — driven by real catalogue data.</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((t) => (
          <Card key={t.label}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <t.icon className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="mt-3 text-2xl font-black">{t.value}</p>
              <p className="text-sm text-muted-foreground">{t.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardContent className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold">Order & payment status</h2>
              <Link to="/admin/orders" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                Orders <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <p className="text-sm text-muted-foreground">
              Live order and payment KPIs appear here once Supabase is connected and orders are placed.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold">Quick actions</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link to="/admin/products" className="rounded-md border px-3 py-1.5 text-sm hover:bg-accent">Manage products</Link>
              <Link to="/admin/settings" className="rounded-md border px-3 py-1.5 text-sm hover:bg-accent">Business settings</Link>
              <Link to="/admin/products?action=import" className="rounded-md border px-3 py-1.5 text-sm hover:bg-accent">Import catalogue</Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
