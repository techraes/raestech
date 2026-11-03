import type { CatalogType, ImportRowResult, NormalizedRecord, ValidationIssue } from "./types";

export interface RecordInput {
  /** 1-based CSV data row index (header excluded). */
  rowIndex: number;
  record: Partial<NormalizedRecord>;
}

const PHONE_LIKE = ["phone", "smartphone", "cellphone", "mobile", "handset"];
const JV_LIKE = ["jv", "sim-locked", "simlocked", "sim locked", "locked"];

function includesAny(value: string, tokens: string[]): boolean {
  const v = value.toLowerCase();
  return tokens.some((t) => v.includes(t));
}

/** Normalize a raw condition string to the DB enum value. */
export function normalizeCondition(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const v = raw.toLowerCase().trim();
  if (["box_pack", "box pack", "box-packed", "new", "new box packed", "new box-pack", "sealed", "factory sealed", "brand new"].includes(v)) {
    return "box_pack";
  }
  if (["used", "second hand", "pre-owned", "gently used"].includes(v)) return "used";
  if (["refurbished", "refurb", "grade a", "grade-a", "renewed"].includes(v)) return "refurbished";
  return undefined;
}

/** Normalize a raw PTA status string to a canonical label. */
export function normalizePta(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const v = raw.toLowerCase().trim();
  if (v.includes("pta") && (v.includes("approved") || v.includes("official") || v.includes("activate"))) return "PTA Approved";
  if (v.includes("non") || v.includes("jv") || v.includes("not pta") || v.includes("box")) return "Non-PTA / JV";
  if (v.includes("pta")) return "PTA Approved";
  return raw.trim() || undefined;
}

function isNumber(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n);
}

/**
 * Validate a single record for the target catalogue.
 * Returns issues (empty when valid) and a *finalized* record with any
 * catalogue-specific normalization applied (e.g. forced SIM-lock).
 */
export function validateRecord(
  input: RecordInput,
  catalogType: CatalogType,
  seenSkus: Map<string, number>
): { issues: ValidationIssue[]; record: NormalizedRecord } {
  const r = input.record;
  const issues: ValidationIssue[] = [];
  const out: NormalizedRecord = {
    brand: (r.brand ?? "").trim(),
    name: (r.name ?? r.model ?? "").trim(),
    sku: (r.sku ?? "").trim(),
  };

  // ---- required fields ----
  if (!out.brand) issues.push({ field: "brand", message: "Brand is required." });
  if (!out.name) issues.push({ field: "name", message: "Product name or model is required." });
  if (!out.sku) issues.push({ field: "sku", message: "SKU is required." });

  // ---- duplicate SKU within the file ----
  if (out.sku) {
    const prior = seenSkus.get(out.sku.toLowerCase());
    if (prior != null) {
      issues.push({ field: "sku", message: `Duplicate SKU "${out.sku}" (also on row ${prior}).` });
    } else {
      seenSkus.set(out.sku.toLowerCase(), input.rowIndex);
    }
  }

  // ---- numeric prices / stock ----
  const listed = r.listedPrice;
  if (listed == null) {
    issues.push({ field: "listedPrice", message: "Listed price is required." });
  } else if (!isNumber(listed) || listed < 0) {
    issues.push({ field: "listedPrice", message: "Listed price must be a non-negative number." });
  }
  out.listedPrice = isNumber(listed) && listed >= 0 ? listed : undefined;

  if (r.buyNowPrice != null) {
    if (!isNumber(r.buyNowPrice) || r.buyNowPrice < 0) {
      issues.push({ field: "buyNowPrice", message: "Buy-now price must be a non-negative number." });
    } else {
      out.buyNowPrice = r.buyNowPrice;
    }
  }

  if (r.stock != null) {
    if (!isNumber(r.stock) || !Number.isInteger(r.stock) || r.stock < 0) {
      issues.push({ field: "stock", message: "Stock must be a non-negative integer." });
    } else {
      out.stock = r.stock;
    }
  }

  // ---- condition ----
  const cond = normalizeCondition(r.condition);
  if (!cond) {
    issues.push({
      field: "condition",
      message: `Unsupported condition "${r.condition ?? ""}". Use New/Box Pack, Used, or Refurbished.`,
    });
  } else {
    out.condition = cond;
  }

  // ---- category support ----
  const category = (r.category ?? "").trim();
  if (category) {
    const supported =
      catalogType === "apple-jv"
        ? includesAny(category, JV_LIKE) || includesAny(category, PHONE_LIKE)
        : includesAny(category, PHONE_LIKE);
    if (!supported) {
      issues.push({ field: "category", message: `Unsupported category "${category}" for the ${catalogType === "apple-jv" ? "Apple JV" : "main"} catalogue.` });
    }
  }
  out.category = category || undefined;

  // ---- PTA + SIM-lock (JV hardening) ----
  const pta = normalizePta(r.ptaStatus);
  out.ptaStatus = pta;

  if (catalogType === "apple-jv") {
    // JV iPhones are ALWAYS SIM-locked; never factory-unlocked.
    out.simLockStatus = "SIM-Locked";
    const rawLock = (r.simLockStatus ?? "").toLowerCase();
    if (rawLock.includes("unlock") && !rawLock.includes("no")) {
      issues.push({ field: "simLockStatus", message: "JV iPhones must be SIM-locked; factory-unlocked is not allowed." });
    }
    if (pta === "PTA Approved") {
      issues.push({ field: "ptaStatus", message: "JV iPhones are never PTA-approved. Correct the PTA status." });
    }
  } else if (r.simLockStatus) {
    const rawLock = (r.simLockStatus ?? "").toLowerCase();
    out.simLockStatus = includesAny(rawLock, ["lock", "jv"]) ? (rawLock.includes("un") ? "Unlocked" : "SIM-Locked") : rawLock;
  }

  // ---- warranty ----
  out.warrantyType = r.warrantyType?.trim() || undefined;
  out.warrantyDuration = r.warrantyDuration?.trim() || undefined;
  out.warrantyProvider = r.warrantyProvider?.trim() || undefined;
  out.warrantyExclusions = r.warrantyExclusions?.trim() || undefined;

  // ---- copy through remaining optional fields ----
  out.model = r.model?.trim() || undefined;
  out.slug = r.slug?.trim() || undefined;
  out.description = r.description?.trim() || undefined;
  out.status = r.status?.trim() || undefined;
  out.featured = r.featured ?? false;
  out.newArrival = r.newArrival ?? false;
  out.bestseller = r.bestseller ?? false;
  out.seoTitle = r.seoTitle?.trim() || undefined;
  out.seoDescription = r.seoDescription?.trim() || undefined;
  out.keywords = r.keywords?.trim() || undefined;
  out.supplierSku = r.supplierSku?.trim() || undefined;
  out.storage = r.storage?.trim() || undefined;
  out.ram = r.ram?.trim() || undefined;
  out.colors = r.colors ?? undefined;
  out.display = r.display?.trim() || undefined;
  out.chipset = r.chipset?.trim() || undefined;
  out.rearCamera = r.rearCamera?.trim() || undefined;
  out.frontCamera = r.frontCamera?.trim() || undefined;
  out.battery = r.battery?.trim() || undefined;
  out.network = r.network?.trim() || undefined;
  out.regionalModel = r.regionalModel?.trim() || undefined;
  out.instalmentTotal = isNumber(r.instalmentTotal) ? r.instalmentTotal : undefined;
  out.lowStockThreshold = isNumber(r.lowStockThreshold) ? r.lowStockThreshold : undefined;
  out.requiresVerification = r.requiresVerification ?? (catalogType === "apple-jv" ? true : false);

  return { issues, record: out };
}

/**
 * Validate a batch of records.
 * Returns per-row results and the count of valid (import-ready) records.
 */
export function validateAll(
  inputs: RecordInput[],
  catalogType: CatalogType
): { rows: ImportRowResult[]; validCount: number } {
  const seenSkus = new Map<string, number>();
  const rows: ImportRowResult[] = [];
  let validCount = 0;

  for (const input of inputs) {
    const { issues, record } = validateRecord(input, catalogType, seenSkus);
    rows.push({
      rowIndex: input.rowIndex,
      sku: record.sku,
      record,
      errors: issues,
    });
    if (issues.length === 0) validCount += 1;
  }

  return { rows, validCount };
}
