import { useEffect, useMemo, useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  Search, ShoppingCart, User, Menu, X, MessageCircle, ChevronDown, Heart,
  Facebook, Instagram, Youtube, MapPin, Mail, Phone, LayoutGrid, ShieldCheck,
} from "lucide-react";
import { useSettings } from "@/features/settings/store";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/features/auth/AuthContext";
import { useCart } from "@/store/cart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProductImage } from "@/components/product-image";
import { BrandLogo } from "@/components/brand-logo";
import { getBrands, useProducts } from "@/data/catalog";
import { cn } from "@/lib/utils";
import type { Product } from "@/types";

const NAV = [
  { label: "Home", to: "/" },
  { label: "Shop", to: "/phones" },
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
  const [brandOpen, setBrandOpen] = useState(false);
  const navigate = useNavigate();
  const brands = getBrands();
  const products = useProducts();

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    return products
      .filter((p) => p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q) || p.model.toLowerCase().includes(q))
      .slice(0, 5);
  }, [query, products]);

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

  const suggestionPanel = suggestions.length > 0 ? (
    <div className="absolute left-0 right-0 top-full z-50 mt-2 rounded-2xl border bg-white p-2 shadow-xl">
      {suggestions.map((p) => (
        <button key={p.id} type="button" onMouseDown={() => goToProduct(p)} className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-muted">
          <span className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border-border border bg-muted">
            <ProductImage product={p} className="h-full w-full object-cover" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium">{p.name}</span>
            <span className="block text-xs text-muted-foreground">{p.brand} · {p.model}</span>
          </span>
        </button>
      ))}
    </div>
  ) : null;

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* ---- Slim sale strip (active offer settings) ---- */}
      {settings.announcementEnabled && (
        <Link
          to="/phones"
          className="block bg-gradient-to-r from-red-700 via-red-600 to-orange-500 text-white"
        >
          <div className="mx-auto max-w-7xl px-4 py-1.5 text-center">
            <p className="text-xs font-extrabold uppercase tracking-[0.08em] sm:text-sm">
              {settings.buyNowDiscountPercent}% OFF on Buy Now · {settings.instalmentDiscountPercent}% OFF on Instalments
            </p>
          </div>
        </Link>
      )}

      {/* ---- Sticky compact header row (menu / logo / search / actions) ---- */}
      <header className={cn("sticky top-0 z-40 bg-background/90 backdrop-blur-md transition-all duration-300", scrolled ? "border-b border-border shadow-sm" : "border-b border-transparent")}>
        <div className="h-0.5 w-full bg-gradient-to-r from-neutral-900 via-neutral-400 to-neutral-900" />
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
          <button className="inline-flex h-10 w-10 items-center justify-center rounded-md hover:bg-muted lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Menu">
            <Menu className="h-5 w-5" />
          </button>

          <Link to="/" className="flex shrink-0 items-center gap-2">
            {settings.logoDataUrl ? (
              <img src={settings.logoDataUrl} alt={settings.storeName} className="h-9 w-auto max-w-[160px] object-contain" />
            ) : (
              <span className="text-xl font-black tracking-tight text-foreground">{settings.storeName}</span>
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
                className="h-11 rounded-full border-border bg-muted pl-4 pr-12 text-sm"
              />
              <button type="submit" className="absolute right-1.5 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform hover:scale-105" aria-label="Search">
                <Search className="h-4 w-4" />
              </button>
            </div>
            {showSuggestions && suggestionPanel}
          </form>

          {/* Right actions */}
          <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
            <Link to="/cart" className="relative inline-flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-muted" aria-label="Cart">
              <ShoppingCart className="h-5 w-5" strokeWidth={1.8} />
              {count > 0 && (
                <span className="absolute right-0.5 top-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                  {count}
                </span>
              )}
            </Link>
            <Link to="/wishlist" className="hidden h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-muted sm:inline-flex" aria-label="Wishlist">
              <Heart className="h-5 w-5" strokeWidth={1.8} />
            </Link>
            <ThemeToggle />
            {user ? (
              <Link to="/account" className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-muted text-foreground transition-colors hover:bg-secondary" aria-label="My account">
                <User className="h-5 w-5" strokeWidth={1.8} />
              </Link>
            ) : (
              <>
                <Button asChild variant="outline" size="sm" className="h-9 rounded-full px-3.5 sm:px-4">
                  <Link to="/login">Login</Link>
                </Button>
                <Button asChild size="sm" className="hidden h-9 rounded-full px-4 sm:inline-flex">
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
      </header>

      {/* Mobile full-width search (below the sticky compact row) */}
      <form onSubmit={submitSearch} className="bg-background px-4 pb-3 pt-2 md:hidden">
        <div className="relative">
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search for smartphones…" className="h-10 rounded-full border-border bg-muted pl-4 pr-11 text-sm" />
          <button type="submit" className="absolute right-1.5 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-primary-foreground" aria-label="Search">
            <Search className="h-3.5 w-3.5" />
          </button>
        </div>
      </form>

      {/* ---- Desktop navigation row ---- */}
      <nav className="hidden border-b border-border bg-background lg:block">
        <div className="mx-auto flex max-w-7xl items-center gap-1 px-4">
          {/* Brands grouped under a dropdown */}
          <div className="relative mr-2" onMouseEnter={() => setBrandOpen(true)} onMouseLeave={() => setBrandOpen(false)}>
            <button className="inline-flex h-11 items-center gap-2 rounded-full border border-border bg-muted px-5 text-sm font-semibold text-foreground transition-colors hover:bg-secondary">
              <LayoutGrid className="h-4 w-4" /> Brands <ChevronDown className="h-3.5 w-3.5" />
            </button>
            {brandOpen && (
              <div className="absolute left-0 top-full z-50 mt-2 w-64 rounded-2xl border-border border bg-popover p-2 shadow-xl animate-fade-in">
                {brands.map((b) => (
                  <Link
                    key={b.slug}
                    to={`/brand/${b.slug}`}
                    onClick={() => setBrandOpen(false)}
                    className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted"
                  >
                    <BrandLogo brand={b} showFallbackName={false} />
                    <span>{b.name}</span>
                  </Link>
                ))}
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
                  isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                )
              }
            >
              {({ isActive }) => (
                <>
                  {item.label}
                  <span className={cn("absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-foreground transition-transform duration-300", isActive ? "scale-x-100" : "scale-x-0")} />
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
          <div className="absolute inset-y-0 left-0 flex w-[300px] max-w-[85vw] flex-col bg-background shadow-2xl animate-slide-in-left">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <span className="text-lg font-black tracking-tight">{settings.storeName}</span>
              <button onClick={() => setMobileOpen(false)} className="inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-muted" aria-label="Close menu">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              {NAV.map((item) => (
                <Link key={item.label} to={item.to} onClick={() => setMobileOpen(false)} className="block rounded-xl px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted">
                  {item.label}
                </Link>
              ))}
              <p className="px-3 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Brands</p>
              {brands.map((b) => (
                <Link key={b.slug} to={`/brand/${b.slug}`} onClick={() => setMobileOpen(false)} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted-foreground hover:bg-muted">
                  <BrandLogo brand={b} showFallbackName={false} />
                  <span>{b.name}</span>
                </Link>
              ))}

              <div className="mt-3 border-t pt-3">
                {user ? (
                  <Link to="/account" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 rounded-xl bg-muted px-3 py-2.5 text-sm font-medium text-foreground">
                    <User className="h-4 w-4" /> My Account
                  </Link>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <Button asChild variant="outline" size="sm" className="rounded-full">
                      <Link to="/login" onClick={() => setMobileOpen(false)}>Login</Link>
                    </Button>
                    <Button asChild size="sm" className="rounded-full">
                      <Link to="/register" onClick={() => setMobileOpen(false)}>Register</Link>
                    </Button>
                  </div>
                )}
                <Link to="/wishlist" onClick={() => setMobileOpen(false)} className="mt-2 flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted">
                  <Heart className="h-4 w-4" /> Wishlist
                </Link>
              </div>
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

          <div>
            <p className="mb-3 text-sm font-semibold text-white">Shop</p>
            <ul className="space-y-2 text-sm">
              <li><Link to="/phones" className="text-neutral-400 transition-colors hover:text-white">All Phones</Link></li>
              <li><Link to="/instalments" className="text-neutral-400 transition-colors hover:text-white">Instalments</Link></li>
              <li><Link to="/best-sellers" className="text-neutral-400 transition-colors hover:text-white">Best Sellers</Link></li>
              <li><Link to="/new-arrivals" className="text-neutral-400 transition-colors hover:text-white">New Arrivals</Link></li>
            </ul>
          </div>

          <div>
            <p className="mb-3 text-sm font-semibold text-white">Brands</p>
            <ul className="space-y-2 text-sm">
              {brands.slice(0, 6).map((b) => (
                <li key={b.slug}><Link to={`/brand/${b.slug}`} className="text-neutral-400 transition-colors hover:text-white">{b.name}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <p className="mb-3 text-sm font-semibold text-white">Company</p>
            <ul className="space-y-2 text-sm">
              <li><Link to="/about" className="text-neutral-400 transition-colors hover:text-white">About Us</Link></li>
              <li><Link to="/contact" className="text-neutral-400 transition-colors hover:text-white">Contact Us</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-4 text-xs text-neutral-500 sm:flex-row">
            <span>{settings.copyrightText.replace("{year}", String(new Date().getFullYear()))}</span>
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
