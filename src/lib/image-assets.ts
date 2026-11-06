import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { ImageAsset, ImageAssetKind } from "@/types";

export const IMAGE_STAGING_BUCKET = "product-images-staging";
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // bucket limit is 10 MB

export function slugify(s: string): string {
  return s.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

/** Stable mapped asset key (matches the server-side import engine). */
export function assetKey(
  brand: string,
  model: string,
  slug: string,
  sku: string | undefined,
  kind: ImageAssetKind,
  subKind: string
): string {
  return [brand, model, slug, sku ?? "", kind, subKind].join("|").toLowerCase();
}

/**
 * Compute the SHA-256 hex digest of a File (used for duplicate detection and
 * idempotent imports). Works in browser via Web Crypto.
 */
export async function fileSha256(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Derive a safe storage path inside the private bucket. */
export function storagePathFor(brand: string, slug: string, kind: ImageAssetKind, subKind: string, sha: string): string {
  const ext = kind === "gallery_original" ? "jpg" : "webp";
  return `${slugify(brand)}/${slugify(slug)}/${kind}/${subKind}-${sha.slice(0, 16)}.${ext}`;
}

export type UploadImageResult =
  | { ok: true; path: string; sha256: string }
  | { ok: false; error: string };

/**
 * Upload an image into the PRIVATE staging bucket. Admin-only via RLS; guests
 * never see these objects. Returns the storage path + sha256 for registry row.
 */
export async function uploadStagingImage(
  file: File,
  asset: { brand: string; model: string; productSlug: string; sku?: string; kind: ImageAssetKind; subKind: string }
): Promise<UploadImageResult> {
  if (!isSupabaseConfigured) {
    return { ok: false, error: "Supabase storage is not configured on this deployment." };
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return { ok: false, error: "File exceeds the 10 MB staging limit." };
  }
  const sha = await fileSha256(file);
  const path = storagePathFor(asset.brand, asset.productSlug, asset.kind, asset.subKind, sha);

  const { error } = await supabase!.storage.from(IMAGE_STAGING_BUCKET).upload(path, file, {
    cacheControl: "3600",
    contentType: file.type || "application/octet-stream",
    upsert: false,
  });
  if (error) return { ok: false, error: `Upload failed: ${error.message}` };
  return { ok: true, path, sha256: sha };
}

/** Short-lived signed URL for the private staging bucket. */
export async function getStagingSignedUrl(path: string, expiresIn = 600): Promise<string | null> {
  if (!isSupabaseConfigured) return null;
  const { data } = await supabase!.storage.from(IMAGE_STAGING_BUCKET).createSignedUrl(path, expiresIn);
  return data?.signedUrl ?? null;
}

/**
 * Insert a staged asset registry row. Idempotent by sha256 + source_key via
 * the unique constraints; on conflict we simply fetch the existing row.
 */
export async function insertStagedAsset(asset: Omit<ImageAsset, "id" | "createdAt" | "updatedAt">): Promise<ImageAsset | null> {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase!
    .from("product_image_assets")
    .insert({
      brand: asset.brand,
      model: asset.model,
      product_slug: asset.productSlug,
      sku: asset.sku,
      asset_kind: asset.kind,
      sub_kind: asset.subKind,
      preview_only: asset.previewOnly,
      sha256: asset.sha256,
      source_key: assetKey(asset.brand, asset.model, asset.productSlug, asset.sku, asset.kind, asset.subKind),
      storage_path: asset.storagePath,
      status: asset.status,
      is_featured: asset.isFeatured,
    })
    .select("*")
    .maybeSingle();
  if (error) {
    // If duplicate (unique violation), treat as already-staged duplicate.
    if (error.code === "23505") {
      const { data: found } = await supabase!
        .from("product_image_assets")
        .select("*")
        .eq("sha256", asset.sha256)
        .maybeSingle();
      return found as ImageAsset | null;
    }
    console.error("insertStagedAsset", error);
    return null;
  }
  return data as ImageAsset | null;
}

/** Admin-only review transition (uses security-definer RPC). */
export async function reviewStagedAsset(id: string, decision: "approve" | "reject", note?: string): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseConfigured) return { ok: false, error: "Supabase is not configured." };
  const { error } = await supabase!.rpc("review_image_asset", {
    p_id: id,
    p_decision: decision,
    p_note: note ?? null,
  });
  return error ? { ok: false, error: error.message } : { ok: true };
}

/** Log an import batch (admin). */
export async function insertImportLog(entry: {
  batch: string; kind: string; total: number; staged: number; matchedProducts: number;
  matchedSkus: number; duplicates: number; failed: number; summary: Record<string, unknown>;
}): Promise<void> {
  if (!isSupabaseConfigured) return;
  await supabase!.from("image_import_log").insert(entry);
}
