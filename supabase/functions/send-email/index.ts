// RAES TECH — Send transactional email via Resend.
//
// Server-side Edge Function. It authenticates the caller with their Supabase
// Session JWT and, for order confirmations, loads the order authoritatively
// from the database (service-role) so the email always shows the real,
// server-assigned order number and amounts — never stale client data.
//
// No shared secret is embedded in the browser; the user's JWT is the only
// credential a caller needs. Sending is restricted to the authenticated user's
// own verified email (or an order that belongs to them).
//
// Abuse hardening (see migration 00008 via_send_log):
//   - per-IP, per-recipient and global daily send caps

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_SECRET_KEY") ?? "";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const RESEND_FROM = Deno.env.get("RESEND_FROM") ?? "RAES TECH <onboarding@resend.dev>";

// Rate-limit caps (daily, per UTC day). Overridable via env for tuning.
const MAX_SENDS_PER_IP_PER_DAY = Number(Deno.env.get("SEND_MAX_PER_IP_PER_DAY") ?? 50);
const MAX_SENDS_PER_RECIPIENT_PER_DAY = Number(Deno.env.get("SEND_MAX_PER_RECIPIENT_PER_DAY") ?? 5);
const MAX_SENDS_GLOBAL_PER_DAY = Number(Deno.env.get("SEND_MAX_GLOBAL_PER_DAY") ?? 1000);

Deno.serve(async (req) => {
  // 1) Authorize using the caller's Supabase session (JWT).
  const authHeader = req.headers.get("authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) {
    return json({ error: "Unauthorized" }, 401);
  }
  const token = authHeader.slice("Bearer ".length).trim();
  if (!token) return json({ error: "Unauthorized" }, 401);

  // Service-role client: bypasses RLS for reading orders/templates and for the
  // send-log insert. This is intentional — these tables are server-side only.
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Resolve the authenticated user. With verify_jwt = true the platform already
  // validated the token; we also confirm it maps to a real, confirmed user.
  const { data: { user }, error: userErr } = await supabase.auth.getUser(token);
  if (userErr || !user) {
    return json({ error: "Unauthorized" }, 401);
  }
  if (!user.email_confirmed_at) {
    return json({ error: "Recipient email is not verified." }, 403);
  }
  const authEmail = (user.email ?? "").trim().toLowerCase();
  if (!authEmail) {
    return json({ error: "Unauthorized" }, 401);
  }

  // 2) Parse body.
  const body = await req.json().catch(() => null);
  if (!body) return json({ error: "Invalid JSON" }, 400);
  const { orderId, templateKey, data = {} } = body;
  if (typeof templateKey !== "string" || !templateKey.trim()) return json({ error: "templateKey is required" }, 400);

  // 3) Resolve recipient. For order confirmation we load the order from the DB
  //    so the email shows authoritative data and we never trust client inputs.
  let recipient = "";
  const renderData: Record<string, string> = { ...data };
  if (templateKey === "order_confirmation") {
    if (typeof orderId !== "string" || !orderId.trim()) {
      return json({ error: "orderId is required for order_confirmation" }, 400);
    }
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .select("id, order_number, email, shipping_full_name, total, subtotal, discount_amount, shipping_charge")
      .eq("id", orderId)
      .maybeSingle();
    if (orderErr || !order) {
      return json({ error: "Order not found." }, 404);
    }
    // Authorization: the order must belong to the authenticated user. This
    // prevents a caller from triggering emails for arbitrary orders.
    const orderEmail = (order.email ?? "").trim().toLowerCase();
    if (orderEmail !== authEmail && String(order.user_id ?? "") !== user.id) {
      return json({ error: "Order does not belong to this account." }, 403);
    }
    recipient = orderEmail || authEmail;
    renderData.order_number = String(order.order_number ?? "");
    renderData.total = String(order.total ?? "");
    renderData.first_name = order.shipping_full_name || orderEmail.split("@")[0] || "";
  } else {
    // Non-order templates still require an explicit, matching recipient.
    const { to } = body;
    if (typeof to !== "string" || !to.trim()) return json({ error: "to (email) is required" }, 400);
    recipient = to.trim().toLowerCase();
    if (recipient !== authEmail) {
      return json({ error: "Recipient must match your verified account email." }, 403);
    }
  }

  // 4) Enforce daily send quotas (single UTC day).
  const dayStartIso = new Date(Date.now()).toISOString().slice(0, 10) + "T00:00:00.000Z";
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

  // 5) Load the template from Supabase.
  const { data: tpl, error: tplErr } = await supabase
    .from("email_templates")
    .select("key, subject, body")
    .eq("key", templateKey)
    .eq("enabled", true)
    .maybeSingle();
  if (tplErr || !tpl) {
    return json({ error: `Email template '${templateKey}' not found or disabled.` }, 404);
  }

  // 6) Render {{placeholder}} values and record the attempt.
  const { render } = await import("./render.mjs");
  const subject = render(tpl.subject, renderData);
  const html = render(tpl.body, renderData);

  const { error: logErr } = await supabase.from("email_send_log").insert({
    recipient,
    sender_ip: ip,
    template_key: templateKey,
  });
  if (logErr) {
    return json({ error: "Could not record send attempt.", detail: logErr.message }, 500);
  }

  // 7) Send via Resend.
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
