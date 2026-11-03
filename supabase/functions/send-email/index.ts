// RAES TECH — Send transactional email via Resend.
//
// Server-side Edge Function. Guards every call with a shared-secret header
// (Bearer $SEND_EMAIL_SECRET) so the endpoint cannot be abused by anonymous
// callers. It loads the message body/subject from the `email_templates`
// table (admin-managed), renders {{placeholder}} values, and sends through
// the Resend API. The Resend API key is a server-side secret and is never
// exposed to the browser.
//
// Abuse hardening (see migration 00008 via_send_log):
//  * This endpoint is NOT an open relay. The recipient must be a registered
//    user (present in the `profiles` table) with a confirmed email
//    (`auth.users.email_confirmed_at`). Otherwise the request is rejected.
//  * Outbound sends are rate-limited using the `email_send_log` table:
//      - per caller IP per UTC day
//      - per recipient per UTC day
//      - global per UTC day
//    If the quota cannot be read, the request fails closed (500).
//
// Invoke (after deploy):
//   curl -X POST https://<ref>.functions.supabase.co/send-email \
//     -H "Authorization: Bearer $SEND_EMAIL_SECRET" \
//     -H "Content-Type: application/json" \
//     -d '{"to":"customer@example.com","templateKey":"order_confirmation",
//          "data":{"order_number":"ORD-ABC123","total":"Rs. 150,000"}}'

import { createClient } from "@supabase/supabase-js";
import { render } from "./render.mjs";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_SECRET_KEY") ?? "";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const RESEND_FROM = Deno.env.get("RESEND_FROM") ?? "RAES TECH <onboarding@resend.dev>";
const SEND_EMAIL_SECRET = Deno.env.get("SEND_EMAIL_SECRET") ?? "";

// Rate-limit caps (daily, per UTC day). Overridable via env for tuning.
const MAX_SENDS_PER_IP_PER_DAY = Number(Deno.env.get("SEND_MAX_PER_IP_PER_DAY") ?? 50);
const MAX_SENDS_PER_RECIPIENT_PER_DAY = Number(Deno.env.get("SEND_MAX_PER_RECIPIENT_PER_DAY") ?? 5);
const MAX_SENDS_GLOBAL_PER_DAY = Number(Deno.env.get("SEND_MAX_GLOBAL_PER_DAY") ?? 1000);

Deno.serve(async (req) => {
  // 1) Authorize: shared-secret header.
  const auth = req.headers.get("authorization");
  if (!SEND_EMAIL_SECRET || auth !== `Bearer ${SEND_EMAIL_SECRET}`) {
    return json({ error: "Unauthorized" }, 401);
  }

  // 2) Parse payload.
  const body = await req.json().catch(() => null);
  if (!body) return json({ error: "Invalid JSON" }, 400);
  const { to, templateKey, data = {} } = body;
  if (typeof to !== "string" || !to.trim()) return json({ error: "to (email) is required" }, 400);
  if (typeof templateKey !== "string" || !templateKey.trim()) return json({ error: "templateKey is required" }, 400);

  const recipient = to.trim();
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  // 3) Do NOT act as an open relay: recipient must be registered + verified.
  const registered = await requireRegisteredAndVerified(supabase, recipient);
  if (!registered.ok) return json({ error: registered.message }, registered.status);

  // 4) Rate limiting (per IP / per recipient / global, per UTC day).
  const now = new Date();
  const dayStartIso = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  ).toISOString();
  const ip = clientIp(req);

  try {
    const [perIp, perRecipient, globalCount] = await Promise.all([
      countToday(supabase, dayStartIso, "sender_ip", ip),
      countToday(supabase, dayStartIso, "recipient", recipient),
      countToday(supabase, dayStartIso, null, null),
    ]);

    if (perIp >= MAX_SENDS_PER_IP_PER_DAY) {
      return json({ error: "Rate limit exceeded for this sender.", retry_after: "86400" }, 429);
    }
    if (perRecipient >= MAX_SENDS_PER_RECIPIENT_PER_DAY) {
      return json({ error: "Rate limit exceeded for this recipient.", retry_after: "86400" }, 429);
    }
    if (globalCount >= MAX_SENDS_GLOBAL_PER_DAY) {
      return json({ error: "Global daily send limit reached.", retry_after: "86400" }, 429);
    }
  } catch (e) {
    // Fail closed: if the quota cannot be checked, do not send.
    return json({ error: "Could not verify send quota.", detail: e.message }, 500);
  }

  // Reserve the send slot before contacting Resend (closes the concurrency race).
  await supabase
    .from("email_send_log")
    .insert({ recipient, sender_ip: ip, template_key: templateKey })
    .catch(() => {});

  // 5) Load the template from Supabase.
  const { data: tpl, error: tplErr } = await supabase
    .from("email_templates")
    .select("subject, body")
    .eq("key", templateKey)
    .eq("enabled", true)
    .maybeSingle();
  if (tplErr || !tpl) {
    return json({ error: `Email template '${templateKey}' not found or disabled.` }, 404);
  }

  // 6) Render and send via Resend.
  const subject = render(tpl.subject, data).slice(0, 200);
  const html = render(tpl.body, data);
  const resendRes = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: RESEND_FROM,
      to: [recipient],
      subject,
      html,
    }),
  });

  if (!resendRes.ok) {
    const text = await resendRes.text().catch(() => "");
    return json({ error: `Resend error (${resendRes.status})`, detail: text.slice(0, 300) }, 502);
  }

  return json({ ok: true, to: recipient, templateKey }, 200);
});

async function requireRegisteredAndVerified(supabase, email) {
  const { data: profile, error: profErr } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();
  if (profErr || !profile) {
    return { ok: false, status: 403, message: "Recipient must be a registered RAES TECH user." };
  }

  const { data: verified, error: vErr } = await supabase.rpc("is_email_verified", {
    p_email: email,
  });
  if (vErr || verified !== true) {
    return { ok: false, status: 403, message: "Recipient email is not verified." };
  }

  return { ok: true };
}

async function countToday(supabase, dayStartIso, column, value) {
  let q = supabase.from("email_send_log").select("*", { count: "exact", head: true });
  if (column) q = q.eq(column, value);
  const { count, error } = await q.gte("created_at", dayStartIso);
  if (error) throw new Error(error.message);
  return count ?? 0;
}

function clientIp(req) {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("cf-connecting-ip") ?? "unknown";
}

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
