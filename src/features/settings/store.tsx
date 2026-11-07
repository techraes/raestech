import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { SiteSettings, HomepageSection, PaymentMethod, SocialLinks, SeoAnalytics, ThemeTokens, UserRole } from "@/types";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/features/auth/AuthContext";
import { ADMIN_ROLES } from "@/features/auth/permissions";

export const DEFAULT_THEME: ThemeTokens = {
  accentColor: "#efeff1",
  backgroundColor: "#f7f7f8",
  headerColor: "#ffffff",
  footerColor: "#111111",
  buttonColor: "#111111",
  buttonHoverColor: "#1c1c1e",
  textColor: "#171717",
  linkColor: "#171717",
  borderColor: "#e6e6e8",
  fontFamily: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  headingFont: "ui-sans-serif, system-ui, sans-serif",
  radiusScale: 1,
};

export const DEFAULT_HOMEPAGE_SECTIONS: HomepageSection[] = [
  { id: "s-hero", kind: "hero", title: "RAES TECH", subtitle: "Premium smartphones, honest prices.", buttonText: "Browse catalogue", buttonLink: "/catalog", enabled: true, sort: 0 },
  { id: "s-announcement", kind: "announcement", title: "Announcement", enabled: true, sort: 1 },
  { id: "s-brands", kind: "featuredBrands", title: "Featured brands", enabled: true, sort: 2 },
  { id: "s-bestsellers", kind: "bestSellers", title: "Best sellers", enabled: true, sort: 3 },
  { id: "s-new", kind: "newArrivals", title: "New arrivals", enabled: true, sort: 4 },
  { id: "s-buyn", kind: "buyNowPromo", title: "Buy Now and save 10%", subtitle: "Pay in full for a discount on every phone.", buttonText: "Shop now", buttonLink: "/catalog", enabled: true, sort: 5 },
  { id: "s-instal", kind: "instalmentPromo", title: "0% markup instalments", subtitle: "Split the cost. No interest, no guarantor.", buttonText: "Learn more", buttonLink: "/instalments", enabled: true, sort: 6 },
];

export const DEFAULT_PAYMENT_METHODS: PaymentMethod[] = [
  { id: "pm-faysal", code: "faysal_bank", name: "Faysal Bank Manual Transfer", enabled: false, customerDescription: "Manual bank transfer to our Faysal account.", displayOrder: 0, type: "manual", kind: "bank", testMode: false, liveMode: false, verified: false, bankName: "", accountTitle: "", accountNumber: "", iban: "", branch: "", instructions: "" },
  { id: "pm-jazzcash", code: "jazzcash", name: "JazzCash", enabled: false, displayOrder: 1, type: "manual", kind: "mobile_wallet", testMode: false, liveMode: false, verified: false },
  { id: "pm-easypaisa", code: "easypaisa", name: "Easypaisa", enabled: false, displayOrder: 2, type: "manual", kind: "mobile_wallet", testMode: false, liveMode: false, verified: false },
  { id: "pm-bank", code: "bank_transfer", name: "Bank Transfer", enabled: false, displayOrder: 3, type: "manual", kind: "bank", testMode: false, liveMode: false, verified: false },
  { id: "pm-crypto", code: "crypto_usdt", name: "Crypto (USDT)", enabled: false, customerDescription: "Pay with USDT (TRC-20). Send the exact amount to our wallet and upload proof.", displayOrder: 4, type: "manual", kind: "crypto", testMode: false, liveMode: false, verified: false, network: "TRC-20", coinSymbol: "USDT", walletAddress: "", instructions: "" },
  { id: "pm-card", code: "card", name: "Card Payment", enabled: false, customerDescription: "Pay by debit/credit card securely.", displayOrder: 5, type: "online", kind: "card", testMode: false, liveMode: false, verified: false, cardProcessor: "", merchantId: "", instructions: "" },
];

export const DEFAULT_SOCIAL_LINKS: SocialLinks = { instagram: "", facebook: "", tiktok: "", youtube: "", other: [] };

export const DEFAULT_SEO_ANALYTICS: SeoAnalytics = {
  browserTitle: "RAES TECH — Smartphone Store Pakistan",
  defaultSeoDescription: "RAES TECH — Pakistan's premium smartphone store. Buy smartphones with Buy Now discounts or 0% markup instalments.",
  googleAnalyticsId: "",
  googleSearchConsoleVerification: "",
  analyticsEnabled: false,
  canonicalBase: "",
  robotsTxt: "User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /account\nDisallow: /checkout",
  socialImage: "",
  ogType: "website",
};

export const DEFAULT_SETTINGS: SiteSettings = {
  storeName: "RAES TECH",
  tagline: "Premium smartphones, honest prices.",
  domain: "https://raestech.store",
  supportEmail: "support@raestech.store",
  supportPhone: "03499260342",
  whatsapp: "+923499260342",
  instagram: "",
  facebook: "",
  tiktok: "",
  currency: "PKR",
  currencySymbol: "Rs.",
  codEnabled: false,
  buyNowDiscountPercent: 22,
  instalmentDiscountPercent: 11,
  instalmentAdvancePercent: 20,
  instalmentMarkupPercent: 0,
  instalmentTenures: [3, 6, 9, 12],
  shippingCharge: 299,
  freeShippingThreshold: 100000,
  announcementText: "Buy Now and save 10% — or take a phone on 0% markup instalments.",
  primaryColor: "#0a0a0a",
  secondaryColor: "#f5f5f5",

  businessName: "RAES TECH",
  businessAddress: "",
  businessDescription: "",
  country: "Pakistan",
  timezone: "Asia/Karachi",
  dateFormat: "d MMM yyyy",
  language: "en",
  copyrightText: "© {year} RAES TECH. All rights reserved.",
  currencyFormat: "pkr",

  browserTitle: "RAES TECH — Smartphone Store Pakistan",
  defaultSeoDescription: "RAES TECH — Pakistan's premium smartphone store. Buy smartphones with Buy Now discounts or 0% markup instalments.",

  announcementEnabled: true,
  maintenanceMode: false,

  faviconDataUrl: "",
  logoDataUrl: "",

  theme: DEFAULT_THEME,
  homepageSections: DEFAULT_HOMEPAGE_SECTIONS,
  paymentMethods: DEFAULT_PAYMENT_METHODS,
  socialLinks: DEFAULT_SOCIAL_LINKS,
  seoAnalytics: DEFAULT_SEO_ANALYTICS,
};

interface SettingsContextValue {
  settings: SiteSettings;
  saveSetting: (key: keyof SiteSettings, value: unknown) => void;
  patchSettings: (patch: Partial<SiteSettings>) => void;
  resetSettings: () => void;
}

const SettingsContext = createContext<SettingsContextValue>({
  settings: DEFAULT_SETTINGS,
  saveSetting: () => {},
  patchSettings: () => {},
  resetSettings: () => {},
});

const STORAGE_KEY = "raes.settings.v1";

const SCALAR_KEYS: (keyof SiteSettings)[] = [
  "storeName", "tagline", "domain", "supportEmail", "supportPhone", "whatsapp",
  "instagram", "facebook", "tiktok", "currency", "currencySymbol",
  "announcementText", "primaryColor", "secondaryColor",
  "businessName", "businessAddress", "businessDescription", "country",
  "timezone", "dateFormat", "language", "copyrightText", "currencyFormat",
  "browserTitle", "defaultSeoDescription", "faviconDataUrl", "logoDataUrl",
];

const BOOLEAN_KEYS: (keyof SiteSettings)[] = ["codEnabled", "announcementEnabled", "maintenanceMode"];
const NUMBER_KEYS: (keyof SiteSettings)[] = [
  "buyNowDiscountPercent", "instalmentDiscountPercent", "instalmentAdvancePercent", "instalmentMarkupPercent",
  "shippingCharge", "freeShippingThreshold",
];
const JSON_KEYS: (keyof SiteSettings)[] = [
  "instalmentTenures", "theme", "homepageSections", "paymentMethods", "socialLinks", "seoAnalytics",
];

/**
 * Pricing / discount configuration keys. These mirror the server-side
 * `discount_setting_keys()` whitelist (migration 00020) and may only be
 * changed by a Super Admin. The client-side guard below mirrors the RLS
 * policies ("settings_admin_all" → any admin, "discount_settings_superadmin"
 * → Super Admin only) as defense-in-depth; the DB policies remain the real
 * enforcement.
 */
const SENSITIVE_KEYS: ReadonlySet<string> = new Set([
  "buyNowDiscountPercent",
  "instalmentDiscountPercent",
  "instalmentAdvancePercent",
  "instalmentMarkupPercent",
  "instalmentTenures",
  "shippingCharge",
  "freeShippingThreshold",
]);

function snakeToCamel(s: string): string {
  return s.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
}

function readLocalSettings(): Partial<SiteSettings> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Partial<SiteSettings>;
  } catch {
    return {};
  }
}

function writeLocalSettings(settings: SiteSettings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    /* storage full / unavailable — ignore */
  }
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [ready, setReady] = useState(false);

  // Authorization guard (mirrors server-side RLS):
  //  - sensitive pricing/discount keys require the Super Admin;
  //  - all other settings require any admin role;
  //  - non-admins (customers/guests) can never mutate settings here.
  const { user, isSuperAdmin } = useAuth();
  const role: UserRole | undefined = isSuperAdmin ? "super_admin" : (user?.role as UserRole | undefined);
  const isAdmin = (): boolean => role === "super_admin" || (Boolean(role) && ADMIN_ROLES.includes(role as UserRole));
  const canWriteKey = (key: keyof SiteSettings): boolean =>
    SENSITIVE_KEYS.has(key) ? isSuperAdmin : isAdmin();

  useEffect(() => {
    if (!supabase) {
      // Dev/local mode: hydrate from the persistent local mirror (or defaults).
      const local = readLocalSettings();
      setSettings({ ...DEFAULT_SETTINGS, ...local });
      setReady(true);
      return;
    }
    supabase
      .from("public_settings")
      .select("key,value,value_kind")
      .then(({ data, error }) => {
        if (!error && data) {
          const next = { ...DEFAULT_SETTINGS };
          for (const row of data as { key: string; value: string; value_kind: string }[]) {
            const k = snakeToCamel(row.key) as keyof SiteSettings;
            if (!(k in DEFAULT_SETTINGS)) continue;
            if (SCALAR_KEYS.includes(k)) (next as Record<string, unknown>)[k] = row.value;
            else if (BOOLEAN_KEYS.includes(k)) (next as Record<string, unknown>)[k] = row.value === "true";
            else if (NUMBER_KEYS.includes(k)) (next as Record<string, unknown>)[k] = Number(row.value);
            else if (JSON_KEYS.includes(k)) {
              try {
                (next as Record<string, unknown>)[k] = JSON.parse(row.value);
              } catch {
                /* keep default */
              }
            }
          }
          setSettings(next);
        }
        setReady(true);
      });
  }, []);

  function persist(key: keyof SiteSettings, value: unknown) {
    if (!canWriteKey(key)) {
      console.warn(`[settings] blocked write to "${key}": caller lacks permission`);
      return;
    }
    if (!supabase) {
      // local persistence mirror
      setSettings((prev) => {
        const next = { ...prev, [key]: value };
        writeLocalSettings(next);
        return next;
      });
      return;
    }
    const snake = key.replace(/[A-Z]/g, (c) => "_" + c.toLowerCase());
    let v = String(value);
    let kind = "string";
    if (typeof value === "boolean") { v = String(value); kind = "boolean"; }
    else if (typeof value === "number") { v = String(value); kind = "number"; }
    else if (typeof value === "object" && value !== null) { v = JSON.stringify(value); kind = "json"; }
    supabase.from("website_settings").upsert({ key: snake, value: v, value_kind: kind }).then(() => {});
  }

  function saveSetting(key: keyof SiteSettings, value: unknown) {
    persist(key, value);
  }

  function patchSettings(patch: Partial<SiteSettings>) {
    const keys = Object.keys(patch) as (keyof SiteSettings)[];
    // Validate every key up front so an unauthorized patch never partially
    // mutates local state or the DB.
    if (keys.some((k) => !canWriteKey(k))) {
      console.warn("[settings] blocked patch (missing permission):", keys);
      return;
    }
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      if (!supabase) writeLocalSettings(next);
      return next;
    });
    if (supabase) {
      keys.forEach((k) => persist(k, patch[k]));
    }
  }

  function resetSettings() {
    if (!isSuperAdmin) {
      console.warn("[settings] blocked reset: Super Admin required");
      return;
    }
    setSettings(DEFAULT_SETTINGS);
    if (supabase) {
      const client = supabase;
      const all = [...SCALAR_KEYS, ...BOOLEAN_KEYS, ...NUMBER_KEYS, ...JSON_KEYS];
      all.forEach((k) => {
        const snake = k.replace(/[A-Z]/g, (c) => "_" + c.toLowerCase());
        client.from("website_settings").delete().eq("key", snake).then(() => {});
      });
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  const value = useMemo(() => ({ settings, saveSetting, patchSettings, resetSettings }), [settings]);

  if (!ready) {
    return <div className="sr-only">Loading settings…</div>;
  }

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  return useContext(SettingsContext);
}
