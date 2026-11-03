import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { AuditEntry, CatalogType, ImportMode, ImportRowResult, ImportSummary, NormalizedRecord } from "./types";

/** Map a normalized record to DB column names (snake_case) for the server. */
export function toDbRecord(rec: NormalizedRecord): Record<string, unknown> {
  return {
    brand: rec.brand,
    model: rec.model ?? null,
    name: rec.name,
    slug: rec.slug ?? null,
    description: rec.description ?? null,
    category: rec.category ?? null,
    status: rec.status ?? "active",
    featured: rec.featured ?? false,
    new_arrival: rec.newArrival ?? false,
    bestseller: rec.bestseller ?? false,
    seo_title: rec.seoTitle ?? null,
    seo_description: rec.seoDescription ?? null,
    keywords: rec.keywords ?? null,
    sku: rec.sku,
    supplier_sku: rec.supplierSku ?? null,
    storage: rec.storage ?? null,
    ram: rec.ram ?? null,
    colors: rec.colors ?? [],
    display: rec.display ?? null,
    chipset: rec.chipset ?? null,
    rear_camera: rec.rearCamera ?? null,
    front_camera: rec.frontCamera ?? null,
    battery: rec.battery ?? null,
    network: rec.network ?? null,
    regional_model: rec.regionalModel ?? null,
    pta_status: rec.ptaStatus ?? null,
    sim_lock_status: rec.simLockStatus ?? null,
    condition: rec.condition ?? "box_pack",
    warranty_type: rec.warrantyType ?? null,
    warranty_duration: rec.warrantyDuration ?? null,
    warranty_provider: rec.warrantyProvider ?? null,
    warranty_exclusions: rec.warrantyExclusions ?? null,
    listed_price: rec.listedPrice ?? 0,
    buy_now_price: rec.buyNowPrice ?? 0,
    instalment_total: rec.instalmentTotal ?? null,
    stock: rec.stock ?? 0,
    low_stock_threshold: rec.lowStockThreshold ?? 5,
    requires_verification: rec.requiresVerification ?? false,
  };
}

interface ServerSummary {
  total: number;
  imported: number;
  updated: number;
  skipped: number;
  failed: number;
  errors?: Array<{ row?: number; sku?: string; message?: string }>;
}

/** Build a client-side ImportSummary from pre-commit validation results. */
export function buildLocalSummary(
  catalogType: CatalogType,
  mode: ImportMode,
  rows: ImportRowResult[]
): ImportSummary {
  const total = rows.length;
  const failedRows = rows.filter((r) => r.errors.length > 0);
  const validRows = rows.filter((r) => r.errors.length === 0);

  let imported = 0;
  let updated = 0;
  let skipped = 0;

  if (mode === "add") imported = validRows.length;
  else if (mode === "update") updated = validRows.length;
  else {
    // upsert: simulate split (server decides exactly; this is a preview estimate).
    imported = Math.ceil(validRows.length / 2);
    updated = validRows.length - imported;
  }

  return {
    catalogType,
    mode,
    total,
    imported,
    updated,
    skipped,
    failed: failedRows.length,
    errors: failedRows,
  };
}

/**
 * Commit validated records to Supabase through the server-side
 * `import_products` RPC. The server re-validates, upserts by SKU and audits.
 * When Supabase is not configured we refuse and surface a clear message.
 */
export async function commitImport(params: {
  catalogType: CatalogType;
  mode: ImportMode;
  records: NormalizedRecord[];
}): Promise<{ ok: boolean; summary?: ImportSummary; message?: string }> {
  if (!isSupabaseConfigured) {
    return {
      ok: false,
      message:
        "Supabase is not configured (set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY before importing). No records were committed.",
    };
  }

  const payload = {
    catalog_type: params.catalogType,
    mode: params.mode,
    records: params.records.map(toDbRecord),
  };

  const { data, error } = await supabase!.rpc("import_products", { p_payload: payload });

  if (error) {
    return { ok: false, message: error.message };
  }

  const s = (data ?? {}) as ServerSummary;
  const summary: ImportSummary = {
    catalogType: params.catalogType,
    mode: params.mode,
    total: s.total ?? params.records.length,
    imported: s.imported ?? 0,
    updated: s.updated ?? 0,
    skipped: s.skipped ?? 0,
    failed: s.failed ?? 0,
    errors: (s.errors ?? []).map((e) => ({
      rowIndex: e.row ?? 0,
      sku: e.sku,
      errors: [{ field: "server", message: e.message ?? "Server rejected record" }],
    })),
  };

  return { ok: true, summary };
}

/** Fetch the most recent import audit log entries. */
export async function fetchAuditLog(limit = 25): Promise<AuditEntry[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase!
    .from("import_audit_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) return [];
  return (data ?? []) as AuditEntry[];
}

/** Build a CSV error report from per-row results. */
export function buildErrorReportCsv(rows: ImportRowResult[]): string {
  const header = ["Row", "SKU", "Errors"];
  const lines = [header.join(",")];
  for (const r of rows) {
    const messages = r.errors.map((e) => e.message).join("; ");
    const sku = (r.sku ?? "").replace(/"/g, '""');
    const safe = messages.replace(/"/g, '""');
    lines.push(`"${r.rowIndex}","${sku}","${safe}"`);
  }
  return lines.join("\n");
}
