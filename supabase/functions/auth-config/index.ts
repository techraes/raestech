// RAES TECH — Admin-controlled signup email verification toggle.
//
// Only a Super Admin may change whether new signups require an email OTP.
// Enforcement is server-side:
//   - The caller's Supabase JWT is verified and their role is checked against
//     user_roles (super_admin required).
//   - The change is applied to Supabase Auth via the Management API
//     (mailer.autoconfirm). require_signup_otp = true ⇔ autoconfirm = false.
//   - The effective state is persisted (auth_email_config) and audited
//     (auth_config_audit: who, when, previous, new).
//
// Env (Edge Function secrets):
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
//   MGMT_PAT               — Supabase Management API personal access token
//                           (must not start with SUPABASE_ — the platform
//                           rejects SUPABASE_-prefixed secret names).
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_SECRET_KEY") ?? "";
const PAT = Deno.env.get("MGMT_PAT") ?? "";

function projectRef(): string {
  try {
    const u = new URL(SUPABASE_URL);
    const parts = u.hostname.split(".");
    return parts[0] ?? "";
  } catch {
    return "";
  }
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method !== "GET" && req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const token = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!token) return json({ error: "Unauthorized" }, 401);

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: { user }, error: userErr } = await supabase.auth.getUser(token);
  if (userErr || !user) return json({ error: "Unauthorized" }, 401);

  const { data: roleRows } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id);
  const isSuperAdmin = Array.isArray(roleRows) && roleRows.some((r) => r.role === "super_admin");
  if (!isSuperAdmin) return json({ error: "Forbidden: super admin only" }, 403);

  if (req.method === "GET") {
    const { data } = await supabase
      .from("auth_email_config")
      .select("require_signup_otp")
      .eq("id", true)
      .maybeSingle();
    const effective = data?.require_signup_otp ?? true;
    return json({ require_signup_otp: effective });
  }

  // POST: set the switch.
  const body = await req.json().catch(() => null);
  if (!body || typeof body.require_signup_otp !== "boolean") {
    return json({ error: "require_signup_otp (boolean) is required" }, 400);
  }

  const requireOtp = body.require_signup_otp;
  const autoconfirm = !requireOtp;

  const { data: prevRow } = await supabase
    .from("auth_email_config")
    .select("require_signup_otp")
    .eq("id", true)
    .maybeSingle();
  const previous = prevRow?.require_signup_otp ?? true;

  // Apply to Supabase Auth via the Management API.
  const ref = projectRef();
  if (!ref || !PAT) {
    return json({
      error: "Provider update failed: Management API credentials are not configured.",
      effective: previous,
    }, 502);
  }
  const mRes = await fetch(`https://api.supabase.com/v1/projects/${ref}/config/auth`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${PAT}`,
      "Content-Type": "application/json",
    },
    // Use the flat `mailer_autoconfirm` key. The nested `mailer: { autoconfirm }`
    // form is accepted with HTTP 200 but does NOT change the setting on the
    // Management API, which would make the admin switch silently ineffective.
    body: JSON.stringify({ mailer_autoconfirm: autoconfirm }),
  });
  if (!mRes.ok) {
    const txt = await mRes.text().catch(() => "");
    return json({ error: "Provider update failed", detail: txt.slice(0, 300), effective: previous }, 502);
  }

  // Persist effective state and audit.
  const { error: upErr } = await supabase.from("auth_email_config").upsert({
    id: true,
    require_signup_otp: requireOtp,
    updated_by: user.id,
    updated_at: new Date().toISOString(),
  });
  if (upErr) {
    return json({ error: "Could not save the auth setting.", effective: previous }, 500);
  }
  await supabase.from("auth_config_audit").insert({
    changed_by: user.id,
    previous_value: previous,
    new_value: requireOtp,
  });

  return json({ require_signup_otp: requireOtp });
});
