import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
export const RECEIPT_BUCKET = "receipts";
export const IDENTITY_BUCKET = "identity-documents";

export type UploadResult = { ok: true; path: string } | { ok: false; error: string };

/**
 * Upload a file into a private storage bucket. Returns the storage path on
 * success. When Supabase is not configured returns a descriptive error so the
 * UI never silently drops the upload.
 */
export async function uploadPrivateFile(
  bucket: string,
  file: File,
  folder: string,
  ownerId: string
): Promise<UploadResult> {
  if (!isSupabaseConfigured) {
    return { ok: false, error: "Upload storage is not configured on this deployment. Please try again later." };
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return { ok: false, error: "File is too large. Maximum size is 5 MB." };
  }
  const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${folder}/${ownerId}/${Date.now()}-${safeName}.${ext}`;

  const { error } = await supabase!.storage.from(bucket).upload(path, file, {
    cacheControl: "3600",
    contentType: file.type || "application/octet-stream",
    upsert: false,
  });
  if (error) {
    return { ok: false, error: `Could not upload file: ${error.message}` };
  }
  return { ok: true, path };
}

/**
 * Build a short-lived signed URL for an authorized viewer. Falls back to a
 * public URL only for non-private buckets (never used for identity documents).
 */
export async function getSignedUrl(bucket: string, path: string, expiresIn = 600): Promise<string | null> {
  if (!isSupabaseConfigured) return null;
  const { data } = await supabase!.storage.from(bucket).createSignedUrl(path, expiresIn);
  return data?.signedUrl ?? null;
}
