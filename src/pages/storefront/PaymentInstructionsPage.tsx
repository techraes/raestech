import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BankTransferDetails } from "@/components/bank-transfer-details";
import { FileUploadField } from "@/components/file-upload-field";
import { useSettings } from "@/features/settings/store";
import { submitReceipt } from "@/lib/receipts";
import { formatPKR } from "@/lib/utils";

export function PaymentInstructionsPage() {
  const { settings } = useSettings();
  const [params] = useSearchParams();
  const orderNo = params.get("order") || "";
  const amountParam = params.get("amount") || "";
  const amount = amountParam ? Number(amountParam) : 0;
  const manualMethod = settings.paymentMethods?.find((m) => m.enabled && m.type === "manual") ?? null;

  const [receipt, setReceipt] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!receipt) {
      setError("Please attach your payment receipt before submitting.");
      return;
    }
    if (!orderNo) {
      setError("We couldn't find the order for this receipt. Please upload from My Orders instead.");
      return;
    }
    setSubmitting(true);
    const result = await submitReceipt(orderNo, amount, receipt);
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setDone(true);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold">Payment Instructions</h1>

      <BankTransferDetails
        orderNumber={orderNo ? `Order: ${orderNo}` : undefined}
        amountText={amount ? formatPKR(amount) : undefined}
        bank={manualMethod ? { bankName: manualMethod.bankName, accountTitle: manualMethod.accountTitle, accountNumber: manualMethod.accountNumber, iban: manualMethod.iban, instructions: manualMethod.instructions } : undefined}
      />

      {/* Receipt upload */}
      <Card>
        <CardContent className="space-y-4 p-5">
          <h2 className="text-lg font-bold">Upload your payment receipt</h2>
          <p className="text-sm text-muted-foreground">
            After transferring the exact order amount, upload a clear screenshot or scan of your receipt for verification.
          </p>

          {done ? (
            <div className="flex flex-col items-center rounded-xl border border-emerald-200 bg-emerald-50 py-8 text-center">
              <CheckCircle2 className="mb-2 h-8 w-8 text-emerald-600" />
              <p className="font-semibold text-emerald-800">Receipt submitted</p>
              <p className="mt-1 max-w-sm text-sm text-emerald-700">
                Payment is now pending verification. Our team will review it shortly.
              </p>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <FileUploadField
                id="receipt-upload"
                label="Payment receipt"
                accept=".jpg,.jpeg,.png,.pdf"
                required
                value={receipt}
                onChange={setReceipt}
                helperText="Attach your bank transfer receipt (JPG, JPEG, PNG or PDF, max 5 MB)."
              />
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button type="submit" className="w-full" disabled={submitting || !receipt}>
                {submitting ? "Uploading…" : "Submit payment confirmation"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      <Button asChild variant="outline" className="w-full">
        <Link to="/account/orders">Go to My Orders</Link>
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        Questions? Contact {settings.supportEmail} or {settings.supportPhone}.
      </p>
    </div>
  );
}
