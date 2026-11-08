import { createClient } from "@supabase/supabase-js";

const token = process.env.SUPABASE_ACCESS_TOKEN;
const ref = process.argv[2] || "xisvlnruafmfnjtbwjin";
if (!token) {
  console.error("No SUPABASE_ACCESS_TOKEN");
  process.exit(1);
}

const H = { Authorization: "Bearer " + token };
const r = await fetch(`https://api.supabase.com/v1/projects/${ref}/api-keys`, { headers: H });
const j = await r.json();
const sk = (j || []).find((k) => k.name === "service_role")?.api_key;
if (!sk) {
  console.error("no service role key");
  process.exit(1);
}

const sb = createClient(`https://${ref}.supabase.co`, sk, { auth: { persistSession: false } });

const users = [
  { email: "e2e.customer1@raes.test", password: "E2eCustomer1!", name: "Test Customer One", role: "customer" },
  { email: "e2e.customer2@raes.test", password: "E2eCustomer2!", name: "Test Customer Two", role: "customer" },
  { email: "e2e.admin@raes.test", password: "E2eAdmin1!", name: "Test Admin", role: "super_admin" },
];

for (const u of users) {
  try {
    const { data, error } = await sb.auth.admin.createUser({ email: u.email, password: u.password, email_confirm: true });
    if (error) {
      if (/already been registered|already registered|already exists/i.test(error.message)) {
        console.log(u.email, "-> already exists");
        const { data: lu } = await sb.auth.admin.listUsers({ page: 1, perPage: 1000 });
        const found = lu.users.find((x) => x.email === u.email);
        if (found) {
          await sb.from("profiles").upsert({ id: found.id, full_name: u.name, email: u.email });
          await sb.from("user_roles").upsert({ user_id: found.id, role: u.role });
        }
        continue;
      }
      console.log(u.email, "-> ERR", error.message);
      continue;
    }
    const id = data.user.id;
    const { error: up } = await sb.from("profiles").upsert({ id, full_name: u.name, email: u.email });
    const { error: ur } = await sb.from("user_roles").upsert({ user_id: id, role: u.role });
    console.log(u.email, "-> created id", id, "profile", up ? "ERR " + up.message : "ok", "role", ur ? "ERR " + ur.message : "ok");
  } catch (e) {
    console.log(u.email, "-> EXC", e.message);
  }
}
