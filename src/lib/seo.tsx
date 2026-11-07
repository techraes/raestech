import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useSettings } from "@/features/settings/store";

/**
 * Lightweight, dependency-free SEO head manager for the RAES TECH storefront.
 *
 * Rendered as <Seo …/> inside a page, it sets the document title, meta
 * description, canonical link, robots meta, Open Graph / Twitter tags and
 * JSON-LD structured data on the live <head>. It is a client-side manager:
 * it runs after the React app mounts and keeps the DOM <head> in sync with the
 * active route. It does not by itself make the server-returned HTML contain the
 * tags (see docs for prerendering/SSR notes), but it provides correct, unique
 * metadata for every public page that Google and social crawlers consume after
 * JavaScript rendering.
 */

export interface SeoJsonLd {
  "@context": string;
  "@type": string;
  [key: string]: unknown;
}

interface SeoProps {
  /** Page title (appended with store name automatically if desired). */
  title?: string;
  /** Meta description. */
  description?: string;
  /** Path used for the canonical URL. Defaults to the current route path. */
  canonicalPath?: string;
  /** Absolute or site-relative image path for OG/Twitter. */
  image?: string;
  /** When true, sets robots to noindex, nofollow (private/utility pages). */
  noindex?: boolean;
  /** Open Graph type. Default: website. */
  type?: string;
  /** JSON-LD structured data to inject. */
  jsonLd?: SeoJsonLd | SeoJsonLd[];
}

function ensureMeta(name: string, isProperty = false): HTMLMetaElement {
  const attr = isProperty ? "property" : "name";
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  return el;
}

function setMetaContent(name: string, content: string, isProperty = false) {
  ensureMeta(name, isProperty).setAttribute("content", content);
}

function removeMetas(selector: string) {
  document.head.querySelectorAll(selector).forEach((el) => el.remove());
}

function setCanonical(href: string) {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "canonical");
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

function setJsonLd(json: SeoJsonLd[] | undefined) {
  const id = "__seo_jsonld__";
  let el = document.getElementById(id) as HTMLScriptElement | null;
  if (!el) {
    el = document.createElement("script");
    el.id = id;
    el.type = "application/ld+json";
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(json ?? []);
}

/** Convert a site-relative path into an absolute URL using the canonical base. */
function absoluteUrl(base: string, path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  return base.replace(/\/$/, "") + (path.startsWith("/") ? path : `/${path}`);
}

export function Seo({
  title,
  description,
  canonicalPath,
  image,
  noindex,
  type = "website",
  jsonLd,
}: SeoProps) {
  const { settings } = useSettings();
  const location = useLocation();

  useEffect(() => {
    const seo = settings.seoAnalytics;
    const base = (seo.canonicalBase || settings.domain).replace(/\/$/, "");
    const path = canonicalPath ?? location.pathname;
    const canonical = base + (path.startsWith("/") ? path : `/${path}`);
    const storeName = settings.storeName || "RAES TECH";
    const fallbackTitle = seo.browserTitle || `${storeName} — Smartphone Store Pakistan`;
    const fallbackDesc = seo.defaultSeoDescription;
    const finalTitle = title ? title : fallbackTitle;
    const finalDesc = description ?? fallbackDesc;
    const ogImage = image || seo.socialImage;

    document.title = finalTitle;
    setMetaContent("description", finalDesc);
    setCanonical(canonical);
    setMetaContent("robots", noindex ? "noindex, nofollow" : "index, follow");

    setMetaContent("og:title", finalTitle, true);
    setMetaContent("og:description", finalDesc, true);
    setMetaContent("og:url", canonical, true);
    setMetaContent("og:type", type, true);
    setMetaContent("og:site_name", storeName, true);
    setMetaContent("twitter:card", "summary_large_image");
    setMetaContent("twitter:title", finalTitle);
    setMetaContent("twitter:description", finalDesc);

    if (ogImage) {
      const img = absoluteUrl(base, ogImage);
      setMetaContent("og:image", img, true);
      setMetaContent("twitter:image", img);
    } else {
      removeMetas('meta[property="og:image"], meta[name="twitter:image"]');
    }

    setJsonLd(jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : undefined);
  }, [
    title,
    description,
    canonicalPath,
    image,
    noindex,
    type,
    jsonLd,
    location.pathname,
    settings.seoAnalytics,
    settings.domain,
    settings.storeName,
  ]);

  return null;
}

/**
 * Site-wide head defaults that apply regardless of route: keeps the Google
 * Search Console verification tag in sync with the stored verification token.
 */
export function useSitewideSeo() {
  const { settings } = useSettings();

  useEffect(() => {
    const token = settings.seoAnalytics.googleSearchConsoleVerification?.trim();
    if (!token) return; // keep the static <meta> shipped in index.html
    let el = document.head.querySelector<HTMLMetaElement>('meta[name="google-site-verification"]');
    if (!el) {
      el = document.createElement("meta");
      el.setAttribute("name", "google-site-verification");
      document.head.appendChild(el);
    }
    el.setAttribute("content", token);
  }, [settings.seoAnalytics.googleSearchConsoleVerification]);
}
