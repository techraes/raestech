import { useCallback, useEffect, useState } from "react";
import { CreditCard, RefreshCw, CheckCircle2, Clock, XCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/features/auth/AuthContext";
import { formatPKR } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface ProofRow {
  id: string;
  kind: string;
  claimed_amount: number;
  verified_amount?: number | null;
  status: string;
  rejection_reason?: string | null;
  created_at: string;
  order_number?: string;
  application_number?: string;
}

const STATUS_LABEL: Record<string, { label: string; tone: "success" | "secondary" | "destructive" | "warning" | "muted" }> = {
  pending_verification: { label: "Payment Under Review", tone: "secondary" },
  verified: { label: "Verified", tone: "success" },
  rejected: { label: "Rejected", tone: "destructive" },
};

export function AccountPayments() {
  const { user } = useAuth();
  const [rows, setRows] = useState<ProofRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!supabase || !user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const { data: proofs, error: pErr } = await supabase
        .from("payment_proofs")
        .select("id,kind,claimed_amount,verified_amount,status,rejection_reason,created_at,order_id,instalment_application_id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(100);
      if (pErr) throw pErr;

      const list = (proofs ?? []) as any[];
      const orderIds = Array.from(new Set<string>(list.map((p) => p.order_id).filter(Boolean)));
      const appIds = Array.from(new Set<string>(list.map((p) => p.instalment_application_id).filter(Boolean)));

      const [oRes, aRes] = await Promise.all([
        orderIds.length ? supabase.from("orders").select("id,order_number").in("id", orderIds) : Promise.resolve({ data: [] }),
        appIds.length ? supabase.from("instalment_applications").select("id,application_number").in("id", appIds) : Promise.resolve({ data: [] }),
      ]);

      const orderMap = new Map((oRes.data ?? []).map((o: any) => [o.id, o.order_number]));
      const appMap = new Map((aRes.data ?? []).map((a: any) => [a.id, a.application_number]));

      const mapped: ProofRow[] = list.map((p) => ({
        id: p.id,
        kind: p.kind,
        claimed_amount: Number(p.claimed_amount ?? 0),
        verified_amount: p.verified_amount != null ? Number(p.verified_amount) : null,
        status: p.status,
        rejection_reason: p.rejection_reason,
        created_at: p.created_at,
        order_number: p.order_id ? orderMap.get(p.order_id) : undefined,
        application_number: p.instalment_application_id ? appMap.get(p.instalment_application_id) : undefined,
      }));
      setRows(mapped);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load your payments.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { void load(); }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">My Payments</h1>
        <Button variant="outline" size="sm" onClick={() => void load()}>
          <RefreshCw className="h-4 w-4" /> Refresh
        </Button>
      </div>

      {loading && <p className="text-sm text-muted-foreground">Loading your payments…</p>}

      {!loading && error && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <XCircle className="h-8 w-8 text-red-500" />
            <p className="text-sm text-red-600">{error}</p>
            <Button size="sm" variant="outline" onClick={() => void load()}>
              <RefreshCw className="mr-1.5 h-4 w-4" /> Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {!loading && !error && rows.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center px-4 py-14 text-center">
            <CreditCard className="mb-3 h-10 w-10 text-muted-foreground" />
            <p className="font-medium">No payments</p>
            <p className="mt-1 w-full max-w-sm text-sm text-muted-foreground">
              After placing an order or submitting an instalment application you can upload your bank transfer receipt here for manual verification.
            </p>
            <Button asChild className="mt-5"><a href="/payment-instructions">View payment instructions</a></Button>
          </CardContent>
        </Card>
      )}

      {!loading && !error && rows.length > 0 && (
        <div className="space-y-4">
          {rows.map((p) => {
            const s = STATUS_LABEL[p.status] ?? { label: p.status, tone: "muted" as const };
            const ref = p.order_number || p.application_number || "—";
            return (
              <Card key={p.id}>
                <CardContent className="space-y-3 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold">{ref}</p>
                    <Badge variant={s.tone}>{s.label}</Badge>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg border px-3 py-2">
                      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Claimed amount</p>
                      <p className="text-sm font-semibold">{formatPKR(p.claimed_amount)}</p>
                    </div>
                    <div className="rounded-lg border px-3 py-2">
                      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Verified amount</p>
                      <p className="text-sm font-semibold">{p.verified_amount != null ? formatPKR(p.verified_amount) : "Awaiting review"}</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">Submitted {new Date(p.created_at).toLocaleString()}</p>
                  {p.status === "rejected" && p.rejection_reason && (
                    <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-500/10 dark:text-red-300">
                      Rejected: {p.rejection_reason}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
