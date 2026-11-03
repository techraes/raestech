import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { uploadPrivateFile, RECEIPT_BUCKET } from "@/lib/uploads";

export type ReceiptResult = { ok: true; message: string } | { ok: false; error: string };

/**
 * Submit a bank-transfer receipt for a given order:
 *  1. resolves the authenticated user,
 *  2. uploads the file to the private `receipts` bucket,
 *  3. ensures a `payments` row exists for the order,
 *  4. records the receipt in `payment_receipts` and flags the payment as
 *     pending verification so admins can review and approve/reject it.
 */
export async function submitReceipt(
  orderId: string,
  amount: number,
  file: File
): Promise<ReceiptResult> {
  if (!isSupabaseConfigured) {
    return { ok: false, error: "Receipt upload storage is not configured on this deployment." };
  }

  const { data: authData } = await supabase!.auth.getUser();
  const userId = authData?.user?.id;
  if (!userId) {
    return { ok: false, error: "Please sign in to upload a receipt." };
  }

  // 1. Upload the file to private storage.
  const up = await uploadPrivateFile(RECEIPT_BUCKET, file, "orders", userId);
  if (!up.ok) return up;

  // 2. Ensure a payment row exists for this order (owned by the session user).
  const { data: existing } = await supabase!
    .from("payments")
    .select("id")
    .eq("order_id", orderId)
    .maybeSingle();

  let paymentId: string | undefined = existing?.id as string | undefined;
  if (!paymentId) {
    const { data: inserted, error: payErr } = await supabase!
      .from("payments")
      .insert({
        order_id: orderId,
        user_id: userId,
        amount,
        method: "manual_bank_transfer",
        status: "pending_verification",
        reference: null,
      })
      .select("id")
      .single();
    if (payErr) {
      return { ok: false, error: "Could not record payment. Please try again." };
    }
    paymentId = inserted?.id as string;
  }

  // 3. Record the receipt.
  const { error: rcErr } = await supabase!.from("payment_receipts").insert({
    payment_id: paymentId,
    file_path: up.path,
    file_name: file.name,
    mime_type: file.type || "application/octet-stream",
    file_size: file.size,
    uploaded_by: userId,
  });
  if (rcErr) {
    return { ok: false, error: "Could not save receipt. Please try again." };
  }

  // 4. Flag payment as pending verification.
  await supabase!.from("payments").update({ status: "pending_verification" }).eq("id", paymentId);

  return {
    ok: true,
    message: "Receipt uploaded. Our team will verify your payment shortly.",
  };
}
