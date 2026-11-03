/**
 * RFC 4180-ish CSV parsing with a few practical relaxations.
 *
 * - Handles UTF-8 and UTF-8 BOM input. Callers should decode files with
 *   FileReader(encoding = "utf-8") which already strips the BOM; we also
 *   defensively strip a leading BOM (\uFEFF) here.
 * - Supports quoted fields containing commas, double-quotes (`""` escape)
 *   and embedded line breaks, plus CRLF / LF line endings.
 * - Returns the rows as `string[][]`; a trailing empty last line is dropped.
 */

export const BOM = "\uFEFF";

export function stripBOM(text: string): string {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

/**
 * Parse CSV text into rows. Every row is an array of field strings.
 * Empty fields become "".
 */
export function parseCSV(text: string): string[][] {
  const src = stripBOM(text);
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let i = 0;
  const n = src.length;

  while (i < n) {
    const ch = src[i];

    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i += 2;
        } else {
          inQuotes = false;
          i += 1;
        }
      } else {
        field += ch;
        i += 1;
      }
      continue;
    }

    if (ch === '"' && field.length === 0) {
      inQuotes = true;
      i += 1;
      continue;
    }

    if (ch === ",") {
      row.push(field);
      field = "";
      i += 1;
      continue;
    }

    if (ch === "\r") {
      // CRLF -> treat as one newline; lone CR also ends the row.
      if (src[i + 1] === "\n") i += 1;
      row.push(field);
      field = "";
      rows.push(row);
      row = [];
      i += 1;
      continue;
    }

    if (ch === "\n") {
      row.push(field);
      field = "";
      rows.push(row);
      row = [];
      i += 1;
      continue;
    }

    field += ch;
    i += 1;
  }

  // Flush the final field that was not terminated by a delimiter/newline.
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  // Drop a fully-empty trailing row (common at EOF).
  if (rows.length > 0) {
    const last = rows[rows.length - 1];
    if (last.length === 1 && last[0].trim() === "") rows.pop();
  }

  return rows;
}

/** Trim whitespace from every field in a row (helper for header + data). */
export function trimRow(row: string[]): string[] {
  return row.map((f) => f.trim());
}

/** Normalize a header label for fuzzy matching. */
export function normalizeHeader(label: string): string {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, "");
}
