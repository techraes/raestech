# Deployment Guide — RAES TECH

This guide covers standing up the real backend and deploying the storefront to
Vercel on `raestech.store`.

---

## 1. Supabase project

1. Create a free/paid project at https://supabase.com.
2. Copy the **Project URL** and the **anon (public) key** from
   *Settings → API*.
3. Apply the migrations. Run them in order (prefer the Supabase CLI for
   reviewable history):

   ```bash
   supabase link --project-ref YOUR_REF
   supabase db push
   ```

   Or paste the contents of each file in the SQL editor, in order:
   - `supabase/migrations/00001_init.sql` (schema, enums, triggers)
   - `supabase/migrations/00002_rls.sql` (Row Level Security policies)
   - `supabase/migrations/00003_functions.sql` (pricing/order functions + settings)
   - `supabase/seed_catalog.sql` (optional catalogue seed)

4. **Create your Super Admin** — in the SQL editor, after signing up your
   first account in the app:

   ```sql
   update public.user_roles set role = 'super_admin'
   where user_id = (select id from auth.users where email = 'you@raestech.store' limit 1);
   ```

   Only a Super Admin can manage roles/permissions.

> **Can't log in to the admin panel?** If sign-in fails with **"Invalid
> login credentials"**, the admin account is not provisioned in Supabase Auth
> (or the password is wrong). A password-only sign-in (`signInWithPassword`)
> requires a real, confirmed user in `auth.users`. Create one with either:
>
> **Option A — Edge function** (recommended, after deploying `create-admin`):
> ```bash
> supabase functions deploy create-admin
> npm run provision:admin -- tech.raes@gmail.com 'STRONG_PASSWORD'
> ```
> Requires `SUPABASE_PROJECT_REF` and `ADMIN_SEED_SECRET` env vars (or call the
> function directly with curl):
> ```bash
> curl -X POST https://<ref>.functions.supabase.co/create-admin \
>   -H "Authorization: Bearer $ADMIN_SEED_SECRET" \
>   -H "Content-Type: application/json" \
>   -d '{"email":"tech.raes@gmail.com","password":"STRONG_PASSWORD_HERE"}'
> ```
>
> **Option B — SQL script** (`supabase/scripts/provision_admin.sql`):
> ```bash
> psql "$DATABASE_URL" -v app_email='tech.raes@gmail.com' -v admin_password='STRONG_PASSWORD_HERE' -f supabase/scripts/provision_admin.sql
> ```
>
> Both create the user (email pre-confirmed), attach the profile, and grant
> `super_admin`. Use a strong password (≥ 8 characters). After that, sign in
> on `/login` and visit `/admin`. If the account exists but the password is
> unknown, use **Forgot password** to reset it.

### OTP / magic‑link emails (read this if you get a link instead of a code)

The app signs users in with an **email OTP** (`signInWithOtp` → `verifyOtp`).
By default Supabase's "Magic Link / OTP" and "Confirm Sign Up" templates send a
clickable `{{ .ConfirmationURL }}` **link**, not the 6‑digit code — so users
get an email like `https://vercel.com/sso/access/request…` (a Vercel SSO
redirect) instead of a code. Two fixes:

1. **Send the code, not a link.** Change the **Magic Link / OTP** and
   **Confirm Sign Up** templates to render `{{ .Token }}` (the 6‑digit code)
   and remove the confirmation‑URL link. Copy‑paste body:

   ```html
   <h2>Your RAES TECH sign-in code</h2>
   <p>Hi {{ .Email }},</p>
   <p>Use the 6-digit code below to sign in to your RAES TECH account:</p>
   <p style="font-size:26px;font-weight:700;letter-spacing:4px">{{ .Token }}</p>
   <p>This code expires shortly and can only be used once.</p>
   <p>If you didn't request this email, you can safely ignore it.</p>
   ```

   Where to apply it (the live project must be changed in the dashboard — the
   `config.toml` overrides in this repo only apply to local/self‑hosted dev):

   - **Dashboard** → Authentication → Email Templates → *Magic Link / OTP*
     (and *Confirm Sign Up*) → replace the body, set a subject like
     "Your RAES TECH sign-in code".
   - Or via the Management API:
     `curl -X PATCH "https://api.supabase.com/v1/projects/otvfosijrectvlwqqoll/config/auth"` with `mailer_templates_magic_link_content` / `mailer_subjects_magic_link` (and `mailer_templates_confirmation_content`).

2. **Keep Site URL/Redirect URLs pointing at the app**, not at Vercel's SSO.
   In Authentication → URL Configuration set the **Site URL** to the deployed
   app (e.g. `https://raestech-raes3.vercel.app`). If you see the
   `vercel.com/sso/access/request` bounce, your Vercel team/project has
   **SSO / Deployment Protection** enabled — unless all projects use it, turn
   that off (or exempt these URLs) so auth links don't get intercepted.

### "OTP not received" — confirmed failure mode (HTTP 500)

If a user requests a code and it never arrives, run:

```bash
node scripts/check-otp-email.mjs
```

If it prints **HTTP 500 `"Error sending confirmation email"`**, the app code is
fine — the OTP request is reaching Supabase Auth, but **Supabase's mailer
cannot deliver email**. OTP emails are sent by Supabase Auth's own mailer, NOT
by the `send-email` edge function (that function only handles transactional
emails). Fix in the Supabase Dashboard:

- **Authentication → SMTP Settings** → enable Custom SMTP with valid provider
  credentials (e.g. Resend: host `smtp.resend.com`, port `587`, username
  `resend`, password = your Resend API key).
- Use a **verified sender domain** (e.g. `no-reply@raestech.store`). The Resend
  test sender `@resend.dev` is commonly rejected — verify your domain and add
  the **SPF/DKIM** DNS records in your domain provider.
- Save, then re-run `node scripts/check-otp-email.mjs` — it should return
  **HTTP 200**.

If you rely on Supabase's default (hosted) mailer instead, confirm it is enabled
and not rate-limited for this project.

### Storage buckets

- Bucket `product-images` — **public** read, admin write (product photos).
- Bucket `private-documents` — **private** (CNIC / instalment documents).
  Access only via role-restricted, short-lived signed URLs; never public.

---

## 2. Environment variables

Set these in Vercel (Project → Settings → Environment Variables):

| Variable | Value |
|---|---|
| `VITE_SUPABASE_URL` | your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | **anon** (public) key |
| `SUPABASE_SERVICE_ROLE_KEY` | service-role key — **server-side only**, never in the client |

> Never commit `.env` or real keys. `.env.example` shows required names only.

**Edge function secrets** (set in Supabase → Edge Functions → Secrets, or in
`supabase/config.toml` for local dev):

| Variable | Used by | Purpose |
|---|---|---|
| `RESEND_API_KEY` | `send-email` | Resend API key (server-side only, never client) |
| `RESEND_FROM` | `send-email` | Verified sender, e.g. `RAES TECH <onboarding@resend.dev>` |

> `send-email` authenticates with the caller's Supabase **session JWT**
> (`verify_jwt = true`) and only sends to the authenticated user's own verified
> email. No shared secret is exposed to the browser.

### Resend setup
1. Create a project at https://resend.com, add and verify your sending domain.
2. Create an API key (`re_…`) in **API Keys**.
3. Set `RESEND_API_KEY` and `RESEND_FROM`.
4. Deploy the Edge Function:
   `supabase functions deploy send-email`.
5. Seed the `email_templates` table with at least `order_confirmation`,
   `password_reset`, and `instalment_reminder` templates (subject/body may use
   `{{placeholder}}` tokens — see `supabase/functions/send-email/render.mjs`).
6. Test: invoke the function while signed in (see header comment in `index.ts`).

---

## 3. Deploy the frontend to Vercel

1. Push the repo to GitHub.
2. In Vercel → **New Project** → import the repo (root = `raestech/`).
3. Framework preset: **Vite**. Build command `npm run build`, output `dist`.
4. Add the environment variables above, then **Deploy**.
5. Health check: open the production URL, confirm homepage loads, catalogue
   reads from Supabase, and login works.

---

## 4. Custom domain (raestech.store)

1. In Vercel project → **Settings → Domains** → add `raestech.store` (and
   `www`).
2. At your DNS registrar, add the records Vercel provides (A/AAAA or CNAME).
3. Vercel provisions **HTTPS** automatically. Wait for cert issuance.

---

## 5. Production smoke tests

- [ ] Homepage loads, announcement bar shows settings text.
- [ ] Catalogue lists real products from the database.
- [ ] Product detail shows variant prices and PTA/condition.
- [ ] A test customer registers and logs in.
- [ ] Buy Now checkout computes 10% discount; instalment page shows 20% advance.
- [ ] A test order is placed; bank-transfer payment flow shows your configured
      Faysal Bank details and lets the customer upload a receipt.
- [ ] Admin can mark a payment verified; order status advances.
- [ ] 404 page and empty states render.

---

## 6. Backup & recovery

- Enable **daily backups** in Supabase (Settings → Backups).
- Store the migration files in git (already done).
- Keep a documented restore drill: `supabase db restore` from a backup file.
- Admin credentials: use strong passwords; enable email confirmations.

### AI product images (optional)

The store auto-uses `public/images/products/{SKU}.png` when present, falling back
to the inline SVG mock-up otherwise. To generate AI images for the whole
catalogue:

```bash
# 1) create the prompt manifest (no key needed)
node scripts/generate-ai-images.mjs

# 2) generate images with a configured provider
IMAGE_PROVIDER=openai IMAGE_API_KEY=sk-... node scripts/generate-ai-images.mjs
IMAGE_PROVIDER=replicate IMAGE_API_KEY=r8_... node scripts/generate-ai-images.mjs
```

- Prompts are derived from real catalog data (brand, model, storage, RAM, colour).
- For Replicate, also set `REPLICATE_MODEL_VERSION` (e.g. an SDXL model version).
- Diffusion models approximate devices — visually verify a sample and re-run for
  any that look wrong. These are illustrative product renders, not official
  manufacturer/device-confirmation photos.

---

## 7. Going live checklist

- [ ] Policies/instalment agreement reviewed by a Pakistani legal adviser.
- [ ] Real product photos uploaded for every listed variant.
- [ ] Bank account details entered in Admin → Settings → Payment.
- [ ] Courier + tracking fields configured in Admin.
- [ ] Email provider (e.g. Resend/SendGrid) connected if you want real email.
- [ ] WhatsApp templates finalised (no live integration without a provider).

