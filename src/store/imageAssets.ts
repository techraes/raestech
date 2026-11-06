import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { ImageAsset, ImageImportLogEntry } from "@/types";
import {
  insertStagedAsset,
  reviewStagedAsset,
  uploadStagingImage,
  getStagingSignedUrl,
  assetKey,
} from "@/lib/image-assets";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

interface ImageAssetsState {
  assets: ImageAsset[];
  logs: ImageImportLogEntry[];
  /** Bulk upload progress bookkeeping (per file). */
  uploadProgress: Record<string, { done: number; total: number; status: "uploading" | "done" | "error"; error?: string }>;
  hydrateFromSupabase: () => Promise<void>;
  stageFiles: (files: File[], opts: {
    brand: string; model: string; slug: string; sku?: string; kind: "gallery_original" | "concept_preview"; subKind: ImageAsset["subKind"]; previewOnly: boolean;
  }) => Promise<{ staged: number; duplicates: number; failed: number }>;
  review: (id: string, decision: "approve" | "reject", note?: string) => Promise<void>;
  setFeatured: (id: string, featured: boolean) => Promise<void>;
  addLog: (log: ImageImportLogEntry) => void;
}

let idCounter = 0;
function nextId(): string {
  idCounter += 1;
  return `local-${Date.now()}-${idCounter}`;
}

export const useImageAssetsStore = create<ImageAssetsState>()(
  persist(
    (set, get) => ({
      assets: [],
      logs: [],
      uploadProgress: {},

      hydrateFromSupabase: async () => {
        if (!isSupabaseConfigured) return;
        const { data } = await supabase!.from("product_image_assets").select("*").order("created_at", { ascending: false });
        if (!data) return;
        const assets = (data as Array<Record<string, unknown>>).map((r) => ({
          id: String(r.id),
          brand: String(r.brand ?? ""),
          model: String(r.model ?? ""),
          productSlug: String(r.product_slug ?? ""),
          sku: r.sku ? String(r.sku) : undefined,
          kind: r.asset_kind as ImageAsset["kind"],
          subKind: r.sub_kind as ImageAsset["subKind"],
          previewOnly: Boolean(r.preview_only),
          sha256: r.sha256 ? String(r.sha256) : undefined,
          storagePath: r.storage_path ? String(r.storage_path) : undefined,
          status: r.status as ImageAsset["status"],
          isFeatured: Boolean(r.is_featured),
          reviewNote: r.review_note ? String(r.review_note) : undefined,
          createdAt: String(r.created_at),
          updatedAt: String(r.updated_at),
        }));
        set({ assets });
      },

      stageFiles: async (files, opts) => {
        let staged = 0;
        let duplicates = 0;
        let failed = 0;
        const progress: Record<string, ImageAssetsState["uploadProgress"][string]> = {};

        for (const file of files) {
          const key = file.name + "-" + file.size;
          progress[key] = { done: 0, total: file.size, status: "uploading" };
          set({ uploadProgress: { ...get().uploadProgress, [key]: progress[key] } });

          try {
            const up = await uploadStagingImage(file, {
              brand: opts.brand,
              model: opts.model,
              productSlug: opts.slug,
              sku: opts.sku,
              kind: opts.kind,
              subKind: opts.subKind,
            });
            if (!up.ok) {
              failed += 1;
              progress[key] = { done: file.size, total: file.size, status: "error", error: up.error };
              set({ uploadProgress: { ...get().uploadProgress, [key]: progress[key] } });
              continue;
            }

            const existing = get().assets.find((a) => a.sha256 === up.sha256 || a.storagePath === up.path);
            if (existing) {
              duplicates += 1;
              progress[key] = { done: file.size, total: file.size, status: "done" };
              set({ uploadProgress: { ...get().uploadProgress, [key]: progress[key] } });
              continue;
            }

            // Local preview (data URL) so the review UI works even without a
            // live Supabase connection.
            const previewUrl = await new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onload = () => resolve(String(reader.result ?? ""));
              reader.onerror = () => resolve("");
              reader.readAsDataURL(file);
            });

            const asset: Omit<ImageAsset, "id" | "createdAt" | "updatedAt"> = {
              brand: opts.brand,
              model: opts.model,
              productSlug: opts.slug,
              sku: opts.sku,
              kind: opts.kind,
              subKind: opts.subKind,
              previewOnly: opts.previewOnly,
              sha256: up.sha256,
              storagePath: up.path,
              previewUrl: previewUrl || undefined,
              status: "staged",
              isFeatured: false,
            };

            const real = await insertStagedAsset(asset);
            const finalAsset: ImageAsset = {
              ...asset,
              id: real?.id ?? nextId(),
              createdAt: real?.createdAt ?? new Date().toISOString(),
              updatedAt: real?.updatedAt ?? new Date().toISOString(),
            };
            set({ assets: [finalAsset, ...get().assets] });
            staged += 1;
            progress[key] = { done: file.size, total: file.size, status: "done" };
          } catch (e) {
            failed += 1;
            progress[key] = { done: file.size, total: file.size, status: "error", error: e instanceof Error ? e.message : "Unknown error" };
          }
          set({ uploadProgress: { ...get().uploadProgress, [key]: progress[key] } });
        }

        return { staged, duplicates, failed };
      },

      review: async (id, decision, note) => {
        const real = await reviewStagedAsset(id, decision, note);
        set({
          assets: get().assets.map((a) =>
            a.id === id
              ? { ...a, status: decision === "approve" ? "approved" : "rejected", reviewNote: note ?? a.reviewNote, updatedAt: new Date().toISOString() }
              : a
          ),
        });
        if (!real.ok) {
          // fall back to local state only (no-op result already applied)
          console.warn("review sync warning:", real.error);
        }
      },

      setFeatured: async (id, featured) => {
        set({
          assets: get().assets.map((a) =>
            a.id === id ? { ...a, isFeatured: featured, updatedAt: new Date().toISOString() } : a
          ),
        });
        if (isSupabaseConfigured) {
          await supabase!.from("product_image_assets").update({ is_featured: featured }).eq("id", id);
        }
      },

      addLog: (log) => set({ logs: [log, ...get().logs] }),
    }),
    {
      name: "raestech:image-assets",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

/** Convenience: fetch signed URLs for the currently staged assets (Supabase mode). */
export async function resolveAssetPreviewUrls(assets: ImageAsset[]): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (!isSupabaseConfigured) return map;
  for (const a of assets) {
    if (a.storagePath) {
      const url = await getStagingSignedUrl(a.storagePath);
      if (url) map.set(a.id, url);
    }
  }
  return map;
}

export { assetKey };
