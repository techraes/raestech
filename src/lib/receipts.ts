import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { uploadPrivateFile, RECEIPT_BUCKET } from "@/lib/uploads";

export type ReceiptResult = { ok: true; message: string } | { ok: false; error: string };
export type ReceiptUploadResult = { ok: true; path: string } | { ok: false; error: string };

/**
 * Upload a bank-transfer receipt file to the private `receipts` bucket.
 * This is intentionally separate from order creation so a checkout can verify
 * the upload succeeded BEFORE an order is generated. The returned path is later
 * attached to the order via `attachReceiptToOrder`.
 */
export async function uploadReceipt(file: File): Promise<ReceiptUploadResult> {
  if (!isSupabaseConfigured) {
    return { ok: false, error: "Receipt upload storage is not configured on this deployment." };
  }

  const { data: authData } = await supabase!.auth.getUser();
  const userId = authData.user?.id;
  if (!userId) {
    return { ok: false, error: "Please sign in to upload a receipt." };
  }

  return uploadPrivateFile(RECEIPT_BUCKET, file, "orders", userId);
}

/**
 * Attach an already-uploaded receipt to an order:
 *  1. ensures a `payments` row exists for the order with the exact amount,
 *  2. records the receipt in `payment_receipts`,
 *  3. flags the payment as pending verification for admin review.
 * `file` is used only for metadata (name/type/size); the blob itself was
 * already uploaded by `uploadReceipt`.
 */
export async function attachReceiptToOrder(
  orderId: string,
  amount: number,
  path: string,
  file: File
): Promise<ReceiptResult> {
  if (!isSupabaseConfigured) {
    return { ok: false, error: "Receipt upload storage is not configured on this deployment." };
  }

  const { data: authData } = await supabase!.auth.getUser();
  const userId = authData.user?.id;
  if (!userId) {
    return { ok: false, error: "Please sign in to upload a receipt." };
  }

  // 1. Ensure a payment row exists for the order.
  const { data: existing } = await supabase!
    .from("payments")
    .select("id")
    .eq("order_id", orderId)
    .maybeSingle();

  let paymentId = existing?.id as string | undefined;

  if (!paymentId) {
    const { data: inserted, error: payErr } = await supabase!
      .from("payments")
      .insert({ order_id: orderId, user_id: userId, amount, status: "pending", method: "bank_transfer" })
      .select("id")
      .single();
    if (payErr) {
      return { ok: false, error: "Could not record payment. Please try again." };
    }
    paymentId = inserted?.id as string;
  }

  // 2. Record the receipt.
  const { error: rcErr } = await supabase!.from("payment_receipts").insert({
    payment_id: paymentId,
    file_path: path,
    file_name: file.name,
    mime_type: file.type || "application/octet-stream",
    file_size: file.size,
    uploaded_by: userId,
  });
  if (rcErr) {
    return { ok: false, error: "Could not save receipt. Please try again." };
  }

  // 3. Flag payment as pending verification (admin review).
  await supabase!.from("payments").update({ status: "pending_verification" }).eq("id", paymentId);

  return {
    ok: true,
    message: "Receipt uploaded. Our team will verify your payment shortly.",
  };
}

/**
 * Submit a bank-transfer receipt for an order that already exists (used by the
 * payment-instructions page). For checkout, prefer `uploadReceipt` followed by
 * `attachReceiptToOrder` so the order is only generated after a successful upload.
 */
export async function submitReceipt(
  orderId: string,
  amount: number,
  file: File
): Promise<ReceiptResult> {
  const uploaded = await uploadReceipt(file);
  if (!uploaded.ok) return uploaded;
  return attachReceiptToOrder(orderId, amount, uploaded.path, file);
}
