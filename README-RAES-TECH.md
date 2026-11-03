# RAES TECH — Smartphone Store (full project)

Complete production build of the RAES TECH storefront + admin.

## Run it (local)
```bash
npm install        # if node_modules is missing
npm run dev        # dev server -> http://localhost:5173
# or production:
npm run build
npm run preview    # -> http://localhost:4173
```

## What's inside
- `src/` — React + TypeScript + Vite source
- `public/` — favicon, robots.txt, sitemap.xml, product images
- `dist/` — ready-to-deploy production build (serve this folder)
- `supabase/migrations/` — database schema + row-level security
- `docs/` — deployment & go-live guide (Supabase + Vercel)
- `data/catalog/` — product catalogue seed + AI prompt manifest

## Go-live (requires your accounts)
See `docs/deployment.md`. In short:
1. Create a Supabase project, link, run migrations (`supabase db push`).
2. Put `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` in `.env.local`.
3. Bootstrap your Super Admin role per `docs/deployment.md`.
4. Deploy `dist/` to Vercel with those env vars.

## Demo
The store runs on the seeded catalogue with a demo customer login; the admin panel
activates once Supabase is connected and your Super Admin role is bootstrapped.
