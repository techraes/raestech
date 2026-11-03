// RAES TECH — Create / elevate the primary administrator.
//
// Server-side provisioning (service-role only, never exposed to the client).
// This is the out-of-band step that fulfils "make tech.raes@gmail.com admin":
// it creates the Auth user (if missing), confirms the email, and assigns the
// `super_admin` role in `user_roles`.
//
// Invoke (after deploy):
//   curl -X POST https://<ref>.functions.supabase.co/create-admin \
//     -H "Authorization: Bearer $ADMIN_SEED_SECRET" \
//     -H "Content-Type: application/json" \
//     -d '{"email":"tech.raes@gmail.com","password":"<strong-password>"}'

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const ADMIN_NAME = "RAES TECH Admin";

serve(async (req) => {
  const secret = Deno.env.get("ADMIN_SEED_SECRET");
  const auth = req.headers.get("authorization") ?? "";
  if (!secret || auth !== `Bearer ${secret}`) {
    return json({ error: "Unauthorized" }, 401);
  }

  let body: { email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");
  if (!email || password.length < 8) {
    return json({ error: "email and a strong password are required" }, 400);
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (listError) return json({ error: listError.message }, 500);

  const found = users?.find((u) => u.email?.toLowerCase() === email);

  let userId: string;
  if (found) {
    const { error } = await supabase.auth.admin.updateUserById(found.id, { password });
    if (error) return json({ error: error.message }, 500);
    userId = found.id;
  } else {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: ADMIN_NAME },
    });
    if (error) return json({ error: error.message }, 500);
    userId = data.user.id;
  }

  await supabase.from("profiles").upsert(
    { id: userId, email, full_name: ADMIN_NAME },
    { onConflict: "id" },
  );
  await supabase.from("user_roles").upsert(
    { user_id: userId, role: "super_admin" },
    { onConflict: "user_id" },
  );

  return json({ ok: true, userId, email, role: "super_admin" }, 200);
});

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
