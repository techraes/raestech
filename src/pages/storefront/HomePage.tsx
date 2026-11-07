import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight, ShieldCheck, Truck, Percent, RotateCcw, SlidersHorizontal,
  Lock, Headphones, BadgeCheck, Sparkles, X,
} from "lucide-react";

import { useSettings } from "@/features/settings/store";
import { Seo } from "@/lib/seo";
import { useProducts, newArrivals, getBrands } from "@/data/catalog";
import { ProductGrid } from "@/components/product-card";
import { HeroInstalmentCalculator } from "@/components/hero-instalment-calculator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BrandLogo } from "@/components/brand-logo";
import { buyNowPrice } from "@/lib/pricing";
import { formatPKR } from "@/lib/utils";
import type { Product } from "@/types";

/**
 * Soft glow colours sampled from each brand's typical handset finishes, so the
 * hero art glows with a colour that echoes the phone on screen. Falls back to
 * a neutral charcoal/violet tint for brands not listed.
 */
const BRAND_GLOW: Record<string, string> = {
  apple: "rgba(148, 163, 184, 0.45)",
  samsung: "rgba(94, 234, 212, 0.35)",
  google: "rgba(129, 140, 248, 0.40)",
  xiaomi: "rgba(251, 146, 60, 0.35)",
  motorola: "rgba(99, 102, 241, 0.35)",
  oppo: "rgba(96, 165, 250, 0.40)",
  vivo: "rgba(192, 132, 252, 0.40)",
  infinix: "rgba(52, 211, 153, 0.35)",
  itel: "rgba(56, 189, 248, 0.35)",
  nothing: "rgba(226, 232, 240, 0.35)",
  honor: "rgba(249, 115, 22, 0.30)",
  tecno: "rgba(34, 211, 238, 0.30)",
};

const DEFAULT_GLOW = "rgba(183, 166, 217, 0.40)";

export function HomePage() {
  const { settings } = useSettings();
  const fresh = newArrivals();
  const brands = getBrands();
  const allProducts = useProducts();
  const [sort, setSort] = useState<"default" | "price-asc" | "price-desc" | "newest">("default");
  const [minS, setMinS] = useState("");
  const [maxS, setMaxS] = useState("");
  const [calcOpen, setCalcOpen] = useState(false);
  const [calcListed, setCalcListed] = useState(0);

  const PRICE_PRESETS = [
    { label: "Under 50k", min: "", max: "50000" },
    { label: "50k–100k", min: "50000", max: "100000" },
    { label: "100k–200k", min: "100000", max: "200000" },
    { label: "200k+", min: "200000", max: "" },
  ];

  const numMin = Number(minS.replace(/,/g, ""));
  const numMax = Number(maxS.replace(/,/g, ""));
  const hasMin = minS.trim() !== "" && !Number.isNaN(numMin);
  const hasMax = maxS.trim() !== "" && !Number.isNaN(numMax);

  const priceOf = (p: Product) => buyNowPrice(p.variants[0].listedPrice, settings.buyNowDiscountPercent);

  const browseAll = useMemo(() => {
    if (!allProducts.length) return [] as Product[];
    let arr = allProducts.filter((p) => p.variants.length > 0);
    if (hasMin) arr = arr.filter((p) => priceOf(p) >= numMin);
    if (hasMax) arr = arr.filter((p) => priceOf(p) <= numMax);
    const sorted = [...arr];
    if (sort === "price-asc") sorted.sort((a, b) => priceOf(a) - priceOf(b));
    else if (sort === "price-desc") sorted.sort((a, b) => priceOf(b) - priceOf(a));
    else if (sort === "newest")
      sorted.sort((a, b) => (Number((b as unknown as { created_at?: number }).created_at) || 0) - (Number((a as unknown as { created_at?: number }).created_at) || 0));
    return sorted;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sort, minS, maxS, settings, allProducts]);

  const heroSection = settings.homepageSections.find((s) => s.kind === "hero" && s.enabled);

  /**
   * Featured handset for the hero: prefer a recognisable flagship with a real
   * photo and a priced variant, falling back to any product with an image.
   * When nothing qualifies we render a clean content-only fallback.
   */
  const heroProduct = useMemo(() => {
    const valid = (p: Product) => !!p.image && p.variants.some((v) => v.listedPrice > 0);
    const preferred = [
      "apple-iphone-15-pro",
      "samsung-galaxy-s25-ultra",
      "apple-iphone-15",
      "samsung-galaxy-s26",
      "apple-iphone-16-pro",
    ];
    for (const slug of preferred) {
      const p = allProducts.find((x) => x.slug === slug);
      if (p && valid(p)) return p;
    }
    return allProducts.find(valid);
  }, [allProducts]);

  const heroVariant = heroProduct?.variants.find((v) => v.listedPrice > 0) || heroProduct?.variants[0];
  const heroListed = heroVariant?.listedPrice ?? 0;
  const heroBuyNow = heroListed > 0 ? buyNowPrice(heroListed, settings.buyNowDiscountPercent) : 0;
  const heroGlow = heroProduct ? BRAND_GLOW[heroProduct.brand.toLowerCase()] || DEFAULT_GLOW : DEFAULT_GLOW;

  // Close the calculator panel on Escape.
  useEffect(() => {
    if (!calcOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setCalcOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [calcOpen]);

  const openCalculator = (listed: number) => {
    setCalcListed(listed > 0 ? listed : 0);
    setCalcOpen(true);
  };

  return (
    <div className="space-y-12">
      <Seo
        title="RAES TECH | Buy Smartphones Online in Pakistan"
        description="Shop smartphones in Pakistan at RAES TECH. Explore Apple iPhone, Samsung Galaxy, Google Pixel and more with easy instalment options and nationwide delivery."
        canonicalPath="/"
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: settings.storeName || "RAES TECH",
            url: settings.seoAnalytics.canonicalBase || settings.domain,
          },
          {
            "@context": "https://schema.org",
            "@type": "Organization",
            name: settings.storeName || "RAES TECH",
            url: settings.seoAnalytics.canonicalBase || settings.domain,
          },
        ]}
      />

      {/* ================= Cinematic hero ================= */}
      <section className="relative overflow-hidden bg-neutral-950 text-white">
        <div className="pointer-events-none absolute -right-32 -top-24 h-96 w-96 rounded-full bg-[radial-gradient(circle,rgba(183,166,217,0.35),transparent_60%)] animate-drift" />
        <div className="pointer-events-none absolute -left-24 bottom-0 h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.08),transparent_60%)]" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-8 px-4 py-12 lg:grid-cols-2 lg:gap-12 lg:py-16">
          {/* Left: model, selling point, price, actions — renders first so it
              sits above the artwork on mobile */}
          <div className="relative z-10 flex flex-col items-start">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/70">
              <Sparkles className="h-3.5 w-3.5" />
              {heroProduct ? heroProduct.brand : "RAES TECH"}
            </span>

            <h1 className="mt-5 text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl xl:text-6xl">
              {heroProduct ? heroProduct.model : heroSection?.title || "UPGRADE YOUR TECH. PAY YOUR WAY."}
            </h1>

            {heroProduct && heroVariant ? (
              <>
                <p className="mt-3 inline-flex items-center gap-2 text-sm text-neutral-300">
                  <BadgeCheck className="h-4 w-4 text-white/70" />
                  <span>
                    {heroVariant.chipset} · {heroVariant.network} · {heroVariant.pta_status}
                  </span>
                </p>

                <div className="mt-6">
                  <div className="flex items-baseline gap-3">
                    <span className="text-lg text-neutral-400 line-through">{formatPKR(heroListed)}</span>
                    <span className="text-3xl font-black tracking-tight sm:text-4xl">{formatPKR(heroBuyNow)}</span>
                  </div>
                  <p className="mt-1 text-xs text-neutral-400">
                    Buy Now · {settings.buyNowDiscountPercent}% off — or split it interest-free
                  </p>
                </div>

                <div className="mt-7 flex flex-wrap items-center gap-3">
                  <Button asChild size="lg" className="rounded-full bg-white text-black hover:bg-neutral-200">
                    <Link to={`/product/${heroProduct.slug}`}>
                      View {heroProduct.model} <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    type="button"
                    onClick={() => openCalculator(heroListed)}
                    className="rounded-full border-white/30 bg-transparent text-white hover:bg-white/10"
                  >
                    Estimate monthly payment
                  </Button>
                </div>

                <div className="mt-6 flex items-center gap-2 text-xs text-neutral-400">
                  <ShieldCheck className="h-4 w-4 text-white/70" />
                  PTA status disclosed · verified pricing
                </div>
              </>
            ) : (
              <>
                <p className="mt-4 max-w-md text-base text-neutral-300">
                  {heroSection?.subtitle || "Latest Smartphones with Flexible Instalment Plans"}
                </p>
                <div className="mt-7 flex flex-wrap items-center gap-3">
                  <Button asChild size="lg" className="rounded-full bg-white text-black hover:bg-neutral-200">
                    <Link to={heroSection?.buttonLink || "/phones"}>
                      {heroSection?.buttonText || "Shop Now"} <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    type="button"
                    onClick={() => openCalculator(0)}
                    className="rounded-full border-white/30 bg-transparent text-white hover:bg-white/10"
                  >
                    Estimate monthly payment
                  </Button>
                </div>
              </>
            )}
          </div>

          {/* Right: artwork (animated in once, space reserved before load) */}
          <div className="relative flex items-center justify-center">
            {heroProduct ? (
              <div className="relative w-full max-w-md aspect-[4/5] animate-hero-phone">
                <div
                  className="absolute -inset-8 rounded-full blur-3xl"
                  style={{ background: heroGlow }}
                  aria-hidden="true"
                />
                <img
                  src={`/images/products/${heroProduct.image}`}
                  alt={heroProduct.name}
                  className="relative h-full w-full object-contain drop-shadow-2xl"
                />
              </div>
            ) : (
              <div className="flex h-64 w-full items-center justify-center rounded-3xl border border-white/10 bg-white/[0.04] sm:h-80">
                <span className="text-sm text-white/50">Featured phone coming soon</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ================= Shop by brand ================= */}
      <section>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Shop by brand</h2>
        </div>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 xl:grid-cols-6">
          {brands.map((b) => (
            <Link
              key={b.slug}
              to={`/brand/${b.slug}`}
              className="group flex flex-col items-center justify-center gap-2.5 rounded-2xl border border-border bg-card px-2 py-4 text-center transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
            >
              <span className="flex h-12 w-full items-center justify-center">
                <BrandLogo brand={b} showFallbackName={false} />
              </span>
              <span className="text-sm font-semibold leading-tight text-foreground">{b.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ================= Consolidated trust strip (one compact row) ================= */}
      <section className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 rounded-2xl border border-border bg-card px-4 py-3.5">
        {[
          { icon: Percent, text: `${settings.buyNowDiscountPercent}% Buy-Now OFF` },
          { icon: Truck, text: "Free Nationwide Shipping" },
          { icon: ShieldCheck, text: "PTA Status Disclosed" },
          { icon: RotateCcw, text: "0% Markup Instalments" },
          { icon: Lock, text: "Secure Payments" },
          { icon: Headphones, text: "Support 7 days" },
        ].map((f, i) => (
          <span key={f.text} className="flex items-center gap-2 text-[13px] text-muted-foreground">
            <f.icon className="h-4 w-4 shrink-0 text-foreground/70" />
            <span>{f.text}</span>
            {i < 5 && <span className="ml-3 hidden h-4 w-px bg-border sm:inline-block" />}
          </span>
        ))}
      </section>

      {/* ================= Browse all phones ================= */}
      <section>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Browse all phones</h2>
          <span className="text-xs text-muted-foreground">{browseAll.length} results</span>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border bg-card p-3 shadow-card">
          <SlidersHorizontal className="h-4 w-4 shrink-0 text-muted-foreground" />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
            className="h-9 rounded-lg border bg-background px-3 text-sm focus:outline-none"
            aria-label="Sort products"
          >
            <option value="default">Sort: Featured</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="newest">Newest first</option>
          </select>

          <span className="text-xs font-medium text-muted-foreground">Price range</span>
          <input
            value={minS}
            onChange={(e) => setMinS(e.target.value)}
            placeholder="Min"
            inputMode="numeric"
            className="h-9 w-24 rounded-lg border bg-background px-3 text-sm focus:outline-none"
            aria-label="Minimum price"
          />
          <span className="text-muted-foreground">–</span>
          <input
            value={maxS}
            onChange={(e) => setMaxS(e.target.value)}
            placeholder="Max"
            inputMode="numeric"
            className="h-9 w-24 rounded-lg border bg-background px-3 text-sm focus:outline-none"
            aria-label="Maximum price"
          />

          <div className="flex flex-wrap items-center gap-1.5">
            {PRICE_PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => { setMinS(p.min); setMaxS(p.max); }}
                className="rounded-full border px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
              >
                {p.label}
              </button>
            ))}
            {(hasMin || hasMax) && (
              <button
                type="button"
                onClick={() => { setMinS(""); setMaxS(""); }}
                className="rounded-full px-2.5 py-1 text-[11px] font-semibold text-primary underline underline-offset-2"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {(hasMin || hasMax) && (
          <p className="mb-3 text-xs font-medium text-muted-foreground">
            Showing prices {formatPKR(hasMin ? numMin : 0)} – {formatPKR(hasMax ? numMax : 100000000)}
          </p>
        )}

        <ProductGrid products={browseAll} />
      </section>

      {/* ================= New arrivals ================= */}
      <section>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-2xl font-bold">New arrivals</h2>
          <Button asChild variant="ghost">
            <Link to="/new-arrivals">View all <ArrowRight className="h-4 w-4" /></Link>
          </Button>
        </div>
        <ProductGrid products={fresh} />
      </section>

      {/* ================= Easy instalments promo ================= */}
      <section className="relative overflow-hidden rounded-3xl bg-neutral-950 text-white">
        <div className="pointer-events-none absolute -right-20 -top-16 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(183,166,217,0.3),transparent_60%)]" />
        <div className="relative grid gap-8 px-6 py-10 sm:px-10 lg:grid-cols-3 lg:items-center">
          <div>
            <h2 className="text-3xl font-black tracking-tight">EASY INSTALMENTS</h2>
            <p className="mt-2 text-neutral-300">Your favourite smartphone is closer than ever.</p>
          </div>
          <ol className="space-y-2 text-sm text-neutral-200">
            <li>1 · Choose your phone</li>
            <li>2 · Select an instalment plan</li>
            <li>3 · Apply online</li>
          </ol>
          <div className="flex flex-col items-start gap-4 lg:items-end">
            <Button asChild size="lg" className="rounded-full bg-white text-black hover:bg-neutral-200">
              <Link to="/instalments">Apply Now <ArrowRight className="h-4 w-4" /></Link>
            </Button>
            <p className="text-xs text-neutral-400">
              Advance {settings.instalmentAdvancePercent}% · {settings.instalmentMarkupPercent}% markup ·{" "}
              {settings.instalmentTenures.join("/")} months
            </p>
          </div>
        </div>
      </section>

      {/* ================= CTA ================= */}
      <section className="rounded-3xl border bg-card p-8 text-center sm:p-12">
        <div>
          <h2 className="text-2xl font-bold sm:text-3xl">Not sure how to pay?</h2>
          <p className="mx-auto mt-2 max-w-lg text-muted-foreground">
            Pay in full with a {settings.buyNowDiscountPercent}% discount, or apply for an instalment plan with{" "}
            {settings.instalmentDiscountPercent}% off, a {settings.instalmentAdvancePercent}% advance and{" "}
            {settings.instalmentMarkupPercent}% markup. No guarantor needed.
          </p>
          <Button asChild size="lg" className="mt-6">
            <Link to="/instalments">View Instalment Information</Link>
          </Button>
        </div>
      </section>

      <p className="text-center text-xs text-muted-foreground">
        {allProducts.length} smartphones currently listed · {settings.currency} {settings.currencySymbol} pricing
      </p>

      {/* ================= Accessible calculator panel ================= */}
      {calcOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Estimate monthly payment"
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setCalcOpen(false)} />
          <div className="relative w-full max-w-md animate-pop rounded-3xl border border-white/15 bg-neutral-900 p-5 shadow-2xl">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-bold text-white">
                {heroProduct ? `${heroProduct.model} — instalments` : "Estimate monthly payment"}
              </span>
              <button
                type="button"
                onClick={() => setCalcOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white"
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
