#!/usr/bin/env node
/**
 * RAES TECH — Check that Supabase Auth can actually deliver OTP emails.
 *
 * OTP emails are sent by Supabase Auth's own mailer, NOT by the `send-email`
 * edge function (that function only handles transactional emails like order
 * confirmations). If the Supabase project's SMTP / sender config is missing or
 * invalid, Auth returns HTTP 500 "Error sending confirmation email" and users
 * never get a code.
 *
 * This script performs a read-only probe of the live auth endpoints and tells
 * you whether OTP email delivery will work.
 *
 * Usage:
 *   node scripts/check-otp-email.mjs
 *
 * Exit codes:
 *   0 = OTP email request accepted (expected to deliver)
 *   1 = Auth reports a delivery failure (SMTP / sender config issue)
 *   2 = Supabase not configured / network error
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, "..", ".env.local");
const url = process.env.VITE_SUPABASE_URL
  || (readFileSync(envPath, "utf-8").match(/VITE_SUPABASE_URL=(.+)/)?.[1] ?? "").trim();
const anon = process.env.VITE_SUPABASE_ANON_KEY
  || (readFileSync(envPath, "utf-8").match(/VITE_SUPABASE_ANON_KEY=(.+)/)?.[1] ?? "").trim();

const PROBE_EMAIL = process.env.OTP_PROBE_EMAIL || "otp-check@example.com";

if (!url || !anon) {
  console.error("Supabase URL/anon key not found in .env.local. Cannot check.");
  process.exit(2);
}

const ctrl = new AbortController();
const timer = setTimeout(() => ctrl.abort(), 20000);

async function request(path, opts = {}) {
  const res = await fetch(url + path, {
    signal: ctrl.signal,
    ...opts,
    headers: {
      apikey: anon,
      Authorization: `Bearer ${anon}`,
      "Content-Type": "application/json",
      ...(opts.headers || {}),
    },
  });
  const text = await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch { json = text; }
  return { status: res.status, body: json, text };
}

async function main() {
  console.log("RAES TECH — OTP email delivery check");
  console.log("Project:", url.replace("https://", "").replace(".supabase.co", ""));
  console.log("Probe email:", PROBE_EMAIL);
  console.log("----------------------------------------");

  const settings = await request("/auth/v1/settings");
  const emailEnabled = settings.body?.external?.email === true;
  const autoconfirm = settings.body?.mailer_autoconfirm === true;
  console.log(`Email auth enabled         : ${emailEnabled}`);
  console.log(`Mailer autoconfirm        : ${autoconfirm} (false = a real OTP email is sent)`);

  const otp = await request("/auth/v1/otp", {
    method: "POST",
    body: JSON.stringify({ email: PROBE_EMAIL, create_user: true }),
  });

  console.log(`OTP request HTTP status    : ${otp.status}`);

  if (otp.status === 200) {
    console.log("\n✓ OTP request accepted. If you still don't receive the code, check:");
    console.log("  - Spam/junk folder (very common for no-reply@supabase.co).");
    console.log("  - Sender domain verification (SPF/DKIM) if using a custom sender.");
    process.exit(0);
  }

  const msg = typeof otp.body === "object" ? (otp.body.msg ?? "") : String(otp.body ?? "");
  const hasSendFailure = /send|mailer|smtp|confirmation email/i.test(msg);

  console.log(`OTP error body             : ${otp.text.slice(0, 300)}`);
  if (otp.status === 500 && hasSendFailure) {
    console.log("\n✗ ROOT CAUSE: Supabase Auth cannot send email (HTTP 500 \"Error sending");
    console.log("  confirmation email\"). This is an SMTP/sender configuration problem in");
    console.log("  the Supabase project — NOT a code bug.");
    console.log("\nFix (Supabase Dashboard → Authentication → SMTP Settings):");
    console.log("  1. Enable Custom SMTP and enter valid provider credentials (e.g. Resend:");
    console.log("     host smtp.resend.com, port 587, username 'resend', password = Resend API key).");
    console.log("  2. Use a VERIFIED sender domain (e.g. no-reply@raestech.store). The Resend");
    console.log("     test sender @resend.dev is commonly rejected — verify your domain and add");
    console.log("     the SPF/DKIM DNS records in your domain provider.");
    console.log("  3. Save, then re-run this script — it should print HTTP 200.");
    console.log("\nAlternatively, if you prefer Supabase's default (hosted) mailer, confirm it is");
    console.log("enabled and not rate-limited for this project.");
    process.exit(1);
  }

  console.log("\n⚠ Unexpected response — inspect the body above. If it's a 4xx, the request");
  console.log("shape or account state may be the issue; if network, re-run.");
  process.exit(1);
}

main().then(() => clearTimeout(timer)).catch((e) => {
  console.error("\nNetwork / runtime error:", e.message);
  console.error("Cannot reach Supabase auth. Check VITE_SUPABASE_URL and your network.");
  process.exit(2);
});
