import { useCallback, useEffect, useMemo, useState } from "react";
import { Search, ZoomIn, RotateCcw, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { getSignedUrl, RECEIPT_BUCKET } from "@/lib/uploads";
import { formatPKR } from "@/lib/utils";
import { useCan } from "@/features/auth/permissions";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader, EmptyState, Stat } from "./_ui";

type ProofStatus = "pending_verification" | "verified" | "rejected";
const KIND_LABEL: Record<string, string> = {
  buy_now: "Full payment (Buy Now)",
  instalment_advance: "Instalment advance",
  instalment_monthly: "Monthly instalment",
};
const STATUS_TONE: Record<ProofStatus, "warning" | "success" | "destructive"> = {
  pending_verification: "warning",
  verified: "success",
  rejected: "destructive",
};

interface ProofRow {
  id: string;
  user_id: string;
  kind: string;
  order_id: string | null;
  instalment_application_id: string | null;
  instalment_schedule_id: string | null;
  claimed_amount: number;
  verified_amount: number | null;
  transfer_date: string;
  bank_reference: string;
  file_path: string;
  status: ProofStatus;
  rejection_reason: string | null;
  reviewed_at: string | null;
  created_at: string;
  order_number?: string;
  application_number?: string;
  customer?: string;
  customer_email?: string;
  total?: number;
  due?: number;
  previously_confirmed?: number;
  projected_after?: number;
  customer_balance?: number;
}

export function AdminPaymentReview() {
  const can = useCan();
  // Review UI is gated to staff who hold the "payments" permission
  // (payment_verifier / finance_manager / super_admin). The RPC enforces the
  // same rule server-side via is_finance_staff().
  const canReview = can("payments");
  const [proofs, setProofs] = useState<ProofRow[]>([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProofStatus | "all">("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<ProofRow | null>(null);

  const load = useCallback(async () => {
    if (!isSupabaseConfigured) { setError("Supabase not configured."); setLoading(false); return; }
    setLoading(true); setError("");
    try {
      const { data: p, error: pErr } = await supabase!
        .from("payment_proofs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (pErr) throw pErr;
      const list = (p as ProofRow[]) || [];

      const orderIds = [...new Set(list.map((x) => x.order_id).filter(Boolean))];
      const appIds = [...new Set(list.map((x) => x.instalment_application_id).filter(Boolean))];
      const userIds = [...new Set(list.map((x) => x.user_id))];

      const [oRes, aRes, uRes] = await Promise.all([
        orderIds.length ? supabase!.from("orders").select("id,order_number,total,status").in("id", orderIds as string[]) : Promise.resolve({ data: [] }),
        appIds.length ? supabase!.from("instalment_applications").select("id,application_number,full_name,advance_payment,advance_received,tenure_months,monthly_payment").in("id", appIds as string[]) : Promise.resolve({ data: [] }),
        supabase!.from("profiles").select("id,full_name,email").in("id", userIds as string[]),
      ]);

      const orders = new Map((oRes.data as any[] || []).map((o) => [o.id, o]));
      const apps = new Map((aRes.data as any[] || []).map((a) => [a.id, a]));
      const profiles = new Map((uRes.data as any[] || []).map((u) => [u.id, u]));

      // confirmed (verified) amounts for orders
      const verifiedByOrder = new Map<string, number>();
      for (const x of list) if (x.status === "verified" && x.order_id) {
        verifiedByOrder.set(x.order_id, (verifiedByOrder.get(x.order_id) || 0) + (x.verified_amount ?? x.claimed_amount));
      }

      const enriched: ProofRow[] = list.map((x) => {
        const o = x.order_id ? orders.get(x.order_id) : undefined;
        const a = x.instalment_application_id ? apps.get(x.instalment_application_id) : undefined;
        const u = profiles.get(x.user_id);
        let due = 0;
        let prev = 0;
        let after = 0;
        if (x.kind === "buy_now" && o) {
          prev = verifiedByOrder.get(x.order_id!) || 0;
          due = Math.max(Number(o.total) - prev, 0);
          after = Math.max(due - (x.verified_amount ?? x.claimed_amount), 0);
        } else if (x.kind === "instalment_advance" && a) {
          prev = Number(a.advance_received ?? 0);
          due = Math.max(Number(a.advance_payment) - prev, 0);
          after = Math.max(due - (x.verified_amount ?? x.claimed_amount), 0);
        }
        return {
          ...x,
          order_number: o?.order_number,
          application_number: a?.application_number,
          total: o ? Number(o.total) : undefined,
          customer: a?.full_name || u?.full_name || undefined,
          customer_email: u?.email,
          due, previously_confirmed: prev, projected_after: after, customer_balance: due,
        };
      });
      setProofs(enriched);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load payment proofs.");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const counts = useMemo(() => {
    const pending = proofs.filter((p) => p.status === "pending_verification").length;
    const verified = proofs.filter((p) => p.status === "verified").length;
    const rejected = proofs.filter((p) => p.status === "rejected").length;
    return { pending, verified, rejected };
  }, [proofs]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return proofs.filter((x) => {
      if (statusFilter !== "all" && x.status !== statusFilter) return false;
      if (!q) return true;
      return (
        (x.order_number || "").toLowerCase().includes(q) ||
        (x.application_number || "").toLowerCase().includes(q) ||
        (x.customer || "").toLowerCase().includes(q) ||
        (x.customer_email || "").toLowerCase().includes(q)
      );
    });
  }, [proofs, query, statusFilter]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payment Verification"
        subtitle="Incoming bank-transfer screenshots. Review, approve or reject each submission. Only finance staff / Super Admin can decide."
        actions={<Button variant="outline" size="sm" onClick={() => void load()}><RotateCcw className="h-4 w-4" /> Refresh</Button>}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Pending verification" value={counts.pending} tone="warning" />
        <Stat label="Approved" value={counts.verified} tone="success" />
        <Stat label="Rejected" value={counts.rejected} tone="destructive" />
      </div>

      <Card>
        <CardContent className="space-y-4 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-9" placeholder="Search order / application / customer" value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
            <select
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ProofStatus | "all")}
            >
              <option value="all">All statuses</option>
              <option value="pending_verification">Pending</option>
              <option value="verified">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {loading && <p className="text-sm text-muted-foreground">Loading submissions…</p>}

          {!loading && !error && filtered.length === 0 && (
            <EmptyState title="No submissions" description="No bank-transfer proofs match the current filters." />
          )}

          <div className="space-y-2">
            {filtered.map((x) => (
              <div key={x.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{x.order_number || x.application_number || "—"}</p>
                  <p className="text-xs text-muted-foreground">{x.customer || x.customer_email || "Unknown customer"}</p>
                  <p className="text-xs text-muted-foreground">{KIND_LABEL[x.kind]} · {formatPKR(x.claimed_amount)} · submitted {new Date(x.created_at).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={STATUS_TONE[x.status]}>{x.status.replace("_", " ")}</Badge>
                  <Button size="sm" variant="outline" onClick={() => setSelected(x)}>Review Payment</Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {selected && (
        <ReviewModal
          proof={selected}
          onClose={() => setSelected(null)}
          onDone={() => { setSelected(null); void load(); }}
        />
      )}
    </div>
  );
}

function ReviewModal({ proof, onClose, onDone }: { proof: ProofRow; onClose: () => void; onDone: () => void }) {
  const [shot, setShot] = useState<string | null>(null);
  const [shotError, setShotError] = useState(false);
  const [phase, setPhase] = useState<"view" | "approve" | "reject">("view");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [received, setReceived] = useState<string>(String(Math.round(proof.claimed_amount)));
  const [reason, setReason] = useState("");

  const loadShot = useCallback(async () => {
    setShotError(false); setShot(null);
    const url = await getSignedUrl(RECEIPT_BUCKET, proof.file_path, 300);
    if (url) setShot(url); else setShotError(true);
  }, [proof.file_path]);
  useEffect(() => { void loadShot(); }, [loadShot]);

  const projected = (proof.due ?? 0) - (Number(received) || 0);

  async function decide() {
    setBusy(true); setError("");
    try {
      let pDecision = "approve";
      let pReason: string | null = null;
      let pReceived: number | null = null;
      if (phase === "approve") {
        const rec = Number(received);
        if (!rec || rec <= 0) { setError("Enter a positive verified amount."); setBusy(false); return; }
        pReceived = rec;
        if (rec !== proof.claimed_amount) {
          if (!reason.trim()) { setError("Reason required because the verified amount differs from the claim."); setBusy(false); return; }
          pReason = reason.trim();
        }
      } else {
        pDecision = "reject";
        if (!reason.trim()) { setError("A customer-visible rejection reason is required."); setBusy(false); return; }
        pReason = reason.trim();
      }
      const { error: rpcErr } = await supabase!.rpc("review_payment_proof", {
        p_proof_id: proof.id,
        p_decision: pDecision,
        p_reason: pReason,
        p_received_amount: pReceived,
      });
      if (rpcErr) throw rpcErr;
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Review failed.");
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3" role="dialog" aria-modal="true" aria-label="Review payment">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border bg-background shadow-2xl">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div>
            <p className="text-sm font-bold">{proof.order_number || proof.application_number}</p>
            <p className="text-xs text-muted-foreground">{KIND_LABEL[proof.kind]} · <Badge variant={STATUS_TONE[proof.status]}>{proof.status.replace("_", " ")}</Badge></p>
          </div>
          <button className="rounded-full px-3 py-1 text-sm hover:bg-muted" onClick={onClose}>Close</button>
        </div>

        <div className="grid gap-4 overflow-y-auto p-4 lg:grid-cols-2">
          {/* Screenshot */}
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Payment proof</p>
            <div className="flex min-h-[280px] items-center justify-center rounded-xl border bg-muted/40 p-3">
              {shot ? (
                <img src={shot} alt="Bank transfer screenshot" className="max-h-[420px] rounded-lg object-contain" />
              ) : shotError ? (
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Screenshot failed to load.</p>
                  <Button size="sm" variant="outline" className="mt-2" onClick={() => void loadShot()}><RotateCcw className="h-4 w-4" /> Retry preview</Button>
                </div>
              ) : (
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              )}
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-lg bg-muted/50 p-2"><dt className="text-muted-foreground">Claimed amount</dt><dd className="font-semibold">{formatPKR(proof.claimed_amount)}</dd></div>
              <div className="rounded-lg bg-muted/50 p-2"><dt className="text-muted-foreground">Transfer date</dt><dd className="font-semibold">{proof.transfer_date}</dd></div>
              <div className="rounded-lg bg-muted/50 p-2 col-span-2"><dt className="text-muted-foreground">Bank reference</dt><dd className="break-all font-mono text-[11px]">{proof.bank_reference}</dd></div>
              <div className="rounded-lg bg-muted/50 p-2 col-span-2"><dt className="text-muted-foreground">Submitted</dt><dd>{new Date(proof.created_at).toLocaleString()}</dd></div>
            </div>
            <button className="flex items-center gap-1 text-xs text-primary" onClick={() => { if (shot) window.open(shot, "_blank"); }}>
              <ZoomIn className="h-3.5 w-3.5" /> Open full screen
            </button>
          </div>

          {/* Details */}
          <div className="space-y-4 text-sm">
            <div className="rounded-xl border p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Customer & order</p>
              <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5">
                <dt className="text-muted-foreground">Customer</dt><dd>{proof.customer || "—"} <span className="text-xs text-muted-foreground">({proof.customer_email})</span></dd>
                <dt className="text-muted-foreground">Order / application</dt><dd>{proof.order_number || proof.application_number}</dd>
                <dt className="text-muted-foreground">Purpose</dt><dd>{KIND_LABEL[proof.kind]}</dd>
              </dl>
            </div>

            <div className="rounded-xl border p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Payment breakdown</p>
              <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5">
                <dt className="text-muted-foreground">Amount due for this payment</dt><dd className="font-semibold">{formatPKR(proof.due)}</dd>
                <dt className="text-muted-foreground">Previously confirmed</dt><dd>{formatPKR(proof.previously_confirmed)}</dd>
                <dt className="text-muted-foreground">Customer balance (before verification)</dt><dd className="font-semibold">{formatPKR(proof.customer_balance ?? 0)}</dd>
                <dt className="text-muted-foreground">Submitted</dt><dd>{formatPKR(proof.claimed_amount)}</dd>
                <dt className="text-muted-foreground">Customer balance (after approval)</dt><dd className="font-semibold text-emerald-700">{formatPKR(Math.max(projected, 0))}</dd>
              </dl>
            </div>

            {phase === "view" && (
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => setPhase("approve")}><CheckCircle2 className="h-4 w-4" /> Approve Payment</Button>
                <Button variant="outline" onClick={() => setPhase("reject")}><XCircle className="h-4 w-4" /> Reject Payment</Button>
              </div>
            )}

            {phase === "approve" && (
              <div className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50/50 p-3">
                <p className="text-sm font-semibold">Approve payment</p>
                <p className="text-xs text-muted-foreground">
                  Order {proof.order_number}, reference {proof.bank_reference}. Crediting <b>{formatPKR(Number(received) || 0)}</b>.
                  Balance: <b>{formatPKR(proof.due)}</b> → <b>{formatPKR(Math.max(projected, 0))}</b>.
                </p>
                <div className="space-y-1.5">
                  <Label>Verified amount (PKR)</Label>
                  <Input type="number" min={1} value={received} onChange={(e) => setReceived(e.target.value)} />
                </div>
                {Number(received) !== proof.claimed_amount && (
                  <div className="space-y-1.5">
                    <Label>Reason for difference</Label>
                    <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. partial transfer received" />
                  </div>
                )}
                {error && <p className="text-xs text-red-600">{error}</p>}
                <div className="flex gap-2">
                  <Button disabled={busy} onClick={() => void decide()}>{busy ? "Saving…" : "Confirm Approve"}</Button>
                  <Button variant="ghost" disabled={busy} onClick={() => { setPhase("view"); setError(""); }}>Back</Button>
                </div>
              </div>
            )}

            {phase === "reject" && (
              <div className="space-y-3 rounded-xl border border-red-200 bg-red-50/50 p-3">
                <p className="text-sm font-semibold">Reject payment</p>
                <p className="text-xs text-muted-foreground">A reason will be shown to the customer. No credit is created.</p>
                <select className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm" value={reason} onChange={(e) => setReason(e.target.value)}>
                  <option value="">Select a reason…</option>
                  <option>Screenshot unreadable</option>
                  <option>Transfer not found</option>
                  <option>Reference does not match</option>
                  <option>Amount does not match transfer</option>
                  <option>Duplicate submission</option>
                </select>
                {error && <p className="text-xs text-red-600">{error}</p>}
                <div className="flex gap-2">
                  <Button variant="destructive" disabled={busy} onClick={() => void decide()}>{busy ? "Saving…" : "Confirm Reject"}</Button>
                  <Button variant="ghost" disabled={busy} onClick={() => { setPhase("view"); setError(""); }}>Back</Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Label({ children }: { children: ReactNode }) {
  return <span className="text-xs font-medium text-muted-foreground">{children}</span>;
}
