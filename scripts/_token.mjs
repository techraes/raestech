// Shared, read-only helper: resolve the Supabase management token.
//
// SECURITY: the token is ONLY read from the SUPABASE_ACCESS_TOKEN environment
// variable (with a fallback to the gitignored .env.local file). It is never
// accepted as a command-line argument, so it is not exposed in shell history,
// process listings, or tool logs.
import { readFileSync } from "node:fs";

export function getManagementToken() {
  if (process.env.SUPABASE_ACCESS_TOKEN) {
    return process.env.SUPABASE_ACCESS_TOKEN;
  }
  // Fallback 1: gitignored local env file (same store as VITE_SUPABASE_*).
  try {
    const content = readFileSync(".env.local", "utf8");
    const line = content.split("\n").find((l) => l.startsWith("SUPABASE_ACCESS_TOKEN="));
    if (line) {
      return line.slice("SUPABASE_ACCESS_TOKEN=".length).trim();
    }
  } catch {
    /* file not present */
  }
  // Fallback 2: temporary dev-only token file (created by a dev, deleted
  // after use). Never committed, never accepted from argv.
  try {
    const content = readFileSync("scripts/.management-token", "utf8").trim();
    if (content) return content;
  } catch {
    /* file not present */
  }
  return "";
}
