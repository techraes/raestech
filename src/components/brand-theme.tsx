import { useEffect } from "react";
import type { SiteSettings } from "@/types";
import { useTheme } from "@/lib/theme";

/** Convert a hex color to an HSL triplet string ("h s% l%") matching the CSS custom properties. */
function hexToHsl(hex: string): string {
  let h = hex.replace("#", "").trim();
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  if (h.length !== 6) return "0 0% 5%";
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let s = 0;
  let hue = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) hue = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) hue = (b - r) / d + 2;
    else hue = (r - g) / d + 4;
    hue *= 60;
  }
  return `${Math.round(hue)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

/**
 * Applies the persisted branding tokens to the live site:
 *  - theme colours -> CSS custom properties (safe, token-based only)
 *  - fonts, border radius
 *  - browser title, meta description, favicon
 * This is the "publish" layer for the Branding & Appearance module.
 */
export function BrandTheme({ settings }: { settings: SiteSettings }) {
  const { resolvedTheme } = useTheme();
  useEffect(() => {
    const root = document.documentElement;
    const t = settings.theme;
    const set = (name: string, value: string) => root.style.setProperty(name, value);
    const dark = resolvedTheme === "dark";

    // Surface tokens come from admin branding in light mode, and from the
    // `.dark` stylesheet in dark mode. When dark, we must REMOVE any previously
    // applied inline surface tokens — otherwise stale light overrides persist
    // and force a white background / low-contrast text in dark (the bug).
    const SURFACE_TOKENS = [
      "--background", "--foreground",
      "--secondary", "--secondary-foreground",
      "--muted", "--muted-foreground",
      "--border", "--input",
      "--card", "--card-foreground",
      "--popover", "--popover-foreground",
      "--accent", "--accent-foreground",
    ];
    if (dark) {
      for (const k of SURFACE_TOKENS) root.style.removeProperty(k);
    } else {
      set("--background", hexToHsl(t.backgroundColor));
      set("--foreground", hexToHsl(t.textColor));
      set("--secondary", hexToHsl(settings.secondaryColor));
      set("--secondary-foreground", hexToHsl(t.textColor));
      set("--muted", hexToHsl(t.backgroundColor) === hexToHsl("#ffffff") ? "0 0% 96%" : hexToHsl(t.backgroundColor));
      set("--border", hexToHsl(t.borderColor));
    }

    // Accent / interactive tokens apply in both themes.
    set("--primary", hexToHsl(t.buttonColor));
    set("--primary-foreground", hexToHsl("#ffffff"));
    set("--accent", hexToHsl(t.accentColor));
    set("--ring", hexToHsl(t.buttonColor));
    set("--radius", `${t.radiusScale}rem`);

    // Header / footer: in dark use the card surface so they don't flash white.
    root.style.setProperty("--header-bg", dark ? "hsl(216 25% 10%)" : t.headerColor);
    root.style.setProperty("--footer-bg", dark ? "hsl(216 25% 10%)" : t.footerColor);
    root.style.setProperty("font-family", t.fontFamily);

    document.title = settings.seoAnalytics?.browserTitle || settings.browserTitle || "RAES TECH";

    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", settings.defaultSeoDescription || "");

    let favicon = document.querySelector('link[rel="icon"]');
    if (!favicon) {
      favicon = document.createElement("link");
      favicon.setAttribute("rel", "icon");
      document.head.appendChild(favicon);
    }
    if (settings.faviconDataUrl) favicon.setAttribute("href", settings.faviconDataUrl);
  }, [settings, resolvedTheme]);

  return null;
}
