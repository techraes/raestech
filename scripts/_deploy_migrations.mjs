// Deploy pending migrations to PRODUCTION.
//
// SAFETY:
//   - This script is READ-ONLY (dry-run) by default: it only lists the remote
//     migration state and does NOT change anything unless --apply is passed.
//   - Pushing requires BOTH the explicit --apply flag AND a typed "yes"
//     confirmation. There is no automatic --yes on the underlying command.
//   - The management token is read only from SUPABASE_ACCESS_TOKEN env or the
//     gitignored .env.local (see ./_token.mjs). It is never taken from argv.
import { spawnSync } from "node:child_process";
import { createInterface } from "node:readline";
import { getManagementToken } from "./_token.mjs";

const REF = "otvfosijrectvlwqqoll";

const token = getManagementToken();
if (!token) {
  console.error("SUPABASE_ACCESS_TOKEN not set (export it or put it in .env.local).");
  process.exit(1);
}
const env = { ...process.env, SUPABASE_ACCESS_TOKEN: token };

const apply = process.argv.includes("--apply");

function run(args) {
  console.log("\n$ supabase " + args.join(" "));
  const r = spawnSync("supabase", args, { env, stdio: "inherit", shell: true });
  if (r.status !== 0) {
    console.error(`supabase exited with status ${r.status}`);
    if (r.error) console.error(r.error.message);
    process.exit(r.status || 1);
  }
}

console.log("TARGET: PRODUCTION PROJECT " + REF);

// Always show remote state first (read-only).
run(["migration", "list", "--project-ref", REF]);

if (!apply) {
  console.warn("\nDRY-RUN: nothing was applied.");
  console.warn(`To PUSH pending migrations, re-run with --apply:\n  node scripts/_deploy_migrations.mjs --apply`);
  process.exit(0);
}

// Human confirmation gate before any mutation.
const rl = createInterface({ input: process.stdin, output: process.stdout });
rl.question(`\nType 'yes' to APPLY pending migrations to < ${REF} (production): `, (ans) => {
  rl.close();
  if (ans.trim().toLowerCase() !== "yes") {
    console.log("Aborted — no changes made.");
    process.exit(0);
  }
  // The typed confirmation above is the gate; --yes only suppresses the CLI's
  // redundant second prompt (which would otherwise fail on non-interactive stdin).
  run(["db", "push", "--project-ref", REF, "--yes"]);
  console.log("\nDone.");
});
