import { useState } from "react";
import { Copy, Check, Landmark } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const BANK_DETAILS = {
  accountTitle: "MUBASHAR IQBAL",
  bankName: "Faysal Bank Limited",
  accountNumber: "3280525000007626",
  iban: "PK24FAYS3280525000007626",
} as const;

export const BANK_PAYMENT_INSTRUCTIONS =
  "Please transfer the payment to the bank account provided above. After completing your transaction, upload your payment receipt and submit your payment confirmation for verification.";

interface BankTransferDetailsProps {
  /** Optional order number shown alongside the details. */
  orderNumber?: string;
  /** Optional payable amount shown alongside the details. */
  amountText?: string;
  className?: string;
}

function CopyCell({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // Fallback for older/embedded browsers.
      const ta = document.createElement("textarea");
      ta.value = value;
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
      } catch {
        /* ignore */
      }
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }
  return (
    <div className="flex items-center justify-between gap-2 rounded-xl border bg-muted/40 px-3 py-2.5">
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="truncate font-semibold text-foreground">{value}</p>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={copy}
        className={cn("shrink-0 gap-1.5", copied && "border-emerald-500 text-emerald-700")}
        aria-label={`Copy ${label}`}
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        {copied ? "Copied" : "Copy"}
      </Button>
    </div>
  );
}

/**
 * Official bank-transfer payment card used during checkout, on the payment
 * instructions page and in the customer order view. Includes one-tap copy
 * buttons with a small success confirmation.
 */
export function BankTransferDetails({ orderNumber, amountText, className }: BankTransferDetailsProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <div className="flex items-center gap-3 border-b bg-gradient-to-r from-emerald-50 to-teal-50 px-5 py-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-white">
          <Landmark className="h-5 w-5" />
        </div>
        <div>
          <p className="font-bold text-foreground">Bank Transfer Payment</p>
          <p className="text-xs text-muted-foreground">Faysal Bank Limited — manual verification</p>
        </div>
        {(orderNumber || amountText) && (
          <div className="ml-auto text-right text-xs">
            {orderNumber && <p className="font-semibold">{orderNumber}</p>}
            {amountText && <p className="text-muted-foreground">Amount due: <span className="font-semibold text-foreground">{amountText}</span></p>}
          </div>
        )}
      </div>
      <CardContent className="space-y-2.5 p-5">
        <CopyCell label="Account Title" value={BANK_DETAILS.accountTitle} />
        <CopyCell label="Bank Name" value={BANK_DETAILS.bankName} />
        <CopyCell label="Account Number" value={BANK_DETAILS.accountNumber} />
        <CopyCell label="IBAN" value={BANK_DETAILS.iban} />
        <p className="pt-2 text-sm text-muted-foreground">{BANK_PAYMENT_INSTRUCTIONS}</p>
      </CardContent>
    </Card>
  );
}
