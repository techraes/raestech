import { useEffect, useMemo, useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  Search, ShoppingCart, User, Menu, X, MessageCircle, ChevronDown, Heart,
  Truck, Facebook, Instagram, Youtube, MapPin, Mail, Phone, ArrowRight,
  LayoutGrid, Check, ShieldCheck,
} from "lucide-react";
import { useSettings } from "@/features/settings/store";
import { useAuth } from "@/features/auth/AuthContext";
import { useCart } from "@/store/cart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProductImage } from "@/components/product-image";
import { getBrands, allProducts } from "@/data/catalog";
import { cn } from "@/lib/utils";
import type { Product } from "@/types";

const NAV = [
  { label: "Home", to: "/" },
  { label: "Shop", to: "/phones" },
  { label: "iPhone", to: "/brand/apple" },
  { label: "Samsung", to: "/brand/samsung" },
  { label: "Android Phones", to: "/phones" },
  { label: "Instalments", to: "/instalments" },
  { label: "About Us", to: "/about" },
  { label: "Contact Us", to: "/contact" },
];

const SOCIALS = [
  { key: "facebook", icon: Facebook, label: "Facebook" },
  { key: "instagram", icon: Instagram, label: "Instagram" },
  { key: "tiktok", icon: null, label: "TikTok" },
  { key: "youtube", icon: Youtube, label: "YouTube" },
] as const;

export function StorefrontLayout() {
  const { settings } = useSettings();
  const { user, isAdmin } = useAuth();
  const count = useCart((s) => s.count());
  const [query, setQuery] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const navigate = useNavigate();
  const brands = getBrands();

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    return allProducts
      .filter((p) => p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q) || p.model.toLowerCase().includes(q))
      .slice(0, 5);
  }, [query]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Maintenance mode: customers see a maintenance screen; admins can still browse.
  if (settings.maintenanceMode && !isAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
        <div className="rounded-full bg-muted p-4">
          <ShieldCheck className="h-10 w-10 text-muted-foreground" />
        </div>
        <h1 className="mt-4 text-2xl font-black">{settings.storeName}</h1>
        <p className="mt-2 max-w-md text-muted-foreground">We are performing a quick maintenance. Please check back soon.</p>
      </div>
    );
  }

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    setShowSuggestions(false);
    if (query.trim()) navigate(`/search?q=${encodeURIComponent(query.trim())}`);
  }

  function goToProduct(p: Product) {
    setShowSuggestions(false);
    setQuery("");
    navigate(`/product/${p.slug}`);
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* ---- Announcement bar ---- */}
      {settings.announcementEnabled && (
        <div className="bg-neutral-950 text-white">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-1.5 text-[11px] font-medium sm:text-xs">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5">
                <Truck className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Free Nationwide Shipping Across Pakistan</span>
                <span className="sm:hidden">Free Nationwide Shipping</span>
              </span>
              <span className="h-3 w-px bg-white/30" />
              <span className="hidden items-center gap-1.5 lg:inline-flex">
                <Check className="h-3.5 w-3.5" />
                Easy Instalments Available (3, 6, 9, 12 Months)
              </span>
              <span className="inline-flex items-center gap-1.5 lg:hidden">
                <Check className="h-3.5 w-3.5" />
                Easy Instalments
              </span>
            </div>
            <div className="hidden items-center gap-2 sm:flex">
              <span className="text-white/70">Follow Us:</span>
              {SOCIALS.map((s) => {
                const url = (settings.socialLinks as unknown as Record<string, unknown>)?.[s.key] as string | undefined;
                if (!url || !s.icon) return null;
                const Icon = s.icon;
                return (
                  <a key={s.key} href={url} target="_blank" rel="noreferrer" aria-label={s.label} className="text-white/80 transition-colors hover:text-white">
                    <Icon className="h-3.5 w-3.5" />
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ---- Main header ---- */}
      <header className={cn("sticky top-0 z-40 bg-white/90 backdrop-blur-md transition-all duration-300", scrolled ? "border-b border-neutral-200 shadow-sm" : "border-b border-transparent")}>
        <div className="h-0.5 w-full bg-gradient-to-r from-neutral-900 via-neutral-400 to-neutral-900" />
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
          <button className="inline-flex h-10 w-10 items-center justify-center rounded-md hover:bg-neutral-100 lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Menu">
            <Menu className="h-5 w-5" />
          </button>

          <Link to="/" className="flex shrink-0 items-center gap-2">
            {settings.logoDataUrl ? (
              <img src={settings.logoDataUrl} alt={settings.storeName} className="h-9 w-auto max-w-[160px] object-contain" />
            ) : (
              <span className="text-xl font-black tracking-tight text-neutral-950">{settings.storeName}</span>
            )}
          </Link>

          {/* Desktop search */}
          <form onSubmit={submitSearch} className="relative mx-auto hidden w-full max-w-xl flex-1 md:block">
            <div className="relative">
              <Input
                value={query}
                onChange={(e) => { setQuery(e.target.value); setShowSuggestions(true); }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                placeholder="Search for smartphones…"
                className="h-11 rounded-full border-neutral-200 bg-neutral-50 pl-4 pr-12 text-sm"
              />
              <button type="submit" className="absolute right-1.5 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-neutral-950 text-white transition-transform hover:scale-105" aria-label="Search">
                <Search className="h-4 w-4" />
              </button>
            </div>
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full z-50 mt-2 rounded-2xl border bg-white p-2 shadow-xl">
                {suggestions.map((p) => (
                  <button key={p.id} type="button" onMouseDown={() => goToProduct(p)} className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-neutral-50">
                    <span className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border bg-neutral-100">
                      <ProductImage product={p} className="h-full w-full object-cover" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">{p.name}</span>
                      <span className="block text-xs text-neutral-500">{p.brand} · {p.model}</span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </form>

          {/* Right actions */}
          <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
            <Link to="/cart" className="relative inline-flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-neutral-100" aria-label="Cart">
              <ShoppingCart className="h-5 w-5" strokeWidth={1.8} />
              {count > 0 && (
                <span className="absolute right-0.5 top-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-neutral-950 px-1 text-[10px] font-bold text-white">
                  {count}
                </span>
              )}
            </Link>
            <Link to="/wishlist" className="hidden h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-neutral-100 sm:inline-flex" aria-label="Wishlist">
              <Heart className="h-5 w-5" strokeWidth={1.8} />
            </Link>
            {user ? (
              <Link to="/account" className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 text-neutral-900 transition-colors hover:bg-neutral-200" aria-label="My account">
                <User className="h-5 w-5" strokeWidth={1.8} />
              </Link>
            ) : (
              <>
                <Button asChild variant="outline" size="sm" className="h-9 rounded-full px-4">
                  <Link to="/login">Login</Link>
                </Button>
                <Button asChild size="sm" className="h-9 rounded-full px-4">
                  <Link to="/register">Register</Link>
                </Button>
              </>
            )}
            {isAdmin && (
              <Button asChild variant="outline" size="sm" className="ml-1 hidden lg:inline-flex">
                <Link to="/admin">Admin</Link>
              </Button>
            )}
          </div>
        </div>

        {/* Mobile search */}
        <form onSubmit={submitSearch} className="px-4 pb-3 md:hidden">
          <div className="relative">
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search for smartphones…" className="h-10 rounded-full border-neutral-200 bg-neutral-50 pl-4 pr-11 text-sm" />
            <button type="submit" className="absolute right-1.5 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-neutral-950 text-white" aria-label="Search">
              <Search className="h-3.5 w-3.5" />
            </button>
          </div>
        </form>
      </header>

      {/* ---- Desktop navigation row ---- */}
      <nav className="hidden border-b border-neutral-200 bg-white lg:block">
        <div className="mx-auto flex max-w-7xl items-center gap-1 px-4">
          {/* All Categories */}
          <div className="relative mr-2" onMouseEnter={() => setCatOpen(true)} onMouseLeave={() => setCatOpen(false)}>
            <button className="inline-flex h-11 items-center gap-2 rounded-full bg-neutral-950 px-5 text-sm font-semibold text-white transition-transform hover:scale-[1.02]">
              <LayoutGrid className="h-4 w-4" /> All Categories <ChevronDown className="h-3.5 w-3.5" />
            </button>
            {catOpen && (
              <div className="absolute left-0 top-full z-50 mt-2 w-64 rounded-2xl border bg-white p-2 shadow-xl animate-fade-in">
                <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-neutral-500">Smartphones</p>
                {brands.map((b) => (
                  <Link key={b.slug} to={`/brand/${b.slug}`} className="block rounded-xl px-3 py-2 text-sm text-neutral-700 transition-colors hover:bg-neutral-50">
                    {b.name}
                  </Link>
                ))}
                <div className="mt-1 border-t pt-1">
                  <Link to="/brand/apple" className="block rounded-xl px-3 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50">
                    JV / SIM-Locked iPhones
                  </Link>
                </div>
              </div>
            )}
          </div>

          {NAV.map((item) => (
            <NavLink
              key={item.label}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                cn(
                  "relative inline-flex h-11 items-center px-3 text-sm font-medium transition-colors",
                  isActive ? "text-neutral-950" : "text-neutral-500 hover:text-neutral-950"
                )
              }
            >
              {({ isActive }) => (
                <>
                  {item.label}
                  <span className={cn("absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-neutral-950 transition-transform duration-300", isActive ? "scale-x-100" : "scale-x-0")} />
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* ---- Mobile drawer ---- */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/45 animate-fade-in" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-[300px] max-w-[85vw] flex-col bg-white shadow-2xl animate-slide-in-left">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <span className="text-lg font-black tracking-tight">{settings.storeName}</span>
              <button onClick={() => setMobileOpen(false)} className="inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-neutral-100" aria-label="Close menu">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              {NAV.map((item) => (
                <Link key={item.label} to={item.to} onClick={() => setMobileOpen(false)} className="block rounded-xl px-3 py-2.5 text-sm font-medium text-neutral-800 hover:bg-neutral-50">
                  {item.label}
                </Link>
              ))}
              <p className="px-3 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Brands</p>
              {brands.map((b) => (
                <Link key={b.slug} to={`/brand/${b.slug}`} onClick={() => setMobileOpen(false)} className="block rounded-xl px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-50">
                  {b.name}
                </Link>
              ))}
              <Link to="/brand/apple" onClick={() => setMobileOpen(false)} className="block rounded-xl px-3 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-50">
                JV / SIM-Locked iPhones
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ---- Page content ---- */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* ---- Footer ---- */}
      <footer className="border-t bg-neutral-950 text-neutral-300">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-3">
            {settings.logoDataUrl ? (
              <img src={settings.logoDataUrl} alt={settings.storeName} className="h-8 w-auto object-contain" />
            ) : (
              <p className="text-lg font-bold text-white">{settings.storeName}</p>
            )}
            <p className="text-sm text-neutral-400">{settings.businessDescription || settings.tagline}</p>
            <div className="space-y-1.5 text-sm text-neutral-400">
              {settings.whatsapp && (
                <p className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" /> {settings.whatsapp}</p>
              )}
              {settings.supportEmail && (
                <p className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" /> {settings.supportEmail}</p>
              )}
              {settings.businessAddress && (
                <p className="flex items-start gap-2"><MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {settings.businessAddress}</p>
              )}
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <p className="font-semibold text-white">Shop</p>
            <Link to="/phones" className="block text-neutral-400 hover:text-white">All Smartphones</Link>
            <Link to="/best-sellers" className="block text-neutral-400 hover:text-white">Best Sellers</Link>
            <Link to="/new-arrivals" className="block text-neutral-400 hover:text-white">New Arrivals</Link>
            <Link to="/instalments" className="block text-neutral-400 hover:text-white">Instalments</Link>
            <Link to="/compare" className="block text-neutral-400 hover:text-white">Compare</Link>
          </div>

          <div className="space-y-2 text-sm">
            <p className="font-semibold text-white">Support</p>
            <Link to="/about" className="block text-neutral-400 hover:text-white">About Us</Link>
            <Link to="/contact" className="block text-neutral-400 hover:text-white">Contact Us</Link>
            <Link to="/payment-instructions" className="block text-neutral-400 hover:text-white">Payment Instructions</Link>
            <Link to="/instalments" className="block text-neutral-400 hover:text-white">Instalment Info</Link>
            <Link to="/shipping" className="block text-neutral-400 hover:text-white">Shipping Policy</Link>
          </div>

          <div className="space-y-2 text-sm">
            <p className="font-semibold text-white">Policies</p>
            <Link to="/returns" className="block text-neutral-400 hover:text-white">Returns & Refunds</Link>
            <Link to="/warranty" className="block text-neutral-400 hover:text-white">Warranty Policy</Link>
            <Link to="/privacy" className="block text-neutral-400 hover:text-white">Privacy Policy</Link>
            <Link to="/terms" className="block text-neutral-400 hover:text-white">Terms & Conditions</Link>
          </div>
        </div>

        <div className="border-t border-white/10">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-5 text-xs text-neutral-500 sm:flex-row">
            <p>{settings.copyrightText.replace("{year}", String(new Date().getFullYear()))}</p>
            <div className="flex items-center gap-3">
              {SOCIALS.map((s) => {
                const url = (settings.socialLinks as unknown as Record<string, unknown>)?.[s.key] as string | undefined;
                if (!url || !s.icon) return null;
                const Icon = s.icon;
                return (
                  <a key={s.key} href={url} target="_blank" rel="noreferrer" aria-label={s.label} className="text-neutral-400 transition-colors hover:text-white">
                    <Icon className="h-4 w-4" />
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp */}
      {settings.whatsapp && (
        <a
          href={`https://wa.me/${settings.whatsapp.replace(/\+/g, "").replace(/[^0-9]/g, "")}?text=Hello, I have a question about your phones.`}
          target="_blank"
          rel="noreferrer"
          className="fixed bottom-5 right-5 z-40 inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg transition-transform hover:scale-105"
          aria-label="Chat on WhatsApp"
        >
          <MessageCircle className="h-6 w-6" />
        </a>
      )}
    </div>
  );
}
