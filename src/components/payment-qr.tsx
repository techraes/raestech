import { QRCodeSVG } from "qrcode.react";
import { Card } from "@/components/ui/card";
import { BANK_DETAILS } from "@/components/bank-transfer-details";
import { formatPKR } from "@/lib/utils";

interface PaymentQrProps {
  amount: number;
  orderNumber?: string;
  className?: string;
  /** Override bank details (from admin payment settings). */
  bank?: { bankName?: string; accountTitle?: string; accountNumber?: string; iban?: string };
  /** Custom scannable payload (from admin payment settings). */
  payload?: string;
  /** Optional uploaded QR code image (data URL) — shown in place of the generated QR. */
  imageUrl?: string;
}

/**
 * Builds a scannable payment payload (bank details + exact amount) and renders
 * it as a QR code so customers can scan-to-pay for the exact order total.
 * An admin-configured payload (from payment settings) takes precedence.
 */
export function buildPaymentQrPayload(amount: number, orderNumber?: string, bank?: { bankName?: string; accountTitle?: string; accountNumber?: string; iban?: string }, customPayload?: string): string {
  if (customPayload && customPayload.trim()) {
    const lines = [customPayload.trim()];
    if (orderNumber) lines.push(`Order: ${orderNumber}`);
    return lines.join("\n");
  }
  const lines = [
    "RAES TECH - Bank Transfer",
    `Bank: ${bank?.bankName || BANK_DETAILS.bankName}`,
    `Account Title: ${bank?.accountTitle || BANK_DETAILS.accountTitle}`,
    `Account Number: ${bank?.accountNumber || BANK_DETAILS.accountNumber}`,
    `IBAN: ${bank?.iban || BANK_DETAILS.iban}`,
    `Amount: ${formatPKR(amount)}`,
  ];
  if (orderNumber) lines.push(`Order: ${orderNumber}`);
  return lines.join("\n");
}

export function PaymentQr({ amount, orderNumber, className, bank, payload: customPayload, imageUrl }: PaymentQrProps) {
  const payload = buildPaymentQrPayload(amount, orderNumber, bank, customPayload);

  if (imageUrl && imageUrl.trim()) {
    return (
      <Card className={className}>
        <div className="flex flex-col items-center gap-3 p-5 text-center">
          <p className="text-sm font-semibold">Scan to pay</p>
          <div className="rounded-2xl border bg-white p-3">
            <img src={imageUrl} alt="Payment QR code" className="h-44 w-44 object-contain" />
          </div>
          <p className="text-xs text-muted-foreground">
            Scan the QR code with your payment app to complete this payment.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <div className="flex flex-col items-center gap-3 p-5 text-center">
        <p className="text-sm font-semibold">Scan to verify transfer details</p>
        <div className="rounded-2xl border bg-white p-3">
          <QRCodeSVG value={payload} size={176} bgColor="#ffffff" fgColor="#111827" level="M" />
        </div>
        <p className="text-xs text-muted-foreground">
          Scan to confirm the exact amount and account details for this order.
        </p>
      </div>
    </Card>
  );
}
