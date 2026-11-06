import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { uploadPrivateFile, RECEIPT_BUCKET } from "@/lib/uploads";
import { toDbPaymentMethod } from "@/lib/payment-method";

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

  // Verify this order belongs to the signed-in user before touching payments.
  const { data: ownedOrder } = await supabase!
    .from("orders")
    .select("id, payment_method")
    .eq("id", orderId)
    .eq("user_id", userId)
    .maybeSingle();
  if (!ownedOrder) {
    return { ok: false, error: "This order was not found for your account." };
  }

  // 1. Ensure a payment row exists for the order. Filter by user_id as
  //    defense-in-depth (RLS also enforces ownership).
  const { data: existing } = await supabase!
    .from("payments")
    .select("id")
    .eq("order_id", orderId)
    .eq("user_id", userId)
    .maybeSingle();

  let paymentId = existing?.id as string | undefined;

  if (!paymentId) {
    // Use the same payment-method code recorded on the order header so the
    // payment row and the order always agree (the DB payment_method enum
    // stores bank transfers as `manual_bank_transfer`).
    const method = toDbPaymentMethod(ownedOrder.payment_method as string | null);
    const { data: inserted, error: payErr } = await supabase!
      .from("payments")
      .insert({ order_id: orderId, user_id: userId, amount, status: "pending", method })
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
  const { error: updErr } = await supabase!.from("payments")
    .update({ status: "pending_verification" })
    .eq("id", paymentId);
  if (updErr) {
    return { ok: false, error: "Your receipt uploaded, but we couldn't flag your payment for review. Please contact support." };
  }

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

/**
 * Attach an already-uploaded advance-payment receipt to an instalment
 * application. Mirrors `attachReceiptToOrder` but targets the instalment
 * application instead of an order (a `payments` row may reference either).
 */
export async function attachReceiptToInstalment(
  applicationId: string,
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

  // Verify this instalment application belongs to the signed-in user before
  // touching payments or flipping status to pending_verification.
  const { data: ownedApp } = await supabase!
    .from("instalment_applications")
    .select("id")
    .eq("id", applicationId)
    .eq("user_id", userId)
    .maybeSingle();
  if (!ownedApp) {
    return { ok: false, error: "This instalment application was not found for your account." };
  }

  // 1. Ensure a payment row exists for the instalment application. At most one
  //    payment per application is allowed (also enforced by the UNIQUE
  //    constraint payments_instalment_app_unique in migration 00015). Filter by
  //    user_id as defense-in-depth (RLS also enforces ownership).
  const { data: existing } = await supabase!
    .from("payments")
    .select("id")
    .eq("instalment_application_id", applicationId)
    .eq("user_id", userId)
    .maybeSingle();

  let paymentId = existing?.id as string | undefined;

  if (paymentId) {
    // A receipt already exists for this application -> reject duplicates.
    const { data: existingReceipt } = await supabase!
      .from("payment_receipts")
      .select("id")
      .eq("payment_id", paymentId)
      .maybeSingle();
    if (existingReceipt) {
      return { ok: false, error: "A receipt has already been uploaded for this advance payment." };
    }
  } else {
    const { data: inserted, error: payErr } = await supabase!
      .from("payments")
      .insert({
        instalment_application_id: applicationId,
        user_id: userId,
        amount,
        status: "pending",
        method: "manual_bank_transfer",
      })
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

  // 3. Flag the payment as pending verification (admin review).
  const { error: updErr } = await supabase!.from("payments")
    .update({ status: "pending_verification" })
    .eq("id", paymentId);
  if (updErr) {
    return { ok: false, error: "Your receipt uploaded, but we couldn't flag your payment for review. Please contact support." };
  }

  return {
    ok: true,
    message: "Receipt uploaded. Our team will verify your advance payment shortly.",
  };
}

/**
 * Submit a bank-transfer receipt for an instalment application's advance
 * payment. Uploads the file first, then attaches it to the application.
 */
export async function submitInstalmentReceipt(
  applicationId: string,
  amount: number,
  file: File
): Promise<ReceiptResult> {
  const uploaded = await uploadReceipt(file);
  if (!uploaded.ok) return uploaded;
  return attachReceiptToInstalment(applicationId, amount, uploaded.path, file);
}
