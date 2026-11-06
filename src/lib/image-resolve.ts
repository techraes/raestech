import type { Product } from "@/types";
import manifest from "@/data/image-manifest.json";
import { useImageApprovals, type ApprovalDecision } from "@/store/imageApprovals";

export interface ManifestEntry {
  slug: string;
  brand: string;
  model: string;
  qaStatus: string;
  asset1280?: string | null;
  asset600?: string | null;
  productImageBasename: string;
}

interface ManifestShape {
  entries: ManifestEntry[];
}

const DATA = manifest as unknown as ManifestShape;

/** Product image basename (e.g. "apple-iphone-12-mini") used as the manifest key. */
export function slugFromProduct(product: Product): string {
  const img = product.image || "";
  return img.replace(/\.(jpe?g|png|webp)$/i, "");
}

export function getManifestEntry(slug: string): ManifestEntry | undefined {
  return DATA.entries.find((e) => e.slug === slug);
}

export function getManifestEntries(): ManifestEntry[] {
  return DATA.entries;
}

/**
 * Resolve the approved concept-image URL for a product, given the current
 * decisions map. Returns null when no concept is approved, or the model is
 * reference-only / hold / has no asset. Approval is strictly admin-gated.
 */
export function getApprovedConceptSrc(product: Product, decisions: Record<string, ApprovalDecision>): string | null {
  const slug = slugFromProduct(product);
  const entry = getManifestEntry(slug);
  // All imported concepts now display by default (approval gate removed).
  // Reference-only models have no imported asset and intentionally keep their
  // existing image. An admin can still opt out per-model via Reject/“Keep existing”.
  if (!entry || !entry.asset1280 || entry.qaStatus === "reference_only") return null;
  if (decisions[slug] === "rejected") return null;
  return entry.asset1280;
}

/** Convenience for non-component code: reads the current store state. */
export function getApprovedConceptSrcStatic(product: Product): string | null {
  return getApprovedConceptSrc(product, useImageApprovals.getState().decisions);
}

/** Reactive hook — subscribes to approval changes so the UI updates instantly. */
export function useApprovedConceptSrc(product: Product): string | null {
  const decisions = useImageApprovals((s) => s.decisions);
  return getApprovedConceptSrc(product, decisions);
}
