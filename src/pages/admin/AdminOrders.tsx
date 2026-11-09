import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, RefreshCw, Eye, CheckCircle2, XCircle, Loader2, FileText, ImageIcon, Lock, Mail, RotateCcw } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { getSignedUrl, RECEIPT_BUCKET, IDENTITY_BUCKET } from "@/lib/uploads";
import { formatPKR } from "@/lib/utils";
import { useCan } from "@/features/auth/permissions";
import { getOrderEmailJob, retryOrderEmail, sendOrderApprovedEmail, type OrderEmailJob } from "@/lib/auth-config";
import { ApprovalEmailCopyPanel } from "./ApprovalEmailCopy";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader, EmptyState, Stat } from "./_ui";

type ReviewKind = "order" | "app";

interface ReceiptInfo {
  path: string;
  name?: string;
  mime?: string;
}

interface PaymentInfo {
  id: string;
  status?: string;
  method?: string;
  amount?: number;
  created_at?: string;
  rejection_reason?: string;
  receipt?: ReceiptInfo | null;
}

interface DocInfo {
  id: string;
  path: string;
  doc_type?: string;
  original_name?: string;
  mime?: string;
}

interface OrderRow {
  kind: "order";
  id: string;
  reference: string;
  status: string;
  paymentStatus: string;
  total: number;
  subtotal: number;
  discount: number;
  shipping: number;
  placed_at: string;
  created_at: string;
  email?: string;
  phone?: string;
  name?: string;
  city?: string;
  province?: string;
  address?: string;
  area?: string;
  postal?: string;
  deliveryPhone?: string;
  method?: string;
  payment?: PaymentInfo | null;
  rejection_reason?: string;
}

interface AppRow {
  kind: "app";
  id: string;
  reference: string;
  status: string;
  full_name?: string;
  mobile?: string;
  email?: string;
  cnic?: string;
  advance?: number;
  advanceReceived?: number;
  balance?: number;
  monthly?: number;
  totalPayable?: number;
  tenure?: number;
  created_at: string;
  payment?: PaymentInfo | null;
  docs: DocInfo[];
  rejection_reason?: string;
  deliveryFullName?: string;
  deliveryPhone?: string;
  deliveryAddress?: string;
  deliveryArea?: string;
  deliveryCity?: string;
  deliveryProvince?: string;
  deliveryPostalCode?: string;
}

type Row = OrderRow | AppRow;

const PAY_METHOD_LABEL: Record<string, string> = {
  manual_bank_transfer: "Bank Transfer",
  faysal_bank: "Faysal Bank",
  bank_transfer: "Bank Transfer",
  jazzcash: "JazzCash",
  easypaisa: "Easypaisa",
  crypto_usdt: "Crypto (USDT)",
  card: "Card",
  instalments: "Instalments",
};

function fmtDate(v?: string): string {
  if (!v) return "—";
  const d = new Date(v);
  return isNaN(d.getTime()) ? "—" : d.toLocaleString();
}

function maskCnic(value?: string): string {
  if (!value) return "—";
  const digits = value.replace(/[^0-9]/g, "");
  if (digits.length !== 13) return "•••";
  return `•••••-${digits.slice(5, 12)}-${digits.slice(12)}`;
}

const STATUS_TONE: Record<string, string> = {
  pending: "warning",
  payment_pending: "warning",
  payment_verification: "info",
  pending_verification: "info",
  verified: "success",
  approved: "success",
  submitted: "info",
  under_review: "warning",
  advance_payment_pending: "warning",
  advance_payment_verified: "info",
  rejected: "destructive",
  confirmed: "success",
};

export function AdminOrders() {
  const [searchParams, setSearchParams] = useSearchParams();
  const can = useCan();
  const canReviewOrders = can("orders") || can("payments");
  const canReviewApps = can("instalments") || can("payments");

  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [apps, setApps] = useState<AppRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"orders" | "apps">("orders");

  const selKind = (searchParams.get("kind") as ReviewKind | null) ?? null;
  const selId = searchParams.get("id");
  const selected: Row | null = useMemo(() => {
    if (!selId) return null;
    if (selKind === "order") return orders.find((o) => o.id === selId) ?? null;
    if (selKind === "app") return apps.find((a) => a.id === selId) ?? null;
    return null;
  }, [selKind, selId, orders, apps]);

  // ---- loading helpers for receipt/document previews ----
  const [receiptUrls, setReceiptUrls] = useState<Record<string, { state: "loading" | "ok" | "denied" | "failed"; url?: string }>>({});
  const [docUrls, setDocUrls] = useState<Record<string, { state: "loading" | "ok" | "denied" | "failed"; url?: string }>>({});

  const loadReceipt = useCallback(async (paymentId: string, info: ReceiptInfo) => {
    if (!isSupabaseConfigured || !supabase) return;
    if (receiptUrls[paymentId]) return;
    setReceiptUrls((p) => ({ ...p, [paymentId]: { state: "loading" } }));
    const url = await getSignedUrl(RECEIPT_BUCKET, info.path, 600);
    setReceiptUrls((p) => ({
      ...p,
      [paymentId]: url ? { state: "ok", url } : { state: "denied" },
    }));
  }, [receiptUrls]);

  const loadDoc = useCallback(async (docId: string, path: string) => {
    if (!isSupabaseConfigured || !supabase) return;
    if (docUrls[docId]) return;
    setDocUrls((p) => ({ ...p, [docId]: { state: "loading" } }));
    const url = await getSignedUrl(IDENTITY_BUCKET, path, 600);
    setDocUrls((p) => ({ ...p, [docId]: url ? { state: "ok", url } : { state: "denied" } }));
  }, [docUrls]);

  // ---- data loading ----
  const load = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) {
      setError("Supabase is not configured on this deployment.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const oRes = await supabase.from("orders")
        .select("id,order_number,email,phone,status,payment_status,total,subtotal,discount_amount,shipping_charge,placed_at,shipping_full_name,shipping_phone,shipping_address,shipping_area,shipping_city,shipping_province,shipping_postal,payment_method,customer_notes,rejection_reason,reviewed_at")
        .order("placed_at", { ascending: false })
        .limit(300);

      const aRes = await supabase.from("instalment_applications")
        .select("id,application_number,full_name,mobile,email,cnic,status,advance_payment,advance_received,remaining_balance,monthly_payment,total_payable,tenure_months,created_at,reviewed_by,reviewed_at,rejection_reason,delivery_full_name,delivery_phone,delivery_address,delivery_area,delivery_city,delivery_province,delivery_postal_code")
        .order("created_at", { ascending: false })
        .limit(300);

      if (oRes.error) throw oRes.error;
      if (aRes.error) throw aRes.error;

      const orderIds = (oRes.data ?? []).map((o: any) => o.id);
      const appIds = (aRes.data ?? []).map((a: any) => a.id);

      let payRes: any = { data: [], error: null };
      let receiptRes: any = { data: [], error: null };
      let docRes: any = { data: [], error: null };
      let profileRes: any = { data: [], error: null };

      if (orderIds.length || appIds.length) {
        const q = supabase.from("payments").select("id,order_id,instalment_application_id,status,method,amount,created_at,rejection_reason");
        payRes = orderIds.length && appIds.length
          ? await q.or(`order_id.in.(${orderIds.join(",")}),instalment_application_id.in.(${appIds.join(",")})`)
          : orderIds.length
            ? await q.in("order_id", orderIds as string[])
            : await q.in("instalment_application_id", appIds as string[]);
      }
      if (payRes.error) throw payRes.error;

      const payIds = (payRes.data ?? []).map((p: any) => p.id);
      if (payIds.length) {
        const r = await supabase.from("payment_receipts")
          .select("id,payment_id,file_path,file_name,mime_type")
          .in("payment_id", payIds as string[]);
        if (r.error) throw r.error;
        receiptRes = r;
      }
      if (appIds.length) {
        const d = await supabase.from("instalment_documents")
          .select("id,application_id,path,doc_type,original_name,mime_type")
          .in("application_id", appIds as string[]);
        if (d.error) throw d.error;
        docRes = d;
      }

      const userIds = Array.from(new Set<string>([
        ...(oRes.data ?? []).map((o: any) => o.user_id).filter(Boolean),
        ...(aRes.data ?? []).map((a: any) => a.user_id).filter(Boolean),
      ]));
      if (userIds.length) {
        const u = await supabase.from("profiles").select("id,full_name,email").in("id", userIds);
        profileRes = u;
      }

      const payByOrder = new Map<string, any>();
      const payByApp = new Map<string, any>();
      const receiptByPay = new Map<string, any>();
      const docByApp = new Map<string, any[]>();

      for (const p of payRes.data ?? []) {
        if (p.order_id) payByOrder.set(p.order_id, p);
        if (p.instalment_application_id) payByApp.set(p.instalment_application_id, p);
      }
      for (const r of receiptRes.data ?? []) receiptByPay.set(r.payment_id, r);
      for (const d of docRes.data ?? []) {
        const arr = docByApp.get(d.application_id) ?? [];
        arr.push(d);
        docByApp.set(d.application_id, arr);
      }
      const profileMap = new Map((profileRes.data ?? []).map((u: any) => [u.id, u]));

      const orderRows: OrderRow[] = (oRes.data ?? []).map((o: any) => {
        const pay: any = payByOrder.get(o.id);
        const profile: any = profileMap.get(o.user_id);
        return {
          kind: "order",
          id: o.id,
          reference: o.order_number,
          status: o.status,
          paymentStatus: o.payment_status,
          total: Number(o.total ?? 0),
          subtotal: Number(o.subtotal ?? 0),
          discount: Number(o.discount_amount ?? 0),
          shipping: Number(o.shipping_charge ?? 0),
          placed_at: o.placed_at,
          created_at: o.placed_at,
          name: o.shipping_full_name || profile?.full_name,
          email: o.email || profile?.email,
          phone: o.phone,
          city: o.shipping_city,
          province: o.shipping_province,
          address: o.shipping_address || o.shipping_postal,
          area: o.shipping_area,
          postal: o.shipping_postal,
          deliveryPhone: o.shipping_phone || o.phone,
          method: pay?.method ?? o.payment_method,
          rejection_reason: o.rejection_reason,
          payment: pay
            ? {
                id: pay.id,
                status: pay.status,
                method: pay.method,
                amount: Number(pay.amount ?? 0),
                created_at: pay.created_at,
                rejection_reason: pay.rejection_reason,
                receipt: receiptByPay.get(pay.id) ? { path: receiptByPay.get(pay.id).file_path, name: receiptByPay.get(pay.id).file_name, mime: receiptByPay.get(pay.id).mime_type } : null,
              }
            : null,
        };
      });

      const appRows: AppRow[] = (aRes.data ?? []).map((a: any) => {
        const pay: any = payByApp.get(a.id);
        const profile: any = profileMap.get(a.user_id);
        return {
          kind: "app",
          id: a.id,
          reference: a.application_number,
          status: a.status,
          full_name: a.full_name || profile?.full_name,
          mobile: a.mobile,
          email: a.email || profile?.email,
          cnic: a.cnic,
          advance: Number(a.advance_payment ?? 0),
          advanceReceived: Number(a.advance_received ?? 0),
          balance: Number(a.remaining_balance ?? 0),
          monthly: Number(a.monthly_payment ?? 0),
          totalPayable: Number(a.total_payable ?? 0),
          tenure: Number(a.tenure_months ?? 0),
          created_at: a.created_at,
          rejection_reason: a.rejection_reason,
          deliveryFullName: a.delivery_full_name || a.full_name,
          deliveryPhone: a.delivery_phone || a.mobile,
          deliveryAddress: a.delivery_address,
          deliveryArea: a.delivery_area,
          deliveryCity: a.delivery_city,
          deliveryProvince: a.delivery_province,
          deliveryPostalCode: a.delivery_postal_code,
          payment: pay
            ? {
                id: pay.id,
                status: pay.status,
                method: pay.method,
                amount: Number(pay.amount ?? 0),
                created_at: pay.created_at,
                rejection_reason: pay.rejection_reason,
                receipt: receiptByPay.get(pay.id) ? { path: receiptByPay.get(pay.id).file_path, name: receiptByPay.get(pay.id).file_name, mime: receiptByPay.get(pay.id).mime_type } : null,
              }
            : null,
          docs: (docByApp.get(a.id) ?? []).map((d: any) => ({
            id: d.id,
            path: d.path,
            doc_type: d.doc_type,
            original_name: d.original_name,
            mime: d.mime_type,
          })),
        };
      });

      setOrders(orderRows);
      setApps(appRows);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load orders.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  // ---- open detail (works after refresh via URL params) ----
  const openDetail = useCallback((kind: ReviewKind, id: string) => {
    setSearchParams({ kind, id }, { replace: false });
  }, [setSearchParams]);

  const closeDetail = useCallback(() => {
    setSearchParams({}, { replace: true });
  }, [setSearchParams]);

  // ---- auto-load receipt/docs when a detail is open ----
  useEffect(() => {
    if (!selected) return;
    if (selected.payment?.receipt) loadReceipt(selected.payment.id, selected.payment.receipt);
    if (selected.kind === "app") {
      for (const d of selected.docs) loadDoc(d.id, d.path);
    }
  }, [selected, loadReceipt, loadDoc]);

  // ---- review actions ----
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState("");

  async function runRpc(fn: () => PromiseLike<{ data?: any; error?: any }>, after?: () => void) {
    setBusy(true);
    setActionError("");
    const { data, error } = await fn();
    if (error) {
      setActionError(error.message ?? "Action failed.");
      setBusy(false);
      return;
    }
    // refresh list + detail
    await load();
    setBusy(false);
    if (after) after();
  }

  // Step 1: verify the payment proof. This only records funds as received and
  // advances the order to 'confirmed'. It does NOT approve the order or send
  // the confirmation email.
  async function verifyPayment() {
    if (!selected || selected.kind !== "order" || !selected.payment) return;
    if (selected.payment.status === "verified" || selected.payment.status === "rejected") {
      setActionError("This payment has already been decided.");
      return;
    }
    await runRpc(() => supabase!.rpc("review_order_payment", { p_order_id: selected.id, p_decision: "approve" }));
  }

  // Step 2: approve a payment-verified order. This is the only action that
  // promotes the order to 'approved' and triggers the confirmation email once.
  async function confirmOrder() {
    if (!selected || selected.kind !== "order") return;
    if (selected.status === "approved") {
      setActionError("This order has already been approved.");
      return;
    }
    if (selected.payment?.status !== "verified") {
      setActionError("Verify the payment before approving the order.");
      return;
    }
    // confirm_order promotes the order to 'approved'; the 00024 DB trigger then
    // queues the job exactly once on that transition. We also invoke the edge
    // function to deliver it now. The status guard above prevents a repeat
    // click from sending a second email.
    await runRpc(
      () => supabase!.rpc("confirm_order", { p_order_id: selected.id }),
      () => { void sendOrderApprovedEmail(selected.id); }
    );
  }

  async function rejectOrder() {
    if (!selected || selected.kind !== "order" || !selected.payment) return;
    if (selected.payment.status === "verified" || selected.payment.status === "rejected") {
      setActionError("This order has already been decided.");
      return;
    }
    if (!reason.trim()) { setActionError("A rejection reason is required."); return; }
    await runRpc(() => supabase!.rpc("review_order_payment", { p_order_id: selected.id, p_decision: "reject", p_reason: reason.trim() }));
  }

  async function verifyAdvance() {
    if (!selected || selected.kind !== "app") return;
    if (selected.status === "advance_payment_verified" || selected.status === "rejected") {
      setActionError("This application has already been decided.");
      return;
    }
    await runRpc(() => supabase!.rpc("review_instalment_advance", { p_application_id: selected.id, p_decision: "approve" }));
  }

  async function approveApp() {
    if (!selected || selected.kind !== "app") return;
    if (selected.status === "approved" || selected.status === "rejected") {
      setActionError("This application has already been decided.");
      return;
    }
    await runRpc(() => supabase!.rpc("review_instalment_application", { p_application_id: selected.id, p_decision: "approve" }));
  }

  async function rejectApp() {
    if (!selected || selected.kind !== "app") return;
    if (selected.status === "approved" || selected.status === "rejected") {
      setActionError("This application has already been decided.");
      return;
    }
    if (!reason.trim()) { setActionError("A rejection reason is required."); return; }
    await runRpc(() => supabase!.rpc("review_instalment_advance", { p_application_id: selected.id, p_decision: "reject", p_reason: reason.trim() }));
  }

  const filteredOrders = orders.filter((o) => !search || o.reference.toLowerCase().includes(search.toLowerCase()));
  const filteredApps = apps.filter((a) => !search || a.reference.toLowerCase().includes(search.toLowerCase()));

  const pendingOrders = orders.filter((o) => o.payment?.status === "pending_verification").length;
  const pendingApps = apps.filter((a) => ["submitted", "under_review"].includes(a.status)).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Orders"
        subtitle="Review orders and instalment applications, payment receipts, and documents."
        actions={<Button variant="outline" size="sm" onClick={() => void load()}><RefreshCw className="h-4 w-4" /> Refresh</Button>}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Awaiting payment review" value={pendingOrders} tone="info" />
        <Stat label="Instalment apps in review" value={pendingApps} tone="warning" />
        <Stat label="Total orders" value={orders.length} />
      </div>

      {!selected && (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search by order or application reference…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-1 rounded-lg border bg-muted/40 p-1 text-sm">
              <button className={`rounded-md px-3 py-1.5 font-medium ${tab === "orders" ? "bg-background shadow-sm" : "text-muted-foreground"}`} onClick={() => setTab("orders")}>Orders</button>
              <button className={`rounded-md px-3 py-1.5 font-medium ${tab === "apps" ? "bg-background shadow-sm" : "text-muted-foreground"}`} onClick={() => setTab("apps")}>Instalments</button>
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {loading && <p className="text-sm text-muted-foreground">Loading…</p>}

          {!loading && tab === "orders" && (
            <Card>
              <CardContent className="divide-y p-0">
                {filteredOrders.length === 0 && (
                  <div className="p-8"><EmptyState title="No orders" description="No orders match the current search." /></div>
                )}
                {filteredOrders.map((o) => (
                  <div key={o.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{o.reference}</span>
                        <Badge variant={(STATUS_TONE[o.payment?.status ?? o.paymentStatus] ?? "muted") as any}>{o.payment?.status ?? o.paymentStatus ?? o.status}</Badge>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {o.name || "Customer"} · {formatPKR(o.total)} · {fmtDate(o.placed_at)}
                      </p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => openDetail("order", o.id)}>
                      <Eye className="mr-1.5 h-3.5 w-3.5" /> View details
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {!loading && tab === "apps" && (
            <Card>
              <CardContent className="divide-y p-0">
                {filteredApps.length === 0 && (
                  <div className="p-8"><EmptyState title="No instalment applications" description="No applications match the current search." /></div>
                )}
                {filteredApps.map((a) => (
                  <div key={a.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{a.reference}</span>
                        <Badge variant={(STATUS_TONE[a.status] ?? "muted") as any}>{a.status}</Badge>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {a.full_name || "Applicant"} · Advance {formatPKR(a.advance ?? 0)} · {fmtDate(a.created_at)}
                      </p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => openDetail("app", a.id)}>
                      <Eye className="mr-1.5 h-3.5 w-3.5" /> View details
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      )}

      {selected && (
        <DetailView
          row={selected}
          canReviewOrders={canReviewOrders}
          canReviewApps={canReviewApps}
          receiptUrls={receiptUrls}
          docUrls={docUrls}
          busy={busy}
          actionError={actionError}
          rejectOpen={rejectOpen}
          reason={reason}
          setRejectOpen={setRejectOpen}
          setReason={setReason}
          onVerifyPayment={verifyPayment}
          onConfirmOrder={confirmOrder}
          onRejectOrder={rejectOrder}
          onVerifyAdvance={verifyAdvance}
          onApproveApp={approveApp}
          onRejectApp={rejectApp}
          onBack={closeDetail}
          onRetryEmail={async () => {
            if (selected.kind !== "order") return;
            await retryOrderEmail(selected.id);
            await sendOrderApprovedEmail(selected.id);
            await load();
          }}
        />
      )}
    </div>
  );
}

function ReceiptSection({ payment, receiptUrls, onLoad }: {
  payment: PaymentInfo | null;
  receiptUrls: Record<string, { state: string; url?: string }>;
  onLoad: () => void;
}) {
  if (!payment) {
    return (
      <div className="rounded-lg border p-4 text-sm text-muted-foreground">
        No file submitted — the customer has not uploaded a receipt yet.
      </div>
    );
  }
  const receipt = payment.receipt;
  if (!receipt) {
    return (
      <div className="rounded-lg border p-4 text-sm text-muted-foreground">
        No file submitted — the customer has not uploaded a receipt yet.
      </div>
    );
  }
  const urlState = receiptUrls[payment.id];
  const isImage = receipt.mime?.startsWith("image/");

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">Payment receipt</p>
        <Button size="sm" variant="ghost" onClick={onLoad}><RotateCcw className="h-3.5 w-3.5" /> Reload</Button>
      </div>
      {!urlState && (
        <div className="rounded-lg border p-4 text-sm text-muted-foreground">
          Access link not loaded.
        </div>
      )}
      {urlState?.state === "loading" && <p className="text-sm text-muted-foreground">Loading preview…</p>}
      {urlState?.state === "denied" && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50/50 p-4 text-sm text-red-700">
          <Lock className="h-4 w-4" /> Access denied.
        </div>
      )}
      {urlState?.state === "failed" && (
        <div className="rounded-lg border border-red-200 bg-red-50/50 p-4 text-sm text-red-700">
          File could not be loaded.
        </div>
      )}
      {urlState?.state === "ok" && urlState.url && (
        <div className="space-y-2">
          {isImage ? (
            <div className="rounded-lg border bg-muted/40 p-2">
              <img
                src={urlState.url}
                alt="Payment receipt"
                className="mx-auto max-h-80 rounded object-contain"
                onError={() => { /* handled by state below */ }}
              />
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-lg border p-4">
              <FileText className="h-6 w-6 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{receipt.name || "Receipt (PDF)"}</span>
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" asChild><a href={urlState.url} target="_blank" rel="noreferrer">Open</a></Button>
          </div>
        </div>
      )}
    </div>
  );
}

function DocumentsSection({ docs, docUrls, onLoad }: {
  docs: DocInfo[];
  docUrls: Record<string, { state: string; url?: string }>;
  onLoad: () => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">Application documents</p>
        <Button size="sm" variant="ghost" onClick={onLoad}><RotateCcw className="h-3.5 w-3.5" /> Reload</Button>
      </div>
      {docs.length === 0 && (
        <div className="rounded-lg border p-4 text-sm text-muted-foreground">No file submitted.</div>
      )}
      {docs.map((d) => {
        const st = docUrls[d.id];
        const isImage = d.mime?.startsWith("image/");
        return (
          <div key={d.id} className="rounded-lg border p-3">
            <p className="text-xs font-medium text-muted-foreground">{d.doc_type ?? "Document"}</p>
            {!st && <p className="mt-1 text-xs text-muted-foreground">Access link not loaded.</p>}
            {st?.state === "loading" && <p className="mt-1 text-xs text-muted-foreground">Loading preview…</p>}
            {st?.state === "denied" && (
              <p className="mt-1 flex items-center gap-1 text-xs text-red-700"><Lock className="h-3 w-3" /> Access denied.</p>
            )}
            {st?.state === "failed" && <p className="mt-1 text-xs text-red-700">File could not be loaded.</p>}
            {st?.state === "ok" && st.url && (
              <div className="mt-2 space-y-2">
                {isImage ? (
                  <img src={st.url} alt={d.doc_type ?? "document"} className="max-h-56 rounded border object-contain" />
                ) : (
                  <div className="flex items-center gap-2 text-sm"><FileText className="h-4 w-4 text-muted-foreground" /> {d.original_name || "PDF"}</div>
                )}
                <Button size="sm" variant="outline" asChild><a href={st.url} target="_blank" rel="noreferrer">Open</a></Button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function DetailView(props: {
  row: Row;
  canReviewOrders: boolean;
  canReviewApps: boolean;
  receiptUrls: Record<string, { state: string; url?: string }>;
  docUrls: Record<string, { state: string; url?: string }>;
  busy: boolean;
  actionError: string;
  rejectOpen: boolean;
  reason: string;
  setRejectOpen: (v: boolean) => void;
  setReason: (v: string) => void;
  onVerifyPayment: () => void;
  onConfirmOrder: () => void;
  onRejectOrder: () => void;
  onVerifyAdvance: () => void;
  onApproveApp: () => void;
  onRejectApp: () => void;
  onBack: () => void;
  onRetryEmail: () => void;
}) {
  const { row } = props;
  const isOrder = row.kind === "order";
  const isApp = row.kind === "app";
  const payment = row.payment;

  return (
    <Card>
      <CardContent className="space-y-5 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold">{(isOrder ? row.reference : (row as AppRow).reference)}</h2>
              <Badge variant={(STATUS_TONE[isOrder ? (payment?.status ?? row.status) : (row as AppRow).status] ?? "muted") as any}>
                {isOrder ? (payment?.status ?? row.status) : (row as AppRow).status}
              </Badge>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {isOrder ? "Buy Now order" : "Instalment application"} · {fmtDate(row.created_at)}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={props.onBack}>← Back to list</Button>
        </div>

        {isOrder && (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Order reference" value={row.reference} />
            <Field label="Purchase type" value="Buy Now" />
            <Field label="Customer" value={(row as OrderRow).name || "—"} />
            <Field label="Contact" value={(row as OrderRow).deliveryPhone || (row as OrderRow).phone || "—"} />
            <Field label="Email" value={(row as OrderRow).email || "—"} />
            <Field label="Street address" value={(row as OrderRow).address || "—"} />
            <Field label="Area" value={(row as OrderRow).area || "—"} />
            <Field label="City / Province" value={[(row as OrderRow).city, (row as OrderRow).province].filter(Boolean).join(", ") || "—"} />
            <Field label="Postal code" value={(row as OrderRow).postal || "—"} />
            <Field label="Listed subtotal" value={formatPKR((row as OrderRow).subtotal)} />
            <Field label="Discount" value={`−${formatPKR((row as OrderRow).discount)}`} />
            <Field label="Shipping" value={(row as OrderRow).shipping === 0 ? "Free" : formatPKR((row as OrderRow).shipping)} />
            <Field label="Total" value={formatPKR((row as OrderRow).total)} />
            <Field label="Payment method" value={PAY_METHOD_LABEL[payment?.method ?? ""] ?? (row as OrderRow).method ?? "—"} />
            <Field label="Payment status" value={payment?.status ?? "—"} />
            <Field label="Submission time" value={fmtDate(payment?.created_at)} />
            {(row as OrderRow).rejection_reason && <Field label="Rejection reason" value={(row as OrderRow).rejection_reason ?? "—"} />}
          </div>
        )}

        {isApp && (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Application reference" value={row.reference} />
            <Field label="Purchase type" value="Instalment" />
            <Field label="Applicant" value={(row as AppRow).full_name || "—"} />
            <Field label="Mobile" value={(row as AppRow).mobile || "—"} />
            <Field label="Email" value={(row as AppRow).email || "—"} />
            <Field label="CNIC" value={maskCnic((row as AppRow).cnic)} />
            <Field label="Delivery contact" value={(row as AppRow).deliveryPhone || (row as AppRow).mobile || "—"} />
            <Field label="Delivery street" value={(row as AppRow).deliveryAddress || "—"} />
            <Field label="Delivery area" value={(row as AppRow).deliveryArea || "—"} />
            <Field label="Delivery city / province" value={[(row as AppRow).deliveryCity, (row as AppRow).deliveryProvince].filter(Boolean).join(", ") || "—"} />
            <Field label="Delivery postal code" value={(row as AppRow).deliveryPostalCode || "—"} />
            <Field label="Advance due" value={formatPKR((row as AppRow).advance ?? 0)} />
            <Field label="Advance received" value={formatPKR((row as AppRow).advanceReceived ?? 0)} />
            <Field label="Balance" value={formatPKR((row as AppRow).balance ?? 0)} />
            <Field label="Monthly instalment" value={formatPKR((row as AppRow).monthly ?? 0)} />
            <Field label="Total payable" value={formatPKR((row as AppRow).totalPayable ?? 0)} />
            <Field label="Term" value={(row as AppRow).tenure ? `${(row as AppRow).tenure} months` : "—"} />
            <Field label="Payment status" value={payment?.status ?? "—"} />
            <Field label="Submission time" value={fmtDate(payment?.created_at)} />
            {(row as AppRow).rejection_reason && <Field label="Rejection reason" value={(row as AppRow).rejection_reason ?? "—"} />}
          </div>
        )}

        <ReceiptSection
          payment={payment ?? null}
          receiptUrls={props.receiptUrls}
          onLoad={() => { if (payment?.receipt) { /* reload */ } }}
        />

        {isApp && (
          <DocumentsSection
            docs={(row as AppRow).docs}
            docUrls={props.docUrls}
            onLoad={() => {}}
          />
        )}

        {props.actionError && <p className="text-sm text-red-600">{props.actionError}</p>}

        {isOrder && props.canReviewOrders && payment && (payment.status === "pending_verification" || payment.status === "unpaid") && (
          <div className="rounded-lg border p-4">
            <p className="text-sm font-semibold">Review payment proof</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Verifying records the transfer as received and confirms the order. It does not send the confirmation email — approving the order is a separate step. Rejecting requires a reason.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button disabled={props.busy} onClick={props.onVerifyPayment}><CheckCircle2 className="mr-1.5 h-4 w-4" /> {props.busy ? "Saving…" : "Verify payment"}</Button>
              <Button variant="destructive" disabled={props.busy} onClick={() => { props.setReason(""); props.setRejectOpen(true); }}><XCircle className="mr-1.5 h-4 w-4" /> Reject</Button>
            </div>
            {props.rejectOpen && (
              <div className="mt-3 space-y-2">
                <Textarea placeholder="Reason for rejection (required)" value={props.reason} onChange={(e) => props.setReason(e.target.value)} rows={2} />
                <div className="flex gap-2">
                  <Button variant="destructive" size="sm" disabled={props.busy} onClick={props.onRejectOrder}>{props.busy ? "Saving…" : "Confirm Reject"}</Button>
                  <Button size="sm" variant="ghost" onClick={() => props.setRejectOpen(false)}>Cancel</Button>
                </div>
              </div>
            )}
          </div>
        )}

        {isOrder && props.canReviewOrders && payment?.status === "verified" && row.status !== "approved" && (
          <div className="rounded-lg border p-4">
            <p className="text-sm font-semibold">Approve order</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Payment is verified. Approving the order sends the customer confirmation email once.
            </p>
            <div className="mt-3">
              <Button disabled={props.busy} onClick={props.onConfirmOrder}><Mail className="mr-1.5 h-4 w-4" /> {props.busy ? "Saving…" : "Approve order (send confirmation)"}</Button>
            </div>
          </div>
        )}

        {isApp && props.canReviewApps && (
          <div className="rounded-lg border p-4">
            <p className="text-sm font-semibold">Review instalment application</p>
            <p className="mt-1 text-xs text-muted-foreground">
              “Verify advance” records only the advance as received — it does not approve the CNIC application. Approving the application is a separate decision.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {(row as AppRow).status !== "advance_payment_verified" && (
                <Button disabled={props.busy} onClick={props.onVerifyAdvance}><CheckCircle2 className="mr-1.5 h-4 w-4" /> {props.busy ? "Saving…" : "Verify advance"}</Button>
              )}
              <Button disabled={props.busy} onClick={props.onApproveApp}><CheckCircle2 className="mr-1.5 h-4 w-4" /> Approve application</Button>
              <Button variant="destructive" disabled={props.busy} onClick={() => { props.setReason(""); props.setRejectOpen(true); }}><XCircle className="mr-1.5 h-4 w-4" /> Reject</Button>
            </div>
            {props.rejectOpen && (
              <div className="mt-3 space-y-2">
                <Textarea placeholder="Reason for rejection (required)" value={props.reason} onChange={(e) => props.setReason(e.target.value)} rows={2} />
                <div className="flex gap-2">
                  <Button variant="destructive" size="sm" disabled={props.busy} onClick={props.onRejectApp}>{props.busy ? "Saving…" : "Confirm Reject"}</Button>
                  <Button size="sm" variant="ghost" onClick={() => props.setRejectOpen(false)}>Cancel</Button>
                </div>
              </div>
            )}
          </div>
        )}

        {isOrder && props.canReviewOrders && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Mail className="h-3.5 w-3.5" /> Approval email job: <EmailJobState orderId={row.id} onRetry={props.onRetryEmail} />
          </div>
        )}

        {(props.canReviewOrders || props.canReviewApps) && (
          <ApprovalEmailCopyPanel
            kind={isOrder ? "order" : "instalment"}
            subjectId={row.id}
            approved={isOrder ? row.status === "approved" : (row as AppRow).status === "approved"}
          />
        )}
      </CardContent>
    </Card>
  );
}

function EmailJobState({ orderId, onRetry }: { orderId: string; onRetry: () => void }) {
  const [job, setJob] = useState<OrderEmailJob | null>(null);
  const [loadingJob, setLoadingJob] = useState(true);
  useEffect(() => {
    let active = true;
    setLoadingJob(true);
    void (async () => {
      const j = await getOrderEmailJob(orderId);
      if (active) {
        setJob(j);
        setLoadingJob(false);
      }
    })();
    return () => { active = false; };
  }, [orderId]);
  if (loadingJob) return <span>…</span>;
  if (!job) return <span>none</span>;

  const showRetry = job.status === "failed" || job.status === "pending";
  return (
    <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
      <span
        className={
          job.status === "sent" || job.status === "delivered"
            ? "font-medium text-emerald-700"
            : job.status === "failed"
            ? "font-medium text-red-600"
            : "font-medium text-amber-600"
        }
      >
        {job.status}
      </span>
      {job.masked_recipient && (
        <span className="text-xs text-muted-foreground">→ {job.masked_recipient}</span>
      )}
      {job.last_attempt_at && (
        <span className="text-xs text-muted-foreground">last try {fmtDate(job.last_attempt_at)}</span>
      )}
      {job.delivery_id && job.status === "sent" && (
        <span className="text-xs text-muted-foreground">accepted by provider</span>
      )}
      {job.last_error && (
        <span className="block w-full text-xs text-red-600" title="Provider / delivery failure reason">
          {job.last_error}
        </span>
      )}
      {showRetry && (
        <Button size="sm" variant="ghost" onClick={onRetry}>Retry email</Button>
      )}
    </span>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border px-3 py-2">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}
