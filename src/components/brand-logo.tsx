import { useState } from "react";
import { cn } from "@/lib/utils";

export interface BrandRef {
  name: string;
  slug: string;
}

/**
 * Hosted official brand logo sources (Wikimedia Commons). These are reliable,
 * openly-licensed brand assets. The component falls back to the plain brand
 * name when a logo is unavailable (e.g. offline) and reports it to the console.
 */
const BRAND_LOGO_URLS: Record<string, string> = {
  apple: "https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg",
  google: "https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg",
  samsung: "https://upload.wikimedia.org/wikipedia/commons/2/24/Samsung_Logo.svg",
  xiaomi: "https://upload.wikimedia.org/wikipedia/commons/a/ae/Xiaomi_logo.svg",
  motorola: "https://upload.wikimedia.org/wikipedia/commons/3/39/Motorola_logo.svg",
};

interface BrandLogoProps {
  brand: BrandRef;
  className?: string;
  /**
   * Show the brand name when the logo asset is missing or fails to load.
   * Set to `false` when the caller renders the name itself so the name is
   * never duplicated, and the identity appears exactly once.
   */
  showFallbackName?: boolean;
}

/**
 * Brand logo shown beside the brand name. The logo sits in a light rounded
 * container so dark logos stay visible in dark mode, and `object-contain`
 * preserves each logo's proportions. If the asset can't load, we retain the
 * brand name and report the missing logo.
 */
export function BrandLogo({ brand, className, showFallbackName = true }: BrandLogoProps) {
  const url = BRAND_LOGO_URLS[brand.slug.toLowerCase()];
  const [failed, setFailed] = useState(false);
  const showLogo = !!url && !failed;

  if (!showLogo) {
    if (!showFallbackName) return null;
    return (
      <span className={cn("text-xs font-bold text-foreground", className)}>{brand.name}</span>
    );
  }

  return (
    <span className={cn("inline-flex h-6 min-w-10 items-center justify-center rounded-md bg-white px-1.5", className)}>
      <img
        src={url}
        alt=""
        aria-hidden="true"
        className="max-h-4 w-auto max-w-20 object-contain"
        onError={() => {
          console.warn(`[BrandLogo] logo unavailable for "${brand.slug}" — showing brand name`);
          setFailed(true);
        }}
      />
    </span>
  );
}
