# RAES TECH — Image Import Completion Report

**Task:** Implement the supplied `RAESTECH_MERCURY3_UPLOAD_READY_IMAGE_MASTER.zip` (Mercury 3
"upload ready" image master) into the existing RAES TECH React + Supabase storefront,
respecting the commercial/safety constraints.

---

## 1. What was supplied

The archive contains 253 entries (9.2 MB uncompressed):

- `product-images/` — **246 WebP assets** (123 models × 1280px + 600px) — AI concept renders.
- `manifests/` — `model_image_mapping.json`, `model_image_mapping.csv`, `product_sku_image_mapping.csv`, `import_validation_report.json`.
- `catalog/RAESTECH_Master_Catalog_Batch_30_Updated.xlsx`, `documentation/`.

Per the authoritative `model_image_mapping.json`:

| Metric | Count |
|---|---|
| Models in manifest | 125 |
| Catalog products | 125 |
| **Matched** (slug ↔ product.image basename) | **125** |
| Unmatched | 0 |
| QA status: `qa_review` | 116 |
| QA status: `qa_hold` (NO publish) | 7 |
| QA status: `reference_only` (keep existing image) | 2 (Apple iPhone 15 Pro, Google Pixel 8) |
| Concept assets staged (1280 & 600 webp) | 246 |
| Duplicate assets | 0 (idempotent SHA-256) |

**4K note:** several concept sources carry decorative "4K" labels. These are **not** treated as
proof of native 4K resolution and are not used to justify publishing.

---

## 2. Dry-run report

Generated at runtime from the live pack: **`data/reports/image-import-dryrun.json`**
(125 matched, 0 unmatched, 7 QA-hold, 2 reference-only, 116 review).

---

## 3. Import performed (safe, resumable, idempotent)

- Staged the 246 WebP assets into **`public/images/concepts/`** (source of the imported images).
  Re-running is idempotent: identical bytes are skipped; a SHA-256 manifest is recorded at
  `data/reports/staged_concepts_sha256.json`.
- Built a static, source-of-truth manifest **`src/data/image-manifest.json`** from
  `model_image_mapping.json` (script `scripts/build_image_manifest.py`). Every entry carries its
  QA status (`review`/`hold`/`reference_only`) and asset paths.

**Nothing is auto-published.** Concepts only appear on the storefront after an administrator
explicitly approves them in the admin review UI.

---

## 4. Admin review workflow (Catalog → Product Images)

Enhanced **`src/pages/admin/AdminImages.tsx`** with a new **“Import Review — Concept Images”**
panel (`src/components/image-import-review.tsx`):

- Thumbnail preview of each staged concept (local WebP).
- Model/brand + QA status badges: **Review** / **QA HOLD** / **Reference-only**.
- **Approve / Reject** buttons per review model; decisions persist via a localStorage-backed
  store (`src/store/imageApprovals.ts`).
- QA-HOLD and reference-only models **cannot** be approved/published (UI blocks them + always
  keep existing images).
- Summary stats (approved / rejected / held / in review), filter, show-held toggle, reset-all.

---

## 5. Storefront image display (adapter)

Updated **`src/components/product-image.tsx`** (used by product cards, homepage, category/search,
featured, product detail, instalment apply, admin editor):

- Prefers an **admin-approved** concept image when one exists; otherwise falls back to the existing
  approved `/images/products/<model>.jpg` image, then colour variant, then a graceful placeholder.
- Keeps lazy loading, `decoding="async"`, alt text, `object-cover`, and stable aspect containers.
- On error a failed concept **falls back to the existing base image** (never breaks the card).

**Verified display behaviour:** homepage product grid and product-detail page render with images,
0 console errors, no broken-image requests.

---

## 6. Safety & commercial rules preserved (not altered/verified)

- No duplicate products created; product IDs unchanged (constraint: no changes).

  All 125 products keep their `image` field; concepts are an *additional* approved layer.
- No service-role keys in frontend code (only the publishable anon key is used; server-side/edge
  paths remain server-only).
- QA-HOLD images are not auto-published; reference-only models keep existing images.
- Pricing, discounts (10% Buy Now), instalments (0% markup, 20% advance, 3/6/9/12 months),
  checkout, payment methods, stock, orders, shipping, warranties and CNIC instalment rules were
  **not modified** (no commercial source files touched).

---

## 7. Verification (Definition of Done)

| Check | Result |
|---|---|
| `npm run typecheck` | ✅ PASS (exit 0) |
| `npm run build` (tsc -b + vite build) | ✅ PASS (1802 modules, dist produced) |
| UI loaded & inspected in browser after changes | ✅ Homepage + product detail rendered; 0 console errors |
| Browser network / broken images | ✅ No image 404s on verified pages |

> **Limitation (honest):** the interactive admin panel could not be logged into in this session:
> the dev-admin password is masked in `.env.local` and the live Supabase login requires real
> credentials, so the review grid was verified via typecheck/build and code review, not a live
> admin screenshot. The storefront rendering (which is the visible effect of the display change)
> **was** browser-verified.

---

## 8. Rollback

- **Storefront images:** unchanged by default — only explicitly-approved concepts are shown; clear the
  approvals store (`raestech:image-approvals` in localStorage → “Reset all approvals” in the admin UI)
  to return every product to its existing image.
- **Assets:** the staged concepts live under `public/images/concepts/` and can be removed without
  affecting existing `/images/products/` images.
- **Source mapping:** `src/data/image-manifest.json` is regenerable via `scripts/build_image_manifest.py`.

---

## 9. Remaining blockers / next steps

1. **Official source images** — all supplied assets are AI concept renders; replace with legally
   usable, verified model- and colour-correct photos before broad publication (README_FIRST.md
   flags the same).
2. **QA-HOLD (7) models** — verify model/colour details before they can be approved:
   - Tecno Camon 50 Ultra 5G, Xiaomi 17 Ultra, Xiaomi Redmi 15C, Honor X8d, Honor X9d,
     itel Power 80, itel A100C.
3. **Reference-only (2) models** — Apple iPhone 15 Pro, Google Pixel 8 keep existing images (no
   imported asset).
4. **Supabase storage upload** — the existing staging/review pipeline (`src/lib/image-assets.ts`,
   `src/store/imageAssets.ts`) supports uploading to the `product-images-staging` bucket when the
   live project is reachable; the local manifest flow above works without it.
