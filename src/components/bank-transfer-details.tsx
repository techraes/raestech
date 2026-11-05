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

/** Resolve the active manual payment method from settings. */
export function resolveManualPaymentMethod(paymentMethods: Array<{ enabled?: boolean; type?: string; code?: string }> = []) {
  return paymentMethods.find((m) => m.enabled && m.type === "manual") ?? null;
}

interface BankTransferDetailsProps {
  /** Optional order number shown alongside the details. */
  orderNumber?: string;
  /** Optional payable amount shown alongside the details. */
  amountText?: string;
  className?: string;
  /** Override bank details (from admin payment settings). */
  bank?: {
    bankName?: string;
    accountTitle?: string;
    accountNumber?: string;
    iban?: string;
    instructions?: string;
  };
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
export function BankTransferDetails({ orderNumber, amountText, className, bank }: BankTransferDetailsProps) {
  const details = {
    accountTitle: bank?.accountTitle || BANK_DETAILS.accountTitle,
    bankName: bank?.bankName || BANK_DETAILS.bankName,
    accountNumber: bank?.accountNumber || BANK_DETAILS.accountNumber,
    iban: bank?.iban || BANK_DETAILS.iban,
    instructions: bank?.instructions || BANK_PAYMENT_INSTRUCTIONS,
  };
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
        <CopyCell label="Account Title" value={details.accountTitle} />
        <CopyCell label="Bank Name" value={details.bankName} />
        <CopyCell label="Account Number" value={details.accountNumber} />
        <CopyCell label="IBAN" value={details.iban} />
        <p className="pt-2 text-sm text-muted-foreground">{details.instructions}</p>
      </CardContent>
    </Card>
  );
}
