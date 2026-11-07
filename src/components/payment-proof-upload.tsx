import { useEffect, useRef, useState } from "react";
import { UploadCloud, ImagePlus, CheckCircle2, Loader2, AlertCircle, X } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { uploadPrivateFile, RECEIPT_BUCKET } from "@/lib/uploads";
import { useAuth } from "@/features/auth/AuthContext";
import { BANK_DETAILS } from "@/components/bank-transfer-details";
import { formatPKR } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type PaymentProofKind = "buy_now" | "instalment_advance" | "instalment_monthly";

interface PaymentProofUploadProps {
  kind: PaymentProofKind;
  orderId?: string;
  instalmentApplicationId?: string;
  instalmentScheduleId?: string;
  amountDue: number;
  /** Optional context line shown above the form (e.g. order number). */
  context?: string;
}

const KIND_LABEL: Record<PaymentProofKind, string> = {
  buy_now: "Full payment (Buy Now)",
  instalment_advance: "Instalment advance",
  instalment_monthly: "Monthly instalment",
};

export function PaymentProofUpload({
  kind,
  orderId,
  instalmentApplicationId,
  instalmentScheduleId,
  amountDue,
  context,
}: PaymentProofUploadProps) {
  const { user } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);

  const [amount, setAmount] = useState<string>(amountDue ? String(Math.round(amountDue)) : "");
  const [date, setDate] = useState<string>("");
  const [reference, setReference] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [state, setState] = useState<"idle" | "uploading" | "submitted">("idle");
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!file) { setPreview(""); return; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!user) { setError("Please sign in to upload a payment proof."); return; }
    const amountNum = Number(amount);
    if (!amountNum || amountNum <= 0) { setError("Enter a valid amount sent in PKR."); return; }
    if (!date) { setError("Select the transfer date."); return; }
    if (reference.trim().length < 3) { setError("Enter the bank transaction reference."); return; }
    if (!file) { setError("Attach a screenshot of the transfer."); return; }
    if (!orderId && !instalmentApplicationId && !instalmentScheduleId) {
      setError("Missing linked order / instalment."); return;
    }
    if (!isSupabaseConfigured) { setError("Upload storage is not configured on this deployment."); return; }

    setState("uploading");
    setProgress(15);

    // 1) Upload the screenshot to private storage (owner folder).
    const up = await uploadPrivateFile(RECEIPT_BUCKET, file, "payment-proofs", user.id);
    if (!up.ok) {
      setError(up.error);
      setState("idle");
      return;
    }
    setProgress(70);

    // 2) Record the submission. Only when BOTH the screenshot AND the record
    //    persist do we show "Payment submitted for review".
    const idem = `${user.id}-${orderId || instalmentApplicationId || instalmentScheduleId || "proof"}-${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
    const { data, error: rpcErr } = await supabase!.rpc("submit_payment_proof", {
      p_order_id: orderId ?? null,
      p_instalment_application_id: instalmentApplicationId ?? null,
      p_instalment_schedule_id: instalmentScheduleId ?? null,
      p_kind: kind,
      p_claimed_amount: amountNum,
      p_transfer_date: date,
      p_bank_reference: reference.trim(),
      p_file_path: up.path,
      p_file_name: file.name,
      p_mime_type: file.type,
      p_file_size: file.size,
      p_idempotency_key: idem,
    });

    if (rpcErr) {
      setError(`Could not record the payment: ${rpcErr.message}`);
      setState("idle");
      return;
    }
    setProgress(100);
    setState("submitted");
    void data;
  }

  if (state === "submitted") {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
        <div className="flex items-start gap-2">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold">Payment submitted for review</p>
            <p className="mt-1 text-emerald-700">
              Your screenshot and payment record have been saved. The store will verify the bank transfer and approve or
              reject it. Your balance is unchanged until then.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-xl border bg-card p-4">
        <p className="text-sm font-semibold">{KIND_LABEL[kind]}</p>
        {context && <p className="mt-1 text-xs text-muted-foreground">{context}</p>}
        <div className="mt-2 flex items-center justify-between rounded-lg bg-muted/60 px-3 py-2">
          <span className="text-xs text-muted-foreground">Amount due</span>
          <span className="text-sm font-bold">{formatPKR(amountDue)}</span>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Bank details</p>
        <div className="mt-2 space-y-1 text-xs text-muted-foreground">
          <p>
            {BANK_DETAILS.bankName} — {BANK_DETAILS.accountTitle} · {BANK_DETAILS.iban}
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="proof-amount">Amount sent (PKR)</Label>
          <Input id="proof-amount" type="number" min={1} value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="proof-date">Transfer date</Label>
          <Input id="proof-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="proof-ref">Bank transaction reference</Label>
        <Input id="proof-ref" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="e.g. FBL-2025-123456" />
      </div>

      <div className="space-y-1.5">
        <Label>Screenshot of transfer</Label>
        <div
          className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-5 text-center"
          onClick={() => fileRef.current?.click()}
        >
          {preview ? (
            <img src={preview} alt="Receipt preview" className="mb-2 max-h-44 rounded-lg object-contain" />
          ) : (
            <ImagePlus className="mb-2 h-8 w-8 text-muted-foreground" />
          )}
          <span className="text-xs text-muted-foreground">
            {file ? file.name : "Tap to choose an image from your gallery or computer"}
          </span>
          <span className="mt-1 text-[11px] text-muted-foreground">PNG/JPG, max 5 MB</span>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,application/pdf"
          className="hidden"
          onChange={(e) => { setFile(e.target.files?.[0] ?? null); e.target.value = ""; }}
        />
        {file && (
          <button type="button" className="text-xs text-red-600" onClick={() => { setFile(null); setPreview(""); }}>
            <X className="mr-1 inline h-3 w-3" /> Remove / replace
          </button>
        )}
      </div>

      {state === "uploading" && (
        <div className="space-y-1.5">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
          </div>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Uploading screenshot…
          </p>
        </div>
      )}

      {error && (
        <p className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          <AlertCircle className="h-4 w-4" /> {error}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={state === "uploading"}>
        {state === "uploading" ? "Uploading…" : <><UploadCloud className="h-4 w-4" /> Submit for review</>}
      </Button>
      <p className="text-center text-[11px] text-muted-foreground">
        Your balance stays unchanged while the proof is under review.
      </p>
    </form>
  );
}
