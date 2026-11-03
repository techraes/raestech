import { useMemo, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  ShoppingCart, Heart, ShieldCheck, Lock, Truck, Check, ChevronRight,
  Smartphone, Battery, Cpu, Wifi, Camera, Zap,
} from "lucide-react";
import { getProductBySlug, relatedProducts } from "@/data/catalog";
import { useSettings } from "@/features/settings/store";
import { buyNowPrice, instalmentPlan } from "@/lib/pricing";
import { formatPKR, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ProductGrid } from "@/components/product-card";
import { ProductImage } from "@/components/product-image";
import { useCart } from "@/store/cart";
import { ptaInfo } from "@/lib/pta";
import { NotFoundPage } from "./NotFoundPage";

export function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const product = slug ? getProductBySlug(slug) : undefined;
  const { settings } = useSettings();
  const addItem = useCart((s) => s.addItem);
  const navigate = useNavigate();

  const variants = product?.variants ?? [];
  const [vIndex, setVIndex] = useState(0);
  const variant = variants[vIndex];
  const [color, setColor] = useState<string>("");

  const plan = useMemo(
    () => (variant ? instalmentPlan(variant.listedPrice, 12, settings.instalmentAdvancePercent, settings.instalmentMarkupPercent) : null),
    [variant, settings.instalmentAdvancePercent, settings.instalmentMarkupPercent]
  );

  if (!product || !variant) return <NotFoundPage />;

  const bn = buyNowPrice(variant.listedPrice, settings.buyNowDiscountPercent);
  const savings = variant.listedPrice - bn;
  const isJV = /jv|sim-locked|carrier-locked/i.test(variant.pta_status + " " + variant.notes);
  const ptaApproved = /pta approved/i.test(variant.pta_status);

  const colors = color ? [color] : (variant.colors.length ? variant.colors : ["Black"]);

  const specs = [
    { icon: Smartphone, label: "Display", value: variant.display },
    { icon: Cpu, label: "Chipset", value: variant.chipset },
    { icon: Camera, label: "Rear Camera", value: variant.rear_camera },
    { icon: Camera, label: "Front Camera", value: variant.front_camera },
    { icon: Battery, label: "Battery", value: variant.battery },
    { icon: Wifi, label: "Network", value: variant.network },
    { icon: Zap, label: "Storage / RAM", value: `${variant.storage} / ${variant.ram}` },
  ];

  return (
    <div className="space-y-10">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-muted-foreground">
        <Link to="/" className="hover:text-foreground">Home</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link to={`/brand/${product.brand.toLowerCase()}`} className="hover:text-foreground">{product.brand}</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground">{product.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Image / visuals */}
        <div>
          <div className="aspect-square overflow-hidden rounded-3xl bg-muted/30">
            <ProductImage product={product} variant={variant} className="h-full w-full p-4" />
          </div>
          <p className="mt-2 text-center text-[10px] text-neutral-400">Representative image — colour may vary</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {variant.colors.map((c, i) => (
              <button
                key={c + i}
                onClick={() => setColor(c)}
                className="h-9 w-9 rounded-full border-2 shadow-sm transition-transform hover:scale-105"
                style={{ background: c.toLowerCase().includes("white") || c.toLowerCase().includes("silver") || c.toLowerCase().includes("starlight") ? "#f5f5f5" : c.toLowerCase().includes("black") || c.toLowerCase().includes("midnight") ? "#000" : c.toLowerCase().includes("pink") ? "#f9a8c4" : c.toLowerCase().includes("blue") ? "#3b82f6" : c.toLowerCase().includes("green") ? "#22c55e" : c.toLowerCase().includes("red") ? "#ef4444" : c.toLowerCase().includes("gold") || c.toLowerCase().includes("yellow") ? "#facc15" : c.toLowerCase().includes("purple") ? "#a855f7" : c.toLowerCase().includes("graphite") ? "#374151" : c.toLowerCase().includes("titanium") ? "#9ca3af" : "#6b7280" }}
                aria-label={`Colour ${c}`}
                title={c}
              />
            ))}
          </div>
        </div>

        {/* Details */}
        <div className="space-y-5">
          <div>
            <div className="flex items-center gap-2">
              <Link to={`/brand/${product.brand.toLowerCase()}`} className="text-sm font-medium text-muted-foreground hover:text-foreground">
                {product.brand}
              </Link>
              {isJV && <Badge variant="warning">JV / SIM-Locked</Badge>}
              {ptaApproved && <Badge variant="success">PTA Approved</Badge>}
            </div>
            <h1 className="mt-1 text-2xl font-bold sm:text-3xl">{product.name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {variant.storage} · {variant.ram} · {variant.condition}
            </p>
          </div>

          <div className="rounded-2xl border bg-card p-5">
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-black">{formatPKR(bn)}</span>
              <span className="text-lg text-muted-foreground line-through">{formatPKR(variant.listedPrice)}</span>
            </div>
            <p className="mt-1 text-sm font-medium text-emerald-700">
              You save {formatPKR(savings)} with Buy Now (10% off)
            </p>
          </div>

          {/* Variant selection */}
          {variants.length > 1 && (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-medium">Storage / RAM variant</p>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {variants.map((v, i) => {
                  const vPta = ptaInfo(v);
                  const selected = i === vIndex;
                  return (
                    <button
                      key={v.sku}
                      onClick={() => { setVIndex(i); setColor(""); }}
                      className={cn(
                        "rounded-xl border p-3 text-left transition-all",
                        selected
                          ? "border-primary bg-primary text-primary-foreground shadow-lg"
                          : "bg-card hover:border-primary hover:shadow-sm"
                      )}
                    >
                      <span className="block text-sm font-bold">
                        {v.storage} <span className={cn("font-medium", selected ? "text-white/70" : "text-muted-foreground")}>/ {v.ram}</span>
                      </span>
                      <span
                        className={cn(
                          "mt-1.5 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                          selected
                            ? vPta.tone === "warning"
                              ? "bg-amber-400 text-black"
                              : vPta.tone === "success"
                              ? "bg-emerald-400 text-black"
                              : "bg-white/20 text-white"
                            : vPta.tone === "warning"
                            ? "bg-amber-100 text-amber-800"
                            : vPta.tone === "success"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        {vPta.label}
                      </span>
                      <span className={cn("mt-2 block text-[13px] font-extrabold tracking-tight", selected ? "text-white" : "text-foreground")}>
                        {formatPKR(buyNowPrice(v.listedPrice, settings.buyNowDiscountPercent))}
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground">
                Each variant shows its PTA / SIM-lock status. JV devices are never sold as factory-unlocked.
              </p>
            </div>
          )}

          {/* PTA / condition status */}
          <div className="space-y-2 rounded-2xl bg-muted/40 p-4 text-sm">
            <p className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span className="font-medium">PTA status:</span> {variant.pta_status}
            </p>
            <p className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              <span className="font-medium">Condition:</span> {variant.condition}
            </p>
            {variant.requiresVerification && (
              <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                ⚠ This listing requires IMEI / stock verification before dispatch. Confirmed at checkout.
              </p>
            )}
            {variant.priceCheckedDate && (
              <p className="text-xs text-muted-foreground">Price checked: {variant.priceCheckedDate}</p>
            )}
            {variant.notes && (
              <p className="rounded-lg bg-neutral-100 px-3 py-2 text-xs text-neutral-700">{variant.notes}</p>
            )}
            <p className="flex items-center gap-1.5 text-xs font-medium text-emerald-700">
              <ShieldCheck className="h-4 w-4" /> Stock and IMEI verified before dispatch.
            </p>
          </div>

          {/* Buy / instalment CTAs */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Button size="lg" className="rounded-full bg-neutral-950 text-white hover:bg-neutral-800" onClick={() => { addItem(product, variant); navigate("/checkout"); }}>
                Buy Now
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full">
                <Link to={`/instalments/apply?product=${product.slug}`}>Apply Instalment</Link>
              </Button>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Card className="p-4">
                <p className="text-sm font-bold">Buy Now</p>
                <p className="mt-1 text-xs text-muted-foreground">Pay in full — save 10%.</p>
                <p className="mt-2 text-lg font-bold">{formatPKR(bn)}</p>
              </Card>
              <Card className="p-4">
                <p className="text-sm font-bold">Buy on Instalments</p>
                <p className="mt-1 text-xs text-muted-foreground">Full price · 0% markup.</p>
                <p className="mt-2 text-lg font-bold">{formatPKR(variant.listedPrice)}</p>
              </Card>
            </div>
            {plan && (
              <div className="rounded-2xl border bg-card p-4 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Advance ({settings.instalmentAdvancePercent}%)</span><span className="font-semibold">{formatPKR(plan.advance)}</span></div>
                <div className="mt-1 flex justify-between"><span className="text-muted-foreground">Remaining balance</span><span className="font-semibold">{formatPKR(plan.remaining)}</span></div>
                <div className="mt-1 flex justify-between"><span className="text-muted-foreground">Monthly (12 months)</span><span className="font-semibold">{formatPKR(plan.monthly)}</span></div>
                <Button asChild variant="outline" className="mt-3 w-full">
                  <Link to={`/instalments/apply?product=${product.slug}`}>Apply for Instalments</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Specs + description */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <h2 className="mb-4 text-lg font-bold">Specifications</h2>
            <div className="space-y-3">
              {specs.map((s) => (
                <div key={s.label} className="flex items-start gap-3">
                  <s.icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                    <p className="text-sm">{s.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Related */}
      <section>
        <h2 className="mb-5 text-xl font-bold">Related phones</h2>
        <ProductGrid products={relatedProducts(product)} />
      </section>
    </div>
  );
}
