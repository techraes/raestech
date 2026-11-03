import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const seed = JSON.parse(readFileSync(path.join(ROOT, "src/data/catalog_seed.json"), "utf-8"));
const OUT = path.join(ROOT, "public/images/products");
mkdirSync(OUT, { recursive: true });

function colorFromName(name) {
  const n = (name || "").toLowerCase();
  if (/white|silver|starlight|lightning|ivory/.test(n)) return { hex: "#e8e8e8", dark: "#9ca3af", text: "#111827" };
  if (/black|midnight|space/.test(n)) return { hex: "#1f2937", dark: "#000000", text: "#ffffff" };
  if (/graphite/.test(n)) return { hex: "#374151", dark: "#111827", text: "#ffffff" };
  if (/titanium|grey|gray/.test(n)) return { hex: "#9ca3af", dark: "#4b5563", text: "#111827" };
  if (/pink/.test(n)) return { hex: "#f4a9c2", dark: "#d15b86", text: "#ffffff" };
  if (/gold|yellow|cream/.test(n)) return { hex: "#e8c37a", dark: "#c7952f", text: "#111827" };
  if (/blue|sierra|azure/.test(n)) return { hex: "#3b82f6", dark: "#1d4ed8", text: "#ffffff" };
  if (/green|alpine|mint/.test(n)) return { hex: "#22c55e", dark: "#15803d", text: "#ffffff" };
  if (/red|product/.test(n)) return { hex: "#ef4444", dark: "#b91c1c", text: "#ffffff" };
  if (/purple|deep|amet/.test(n)) return { hex: "#a855f7", dark: "#7e22ce", text: "#ffffff" };
  if (/brown/.test(n)) return { hex: "#a16207", dark: "#713f12", text: "#ffffff" };
  return { hex: "#6b7280", dark: "#374151", text: "#ffffff" };
}

function esc(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function svgFor(product, variant) {
  const c = colorFromName(variant.colors[0] || product.brand);
  const brand = esc(product.brand);
  const model = esc(product.model);
  const storage = esc(variant.storage || "");
  const ram = esc(variant.ram || "");
  const initial = esc((product.brand || "R")[0].toUpperCase());

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" width="600" height="600" role="img" aria-label="${esc(product.name)} ${storage}">
  <defs>
    <radialGradient id="bg" cx="50%" cy="38%" r="80%">
      <stop offset="0%" stop-color="${c.hex}" stop-opacity="0.9"/>
      <stop offset="55%" stop-color="${c.dark}" stop-opacity="0.88"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="1"/>
    </radialGradient>
    <linearGradient id="phoneBody" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.14"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0.28"/>
    </linearGradient>
    <linearGradient id="screen" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#f8fafc"/>
      <stop offset="100%" stop-color="#e2e8f0"/>
    </linearGradient>
    <filter id="shadow" x="-30%" y="-30%" width="160%" height="170%">
      <feDropShadow dx="0" dy="22" stdDeviation="26" flood-color="#000" flood-opacity="0.55"/>
    </filter>
  </defs>

  <rect width="600" height="600" fill="url(#bg)"/>

  <g filter="url(#shadow)">
    <rect x="175" y="60" width="250" height="480" rx="34" fill="url(#phoneBody)" stroke="rgba(255,255,255,0.35)" stroke-width="2"/>
    <rect x="188" y="74" width="224" height="452" rx="26" fill="url(#screen)"/>
    <rect x="270" y="88" width="60" height="6" rx="3" fill="#cbd5e1"/>
    <circle cx="316" cy="106" r="4" fill="#94a3b8"/>
    <text x="300" y="150" font-family="Segoe UI, Arial, sans-serif" font-size="26" font-weight="700" letter-spacing="2" fill="#475569" text-anchor="middle">${brand}</text>
    <text x="300" y="200" font-family="Segoe UI, Arial, sans-serif" font-size="34" font-weight="800" fill="#0f172a" text-anchor="middle">${model}</text>
    <rect x="236" y="236" width="128" height="44" rx="22" fill="#0f172a"/>
    <text x="300" y="264" font-family="Segoe UI, Arial, sans-serif" font-size="18" font-weight="700" fill="#ffffff" text-anchor="middle">${storage} · ${ram}</text>
    <g transform="translate(300,360)" stroke="#0f172a" stroke-width="3" fill="none" stroke-linecap="round">
      <rect x="-36" y="-52" width="72" height="104" rx="12"/>
      <line x1="-4" y1="44" x2="4" y2="44"/>
    </g>
  </g>

  <circle cx="300" cy="512" r="26" fill="rgba(255,255,255,0.18)"/>
  <text x="300" y="521" font-family="Segoe UI, Arial, sans-serif" font-size="24" font-weight="800" fill="#fff" text-anchor="middle">${initial}</text>
</svg>`;
}

let count = 0;
for (const p of seed.products) {
  for (const v of p.variants) {
    writeFileSync(path.join(OUT, `${v.sku}.svg`), svgFor(p, v));
    count++;
  }
}
console.log(`Generated ${count} responsive product images into public/images/products/`);
