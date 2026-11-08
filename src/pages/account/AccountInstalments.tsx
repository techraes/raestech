import { useCallback, useEffect, useState } from "react";
import { CalendarClock, RefreshCw, CheckCircle2, Clock, XCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/features/auth/AuthContext";
import { formatPKR } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/pages/admin/_ui";

interface InstalmentRow {
  id: string;
  application_number: string;
  status: string;
  advance_payment: number;
  monthly_payment: number;
  tenure_months: number;
  remaining_balance: number;
  created_at: string;
  rejection_reason?: string | null;
}

const STATUS_LABEL: Record<string, { label: string; tone: "success" | "secondary" | "destructive" | "warning" | "muted" }> = {
  submitted: { label: "Under Review", tone: "warning" },
  under_review: { label: "Under Review", tone: "warning" },
  additional_information_required: { label: "More Info Needed", tone: "warning" },
  approved: { label: "Approved", tone: "success" },
  rejected: { label: "Rejected", tone: "destructive" },
  advance_payment_pending: { label: "Advance Payment Pending", tone: "warning" },
  advance_payment_verified: { label: "Advance Verified", tone: "secondary" },
  active: { label: "Active", tone: "success" },
  completed: { label: "Completed", tone: "success" },
  cancelled: { label: "Cancelled", tone: "destructive" },
};

export function AccountInstalments() {
  const { user } = useAuth();
  const [rows, setRows] = useState<InstalmentRow[]>([]);
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
      const { data, error: err } = await supabase
        .from("instalment_applications")
        .select("id,application_number,status,advance_payment,monthly_payment,tenure_months,remaining_balance,created_at,rejection_reason")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(100);
      if (err) throw err;
      setRows((data ?? []) as InstalmentRow[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load your instalments.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { void load(); }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Instalments</h1>
        <Button variant="outline" size="sm" onClick={() => void load()}>
          <RefreshCw className="h-4 w-4" /> Refresh
        </Button>
      </div>

      {loading && <p className="text-sm text-muted-foreground">Loading your instalments…</p>}

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
            <CalendarClock className="mb-3 h-10 w-10 text-muted-foreground" />
            <p className="font-medium">No instalments</p>
            <p className="mt-1 w-full max-w-sm text-sm text-muted-foreground">
              Submit an instalment application to see its status, your agreement and payment schedule here.
            </p>
            <Button asChild className="mt-5"><a href="/instalments/apply">Apply now</a></Button>
          </CardContent>
        </Card>
      )}

      {!loading && !error && rows.length > 0 && (
        <div className="space-y-4">
          {rows.map((r) => {
            const s = STATUS_LABEL[r.status] ?? { label: r.status, tone: "muted" as const };
            return (
              <Card key={r.id}>
                <CardContent className="space-y-4 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold">{r.application_number}</p>
                      <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</p>
                    </div>
                    <Badge variant={s.tone}>{s.label}</Badge>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-lg border px-3 py-2">
                      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Advance</p>
                      <p className="text-sm font-semibold">{formatPKR(r.advance_payment)}</p>
                    </div>
                    <div className="rounded-lg border px-3 py-2">
                      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Term</p>
                      <p className="text-sm font-semibold">{r.tenure_months} months</p>
                    </div>
                    <div className="rounded-lg border px-3 py-2">
                      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Monthly instalment</p>
                      <p className="text-sm font-semibold">{formatPKR(r.monthly_payment)}</p>
                    </div>
                    <div className="rounded-lg border px-3 py-2">
                      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Balance</p>
                      <p className="text-sm font-semibold">{formatPKR(r.remaining_balance)}</p>
                    </div>
                  </div>

                  {r.status === "approved" && (
                    <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                      <CheckCircle2 className="mr-1 inline h-3.5 w-3.5" /> Approved — next payment due: {formatPKR(r.monthly_payment)}.
                    </p>
                  )}

                  {r.status === "rejected" && r.rejection_reason && (
                    <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-500/10 dark:text-red-300">
                      Rejected: {r.rejection_reason}
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
