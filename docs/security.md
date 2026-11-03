# Security Model — RAES TECH

This document summarises the security design and the RLS model implemented in
`supabase/migrations/`.

---

## Principles

- **Never trust the frontend.** Prices, stock and payment status are validated
  server-side (SQL functions / Edge Functions). The client only displays.
- **No service-role key in the browser.** Only the anon key ships to the
  frontend. Admin operations are gated by RLS policies using server-side role
  checks, not by hiding UI.
- **Row Level Security enforced everywhere** — see table below.
- **Private documents** (CNIC) live in a private bucket, accessed only via
  short-lived signed URLs, with access logged.

---

## Roles (`user_roles`)

- `customer` (default for every new account)
- `super_admin` — full control, manages roles & sensitive settings
- `product_manager` — catalogue, variants, inventory
- `order_manager` — orders & shipping
- `payment_verifier` — verify/reject bank transfers
- `instalment_reviewer` — review applications, CNIC documents, collections
- `support_staff` — support-facing reads/writes

**Only Super Admin can change roles.** Normal staff cannot elevate their own
role (enforced by RLS: only rows where caller is an admin are writable, and
role changes are audited).

---

## RLS model (summary)

| Table | Public read | Owner read/write | Admin write |
|---|---|---|---|
| brands / categories / products / variants / images | ✅ (active) | — | ✅ |
| banners / homepage_sections / menus / content_pages | ✅ (visible) | — | ✅ |
| website_settings | via safe `public_settings` view | — | ✅ |
| profiles | — | ✅ (own) | ✅ |
| addresses | — | ✅ (own) | ✅ |
| carts / wishlists + items | — | ✅ (own) | ✅ |
| orders / order_items | — | ✅ (own read, own create) | ✅ |
| payments | — | ✅ (own read/create) | ✅ update |
| payment_receipts | — | ✅ (own) | ✅ |
| refunds | — | ✅ (own read/create) | ✅ |
| coupons | — | — | ✅ (public validate via function) |
| instalment_applications | — | ✅ (own) | ✅ |
| instalment_documents (CNIC) | — | ✅ (own select) | ✅ |
| instalment_agreements | — | ✅ (own select) | ✅ + customer acceptance |
| instalment_schedules / collections | — | ✅ (own select) | ✅ |
| ledger_entries | — | — | ✅ (append-only) |
| reviews | ✅ (approved) | ✅ (own insert) | ✅ |
| notifications | — | ✅ (own) | — |
| audit_logs | — | — | ✅ |

**Critical rule:** customers can never update their own payment verification
status — only `payment_verifier`/admin can (see the `payments_admin_update`
policy and the explicit denial policy for owners).

---

## Private document handling (CNIC)

- Stored in the **private** `private-documents` bucket.
- No public URL is ever generated; retrieval uses role-restricted short-lived
  signed URLs.
- File type and size are validated on upload; transfer is over TLS.
- Access is logged; retention/deletion follows the Privacy Policy.
- No NADRA or government verification is claimed; the system is designed so an
  authorised, tested identity provider can be plugged into later.

---

## Payment integrity

- Payments are created in `pending_verification` and **only** marked verified
  after staff independently check the bank transaction.
- An uploaded receipt is never treated as proof of payment.
- `ledger_entries` are immutable/append-only; corrections use reversal/
  adjustment entries, never silent edits.
- Idempotent order placement (server-side `place_order`) decrements stock
  transactionally to avoid overselling under concurrency.

---

## What to add before launch (if not already done)

- **Rate limiting** on auth + upload + instalment endpoints (Supabase Edge
  Functions / gateway rules).
- **CSRF** protection for state-changing routes.
- **Security headers** (HSTS, CSP) — add via Vercel `vercel.json` or in the
  hosting layer.
- A proper **audit trail viewer** in the admin panel.

---

## Verification

Run the production build (`npm run build`) — it enforces strict TypeScript.
Authorisation and RLS tests are outlined in `docs/testing.md` and should be run
against a live Supabase project before accepting real customers.
