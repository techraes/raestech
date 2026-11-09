import { supabase } from "@/lib/supabase";

/**
 * Client helpers for the admin-controlled signup OTP switch and order-approved
 * email jobs. These talk to server-side RPCs / Edge Functions; the client never
 * holds management credentials.
 */

export interface OrderEmailJob {
  kind: "order" | "instalment";
  status: "pending" | "sending" | "sent" | "delivered" | "failed";
  attempts: number;
  last_attempt_at: string | null;
  last_error: string | null;
  delivery_id: string | null;
  delivered_at: string | null;
  masked_recipient: string | null;
  manually_sent_at?: string | null;
  manually_sent_by?: string | null;
}

/** Effective "require signup OTP" value. Falls back to invoking the edge
 *  function if the RPC isn't deployed yet. */
export async function getSignupOtpRequired(): Promise<boolean> {
  if (!supabase) return true;
  const { data, error } = await supabase.rpc("get_signup_otp_required");
  if (!error && typeof data === "boolean") return data;

  // Fallback to the edge function (read path).
  try {
    const res = await supabase.functions.invoke<{ require_signup_otp: boolean }>("auth-config", {
      method: "GET",
    });
    if (res.error) return true;
    return res.data?.require_signup_otp ?? true;
  } catch {
    return true;
  }
}

/** Set the switch via the server edge function (Super Admin only). */
export async function setSignupOtpRequired(require: boolean): Promise<{
  ok: boolean;
  effective?: boolean;
  error?: string;
}> {
  if (!supabase) return { ok: false, error: "Supabase is not configured." };
  const { data, error } = await supabase.functions.invoke<{ require_signup_otp: boolean }>("auth-config", {
    method: "POST",
    body: { require_signup_otp: require },
  });
  if (error) {
    // The edge function returns the last effective state with the error when the
    // provider update fails.
    const effective = data?.require_signup_otp;
    return { ok: false, effective, error: error.message };
  }
  return { ok: true, effective: data?.require_signup_otp };
}

/** Read the order-approved email job state for the admin order page. */
export async function getOrderEmailJob(orderId: string): Promise<OrderEmailJob | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.rpc("get_order_email_job", { p_order_id: orderId });
  if (error) return null;
  if (!data) return null;
  const row = Array.isArray(data) ? data[0] : data;
  return (row as OrderEmailJob | undefined) ?? null;
}

/** Reset a failed/pending job so the sender reprocesses it (admin). */
export async function retryOrderEmail(orderId: string): Promise<{ ok: boolean; error?: string }> {
  if (!supabase) return { ok: false, error: "Supabase is not configured." };
  const { error } = await supabase.rpc("retry_order_email", { p_order_id: orderId });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/** Trigger sending for one order now (admin). */
export async function sendOrderApprovedEmail(orderId: string): Promise<{ ok: boolean; error?: string }> {
  if (!supabase) return { ok: false, error: "Supabase is not configured." };
  const { error } = await supabase.functions.invoke("send-order-approved-email", {
    body: { orderId },
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/** Read a job by kind + subject id (order or instalment application). */
export async function getEmailJobState(
  kind: "order" | "instalment",
  subjectId: string
): Promise<OrderEmailJob | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.rpc("get_email_job_state", {
    p_kind: kind,
    p_subject_id: subjectId,
  });
  if (error) return null;
  if (!data) return null;
  return {
    kind,
    status: data.status,
    attempts: Number(data.attempts ?? 0),
    last_attempt_at: data.last_attempt_at ?? null,
    last_error: data.last_error ?? null,
    delivery_id: data.delivery_id ?? null,
    delivered_at: data.delivered_at ?? null,
    masked_recipient: data.masked_recipient ?? null,
    manually_sent_at: data.manually_sent_at ?? null,
    manually_sent_by: data.manually_sent_by ?? null,
  };
}

/** Record that an admin sent the confirmation email manually. */
export async function markOrderEmailManualSent(
  subjectId: string
): Promise<{ ok: boolean; error?: string }> {
  if (!supabase) return { ok: false, error: "Supabase is not configured." };
  const { error } = await supabase.rpc("mark_order_email_manual_sent", {
    p_order_id: subjectId,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
