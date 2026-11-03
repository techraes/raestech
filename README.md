# RAES TECH — Smartphone E-commerce Platform

A production-grade, full-stack smartphone store for **Pakistan** (PKR).
React + TypeScript + Vite + Tailwind + shadcn-style UI on the frontend;
**Supabase** (PostgreSQL, Auth, Storage, RLS) as the backend; deployable to
**Vercel** on the custom domain **raestech.store**.

> **Status:** foundation, storefront, admin shell, pricing engine, auth and
> docs are built and the production build passes. See `docs/` for exactly what
> is wired to Supabase and what still requires your backend credentials.

---

## Highlights

- **Real catalogue seed** — generated from your provided product XLSX
  (`data/catalog/...xlsx` → `src/data/catalog_seed.json`): 125 products,
  13 brands, 446 variants with real SKUs, PTA status, condition, market price,
  Buy-Now price and instalment figures.
- **Pricing engine** — server-side mirror plus client display:
  - Buy Now = listed × 90% (10% discount, configurable)
  - Instalments = full listed price, 20% advance (default), 0% markup, tenures
    3/6/9/12 months, with the final payment rounded so the balance reaches
    exactly zero. Verified by `scripts/test-pricing.mjs`.
- **Storefront** — home, catalogue with real filters, brand pages, product
  detail (variants, colours, PTA/condition/warranty, related), search,
  compare, wishlist, cart, checkout, instalment info + application, payment
  instructions, and all policy pages.
- **Admin panel** (`/admin`) — dashboard from real data, products with
  export/import, orders, and a settings panel that edits business/design/
  pricing/shipping/payment configuration without code changes.
- **Auth** — Supabase Auth when configured; a local dev login otherwise.
- **Database** — `supabase/migrations/`: full schema (tables, enums,
  constraints, indexes, triggers) + **Row Level Security** + server-side
  pricing/order functions.

---

## Tech stack

| Layer | Tech |
|---|---|
| UI | React 18, TypeScript, Vite 5, Tailwind CSS 3, shadcn-style components, lucide-react |
| State | Zustand (cart) + React context (settings, auth) |
| Backend | Supabase (PostgreSQL, Auth, Storage, RLS, Edge Functions) |
| Deployment | Vercel (SPA) + Supabase cloud |

---

## Getting started

```bash
cd raestech
npm install
cp .env.example .env.local   # add your Supabase keys (or leave blank for dev build)
npm run dev                   # http://localhost:5173
```

Production build:

```bash
npm run build      # tsc + vite build -> dist/
npm run preview
```

---

## Project structure

```
raestech/
├─ src/
│  ├─ data/catalog_seed.json      # generated catalogue seed
│  ├─ data/catalog.ts             # data layer
│  ├─ lib/pricing.ts              # Buy Now + instalment engine
│  ├─ lib/supabase.ts             # supabase client (anon key only)
│  ├─ features/settings/          # settings store (DB-backed when live)
│  ├─ features/auth/              # auth context + protected routes
│  ├─ components/ui/              # shadcn-style primitives
│  ├─ components/product-card.tsx
│  ├─ layouts/                    # storefront / admin / account layouts
│  ├─ pages/storefront/           # public pages
│  ├─ pages/account/              # customer portal
│  ├─ pages/admin/                # admin panel
│  └─ App.tsx                     # routing
├─ supabase/migrations/           # SQL schema + RLS + functions (run these)
├─ data/catalog/                  # source XLSX + parse scripts
├─ scripts/                       # seed + pricing tests
└─ docs/                          # deployment & security guides
```

## Docs

- `docs/README.md` — this overview
- `docs/deployment.md` — Supabase setup, migrations, Vercel, domain/DNS, backup
- `docs/security.md` — RLS model, roles, private storage, checklist

---

## Honest status / not yet connected

- **Supabase**: schema/migrations/RLS are written and ready, but the backend is
  **not yet connected** — the app currently runs on the bundled seed + local
  demo auth. To go live: create a Supabase project, run migrations
  (`supabase/migrations/`), set `VITE_SUPABASE_*`, and create your admin user.
- **Payments / bank transfer**: UI + workflow (receipt upload, manual
  verification) are built; account details are entered privately by the admin.
- **Email / WhatsApp**: configured as settings/templates; **no provider is
  connected** — nothing is actually sent until you add a provider.
- **Couriers / live tracking**: manual tracking UI only; no courier API.
- **Product images**: no supplier photographs were bundled (the catalog had
  none). The app ships **generated, responsive SVG mockups** for every
  product/variant, styled from the real catalog data (brand, model, storage,
  colour), and **automatically loads AI/generated PNGs** (`public/images/products/{SKU}.png`)
  when present — with graceful SVG fallback.
  To generate AI images for the full catalogue, configure a provider and run:
  `node scripts/generate-ai-images.mjs` (writes `data/catalog/ai_prompts.json`
  and produces the PNGs via OpenAI Images or Replicate/Stable Diffusion).
  See `docs/deployment.md` → "AI product images". Verify results visually.
- **Legal**: review the instalment agreement and policies with a Pakistani legal
  adviser before accepting customers.
