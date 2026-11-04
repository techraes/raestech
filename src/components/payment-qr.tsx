import { QRCodeSVG } from "qrcode.react";
import { Card } from "@/components/ui/card";
import { BANK_DETAILS } from "@/components/bank-transfer-details";
import { formatPKR } from "@/lib/utils";

interface PaymentQrProps {
  amount: number;
  orderNumber?: string;
  className?: string;
}

/**
 * Builds a scannable payment payload (bank details + exact amount) and renders
 * it as a QR code so customers can scan-to-pay for the exact order total.
 */
export function buildPaymentQrPayload(amount: number, orderNumber?: string): string {
  const lines = [
    "RAES TECH - Bank Transfer",
    `Bank: ${BANK_DETAILS.bankName}`,
    `Account Title: ${BANK_DETAILS.accountTitle}`,
    `Account Number: ${BANK_DETAILS.accountNumber}`,
    `IBAN: ${BANK_DETAILS.iban}`,
    `Amount: ${formatPKR(amount)}`,
  ];
  if (orderNumber) lines.push(`Order: ${orderNumber}`);
  return lines.join("\n");
}

export function PaymentQr({ amount, orderNumber, className }: PaymentQrProps) {
  const payload = buildPaymentQrPayload(amount, orderNumber);
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
