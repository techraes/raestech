import { useMemo, useRef, useState } from "react";
import {
  Upload, Download, FileUp, CheckCircle2, AlertTriangle, XCircle,
  Loader2, ShieldCheck, Info, ArrowRight, ClipboardList,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatPKR } from "@/lib/utils";
import { isSupabaseConfigured } from "@/lib/supabase";
import { parseCSV, trimRow } from "@/lib/csv";
import { detectColumnMapping, buildRecordFromRow } from "@/features/import/columns";
import { validateAll } from "@/features/import/validate";
import { commitImport, fetchAuditLog, buildErrorReportCsv, buildLocalSummary } from "@/features/import/importService";
import type { AuditEntry, CatalogType, ColumnMapping, ImportMode, ImportRowResult, ImportSummary } from "@/features/import/types";

const CATALOG_LABEL: Record<CatalogType, string> = {
  main: "Main smartphone catalogue",
  "apple-jv": "Apple JV / SIM-Locked iPhone catalogue",
};

const MODE_LABEL: Record<ImportMode, string> = {
  add: "Add new only (skip existing SKUs)",
  update: "Update existing only (skip new SKUs)",
  upsert: "Add new + update existing (by SKU)",
};

export function AdminImport() {
  const [catalogType, setCatalogType] = useState<CatalogType>("main");
  const [mode, setMode] = useState<ImportMode>("upsert");
  const [fileName, setFileName] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [dataRows, setDataRows] = useState<string[][]>([]);
  const [loadError, setLoadError] = useState("");
  const [committing, setCommitting] = useState(false);
  const [commitMessage, setCommitMessage] = useState("");
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  // ---- auto-downect column mapping ----
  const { mappings, unmappedHeaders } = useMemo(() => detectColumnMapping(headers), [headers]);

  // ---- build normalized records from raw rows ----
  const inputs = useMemo(
    () => dataRows.map((row, i) => ({ rowIndex: i + 1, record: buildRecordFromRow(headers, row, mappings) })),
    [headers, dataRows, mappings]
  );

  // ---- validate ----
  const validation = useMemo(() => validateAll(inputs, catalogType), [inputs, catalogType]);
  const rows = validation.rows;
  const validRecords = rows.filter((r) => r.errors.length === 0).map((r) => r.record!);
  const invalidCount = rows.length - validRecords.length;

  function readFile(file: File) {
    setLoadError("");
    setSummary(null);
    setCommitMessage("");
    setFileName(file.name);
    setAudit([]);

    const reader = new FileReader();
    reader.onerror = () => setLoadError("Could not read the file.");
    reader.onload = () => {
      const text = String(reader.result ?? "");
      const parsed = parseCSV(text);
      if (parsed.length < 2) {
        setLoadError("The file must contain a header row and at least one data row.");
        setHeaders([]);
        setDataRows([]);
        return;
      }
      const headerRow = trimRow(parsed[0]);
      const body = parsed.slice(1).map(trimRow).filter((r) => r.some((c) => c.trim() !== ""));
      setHeaders(headerRow);
      setDataRows(body);
    };
    reader.readAsText(file, "utf-8");
  }

  async function handleImport() {
    if (validRecords.length === 0) return;
    setCommitting(true);
    setCommitMessage("");
    const res = await commitImport({ catalogType, mode, records: validRecords });
    setCommitting(false);
    if (!res.ok) {
      setCommitMessage(res.message ?? "Import failed.");
      return;
    }
    setSummary(res.summary ?? null);
    setCommitMessage("Import completed successfully.");
    const log = await fetchAuditLog();
    setAudit(log);
  }

  function downloadErrorReport() {
    const failed = rows.filter((r) => r.errors.length > 0);
    if (failed.length === 0) return;
    const csv = buildErrorReportCsv(failed);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "import-error-report.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function downloadTemplate() {
    const sample = [
      "brand,model,name,sku,storage,ram,colors,category,condition,pta_status,sim_lock_status,listed_price,buy_now_price,stock",
      'Apple,iPhone 13,iPhone 13 128GB,APL-IP13-128,128GB,4GB,Midnight|Black,Smartphone,New,PTA Approved,Unlocked,250000,240000,10',
      'Apple,iPhone 12,iPhone 12 JV 64GB,APL-IP12JV-64,64GB,4GB,Black,Apple JV,Used,Non-PTA / JV,SIM-Locked,180000,170000,5',
    ];
    const blob = new Blob([sample.join("\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "catalogue-import-template.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  const previewSummary = rows.length ? buildLocalSummary(catalogType, mode, rows) : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Product Catalogue Import</h1>
        <p className="text-sm text-muted-foreground">
          Upload a CSV (UTF-8 / UTF-8 BOM) to import or update the catalogue. Rows are validated before anything is written.
        </p>
      </div>

      {!isSupabaseConfigured && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-semibold">Supabase is not configured</p>
            <p className="mt-1">
              Set <code className="rounded bg-amber-100 px-1">VITE_SUPABASE_URL</code> and{" "}
              <code className="rounded bg-amber-100 px-1">VITE_SUPABASE_ANON_KEY</code> to enable live imports and audit
              logging. Preview, validation and error reporting still work below.
            </p>
          </div>
        </div>
      )}

      {/* Setup */}
      <Card>
        <CardHeader>
          <CardTitle>1 · Choose catalogue &amp; mode</CardTitle>
          <CardDescription>Select which catalogue to import into and how SKU matches should be handled.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Catalogue</Label>
              <Select value={catalogType} onValueChange={(v) => setCatalogType(v as CatalogType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="main">Main smartphone catalogue</SelectItem>
                  <SelectItem value="apple-jv">Apple JV / SIM-Locked iPhone</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Import mode</Label>
              <Select value={mode} onValueChange={(v) => setMode(v as ImportMode)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="upsert">Add new + update existing</SelectItem>
                  <SelectItem value="add">Add new only</SelectItem>
                  <SelectItem value="update">Update existing only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">{MODE_LABEL[mode]}</p>
        </CardContent>
      </Card>

      {/* Upload */}
      <Card>
        <CardHeader>
          <CardTitle>2 · Upload CSV</CardTitle>
          <CardDescription>UTF-8 and UTF-8 BOM files are supported. The header row is auto-detected.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div
            className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-colors hover:border-primary"
            onClick={() => fileRef.current?.click()}
          >
            <FileUp className="h-8 w-8 text-muted-foreground" />
            <p className="mt-2 text-sm font-medium">{fileName || "Click to choose a CSV file"}</p>
            <p className="text-xs text-muted-foreground">.csv · text/csv · UTF-8 / UTF-8 BOM</p>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) readFile(f);
                e.target.value = "";
              }}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={downloadTemplate}>
              <Download className="h-4 w-4" /> Download CSV template
            </Button>
          </div>
          {loadError && <p className="text-sm text-red-600">{loadError}</p>}
        </CardContent>
      </Card>

      {/* Column mapping */}
      {headers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>3 · Auto-detected columns</CardTitle>
            <CardDescription>
              {mappings.length} column(s) mapped. {unmappedHeaders.length > 0 ? `${unmappedHeaders.length} unrecognised header(s).` : "All headers recognised."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1.5">
              {mappings.map((m) => (
                <Badge key={m.field} variant="secondary" className="font-normal">
                  {m.header} → <span className="font-semibold">{m.field}</span>
                </Badge>
              ))}
              {unmappedHeaders.map((h) => (
                <Badge key={h} variant="outline" className="text-amber-700">
                  {h} <span className="text-muted-foreground">(unmapped)</span>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preview + validation */}
      {rows.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle>4 · Preview &amp; validation</CardTitle>
                <CardDescription>
                  {rows.length} record(s) parsed — {validRecords.length} valid, {invalidCount} with errors.
                </CardDescription>
              </div>
              {invalidCount > 0 && (
                <Button variant="outline" size="sm" onClick={downloadErrorReport}>
                  <Download className="h-4 w-4" /> Download error report
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="max-h-[420px] overflow-auto rounded-lg border">
              <table className="w-full min-w-[760px] text-sm">
                <thead className="sticky top-0 bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="p-2">#</th>
                    <th className="p-2">SKU</th>
                    <th className="p-2">Brand</th>
                    <th className="p-2">Name</th>
                    <th className="p-2">Storage</th>
                    <th className="p-2">Condition</th>
                    <th className="p-2">Listed price</th>
                    <th className="p-2">PTA / SIM</th>
                    <th className="p-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => {
                    const rc = r.record;
                    const valid = r.errors.length === 0;
                    return (
                      <tr key={r.rowIndex} className="border-t align-top last:border-b-0">
                        <td className="p-2 text-muted-foreground">{r.rowIndex}</td>
                        <td className="p-2 font-medium">{rc?.sku || "—"}</td>
                        <td className="p-2">{rc?.brand || "—"}</td>
                        <td className="p-2">{rc?.name || "—"}</td>
                        <td className="p-2">{rc?.storage || "—"}</td>
                        <td className="p-2">{rc?.condition || "—"}</td>
                        <td className="p-2">{rc?.listedPrice != null ? formatPKR(rc.listedPrice) : "—"}</td>
                        <td className="p-2">
                          <span className="block">{rc?.ptaStatus || "—"}</span>
                          {rc?.simLockStatus ? <span className="block text-xs text-muted-foreground">{rc.simLockStatus}</span> : null}
                        </td>
                        <td className="p-2">
                          {valid ? (
                            <Badge variant="success">
                              <CheckCircle2 className="h-3 w-3" /> Valid
                            </Badge>
                          ) : (
                            <div className="space-y-1">
                              <Badge variant="destructive">
                                <XCircle className="h-3 w-3" /> Error
                              </Badge>
                              {r.errors.map((e, i) => (
                                <p key={i} className="text-[11px] leading-tight text-red-600">
                                  {e.message}
                                </p>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {previewSummary && (
              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
                <Stat label="Total" value={previewSummary.total} />
                <Stat label="To import" value={previewSummary.imported} tone="success" />
                <Stat label="To update" value={previewSummary.updated} tone="info" />
                <Stat label="Skipped" value={previewSummary.skipped} tone="muted" />
                <Stat label="Failed" value={previewSummary.failed} tone="destructive" />
              </div>
            )}

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Button onClick={handleImport} disabled={committing || validRecords.length === 0}>
                {committing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {committing ? "Importing…" : `Import ${validRecords.length} record(s)`}
              </Button>
              <ShieldCheck className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                Commits via the secure server-side import function. Invalid rows are never sent.
              </span>
            </div>

            {commitMessage && (
              <p className={`mt-3 text-sm ${commitMessage.startsWith("Import") ? "text-emerald-700" : "text-red-600"}`}>
                {commitMessage}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      {summary && (
        <Card>
          <CardHeader>
            <CardTitle>Import summary</CardTitle>
            <CardDescription>
              {CATALOG_LABEL[summary.catalogType]} · {MODE_LABEL[summary.mode]}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              <Stat label="Total" value={summary.total} />
              <Stat label="Imported" value={summary.imported} tone="success" />
              <Stat label="Updated" value={summary.updated} tone="info" />
              <Stat label="Skipped" value={summary.skipped} tone="muted" />
              <Stat label="Failed" value={summary.failed} tone="destructive" />
            </div>
            {summary.errors.length > 0 && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm">
                <p className="font-semibold text-red-700">Server-side rejects</p>
                <ul className="mt-1 list-inside list-disc text-red-700">
                  {summary.errors.map((e, i) => (
                    <li key={i}>
                      Row {e.rowIndex} {e.sku ? `(${e.sku})` : ""}: {e.errors.map((m) => m.message).join("; ")}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Audit log */}
      {audit.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4" /> Import audit log
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-[320px] overflow-auto rounded-lg border">
              <table className="w-full min-w-[640px] text-sm">
                <thead className="sticky top-0 bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="p-2">When</th>
                    <th className="p-2">Catalogue</th>
                    <th className="p-2">Mode</th>
                    <th className="p-2">Total</th>
                    <th className="p-2">Imported</th>
                    <th className="p-2">Updated</th>
                    <th className="p-2">Skipped</th>
                    <th className="p-2">Failed</th>
                  </tr>
                </thead>
                <tbody>
                  {audit.map((a) => (
                    <tr key={a.id} className="border-t">
                      <td className="p-2">{new Date(a.created_at).toLocaleString()}</td>
                      <td className="p-2">{a.catalog_type}</td>
                      <td className="p-2">{a.mode}</td>
                      <td className="p-2">{a.total}</td>
                      <td className="p-2">{a.imported}</td>
                      <td className="p-2">{a.updated}</td>
                      <td className="p-2">{a.skipped}</td>
                      <td className="p-2">{a.failed}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <ArrowRight className="h-3.5 w-3.5" />
        JV iPhones are always forced to SIM-Locked and are never PTA-approved.
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: "success" | "info" | "muted" | "destructive" }) {
  const tones: Record<string, string> = {
    success: "text-emerald-700",
    info: "text-sky-700",
    muted: "text-muted-foreground",
    destructive: "text-red-600",
  };
  return (
    <div className="rounded-lg border bg-card p-3">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={`mt-1 text-xl font-extrabold ${tones[tone ?? ""] ?? "text-foreground"}`}>{value}</p>
    </div>
  );
}
