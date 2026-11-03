/**
 * RAES TECH — server-side template rendering for transactional email.
 *
 * This module is imported by BOTH the Edge Function (via Deno import map)
 * and the Node test harness (scripts/test-send-email.mjs), so the rendering
 * logic is exercised by a real unit test without needing a live API call.
 *
 * Syntax: {{field}} is replaced by the value found at `data.field`.
 * Values are HTML-escaped by default (safe for email bodies). The literal
 * string "{{...}}" that does not resolve is left untouched so template
 * authoring mistakes are visible rather than silently blank.
 */

export function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function render(template, data = {}, options = {}) {
  const escape = options.escape !== false;
  return String(template).replace(/\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g, (match, key) => {
    let value = data;
    for (const part of key.split(".")) {
      if (value == null) return match; // unresolved placeholder stays literal
      value = value[part];
    }
    if (value == null || value === "") return match;
    return escape ? escapeHtml(value) : String(value);
  });
}
