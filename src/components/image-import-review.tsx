import { useMemo, useState } from "react";
import { CheckCircle2, XCircle, Clock, AlertTriangle, ShieldAlert, Image } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { getManifestEntries, type ManifestEntry } from "@/lib/image-resolve";
import { useImageApprovals } from "@/store/imageApprovals";

const QA_BADGE: Record<string, { label: string; variant: "warning" | "secondary"; tone: string }> = {
  review: { label: "Concept", variant: "warning", tone: "border-amber-200 bg-amber-50 text-amber-800" },
  hold: { label: "QA HOLD", variant: "secondary", tone: "border-red-200 bg-red-50 text-red-700" },
  reference_only: { label: "Reference-only", variant: "secondary", tone: "border-neutral-200 bg-neutral-100 text-neutral-600" },
};

export function ImageImportReview() {
  const { decisions, setDecision, clearSlug, resetAll } = useImageApprovals();
  const [filter, setFilter] = useState("");
  const entries = getManifestEntries();
  const [showHeld, setShowHeld] = useState(false);

  const stats = useMemo(() => {
    const shown = entries.filter(
      (e) => e.qaStatus !== "reference_only" && decisions[e.slug] !== "rejected"
    ).length;
    const keptExisting = entries.filter((e) => decisions[e.slug] === "rejected").length;
    return {
      total: entries.length,
      shown,
      keptExisting,
      hold: entries.filter((e) => e.qaStatus === "hold").length,
      refOnly: entries.filter((e) => e.qaStatus === "reference_only").length,
    };
  }, [entries, decisions]);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    return entries.filter((e) => {
      if (!showHeld && e.qaStatus === "hold") return false;
      if (q && !`${e.brand} ${e.model} ${e.slug}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [entries, filter, showHeld]);

  function keepExisting(entry: ManifestEntry) {
    if (entry.qaStatus === "reference_only") return;
    setDecision(entry.slug, "rejected");
  }

  function useConcept(entry: ManifestEntry) {
    if (entry.qaStatus === "reference_only") return;
    clearSlug(entry.slug);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldAlert className="h-5 w-5" /> Imported Concept Images — Shown by Default
        </CardTitle>
        <CardDescription>
          All imported concept images now display on the storefront automatically. Use{" "}
          <strong>“Keep existing”</strong> to restore a model's original image instead.
          Reference-only models always keep their existing image.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <Stat label="Total models" value={stats.total} />
          <Stat label="Showing new image" value={stats.shown} tone="text-emerald-600" />
          <Stat label="Keeping existing" value={stats.keptExisting} tone="text-neutral-500" />
          <Stat label="QA HOLD" value={stats.hold} tone="text-red-600" />
          <Stat label="Reference-only" value={stats.refOnly} tone="text-neutral-400" />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter by brand / model…"
            className="max-w-xs"
          />
          <label className="flex cursor-pointer items-center gap-2 text-sm text-neutral-600">
            <input
              type="checkbox"
              checked={showHeld}
              onChange={(e) => setShowHeld(e.target.checked)}
            />
            Show QA HOLD (unverified)
          </label>
          <Button variant="outline" size="sm" onClick={resetAll} className="ml-auto">
            Reset all to shown
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((e) => (
            <ReviewCard key={e.slug} entry={e} onKeep={keepExisting} onUse={useConcept} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: string }) {
  return (
    <div className="rounded-lg border border-neutral-200 p-3 text-center">
      <div className={`text-2xl font-bold ${tone ?? "text-neutral-800"}`}>{value}</div>
      <div className="text-xs text-neutral-500">{label}</div>
    </div>
  );
}

function ReviewCard({
  entry,
  onKeep,
  onUse,
}: {
  entry: ManifestEntry;
  onKeep: (e: ManifestEntry) => void;
  onUse: (e: ManifestEntry) => void;
}) {
  const { decisions } = useImageApprovals();
  const kept = decisions[entry.slug] === "rejected";
  const qa = QA_BADGE[entry.qaStatus] ?? QA_BADGE.review;
  const isRefOnly = entry.qaStatus === "reference_only";

  return (
    <div className="flex flex-col rounded-xl border border-neutral-200 bg-white p-3">
      <div className={`relative mb-3 flex h-40 items-center justify-center overflow-hidden rounded-lg ${qa.tone}`}>
        {entry.asset600 ? (
          <img
            src={entry.asset600}
            alt={`${entry.brand} ${entry.model} concept preview`}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-contain"
          />
        ) : (
          <span className="flex items-center gap-1 text-sm text-neutral-400">
            <Image className="h-4 w-4" /> Keeps existing image
          </span>
        )}
      </div>

      <div className="mb-1 flex items-start justify-between gap-2">
        <div>
          <div className="text-sm font-semibold text-neutral-800">{entry.brand} {entry.model}</div>
          <div className="font-mono text-[11px] text-neutral-400">{entry.slug}</div>
        </div>
        <Badge variant={qa.variant}>{qa.label}</Badge>
      </div>

      <div className="mb-3 text-xs text-neutral-500">
        {entry.qaStatus === "hold" && (
          <span className="flex items-center gap-1 text-red-600"><AlertTriangle className="h-3 w-3" /> QA HOLD — AI concept, model/colour not verified</span>
        )}
        {isRefOnly && (
          <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Reference-only model — no imported asset, keeps existing image</span>
        )}
        {!isRefOnly && entry.qaStatus === "review" && (
          <span className="flex items-center gap-1">
            {kept ? (
              <><XCircle className="h-3 w-3 text-neutral-400" /> Keeping original image</>
            ) : (
              <><CheckCircle2 className="h-3 w-3 text-emerald-500" /> Showing new concept</>
            )}
          </span>
        )}
      </div>

      <div className="mt-auto flex items-center gap-2">
        {!isRefOnly && (
          <>
            <Button size="sm" variant={kept ? "outline" : "default"} className="flex-1" onClick={() => onUse(entry)}>
              <CheckCircle2 className="h-4 w-4" /> Use concept
            </Button>
            <Button size="sm" variant={kept ? "secondary" : "outline"} className="flex-1" onClick={() => onKeep(entry)}>
              <XCircle className="h-4 w-4" /> Keep existing
            </Button>
          </>
        )}
        {isRefOnly && (
          <div className="flex-1 rounded-md border border-dashed border-neutral-300 px-3 py-1.5 text-center text-xs text-neutral-400">
            Keeps existing image
          </div>
        )}
      </div>
    </div>
  );
}
