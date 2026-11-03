#!/usr/bin/env node
/**
 * Generate AI product images for the ENTIRE catalogue.
 *
 * This script:
 *   1. Reads the real catalog seed (src/data/catalog_seed.json).
 *   2. Builds an accurate, per-variant prompt (brand, model, storage, RAM,
 *      colour) — grounded in the actual product data.
 *   3. Writes a manifest `data/catalog/ai_prompts.json` (always).
 *   4. If a provider is configured, generates `public/images/products/{SKU}.png`
 *      for every variant.
 *
 * Providers (set env):
 *   IMAGE_PROVIDER=openai   IMAGE_API_KEY=sk-...
 *   IMAGE_PROVIDER=replicate IMAGE_API_KEY=r8_...   (Stable Diffusion etc.)
 *
 * Example:
 *   IMAGE_PROVIDER=openai IMAGE_API_KEY=sk-... node scripts/generate-ai-images.mjs
 *
 * NOTE: a diffusion model approximates a device; always visually verify a
 * sample before publishing. This does NOT claim official/verified device
 * accuracy.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const seed = JSON.parse(readFileSync(path.join(ROOT, "src/data/catalog_seed.json"), "utf-8"));
const OUT_DIR = path.join(ROOT, "public/images/products");
mkdirSync(OUT_DIR, { recursive: true });

const PROVIDER = process.env.IMAGE_PROVIDER?.toLowerCase() || "";
const API_KEY = process.env.IMAGE_API_KEY || "";

function colorName(c) {
  const n = (c || "").toLowerCase();
  if (/black|midnight|space/.test(n)) return "black";
  if (/white|silver|starlight|ivory/.test(n)) return "silver/white";
  if (/graphite/.test(n)) return "graphite grey";
  if (/titanium|grey|gray/.test(n)) return "titanium grey";
  if (/pink/.test(n)) return "pink";
  if (/gold|yellow|cream/.test(n)) return "gold";
  if (/blue/.test(n)) return "blue";
  if (/green/.test(n)) return "green";
  if (/red/.test(n)) return "red";
  if (/purple/.test(n)) return "purple";
  if (/brown/.test(n)) return "brown";
  return "dark";
}

function buildPrompt(product, variant) {
  const color = colorName(variant.colors?.[0] || product.brand);
  const device = `${product.brand} ${product.model}`;
  return {
    sku: variant.sku,
    filename: `${variant.sku}.png`,
    prompt:
      `${device}, ${variant.storage || ""} ${variant.ram || ""}, ${color} color, ` +
      `professional studio product photography of a single modern smartphone, ` +
      `centered, slight three-quarter angle, dark minimal gradient background, ` +
      `soft dramatic lighting, sharp focus, high detail, premium commercial render, ` +
      `square composition`,
    negative_prompt:
      "text, watermark, logo, caption, blurry, low quality, distorted, deformed, extra fingers, multiple phones, reflection artifacts",
    width: 1024,
    height: 1024,
  };
}

// ---- Manifest (always written) ----
const prompts = [];
for (const p of seed.products) {
  for (const v of p.variants) {
    prompts.push(buildPrompt(p, v));
  }
}
const manifestPath = path.join(ROOT, "data/catalog/ai_prompts.json");
writeFileSync(manifestPath, JSON.stringify(prompts, null, 2));
console.log(`Manifest written: ${prompts.length} prompts -> data/catalog/ai_prompts.json`);

if (!PROVIDER || !API_KEY) {
  console.log("\nNo IMAGE_PROVIDER / IMAGE_API_KEY set — skipping actual generation.");
  console.log("To generate images, run e.g.:");
  console.log("  IMAGE_PROVIDER=openai IMAGE_API_KEY=sk-... node scripts/generate-ai-images.mjs");
  console.log("  IMAGE_PROVIDER=replicate IMAGE_API_KEY=r8_... node scripts/generate-ai-images.mjs");
  process.exit(0);
}

// ---- Providers ----

async function generateOpenAI(prompt) {
  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${API_KEY}` },
    body: JSON.stringify({
      model: "gpt-image-1",
      prompt: prompt.prompt,
      size: `${prompt.width}x${prompt.height}`,
      n: 1,
      response_format: "b64_json",
    }),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${await res.text()}`);
  const json = await res.json();
  return Buffer.from(json.data[0].b64_json, "base64");
}

async function generateReplicate(prompt) {
  const create = await fetch("https://api.replicate.com/v1/predictions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${API_KEY}` },
    body: JSON.stringify({
      version: process.env.REPLICATE_MODEL_VERSION, // e.g. a Stable Diffusion model version
      input: {
        prompt: prompt.prompt,
        negative_prompt: prompt.negative_prompt,
        width: prompt.width,
        height: prompt.height,
      },
    }),
  });
  if (!create.ok) throw new Error(`Replicate create ${create.status}: ${await create.text()}`);
  const { urls } = await create.json();
  for (let i = 0; i < 120; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    const poll = await fetch(urls.get, { headers: { Authorization: `Bearer ${API_KEY}` } });
    const status = await poll.json();
    if (status.status === "succeeded") {
      const imgRes = await fetch(status.output[0]);
      return Buffer.from(await imgRes.arrayBuffer());
    }
    if (status.status === "failed") throw new Error(`Replicate failed: ${JSON.stringify(status.error)}`);
  }
  throw new Error("Replicate timeout");
}

let ok = 0;
let fail = 0;
for (const pr of prompts) {
  const out = path.join(OUT_DIR, pr.filename);
  if (existsSync(out)) { ok++; continue; } // skip existing
  try {
    const buf = PROVIDER === "openai" ? await generateOpenAI(pr) : await generateReplicate(pr);
    writeFileSync(out, buf);
    ok++;
    console.log(`generated ${pr.filename}`);
  } catch (e) {
    fail++;
    console.error(`failed ${pr.filename}:`, e.message);
  }
}
console.log(`\nDone. generated=${ok} failed=${fail}`);
