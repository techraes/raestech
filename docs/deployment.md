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
