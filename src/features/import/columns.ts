import { normalizeHeader } from "@/lib/csv";
import type { ColumnMapping, NormalizedRecord } from "./types";

export type FieldKind = "text" | "number" | "boolean" | "list";

export interface FieldDef {
  key: string;
  label: string;
  kind: FieldKind;
  /** Normalized synonyms used for header auto-detection. */
  synonyms: string[];
}

export const FIELD_DEFS: FieldDef[] = [
  // ---- product level ----
  { key: "brand", label: "Brand", kind: "text", synonyms: ["brand", "make", "manufacturer", "company", "brandname"] },
  { key: "model", label: "Model", kind: "text", synonyms: ["model", "modelname", "device", "productmodel"] },
  { key: "name", label: "Product name", kind: "text", synonyms: ["name", "productname", "title", "listingname", "product"] },
  { key: "slug", label: "Slug", kind: "text", synonyms: ["slug", "urlslug", "handleslug", "productslug"] },
  { key: "description", label: "Description", kind: "text", synonyms: ["description", "desc", "details", "productdescription"] },
  { key: "category", label: "Category", kind: "text", synonyms: ["category", "type", "catalog", "class", "producttype"] },
  { key: "status", label: "Status", kind: "text", synonyms: ["status", "productstatus", "listingstatus"] },
  { key: "featured", label: "Featured", kind: "boolean", synonyms: ["featured", "isfeatured", "highlight"] },
  { key: "newArrival", label: "New arrival", kind: "boolean", synonyms: ["newarrival", "new", "isnew", "newlyadded"] },
  { key: "bestseller", label: "Best seller", kind: "boolean", synonyms: ["bestseller", "bestselling", "popular"] },
  { key: "seoTitle", label: "SEO title", kind: "text", synonyms: ["seotitle", "metatitle", "pagetitle"] },
  { key: "seoDescription", label: "SEO description", kind: "text", synonyms: ["seodescription", "metadescription"] },
  { key: "keywords", label: "Keywords", kind: "text", synonyms: ["keywords", "tagskeywords", "tags"] },

  // ---- variant level ----
  { key: "sku", label: "SKU", kind: "text", synonyms: ["sku", "skuid", "variantsku", "itemcode", "stockkeepingunit"] },
  { key: "supplierSku", label: "Supplier SKU", kind: "text", synonyms: ["suppliersku", "vendorsku", "partnumber", "suppliercode"] },
  { key: "storage", label: "Storage", kind: "text", synonyms: ["storage", "capacity", "rom", "internalstorage"] },
  { key: "ram", label: "RAM", kind: "text", synonyms: ["ram", "memory", "rm"] },
  { key: "colors", label: "Colours", kind: "list", synonyms: ["colors", "colour", "colours", "color", "variantcolor", "shade"] },
  { key: "display", label: "Display", kind: "text", synonyms: ["display", "screensize", "screen", "panel"] },
  { key: "chipset", label: "Chipset", kind: "text", synonyms: ["chipset", "processor", "soc", "cpu"] },
  { key: "rearCamera", label: "Rear camera", kind: "text", synonyms: ["rearcamera", "camera", "mainsensor", "maincamera"] },
  { key: "frontCamera", label: "Front camera", kind: "text", synonyms: ["frontcamera", "selfiecamera", "frontsensor", "selfie"] },
  { key: "battery", label: "Battery", kind: "text", synonyms: ["battery", "batterycapacity", "mah", "capacitymah"] },
  { key: "network", label: "Network bands", kind: "text", synonyms: ["network", "bands", "connectivity", "5g", "5gnetwork"] },
  { key: "regionalModel", label: "Regional model", kind: "text", synonyms: ["regionalmodel", "region", "regionvariant", "regioncode"] },
  { key: "ptaStatus", label: "PTA status", kind: "text", synonyms: ["ptastatus", "pta", "ptaapproved", "ispta"] },
  { key: "simLockStatus", label: "SIM-lock status", kind: "text", synonyms: ["simlockstatus", "simlock", "simlocked", "clocked", "unlocked"] },
  { key: "condition", label: "Condition", kind: "text", synonyms: ["condition", "productcondition", "cond", "grade"] },
  { key: "warrantyType", label: "Warranty type", kind: "text", synonyms: ["warrantytype", "warranty", "coveragetype"] },
  { key: "warrantyDuration", label: "Warranty duration", kind: "text", synonyms: ["warrantyduration", "warrantyperiod", "warrantyterm"] },
  { key: "warrantyProvider", label: "Warranty provider", kind: "text", synonyms: ["warrantyprovider", "provider", "servicecenter"] },
  { key: "warrantyExclusions", label: "Warranty exclusions", kind: "text", synonyms: ["warrantyexclusions", "exclusions", "exceptions"] },
  { key: "listedPrice", label: "Listed price", kind: "number", synonyms: ["listedprice", "price", "retailprice", "marketprice", "listprice", "landprice"] },
  { key: "buyNowPrice", label: "Buy-now price", kind: "number", synonyms: ["buynowprice", "buynprice", "cashprice", "discountprice", "instantprice"] },
  { key: "instalmentTotal", label: "Instalment total", kind: "number", synonyms: ["instalmenttotal", "instalment", "installmenttotal", "installment", "numprice"] },
  { key: "stock", label: "Stock", kind: "number", synonyms: ["stock", "quantity", "qty", "availability", "units"] },
  { key: "lowStockThreshold", label: "Low-stock threshold", kind: "number", synonyms: ["lowstockthreshold", "lowstock", "threshold", "reorderpoint"] },
  { key: "requiresVerification", label: "Requires verification", kind: "boolean", synonyms: ["requiresverification", "verification", "imeiverification", "verify"] },
];

const FIELD_BY_SYNONYM = new Map<string, FieldDef>();
for (const def of FIELD_DEFS) {
  for (const s of def.synonyms) FIELD_BY_SYNONYM.set(normalizeHeader(s), def);
}

export function fieldDef(key: string): FieldDef | undefined {
  return FIELD_DEFS.find((d) => d.key === key);
}

/**
 * Auto-detect column mapping from a CSV header row.
 * Returns one ColumnMapping per recognized header plus a list of headers that
 * could not be mapped to any known field.
 */
export function detectColumnMapping(headers: string[]): {
  mappings: ColumnMapping[];
  unmappedHeaders: string[];
} {
  const used = new Set<string>();
  const mappings: ColumnMapping[] = [];
  const unmappedHeaders: string[] = [];

  for (const header of headers) {
    const key = normalizeHeader(header);
    if (!key) {
      unmappedHeaders.push(header);
      continue;
    }
    const def = FIELD_BY_SYNONYM.get(key);
    if (def && !used.has(def.key)) {
      used.add(def.key);
      mappings.push({ field: def.key, header, matched: true });
    } else {
      // Either unknown, or this field was already claimed; leave as unmapped.
      unmappedHeaders.push(header);
    }
  }

  return { mappings, unmappedHeaders };
}

/** Parse a scalar cell according to the target field kind. */
export function parseCell(value: string, kind: FieldKind): unknown {
  const v = value.trim();
  if (v === "") return undefined;

  if (kind === "number") {
    // Drop thousands separators, then extract the first clean number token so
    // currency labels ("Rs.", "PKR", "$") never leak into the value.
    const cleaned = v.replace(/,/g, "");
    const m = /[-+]?\d+(?:\.\d+)?/.exec(cleaned);
    if (!m) return undefined;
    const num = Number(m[0]);
    return Number.isFinite(num) ? num : undefined;
  }

  if (kind === "boolean") {
    const t = v.toLowerCase();
    if (["true", "yes", "y", "1", "active", "on"].includes(t)) return true;
    if (["false", "no", "n", "0", "inactive", "off"].includes(t)) return false;
    return undefined;
  }

  if (kind === "list") {
    const parts = v.split(/[|;]/).map((s) => s.trim()).filter(Boolean);
    return parts.length ? parts : undefined;
  }

  return v;
}

/**
 * Build a NormalizedRecord from a raw CSV data row given the column mappings.
 * `headers` is the (trimmed) header row; every mapping carries the resolved
 * source header, whose column index is looked up here.
 */
export function buildRecordFromRow(
  headers: string[],
  row: string[],
  mappings: ColumnMapping[]
): Partial<NormalizedRecord> {
  const headerIndex = new Map<string, number>();
  headers.forEach((h, i) => {
    const key = normalizeHeader(h);
    if (key && !headerIndex.has(key)) headerIndex.set(key, i);
  });

  const record: Partial<NormalizedRecord> = {};
  for (const m of mappings) {
    if (!m.matched || !m.header) continue;
    const idx = headerIndex.get(normalizeHeader(m.header));
    if (idx == null || idx >= row.length) continue;
    const def = fieldDef(m.field);
    if (!def) continue;
    const value = parseCell(row[idx], def.kind);
    if (value !== undefined) (record as Record<string, unknown>)[m.field] = value;
  }
  return record;
}
