// Save the current production build (dist/) to a fresh folder on the user's
// Desktop with a short README. Run: node scripts/_save_desktop_build.mjs
import { cpSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

const dest = join(homedir(), "Desktop", "RAES-TECH-website-build");
if (!existsSync("dist")) {
  console.error("No dist/ found — run `npm run build` first.");
  process.exit(1);
}
cpSync("dist", dest, { recursive: true });

const readme = [
  "# RAES TECH - Production Website Build (updated)",
  "",
  "This folder is the production build of the RAES TECH storefront",
  "(commit 81777e0, pushed to https://github.com/techraes/raestech.git).",
  "",
  "## What's inside",
  "- index.html - entry point",
  "- assets/ - bundled JS/CSS",
  "- images/ - product/marketing imagery",
  "- favicon.svg, robots.txt, sitemap.xml",
  "",
  "## How to serve it",
  "Any static host works (Vercel, Netlify, nginx, or local preview):",
  "    npx serve .",
  "or",
  "    npm run preview",
  "",
  "## Notes",
  "- Static build; talks to Supabase at runtime for products, checkout, auth.",
  "- Apply migration supabase/migrations/00022_instalment_offer_color_caseinsensitive.sql (supabase db push).",
  "- Re-run `npm run build` after further source changes.",
  "",
].join("\n");
writeFileSync(join(dest, "README.md"), readme);

console.log("Saved build ->", dest);
console.log(readdirSync(dest).join(", "));
