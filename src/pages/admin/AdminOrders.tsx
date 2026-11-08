import { useCallback, useEffect, useState } from "react";
import { ShoppingBag, RefreshCw, CheckCircle2, Clock, XCircle, Mail } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { getOrderEmailJob, retryOrderEmail, sendOrderApprovedEmail, type OrderEmailJob } from "@/lib/auth-config";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader, EmptyState, Stat } from "./_ui";

interface OrderRow {
  id: string;
  order_number: string;
  email: string | null;
  status: string;
  total: number | null;
  placed_at: string | null;
  job?: OrderEmailJob | null;
  jobBusy?: boolean;
}

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString();
}

function statusBadge(status: string) {
  const tone =
    status === "approved" ? "success" :
    status === "pending" ? "warning" :
    status === "rejected" ? "destructive" : "muted";
  return <Badge variant={tone}>{status}</Badge>;
}

function jobBadge(job?: OrderEmailJob | null) {
  if (!job) return <span className="text-xs text-muted-foreground">no email requested</span>;
  switch (job.status) {
    case "sent":
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 dark:text-blue-400">
          <Mail className="h-3.5 w-3.5" /> Sent · {fmtDate(job.last_attempt_at)}
        </span>
      );
    case "delivered":
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 className="h-3.5 w-3.5" /> Delivered · {fmtDate(job.delivered_at)}
        </span>
      );
    case "failed":
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 dark:text-red-400">
          <XCircle className="h-3.5 w-3.5" /> Failed · {fmtDate(job.last_attempt_at)}
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
          <Clock className="h-3.5 w-3.5" /> {job.status} · {job.attempts} attempt{job.attempts === 1 ? "" : "s"}
        </span>
      );
  }
}

export function AdminOrders() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    const { data, error: oErr } = await supabase!
      .from("orders")
      .select("id,order_number,email,status,total,placed_at")
      .order("placed_at", { ascending: false })
      .limit(200);
    if (oErr) {
      setError(oErr.message);
      setLoading(false);
      return;
    }
    const rows = (data ?? []) as OrderRow[];
    // Enrich each order with its email-job state.
    const enriched = await Promise.all(
      rows.map(async (r) => {
        const job = await getOrderEmailJob(r.id);
        return { ...r, job };
      })
    );
    setOrders(enriched);
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function handleRetry(orderId: string) {
    setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, jobBusy: true } : o));
    const ret = await retryOrderEmail(orderId);
    if (ret.ok) await sendOrderApprovedEmail(orderId);
    const job = await getOrderEmailJob(orderId);
    setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, job, jobBusy: false } : o));
  }

  const approvedCount = orders.filter((o) => o.status === "approved").length;
  const pendingEmailCount = orders.filter((o) => o.job && o.job.status !== "delivered").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Orders"
        subtitle="Order status and order-approved email delivery."
        actions={<Button variant="outline" size="sm" onClick={() => void load()}><RefreshCw className="h-4 w-4" /> Refresh</Button>}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Total orders" value={orders.length} />
        <Stat label="Approved" value={approvedCount} tone="success" />
        <Stat label="Approval emails pending/not delivered" value={pendingEmailCount} tone="info" />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && orders.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center py-16 text-center">
            <ShoppingBag className="mb-3 h-10 w-10 text-muted-foreground" />
            <p className="font-medium">No orders yet</p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Orders will appear here once customers place them.
            </p>
          </CardContent>
        </Card>
      )}

      {loading && <p className="text-sm text-muted-foreground">Loading orders…</p>}

      {!loading && orders.length > 0 && (
        <Card>
          <CardContent className="space-y-2 p-4">
            {orders.map((o) => (
              <div key={o.id} className="flex flex-col gap-2 rounded-xl border p-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-semibold">{o.order_number}</p>
                    {statusBadge(o.status)}
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Placed {fmtDate(o.placed_at)} · Total {o.total != null ? `Rs. ${o.total.toLocaleString()}` : "—"}
                  </p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1">
                    {jobBadge(o.job)}
                    {o.job?.masked_recipient && (
                      <span className="text-xs text-muted-foreground">to {o.job.masked_recipient}</span>
                    )}
                    {o.job?.last_error && (
                      <span className="text-xs text-red-600">{o.job.last_error}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {(o.job?.status === "failed" || o.job?.status === "sent" || o.job?.status === "pending") && (
                    <Button variant="outline" size="sm" disabled={o.jobBusy} onClick={() => void handleRetry(o.id)}>
                      <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                      {o.jobBusy ? "Retrying…" : "Retry email"}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
