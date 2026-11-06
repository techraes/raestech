import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ShieldCheck, Truck, Percent, RotateCcw, SlidersHorizontal, Lock, Headphones, BadgeCheck } from "lucide-react";

import { useSettings } from "@/features/settings/store";
import { useProducts, newArrivals, getBrands } from "@/data/catalog";
import { ProductGrid } from "@/components/product-card";
import { HeroInstalmentCalculator } from "@/components/hero-instalment-calculator";
import { Reveal } from "@/components/reveal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { buyNowPrice } from "@/lib/pricing";
import { formatPKR } from "@/lib/utils";
import type { Product } from "@/types";

export function HomePage() {
  const { settings } = useSettings();
  const fresh = newArrivals();
  const brands = getBrands();
  const allProducts = useProducts();
  const [sort, setSort] = useState<"default" | "price-asc" | "price-desc" | "newest">("default");
  const [minS, setMinS] = useState("");
  const [maxS, setMaxS] = useState("");

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
  }, [sort, minS, maxS, settings, allProducts]);

  const heroSection = settings.homepageSections.find((s) => s.kind === "hero" && s.enabled);

  return (
    <div className="space-y-12">
      {/* Cinematic hero */}
      <section className="relative overflow-hidden bg-neutral-950 text-white">
        <div className="pointer-events-none absolute -right-32 -top-24 h-96 w-96 rounded-full bg-[radial-gradient(circle,rgba(183,166,217,0.35),transparent_60%)] animate-drift" />
        <div className="pointer-events-none absolute -left-24 bottom-0 h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.08),transparent_60%)]" />
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "linear-gradient(115deg, transparent 40%, rgba(255,255,255,0.045) 45%, transparent 50%, rgba(255,255,255,0.03) 55%, transparent 60%)",
          }}
        />
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-12 lg:grid-cols-2 lg:py-16">
          <div className="relative z-10">
            <Reveal direction="down">
              <span className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/70">
                RAES TECH
              </span>
            </Reveal>
            <Reveal delay={80}>
              <h1 className="mt-5 text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl xl:text-6xl">
                {heroSection?.title || "UPGRADE YOUR TECH. PAY YOUR WAY."}
              </h1>
            </Reveal>
            <Reveal delay={160}>
              <p className="mt-4 max-w-md text-base text-neutral-300">
                {heroSection?.subtitle || "Latest Smartphones with Flexible Instalment Plans"}
              </p>
            </Reveal>
            <Reveal delay={240}>
              <Button asChild size="lg" className="mt-8 rounded-full bg-white text-black hover:bg-neutral-200">
                <Link to={heroSection?.buttonLink || "/phones"}>{heroSection?.buttonText || "Shop Now"} <ArrowRight className="h-4 w-4" /></Link>
              </Button>
            </Reveal>
            <Reveal delay={320}>
              <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
                {[
                  { icon: BadgeCheck, label: "100% Original Products" },
                  { icon: Truck, label: "Free Nationwide Shipping" },
                  { icon: Lock, label: "Secure Payments" },
                  { icon: Headphones, label: "Customer Support" },
                ].map((f) => (
                  <div key={f.label} className="flex items-center gap-2 text-[13px] text-neutral-300">
                    <f.icon className="h-4 w-4 shrink-0 text-white/70" />
                    <span>{f.label}</span>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>

          {/* Right: instalment calculator (replaces phone mockup) */}
          <div className="relative hidden items-center justify-center lg:flex">
            <HeroInstalmentCalculator />
          </div>
        </div>
      </section>

      {/* Floating category bar */}
      <section className="relative z-20 mx-auto -mt-9 max-w-7xl px-4">
        <Reveal>
          <div className="overflow-x-auto rounded-3xl border-border border bg-card p-3 shadow-xl sm:p-4">
            <div className="flex min-w-max gap-3">
              {brands.map((b) => (
                <Link
                  key={b.slug}
                  to={`/brand/${b.slug}`}
                  className="flex min-w-[104px] flex-col items-center justify-center rounded-2xl bg-muted px-4 py-4 text-sm font-bold text-foreground transition-all duration-300 hover:-translate-y-1 hover:bg-secondary hover:shadow-md"
                >
                  {b.name}
                </Link>
              ))}
              <Link
                to="/brand/apple"
                className="flex min-w-[104px] flex-col items-center justify-center rounded-2xl border-border border bg-card px-4 py-4 text-sm font-bold text-foreground transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
              >
                JV iPhones
              </Link>
            </div>
          </div>
        </Reveal>
      </section>

      {/* Trust strip */}
      <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { icon: Percent, title: "10% Buy-Now OFF", sub: "Pay in full, pay less" },
          { icon: Truck, title: "Nationwide Delivery", sub: "Across Pakistan" },
          { icon: ShieldCheck, title: "PTA Status Disclosed", sub: "Verified honestly" },
          { icon: RotateCcw, title: "0% Markup Instalments", sub: "3–12 months" },
        ].map((f, i) => (
          <Reveal key={f.title} delay={i * 70}>
            <div className="rounded-2xl border bg-card p-5 card-lift h-full">
              <f.icon className="mb-3 h-6 w-6" />
              <p className="text-sm font-semibold">{f.title}</p>
              <p className="text-xs text-muted-foreground">{f.sub}</p>
            </div>
          </Reveal>
        ))}
      </section>

      {/* Browse all phones (sort + price range) */}
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

      {/* New arrivals */}
      <section>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-2xl font-bold">New arrivals</h2>
          <Button asChild variant="ghost">
            <Link to="/new-arrivals">View all <ArrowRight className="h-4 w-4" /></Link>
          </Button>
        </div>
        <Reveal>
          <ProductGrid products={fresh} />
        </Reveal>
      </section>

      {/* Easy instalments promo */}
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
            <p className="text-xs text-neutral-400">Advance 20% · 0% markup · 3/6/9/12 months</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="rounded-3xl border bg-card p-8 text-center sm:p-12">
        <Reveal>
          <h2 className="text-2xl font-bold sm:text-3xl">Not sure how to pay?</h2>
          <p className="mx-auto mt-2 max-w-lg text-muted-foreground">
            Pay in full with a 10% discount, or apply for an instalment plan with a 20% advance and 0% markup. No guarantor needed.
          </p>
          <Button asChild size="lg" className="mt-6">
            <Link to="/instalments">View Instalment Information</Link>
          </Button>
        </Reveal>
      </section>

      <p className="text-center text-xs text-muted-foreground">
        {allProducts.length} smartphones currently listed · {settings.currency} {settings.currencySymbol} pricing
      </p>
    </div>
  );
}
