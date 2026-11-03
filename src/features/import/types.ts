/** Which catalogue the uploaded CSV belongs to. */
export type CatalogType = "main" | "apple-jv";

/** How to apply records on SKU match. */
export type ImportMode = "add" | "update" | "upsert";

/**
 * A single, normalized record parsed from one CSV row.
 * Product-level fields are repeated on every variant row (like the source
 * XLSX). `sku` is the unique key used for matching/upserting.
 */
export interface NormalizedRecord {
  // ---- product level ----
  brand: string;
  model?: string;
  name: string;
  slug?: string;
  description?: string;
  category?: string;
  status?: string;
  featured?: boolean;
  newArrival?: boolean;
  bestseller?: boolean;
  seoTitle?: string;
  seoDescription?: string;
  keywords?: string;
  // ---- variant level ----
  sku: string;
  supplierSku?: string;
  storage?: string;
  ram?: string;
  colors?: string[];
  display?: string;
  chipset?: string;
  rearCamera?: string;
  frontCamera?: string;
  battery?: string;
  network?: string;
  regionalModel?: string;
  ptaStatus?: string;
  simLockStatus?: string;
  condition?: string;
  warrantyType?: string;
  warrantyDuration?: string;
  warrantyProvider?: string;
  warrantyExclusions?: string;
  listedPrice?: number;
  buyNowPrice?: number;
  instalmentTotal?: number;
  stock?: number;
  lowStockThreshold?: number;
  requiresVerification?: boolean;
}

export interface ValidationIssue {
  field?: string;
  message: string;
}

export interface ImportRowResult {
  /** 1-based row index within the CSV (header excluded). */
  rowIndex: number;
  sku?: string;
  record?: NormalizedRecord;
  errors: ValidationIssue[];
}

export interface ImportSummary {
  catalogType: CatalogType;
  mode: ImportMode;
  total: number;
  imported: number;
  updated: number;
  skipped: number;
  failed: number;
  /** Only rows that failed validation, with their issues. */
  errors: ImportRowResult[];
}

/** A column mapping produced by auto-detection. */
export interface ColumnMapping {
  /** Target normalized field key (see columns.ts). */
  field: string;
  /** Resolved source CSV header (or undefined if not auto-detected). */
  header?: string;
  /** True if the header was recognized from the source CSV. */
  matched: boolean;
}

/** An audit-log entry row, as read back from import_audit_log. */
export interface AuditEntry {
  id?: string;
  catalog_type: string;
  mode: string;
  total: number;
  imported: number;
  updated: number;
  skipped: number;
  failed: number;
  created_by?: string;
  created_at: string;
  summary?: unknown;
}
