// RAES TECH — Send "Order approved" emails.
//
// Processes `order_email_jobs` rows (kind = 'order' | 'instalment'). The job is
// created by a DB trigger when an order/instalment first reaches Approved.
// This function:
//   - loads the authoritative record (service role) so amounts/order numbers are
//     always the real stored values,
//   - renders the `order_approved` template with the customer's saved email,
//   - sends via Resend, and records the outcome on the job. Only a provider
//     acceptance is treated as "sent"; "delivered" requires a separate
//     delivery-confirmation source (webhook) wired to update the job.
//   - permanent (4xx) failures flip the job to 'failed'; transient (5xx/network)
//     failures leave it pending for retry.
//
// Env secrets: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY,
// RESEND_FROM.
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_SECRET_KEY") ?? "";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const RESEND_FROM = Deno.env.get("RESEND_FROM") ?? "RAES TECH <onboarding@resend.dev>";
const ADMIN_ROLES = ["super_admin", "order_manager", "instalment_reviewer"];

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function fill(tpl: string, vars: Record<string, string>): string {
  return (tpl ?? "").replace(/\{\{\s*(\w+)\s*\}\}/g, (_m, k) => vars[k] ?? "");
}

function maskEmail(email: string): string {
  const idx = email.indexOf("@");
  if (idx <= 1) return "***";
  return email[0] + "***" + email.slice(Math.min(idx - 1, 4), idx) + email.slice(idx);
}

Deno.serve(async (req) => {
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Authorize: an admin JWT is required when invoked interactively.
  const token = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (token) {
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) return json({ error: "Unauthorized" }, 401);
    const { data: roleRows } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
    const ok = Array.isArray(roleRows) && roleRows.some((r) => ADMIN_ROLES.includes(r.role));
    if (!ok) return json({ error: "Forbidden" }, 403);
  }

  const body = await req.json().catch(() => null);

  let jobs: Array<Record<string, unknown>> = [];
  if (body && body.orderId) {
    const { data } = await supabase
      .from("order_email_jobs")
      .select("*")
      .eq("kind", "order")
      .eq("subject_id", body.orderId);
    jobs = (data as Array<Record<string, unknown>>) ?? [];
  } else {
    const { data } = await supabase
      .from("order_email_jobs")
      .select("*")
      .in("status", ["pending", "failed"])
      .limit(50);
    jobs = (data as Array<Record<string, unknown>>) ?? [];
  }

  const results: Array<Record<string, unknown>> = [];
  for (const job of jobs) {
    results.push(await processJob(supabase, job));
  }
  return json({ processed: results.length, results });
});

async function processJob(supabase: ReturnType<typeof createClient>, job: Record<string, unknown>) {
  const jobId = String(job.id);
  if (job.status === "sending") return { id: jobId, skipped: "already_sending" };

  await supabase.from("order_email_jobs").update({
    status: "sending",
    updated_at: new Date().toISOString(),
  }).eq("id", jobId);

  try {
    const payload = job.kind === "instalment"
      ? await loadInstalmentPayload(supabase, String(job.subject_id))
      : await loadOrderPayload(supabase, String(job.subject_id));
    if (!payload || !payload.email) throw new Error("Recipient email not found");

    const { data: tpl } = await supabase.from("email_templates").select("subject,body").eq("key", "order_approved").maybeSingle();
    if (!tpl) throw new Error("Email template 'order_approved' not found");

    const subject = fill(tpl.subject, payload);
    const html = fill(tpl.body, payload);

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: RESEND_FROM, to: [payload.email], subject, html }),
    });

    const attempts = Number(job.attempts ?? 0) + 1;
    const now = new Date().toISOString();

    if (resendRes.status === 200) {
      const rbody = await resendRes.json().catch(() => ({}));
      await supabase.from("order_email_jobs").update({
        status: "sent",
        attempts,
        last_attempt_at: now,
        delivery_id: rbody.id ?? null,
        masked_recipient: maskEmail(payload.email),
        last_error: null,
        updated_at: now,
      }).eq("id", jobId);
      return { id: jobId, status: "sent" };
    }

    const permanent = resendRes.status >= 400 && resendRes.status < 500;
    await supabase.from("order_email_jobs").update({
      status: permanent ? "failed" : "pending",
      attempts,
      last_attempt_at: now,
      last_error: `HTTP ${resendRes.status}`,
      updated_at: now,
    }).eq("id", jobId);
    return { id: jobId, status: permanent ? "failed" : "pending" };
  } catch (e) {
    const errMsg = (e instanceof Error ? e.message : String(e)).slice(0, 300);
    await supabase.from("order_email_jobs").update({
      status: "failed",
      attempts: Number(job.attempts ?? 0) + 1,
      last_attempt_at: new Date().toISOString(),
      last_error: errMsg,
      updated_at: new Date().toISOString(),
    }).eq("id", jobId);
    return { id: jobId, status: "failed", error: errMsg };
  }
}

async function loadOrderPayload(supabase, orderId: string) {
  const { data: order } = await supabase.from("orders").select("*").eq("id", orderId).maybeSingle();
  if (!order) return null;
  const { data: items } = await supabase.from("order_items").select("*").eq("order_id", orderId).limit(1);
  const item = items?.[0] ?? {};

  let firstName = "there";
  if (order.user_id) {
    const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", order.user_id).maybeSingle();
    if (profile?.full_name) firstName = profile.full_name.split(" ")[0];
  }

  let email = order.email ?? null;
  if (!email && order.user_id) {
    const { data: profile } = await supabase.from("profiles").select("email").eq("id", order.user_id).maybeSingle();
    email = profile?.email ?? null;
  }

  return {
    email,
    first_name: firstName,
    order_number: order.order_number,
    product_name: item.product_name ?? "",
    variant_name: item.variant_name ?? item.sku ?? "",
    color: item.color ?? "",
    total: order.total,
    payment_method: order.payment_method ?? "bank_transfer",
    instalment_block: "",
  };
}

async function loadInstalmentPayload(supabase, appId: string) {
  const { data: app } = await supabase.from("instalment_applications").select("*").eq("id", appId).maybeSingle();
  if (!app) return null;

  let firstName = "there";
  let email: string | null = null;
  const { data: profile } = await supabase.from("profiles").select("email,full_name").eq("id", app.user_id).maybeSingle();
  if (profile) {
    email = profile.email;
    if (profile.full_name) firstName = profile.full_name.split(" ")[0];
  }

  let productName = "Your phone";
  let variantName = "Instalment order";
  if (app.variant_id) {
    const { data: variant } = await supabase.from("product_variants").select("storage,ram,product_id").eq("id", app.variant_id).maybeSingle();
    if (variant) {
      variantName = `${variant.storage} / ${variant.ram}`;
      const { data: product } = await supabase.from("products").select("name").eq("id", variant.product_id).maybeSingle();
      if (product) productName = product.name;
    }
  }

  const instalmentBlock =
    `<p><strong>Instalment plan:</strong> ${app.tenure_months} months</p>` +
    `<p><strong>Advance:</strong> ${app.advance_payment} PKR<br>` +
    `<strong>Monthly payment:</strong> ${app.monthly_payment} PKR</p>`;

  return {
    email,
    first_name: firstName,
    order_number: app.application_number,
    product_name: productName,
    variant_name: variantName,
    color: app.colour ?? "",
    total: app.total_payable,
    payment_method: "instalments",
    instalment_block: instalmentBlock,
  };
}
