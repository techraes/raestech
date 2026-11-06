import { useEffect, useMemo, useRef, useState } from "react";
import {
  Images, UploadCloud, CheckCircle2, XCircle, Clock, Download, RefreshCw,
  ShieldAlert, Star, StarOff, FileUp, Loader2, EyeOff, AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader, Stat, EmptyState } from "./_ui";
import { useImageAssetsStore, resolveAssetPreviewUrls } from "@/store/imageAssets";
import { useCan } from "@/features/auth/permissions";
import type { ImageAsset, ImageAssetStatus } from "@/types";
import matchManifest from "@/data/image-matching-manifest.json";

interface ManifestModel {
  slug: string; brand: string; model: string; matched: boolean;
  skuRows: number; gallery: boolean; white: boolean; dark: boolean;
}
const MANIFEST = matchManifest as {
  totals: { modelsInManifest: number; skusInManifest: number; galleryOriginalsUnique: number; conceptPreviewUnique: number; assetsTotalUnique: number };
  matching: { modelsMatched: number; modelsUnmatched: number; skusMatched: number; skusUnmatched: number };
  models: ManifestModel[];
};

const STATUS_META: Record<ImageAssetStatus, { label: string; tone: "success" | "warning" | "destructive" | "muted" | "secondary" }> = {
  pending: { label: "Pending", tone: "muted" },
  staged: { label: "Staged", tone: "warning" },
  approved: { label: "Approved", tone: "success" },
  rejected: { label: "Rejected", tone: "destructive" },
};

export function AdminImages() {
  const can = useCan();
  const {
    assets, logs, uploadProgress, hydrateFromSupabase, stageFiles, review, setFeatured, addLog,
  } = useImageAssetsStore();
  const [tab, setTab] = useState<"review" | "upload" | "logs">("review");
  const [previewUrls, setPreviewUrls] = useState<Map<string, string>>(new Map());
  const [selectedModel, setSelectedModel] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | ImageAssetStatus>("all");
  const [note, setNote] = useState("");

  // ---- upload form state ----
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [bulkFiles, setBulkFiles] = useState<File[]>([]);
  const [batchMeta, setBatchMeta] = useState({ brand: "", model: "", slug: "", sku: "" });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{ staged: number; duplicates: number; failed: number } | null>(null);

  useEffect(() => { hydrateFromSupabase(); }, [hydrateFromSupabase]);

  useEffect(() => {
    resolveAssetPreviewUrls(assets).then(setPreviewUrls);
  }, [assets]);

  useEffect(() => {
    // Keep manifest-derived pending assets visible even before any upload,
    // so the review grid shows the full 125-model matching picture.
    const existingSlugs = new Set(assets.map((a) => a.productSlug));
    const pending = MANIFEST.models.filter((m) => !existingSlugs.has(m.slug)).map((m) => ({
      id: `pending-${m.slug}`,
      brand: m.brand,
      model: m.model,
      productSlug: m.slug,
      kind: (m.gallery ? "gallery_original" : "concept_preview") as ImageAsset["kind"],
      subKind: "gallery" as ImageAsset["subKind"],
      previewOnly: !m.gallery,
      status: "pending" as ImageAssetStatus,
      isFeatured: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
    // (We do not inject pending into the store — the grid composes them.)
    setPendingManifest(pending);
  }, [assets, MANIFEST]);

  const [pendingManifest, setPendingManifest] = useState<ImageAsset[]>([]);

  const allViewAssets = useMemo(() => {
    const manifestAssets: ImageAsset[] = pendingManifest;
    const merged = [...assets, ...manifestAssets];
    return merged;
  }, [assets, pendingManifest]);

  const filtered = useMemo(() => {
    let list = allViewAssets;
    if (selectedModel !== "all") list = list.filter((a) => a.productSlug === selectedModel);
    if (statusFilter !== "all") list = list.filter((a) => a.status === statusFilter);
    return list;
  }, [allViewAssets, selectedModel, statusFilter]);

  const modelOptions = useMemo(() => {
    const map = new Map<string, ManifestModel>();
    for (const m of MANIFEST.models) map.set(m.slug, m);
    return map;
  }, []);

  const stats = useMemo(() => {
    const staged = assets.filter((a) => a.status === "staged").length;
    const approved = assets.filter((a) => a.status === "approved").length;
    const rejected = assets.filter((a) => a.status === "rejected").length;
    const pending = pendingManifest.length;
    const concepts = assets.filter((a) => a.previewOnly).length + pendingManifest.filter((p) => p.previewOnly).length;
    const gallery = assets.filter((a) => !a.previewOnly).length;
    return { staged, approved, rejected, pending, concepts, gallery };
  }, [assets, pendingManifest]);

  async function handleBulkUpload() {
    if (!bulkFiles.length || !batchMeta.brand || !batchMeta.model || !batchMeta.slug) return;
    setIsUploading(true);
    setUploadResult(null);
    const res = await stageFiles(bulkFiles, {
      brand: batchMeta.brand,
      model: batchMeta.model,
      slug: batchMeta.slug,
      sku: batchMeta.sku || undefined,
      kind: "gallery_original",
      subKind: "gallery",
      previewOnly: false,
    });
    setUploadResult(res);
    addLog({
      id: `log-${Date.now()}`,
      batch: new Date().toISOString().slice(0, 19),
      kind: "upload",
      total: bulkFiles.length,
      staged: res.staged,
      duplicates: res.duplicates,
      failed: res.failed,
      summary: `${batchMeta.brand} ${batchMeta.model} — bulk upload`,
      createdAt: new Date().toISOString(),
    });
    setIsUploading(false);
    setBulkFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    setBulkFiles(files);
  }

  async function handleReview(id: string, decision: "approve" | "reject") {
    await review(id, decision, note.trim() || undefined);
    if (note.trim()) setNote("");
  }

  const currentUploads = Object.values(uploadProgress).filter((p) => p.status === "uploading").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Image Manager"
        subtitle="Stage, review and approve product imagery. Concepts stay preview-only; nothing replaces live images until approved."
        actions={
          <Button variant="outline" onClick={() => hydrateFromSupabase()}>
            <RefreshCw className="h-4 w-4" /> Sync from Supabase
          </Button>
        }
      />

      {/* Top stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Stat label="Models matched" value={`${MANIFEST.matching.modelsMatched}/${MANIFEST.totals.modelsInManifest}`} tone="success" />
        <Stat label="SKUs matched" value={`${MANIFEST.matching.skusMatched}/${MANIFEST.totals.skusInManifest}`} tone="success" />
        <Stat label="Gallery originals" value={stats.gallery} tone="info" />
        <Stat label="Preview-only concepts" value={stats.concepts} tone="warning" />
        <Stat label="Staged" value={stats.staged} tone="info" />
        <Stat label="Approved" value={stats.approved} tone="success" />
      </div>

      {/* Privacy note */}
      <div className="flex items-start gap-2 rounded-lg border border-sky-200 bg-sky-50 p-3 text-sm text-sky-900">
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          Staging lives in a private Supabase Storage bucket behind admin-only RLS. Guests and customers can
          never access unapproved imagery. Approved images only become live after an explicit admin action — no
          automatic publication, and generic concept illustrations are never usable as real product photos.
        </p>
      </div>

      {!can("products") && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          You need the <strong>products</strong> permission to manage images.
        </div>
      )}

      {can("products") && (
        <>
          {/* Tabs */}
          <div className="flex gap-2 border-b">
            {([
              { key: "review", label: "Review & Approve" },
              { key: "upload", label: "Bulk Upload" },
              { key: "logs", label: "Import Logs" },
            ] as const).map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium ${
                  tab === t.key ? "border-neutral-900 text-neutral-900" : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* ---------- Review tab ---------- */}
          {tab === "review" && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <Select value={selectedModel} onValueChange={setSelectedModel}>
                  <SelectTrigger className="w-[260px]">
                    <SelectValue placeholder="All models" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All models</SelectItem>
                    {MANIFEST.models.map((m) => (
                      <SelectItem key={m.slug} value={m.slug}>{m.brand} {m.model}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="staged">Staged</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
                <div className="ml-auto text-sm text-muted-foreground">
                  {filtered.length} asset(s)
                </div>
              </div>

              {filtered.length === 0 ? (
                <EmptyState title="No assets here" description="Stage or upload images to begin reviewing them." />
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filtered.map((asset) => {
                    const model = modelOptions.get(asset.productSlug);
                    const meta = STATUS_META[asset.status];
                    const url = previewUrls.get(asset.id) ?? asset.previewUrl;
                    return (
                      <Card key={asset.id} className="overflow-hidden">
                        <div className="relative aspect-square bg-muted">
                          {url ? (
                            <img src={url} alt={`${asset.brand} ${asset.model}`} className="h-full w-full object-contain" />
                          ) : (
                            <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground">
                              <EyeOff className="h-8 w-8" />
                              <span className="px-4 text-center text-xs">No preview (upload a file or sync from Supabase)</span>
                            </div>
                          )}
                          <div className="absolute left-2 top-2 flex flex-col gap-1">
                            {asset.previewOnly && (
                              <Badge variant="warning"><AlertTriangle className="h-3 w-3" /> Preview-only concept</Badge>
                            )}
                            {!asset.previewOnly && (
                              <Badge variant="secondary">Gallery original</Badge>
                            )}
                          </div>
                          <div className="absolute right-2 top-2">
                            <Badge variant={meta.tone}>{meta.label}</Badge>
                          </div>
                        </div>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-sm font-bold">{asset.brand} {asset.model}</p>
                              <p className="text-xs text-muted-foreground">{asset.productSlug}</p>
                              {asset.sku && <p className="text-xs text-muted-foreground">SKU {asset.sku}</p>}
                              {model && (
                                <Badge variant="outline" className="mt-1">{model.skuRows} SKU rows · {model.gallery ? "gallery" : "concept"} asset</Badge>
                              )}
                            </div>
                          </div>

                          {asset.reviewNote && (
                            <p className="mt-2 rounded bg-muted p-2 text-xs text-muted-foreground">{asset.reviewNote}</p>
                          )}

                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            {asset.status === "staged" && (
                              <>
                                <Button size="sm" onClick={() => handleReview(asset.id, "approve")}>
                                  <CheckCircle2 className="h-4 w-4" /> Approve
                                </Button>
                                <Button size="sm" variant="outline" className="text-destructive" onClick={() => handleReview(asset.id, "reject")}>
                                  <XCircle className="h-4 w-4" /> Reject
                                </Button>
                              </>
                            )}
                            {asset.status === "pending" && (
                              <Badge variant="muted"><Clock className="h-3 w-3" /> Awaiting upload (manifest match)</Badge>
                            )}
                            {asset.status === "approved" && (
                              <Button size="sm" variant={asset.isFeatured ? "default" : "outline"} onClick={() => setFeatured(asset.id, !asset.isFeatured)}>
                                {asset.isFeatured ? <Star className="h-4 w-4" /> : <StarOff className="h-4 w-4" />}
                                {asset.isFeatured ? "Featured" : "Set featured"}
                              </Button>
                            )}
                          </div>

                          {(asset.status === "staged" || asset.status === "approved") && (
                            <div className="mt-3">
                              <Label className="text-xs">Review note</Label>
                              <div className="mt-1 flex gap-2">
                                <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional note…" className="h-8 text-xs" />
                                <Button size="sm" variant="outline" onClick={async () => { await review(asset.id, asset.status === "approved" ? "approve" : "approve", note.trim() || undefined); setNote(""); }}>
                                  Save
                                </Button>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ---------- Upload tab ---------- */}
          {tab === "upload" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><UploadCloud className="h-5 w-5" /> Bulk Upload</CardTitle>
                <CardDescription>
                  Upload gallery originals (or verified photos) for a model. Files are sent to the private staging bucket,
                  deduplicated by SHA-256, and recorded in the asset registry. Preview-only concepts are staged separately
                  and can never be published as product photos.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                  <div className="space-y-1">
                    <Label>Brand</Label>
                    <Input value={batchMeta.brand} onChange={(e) => setBatchMeta({ ...batchMeta, brand: e.target.value })} placeholder="Apple" />
                  </div>
                  <div className="space-y-1">
                    <Label>Model</Label>
                    <Input value={batchMeta.model} onChange={(e) => setBatchMeta({ ...batchMeta, model: e.target.value })} placeholder="iPhone 15 Pro" />
                  </div>
                  <div className="space-y-1">
                    <Label>Product slug</Label>
                    <Input value={batchMeta.slug} onChange={(e) => setBatchMeta({ ...batchMeta, slug: e.target.value })} placeholder="apple-iphone-15-pro" />
                  </div>
                  <div className="space-y-1">
                    <Label>Variant SKU (optional)</Label>
                    <Input value={batchMeta.sku} onChange={(e) => setBatchMeta({ ...batchMeta, sku: e.target.value })} placeholder="RT-00001" />
                  </div>
                </div>

                <div>
                  <Label>Image files (JPG / PNG / WebP)</Label>
                  <div className="mt-1 flex items-center gap-3">
                    <Input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple
                      onChange={handleFileSelect} className="max-w-md cursor-pointer" />
                    <span className="text-sm text-muted-foreground">{bulkFiles.length} selected</span>
                  </div>
                </div>

                {currentUploads > 0 && (
                  <div className="flex items-center gap-2 text-sm text-sky-700">
                    <Loader2 className="h-4 w-4 animate-spin" /> Uploading {currentUploads} file(s)…
                  </div>
                )}

                {Object.entries(uploadProgress).filter(([, p]) => p.status === "error").length > 0 && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                    <p className="font-semibold">Recoverable upload errors</p>
                    <ul className="mt-1 list-inside list-disc">
                      {Object.entries(uploadProgress).filter(([, p]) => p.status === "error").map(([k, p]) => (
                        <li key={k}>{k} — {p.error}</li>
                      ))}
                    </ul>
                    <p className="mt-1 text-xs">Select the failed files again and re-upload; idempotent SHA-256 keys prevent duplicates.</p>
                  </div>
                )}

                {uploadResult && (
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                    Upload complete — <strong>{uploadResult.staged}</strong> staged,{" "}
                    <strong>{uploadResult.duplicates}</strong> duplicates skipped,{" "}
                    <strong>{uploadResult.failed}</strong> failed.
                  </div>
                )}

                <Button onClick={handleBulkUpload} disabled={!bulkFiles.length || isUploading || !batchMeta.brand || !batchMeta.model || !batchMeta.slug}>
                  {isUploading ? <><Loader2 className="h-4 w-4 animate-spin" /> Uploading…</> : <><FileUp className="h-4 w-4" /> Stage {bulkFiles.length} image(s)</>}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* ---------- Logs tab ---------- */}
          {tab === "logs" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5" /> Import Logs</CardTitle>
                <CardDescription>Every import batch, upload and review action is recorded here.</CardDescription>
              </CardHeader>
              <CardContent>
                {logs.length === 0 ? (
                  <EmptyState title="No import logs yet" description="Uploads and manifest stage runs will appear here." />
                ) : (
                  <div className="space-y-2">
                    {logs.map((l) => (
                      <div key={l.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3 text-sm">
                        <div>
                          <p className="font-semibold">{l.summary}</p>
                          <p className="text-xs text-muted-foreground">{l.batch}</p>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant="secondary">{l.total} total</Badge>
                          <Badge variant="success">{l.staged} staged</Badge>
                          {l.duplicates > 0 && <Badge variant="warning">{l.duplicates} dup</Badge>}
                          {l.failed > 0 && <Badge variant="destructive">{l.failed} failed</Badge>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
