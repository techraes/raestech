import type { CustomerOrder } from "@/types";
import { supabase } from "@/lib/supabase";

const EDGE_FUNCTION = "send-email";

/**
 * Client-side helper to call the `send-email` Supabase Edge Function.
 *
 * Authentication uses the caller's Supabase session JWT (from
 * `supabase.auth.getSession()`). No secret is embedded in the browser bundle.
 * For order confirmations we send only the server-assigned `orderId`; the edge
 * function loads the order authoritatively from the DB, so the email always
 * shows the real order number and total (never stale client draft data).
 *
 * This helper is fire-and-forget: failures are logged, never thrown, so a
 * send error never blocks order placement.
 */
async function invokeSendEmail(payload: {
  orderId?: string;
  to?: string;
  templateKey: string;
  data?: Record<string, string>;
}): Promise<void> {
  const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.replace(/\/$/, "");
  if (!url || !supabase) {
    // Not configured — silently skip (dev mode / no backend).
    return;
  }

  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) {
    console.warn("[send-email] not signed in — email delivery skipped");
    return;
  }

  try {
    const body: Record<string, unknown> = { templateKey: payload.templateKey, data: payload.data ?? {} };
    if (payload.orderId) body.orderId = payload.orderId;
    if (payload.to) body.to = payload.to;

    const res = await fetch(`${url}/functions/v1/${EDGE_FUNCTION}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.warn(`[send-email] ${res.status}`, text.slice(0, 200));
    }
  } catch (err) {
    console.warn("[send-email] request failed", err);
  }
}

/** Send the order-confirmation email, keyed by the server order id. */
export async function sendOrderConfirmation(order: CustomerOrder): Promise<void> {
  await invokeSendEmail({
    orderId: order.id,
    templateKey: "order_confirmation",
  });
}
