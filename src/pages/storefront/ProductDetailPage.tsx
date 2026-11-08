import { useMemo, useState } from "react";
import { Link, useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
  ShoppingCart, Heart, ShieldCheck, Lock, Truck, Check, ChevronRight,
  Smartphone, Battery, Cpu, Wifi, Camera, Zap, X,
} from "lucide-react";
import { getProductBySlug, relatedProducts } from "@/data/catalog";
import { useSettings } from "@/features/settings/store";
import { Seo, type SeoJsonLd } from "@/lib/seo";
import { buyNowPrice, instalmentPlan } from "@/lib/pricing";
import { getApprovedConceptSrcStatic } from "@/lib/image-resolve";
import { defaultVariantIndex, defaultColor, getVariantBySku } from "@/lib/variant-select";
import { formatPKR, cn, displayCondition } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ProductGrid } from "@/components/product-card";
import { ProductImage } from "@/components/product-image";
import { useCart } from "@/store/cart";
import { ptaInfo } from "@/lib/pta";
import { NotFoundPage } from "./NotFoundPage";
import { HeroInstalmentCalculator } from "@/components/hero-instalment-calculator";

/** Map a colour name to a representative swatch background. */
function swatchColor(c: string): string {
  const s = c.toLowerCase();
  if (s.includes("white") || s.includes("silver") || s.includes("starlight") || s.includes("grey") || s.includes("gray") || s.includes("natural")) return "#f5f5f5";
  if (s.includes("black") || s.includes("midnight") || s.includes("graphite") || s.includes("obsidian") || s.includes("ink") || s.includes("space")) return "#1c1c1e";
  if (s.includes("pink") || s.includes("rose")) return "#f9a8c4";
  if (s.includes("blue") || s.includes("navy") || s.includes("azure") || s.includes("sky") || s.includes("ocean")) return "#3b82f6";
  if (s.includes("green") || s.includes("mint") || s.includes("emerald") || s.includes("sage")) return "#22c55e";
  if (s.includes("red") || s.includes("crimson") || s.includes("maroon") || s.includes("scarlet")) return "#ef4444";
  if (s.includes("gold") || s.includes("yellow") || s.includes("amber") || s.includes("sand") || s.includes("champagne")) return "#facc15";
  if (s.includes("purple") || s.includes("violet") || s.includes("lavender")) return "#a855f7";
  if (s.includes("titanium") || s.includes("storm") || s.includes("alpine")) return "#9ca3af";
  if (s.includes("brown") || s.includes("bronze") || s.includes("copper") || s.includes("cognac")) return "#8b5e3c";
  return "#6b7280";
}

export function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const product = slug ? getProductBySlug(slug) : undefined;
  const { settings } = useSettings();
  const addItem = useCart((s) => s.addItem);
  const navigate = useNavigate();

  const variants = product?.variants ?? [];
  const [searchParams] = useSearchParams();
  const requestedSku = searchParams.get("sku");
  const requestedColor = searchParams.get("color");

  // Preselect from ?sku&color (e.g. returning via "Change selection" from the
  // instalment flow). Fall back to the default only when nothing is requested.
  const initialVIndex = (() => {
    let idx = -1;
    if (product && requestedSku) {
      const matched = getVariantBySku(product.variants, requestedSku);
      if (matched) idx = product.variants.indexOf(matched);
    }
    if (idx < 0) idx = product ? defaultVariantIndex(product.variants) : 0;
    return idx;
  })();
  const [vIndex, setVIndex] = useState<number>(initialVIndex);
  const variant = variants[vIndex];
  const [color, setColor] = useState<string>(() => {
    if (!variant) return "";
    if (requestedColor && variant.colors.includes(requestedColor)) return requestedColor;
    return defaultColor(variant);
  });
  const [colorError, setColorError] = useState<string>("");
  const [calcOpen, setCalcOpen] = useState(false);
  const [calcListed, setCalcListed] = useState(0);

  function requireColor(): boolean {
    if (variant.colors.length > 0 && !color) {
      setColorError("Please select a colour before adding to cart. Colour choices matter for your delivery.");
      return false;
    }
    setColorError("");
    return true;
  }

  function goInstalment() {
    if (!requireColor() || !product) return;
    navigate(`/instalments/apply?product=${product.slug}&sku=${encodeURIComponent(variant.sku)}&color=${encodeURIComponent(color || "")}`);
  }

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

  const baseUrl = (settings.seoAnalytics.canonicalBase || settings.domain).replace(/\/$/, "");
  const canonicalProduct = `${baseUrl}/product/${product.slug}`;
  const seoImage = getApprovedConceptSrcStatic(product) ?? undefined;
  const productJsonLd: SeoJsonLd[] = [
    {
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.name,
      description: product.description || `${product.name} available at ${settings.storeName || "RAES TECH"} in Pakistan.`,
      brand: { "@type": "Brand", name: product.brand },
      sku: variant.sku,
      image: seoImage ? baseUrl + seoImage : undefined,
      offers: {
        "@type": "Offer",
        url: canonicalProduct,
        priceCurrency: "PKR",
        price: bn,
        availability: variant.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        itemCondition: "https://schema.org/NewCondition",
        seller: { "@type": "Organization", name: settings.storeName || "RAES TECH" },
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: baseUrl + "/" },
        { "@type": "ListItem", position: 2, name: product.brand, item: `${baseUrl}/brand/${product.brand.toLowerCase()}` },
        { "@type": "ListItem", position: 3, name: product.name, item: canonicalProduct },
      ],
    },
  ];

  return (
    <div className="space-y-10">
      <Seo
        title={`${product.name} Price in Pakistan | RAES TECH`}
        description={product.seo_description || `${product.name} in Pakistan — transparent price with PTA/JV status disclosed, plus Buy Now discount and 0% markup instalments from RAES TECH.`}
        canonicalPath={`/product/${product.slug}`}
        image={seoImage}
        type="product"
        noindex={product.indexable === false}
        jsonLd={productJsonLd}
      />
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
            <ProductImage product={product} variant={variant} color={color} className="h-full w-full p-4" />
          </div>
          <p className="mt-2 text-center text-[10px] text-neutral-400">Representative image — colour may vary</p>
          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-medium">Colour</p>
              <p className="text-sm font-semibold text-foreground">{color || (variant.colors.length ? "Select a colour" : "—")}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {variant.colors.map((c, i) => {
                const selected = color === c;
                return (
                  <button
                    key={c + i}
                    onClick={() => setColor(c)}
                    className={cn(
                      "h-9 w-9 rounded-full border-2 shadow-sm transition-transform hover:scale-105",
                      selected ? "border-foreground ring-2 ring-foreground/40 ring-offset-2" : "border-neutral-300"
                    )}
                    style={{ background: swatchColor(c) }}
                    aria-label={`Colour ${c}`}
                    aria-pressed={selected}
                    title={c}
                  />
                );
              })}
            </div>
            {variant.colors.length > 0 && !color && (
              <p className="mt-2 text-xs text-amber-700">Please select a colour to add to cart.</p>
            )}
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
              {variant.storage} · {variant.ram} · {displayCondition()}
            </p>
          </div>

          <div className="rounded-2xl border bg-card p-5">
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-black">{formatPKR(bn)}</span>
              <span className="text-lg text-muted-foreground line-through">{formatPKR(variant.listedPrice)}</span>
            </div>
            <p className="mt-1 text-sm font-medium text-emerald-700">
              You save {formatPKR(savings)} with Buy Now (22% off)
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
                      onClick={() => { setVIndex(i); setColor(defaultColor(variants[i])); }}
                      className={cn(
                        "relative rounded-xl border p-3 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                        selected
                          ? "variant-option-selected shadow-lg"
                          : "bg-card hover:border-primary hover:shadow-sm"
                      )}
                    >
                      {selected && (
                        <span className="absolute right-2 top-2 inline-flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
                          <Check className="h-3 w-3" strokeWidth={3} />
                        </span>
                      )}
                      <span className="block text-sm font-bold">
                        {v.storage} <span className={cn("font-medium", selected ? "opacity-80" : "text-muted-foreground")}>/ {v.ram}</span>
                      </span>
                      <span
                        className={cn(
                          "mt-1.5 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                          selected
                            ? vPta.tone === "warning"
                              ? "bg-amber-400 text-black"
                              : vPta.tone === "success"
                              ? "bg-emerald-400 text-black"
                              : "bg-neutral-200 text-neutral-900 dark:bg-white/25 dark:text-white"
                            : vPta.tone === "warning"
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-400/20 dark:text-amber-300"
                            : vPta.tone === "success"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-400/20 dark:text-emerald-300"
                            : "bg-muted text-muted-foreground dark:bg-white/10 dark:text-slate-300"
                        )}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        {vPta.label}
                      </span>
                      <span className={cn("mt-2 block text-[13px] font-extrabold tracking-tight", !selected && "text-foreground")}>
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
              <span className="font-medium">Condition:</span> {displayCondition()}
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
              <p className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">{variant.notes}</p>
            )}
            <p className="flex items-center gap-1.5 text-xs font-medium text-emerald-700">
              <ShieldCheck className="h-4 w-4" /> Stock and IMEI verified before dispatch.
            </p>
          </div>

          {/* Buy / instalment CTAs */}
          <div className="space-y-3">
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="w-full rounded-full"
              onClick={() => { setCalcListed(variant.listedPrice > 0 ? variant.listedPrice : 0); setCalcOpen(true); }}
            >
              Estimate monthly payment
            </Button>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Button size="lg" className="w-full rounded-full bg-neutral-950 text-white hover:bg-neutral-800" onClick={() => { if (!requireColor()) return; addItem(product, variant, 1, color); navigate("/checkout"); }}>
                Buy Now
              </Button>
              <Button size="lg" variant="outline" className="w-full rounded-full" onClick={() => { if (!requireColor()) return; addItem(product, variant, 1, color); }}>
                Add to Cart
              </Button>
            </div>
            {colorError && (
              <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">{colorError}</p>
            )}
            <Button size="lg" variant="outline" className="w-full rounded-full" onClick={goInstalment}>
              Apply Instalment
            </Button>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Card className="p-4">
                <p className="text-sm font-bold">Buy Now</p>
                <p className="mt-1 text-xs text-muted-foreground">Pay in full — save 22%.</p>
                <p className="mt-2 text-lg font-bold">{formatPKR(bn)}</p>
              </Card>
              <Card className="p-4">
                <p className="text-sm font-bold">Buy on Instalments</p>
                <p className="mt-1 text-xs text-muted-foreground">11% off · 0% markup.</p>
                <p className="mt-2 text-lg font-bold">{formatPKR(plan?.total ?? variant.listedPrice)}</p>
              </Card>
            </div>
            {plan && (
              <div className="rounded-2xl border bg-card p-4 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Advance ({settings.instalmentAdvancePercent}%)</span><span className="font-semibold">{formatPKR(plan.advance)}</span></div>
                <div className="mt-1 flex justify-between"><span className="text-muted-foreground">Remaining balance</span><span className="font-semibold">{formatPKR(plan.remaining)}</span></div>
                <div className="mt-1 flex justify-between"><span className="text-muted-foreground">Monthly (12 months)</span><span className="font-semibold">{formatPKR(plan.monthly)}</span></div>
                <Button variant="outline" className="mt-3 w-full" onClick={goInstalment}>
                  Apply for Instalments
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Specifications */}
      <section className="rounded-3xl border bg-card p-6 sm:p-8">
        <h2 className="mb-6 text-xl font-bold">Specifications</h2>
        <dl className="grid gap-x-10 gap-y-5 sm:grid-cols-2">
          {specs.map((s) => (
            <div key={s.label} className="flex items-start gap-3">
              <s.icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div>
                <dt className="text-xs text-muted-foreground">{s.label}</dt>
                <dd className="mt-0.5 text-sm font-medium">{s.value}</dd>
              </div>
            </div>
          ))}
        </dl>
      </section>

      {/* Related */}
      <section>
        <h2 className="mb-5 text-xl font-bold">Related phones</h2>
        <ProductGrid products={relatedProducts(product)} />
      </section>

      {/* Instalment estimator modal (uses the same pricing engine as the homepage) */}
      {calcOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Estimate monthly payment"
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setCalcOpen(false)} />
          <div className="relative w-full max-w-md animate-pop rounded-3xl border border-white/15 bg-neutral-900 p-5 shadow-2xl">
            <div className="mb-3 flex items-center justify-between gap-2">
              <span className="text-sm font-bold text-white">
                {product ? `${product.model} — instalments` : "Estimate monthly payment"}
              </span>
              <button
                type="button"
                onClick={() => setCalcOpen(false)}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                aria-label="Close instalment calculator"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mb-4 text-xs text-white/60">
              Enter the listed price — the {settings.instalmentDiscountPercent}% instalment discount is applied automatically.
            </p>
            <HeroInstalmentCalculator key={calcListed} initialPrice={calcListed} />
          </div>
        </div>
      )}
    </div>
  );
}
