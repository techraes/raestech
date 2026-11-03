/** Map a colour name to a representative hex (used for image placeholders & swatches). */
export function colorFromName(name?: string | null): { hex: string; dark: string; text: string } {
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
