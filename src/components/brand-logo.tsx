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

/**
 * Brand logo shown beside the brand name. The logo sits in a light rounded
 * container so dark logos stay visible in dark mode, and `object-contain`
 * preserves each logo's proportions. If the asset can't load, we retain the
 * brand name and report the missing logo.
 */
export function BrandLogo({ brand, className }: { brand: BrandRef; className?: string }) {
  const url = BRAND_LOGO_URLS[brand.slug.toLowerCase()];
  const [failed, setFailed] = useState(false);
  const showLogo = !!url && !failed;

  if (!showLogo) {
    if (url && !failed) {
      // only warn once via the render path when it actually fails
    }
    return (
      <span className={cn("text-xs font-bold text-foreground", className)}>{brand.name}</span>
    );
  }

  return (
    <span className={cn("inline-flex h-6 min-w-10 items-center justify-center rounded-md bg-white px-1.5", className)}>
      <img
        src={url}
        alt={brand.name}
        className="max-h-4 w-auto max-w-20 object-contain"
        onError={() => {
          console.warn(`[BrandLogo] logo unavailable for "${brand.slug}" — showing brand name`);
          setFailed(true);
        }}
      />
    </span>
  );
}
