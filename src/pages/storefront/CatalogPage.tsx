import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { SlidersHorizontal } from "lucide-react";
import { useProducts, getBrands } from "@/data/catalog";
import { ProductGrid } from "@/components/product-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useSettings } from "@/features/settings/store";
import { buyNowPrice } from "@/lib/pricing";
import { formatPKR } from "@/lib/utils";
import type { Product } from "@/types";

export function CatalogPage() {
  const { settings } = useSettings();
  const brands = getBrands();
  const allProducts = useProducts();
  const [brand, setBrand] = useState<string>("all");
  const [sort, setSort] = useState<string>("featured");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [pta, setPta] = useState<string>("all");
  const [storage, setStorage] = useState<string>("all");

  const storages = useMemo(() => {
    const s = new Set<string>();
    for (const p of allProducts) for (const v of p.variants) if (v.storage) s.add(v.storage);
    return [...s].sort((a, b) => (parseInt(a) || 0) - (parseInt(b) || 0));
  }, [allProducts]);

  const PRICE_PRESETS = [
    { label: "Under 50k", min: "", max: "50000" },
    { label: "50k–100k", min: "50000", max: "100000" },
    { label: "100k–200k", min: "100000", max: "200000" },
    { label: "200k+", min: "200000", max: "" },
  ];

  const numMin = Number(minPrice.replace(/,/g, ""));
  const numMax = Number(maxPrice.replace(/,/g, ""));
  const hasMin = minPrice.trim() !== "" && !Number.isNaN(numMin);
  const hasMax = maxPrice.trim() !== "" && !Number.isNaN(numMax);

  const priceOf = (p: Product) => {
    const nums = p.variants.map((v) => buyNowPrice(v.listedPrice, settings.buyNowDiscountPercent)).filter((n) => Number.isFinite(n));
    return nums.length ? Math.min(...nums) : 0;
  };

  const products = useMemo(() => {
    let list = [...allProducts].filter((p) => p.variants.length > 0);
    if (brand !== "all") list = list.filter((p) => p.brand.toLowerCase() === brand.toLowerCase());
    if (pta !== "all") {
      list = list.filter((p) => p.variants.some((v) => {
        const s = v.pta_status.toLowerCase();
        if (pta === "pta") return s.includes("pta approved");
        if (pta === "jv") return /jv|carrier-locked|sim-locked/.test(s);
        return s.includes("non-pta");
      }));
    }
    if (storage !== "all") {
      list = list.filter((p) => p.variants.some((v) => v.storage.toLowerCase() === storage.toLowerCase()));
    }
    if (hasMin) list = list.filter((p) => priceOf(p) >= numMin);
    if (hasMax) list = list.filter((p) => priceOf(p) <= numMax);
    switch (sort) {
      case "price-low-asc": list.sort((a, b) => priceOf(a) - priceOf(b)); break;
      case "price-high-desc": list.sort((a, b) => priceOf(b) - priceOf(a)); break;
      case "newest": list.sort((a, b) => (Number((b as unknown as { created_at?: number }).created_at) || 0) - (Number((a as unknown as { created_at?: number }).created_at) || 0)); break;
      default: break;
    }
    return list;
  }, [brand, sort, minPrice, maxPrice, pta, storage, settings, allProducts]);

  const reset = () => {
    setBrand("all"); setSort("featured"); setMinPrice(""); setMaxPrice("");
    setPta("all"); setStorage("all");
  };

  const priceInput = "h-10 w-full rounded-lg border bg-background px-3 text-sm focus:outline-none";

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">All Smartphones</h1>
          <p className="text-sm text-muted-foreground">{products.length} phones</p>
        </div>
        <span className="text-xs font-medium text-muted-foreground">{products.length} results</span>
      </div>

      {/* Filters */}
      <div className="rounded-2xl border bg-card p-4 shadow-card">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5">
            <Label>Brand</Label>
            <Select value={brand} onValueChange={setBrand}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All brands</SelectItem>
                {brands.map((b) => (
                  <SelectItem key={b.slug} value={b.name}>{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Sort</Label>
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="featured">Featured</SelectItem>
                <SelectItem value="price-low-asc">Price: Low → High</SelectItem>
                <SelectItem value="price-high-desc">Price: High → Low</SelectItem>
                <SelectItem value="newest">Newest</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>PTA status</Label>
            <Select value={pta} onValueChange={setPta}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any</SelectItem>
                <SelectItem value="pta">PTA Approved</SelectItem>
                <SelectItem value="nonpta">Non-PTA</SelectItem>
                <SelectItem value="jv">JV / SIM-Locked</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Storage</Label>
            <Select value={storage} onValueChange={setStorage}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All capacities</SelectItem>
                {storages.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Price range */}
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border bg-background p-3">
          <SlidersHorizontal className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">Price range</span>
          <input value={minPrice} onChange={(e) => setMinPrice(e.target.value)} placeholder="Min" inputMode="numeric"
            aria-label="Minimum price" className={priceInput} style={{ width: 96 }} />
          <span className="text-muted-foreground">–</span>
          <input value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder="Max" inputMode="numeric"
            aria-label="Maximum price" className={priceInput} style={{ width: 96 }} />
          <div className="flex flex-wrap items-center gap-1.5">
            {PRICE_PRESETS.map((p) => (
              <button key={p.label} type="button"
                onClick={() => { setMinPrice(p.min); setMaxPrice(p.max); }}
                className="rounded-full border px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:border-primary hover:text-foreground">
                {p.label}
              </button>
            ))}
          </div>
          <div className="flex flex-1 items-center justify-end gap-2">
            {(hasMin || hasMax) && (
              <span className="text-xs font-medium text-muted-foreground">
                {formatPKR(hasMin ? numMin : 0)} – {formatPKR(hasMax ? numMax : 100000000)}
              </span>
            )}
            <Button variant="outline" size="sm" onClick={reset}>
              <SlidersHorizontal className="h-4 w-4" /> Reset
            </Button>
          </div>
        </div>
      </div>

      <ProductGrid products={products} />

      <p className="text-center text-xs text-muted-foreground">
        Can't find a phone? <Link to="/contact" className="underline">Contact us</Link> and we'll source it.
      </p>
    </div>
  );
}
