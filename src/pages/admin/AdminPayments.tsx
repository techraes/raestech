import { useState } from "react";
import { Save, Info, ImagePlus } from "lucide-react";
import { useSettings } from "@/features/settings/store";
import { useAudit } from "@/features/audit/useAudit";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SectionCard, Field, TextInput, NumberInput, TextArea, Toggle, PageHeader } from "./_ui";
import type { PaymentMethod } from "@/types";

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

function isManualConfigured(m: PaymentMethod): boolean {
  if (m.kind === "crypto") return Boolean((m.walletAddress ?? "").trim() && (m.coinSymbol ?? "").trim());
  if (m.kind === "card") return Boolean((m.cardProcessor ?? "").trim() || (m.instructions ?? "").trim());
  if (m.type === "online") return false;
  const required = [m.name, m.instructions];
  return required.every((v) => (v ?? "").trim() !== "");
}

export function AdminPayments() {
  const { settings, patchSettings } = useSettings();
  const { log } = useAudit();
  const [methods, setMethods] = useState<PaymentMethod[]>(settings.paymentMethods);
  const [saved, setSaved] = useState(false);

  const set = (id: string, partial: Partial<PaymentMethod>) => {
    setMethods((list) => list.map((m) => (m.id === id ? { ...m, ...partial } : m)));
    setSaved(false);
  };

  function toggleEnabled(id: string, next: boolean) {
    const m = methods.find((x) => x.id === id);
    if (!m) return;
    if (next && !isManualConfigured(m)) return; // do not activate until configured
    set(id, { enabled: next, liveMode: next, verified: next });
  }

  function onUploadQr(id: string, file: File | undefined | null) {
    if (!file) return;
    readFileAsDataURL(file)
      .then((url) => set(id, { qrImageUrl: url }))
      .catch(() => {});
  }

  async function save() {
    patchSettings({ paymentMethods: methods });
    await log({ action: "payments.publish", entity: "payment_methods", newValue: methods });
    setSaved(true);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payment Gateway Management"
        subtitle="Configure and enable payment methods. A method cannot be turned on until its details are complete."
        actions={<Button onClick={save} disabled={saved}>{saved ? "Saved" : <><Save className="h-4 w-4" /> Save</>}</Button>}
      />

      <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          Online gateways require verified server-side credentials, callbacks and webhooks. Until those are configured and
          verified, they are listed but cannot be activated. Bank transfer details below are entered by you and stored safely.
        </p>
      </div>

      <div className="space-y-4">
        {methods.map((m) => {
          const configured = isManualConfigured(m);
          const isBank = m.code === "faysal_bank" || m.kind === "bank";
          const isCrypto = m.kind === "crypto";
          const isCard = m.kind === "card";
          return (
            <SectionCard key={m.id} title={m.name}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Badge variant={m.enabled ? "success" : "outline"}>{m.enabled ? "Active" : "Disabled"}</Badge>
                  <Badge variant="secondary">{m.type === "manual" ? "Manual" : "Online"}</Badge>
                  {m.type === "manual" && <Badge variant={configured ? "success" : "warning"}>{configured ? "Configured" : "Needs details"}</Badge>}
                </div>
                <Toggle
                  checked={m.enabled}
                  onChange={(v) => toggleEnabled(m.id, v)}
                  label={m.enabled ? "Enabled" : "Disabled"}
                />
              </div>

              {isCard && (
                <p className="text-xs text-muted-foreground">
                  Card gateway — configure your provider. Live transactions require verified server-side credentials and webhooks;
                  until then, enter your processor details and instructions so customers know how to pay.
                </p>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Display name"><TextInput value={m.name} onChange={(v) => set(m.id, { name: v })} /></Field>
                <Field label="Display order"><NumberInput value={m.displayOrder} onChange={(v) => set(m.id, { displayOrder: v })} /></Field>
                <div className="sm:col-span-2">
                  <Field label="Customer-facing description"><TextArea value={m.customerDescription ?? ""} onChange={(v) => set(m.id, { customerDescription: v })} rows={2} /></Field>
                </div>
              </div>

              {isBank && (
                <div className="grid gap-4 rounded-lg border p-4 sm:grid-cols-2">
                  <p className="text-sm font-semibold sm:col-span-2">Faysal Bank account details</p>
                  <Field label="Bank name"><TextInput value={m.bankName ?? ""} onChange={(v) => set(m.id, { bankName: v })} /></Field>
                  <Field label="Account title"><TextInput value={m.accountTitle ?? ""} onChange={(v) => set(m.id, { accountTitle: v })} /></Field>
                  <Field label="Account number"><TextInput value={m.accountNumber ?? ""} onChange={(v) => set(m.id, { accountNumber: v })} /></Field>
                  <Field label="IBAN"><TextInput value={m.iban ?? ""} onChange={(v) => set(m.id, { iban: v })} /></Field>
                  <Field label="Branch details"><TextInput value={m.branch ?? ""} onChange={(v) => set(m.id, { branch: v })} /></Field>
                  <div className="sm:col-span-2">
                    <Field label="Payment instructions"><TextArea value={m.instructions ?? ""} onChange={(v) => set(m.id, { instructions: v })} rows={3} /></Field>
                  </div>
                </div>
              )}

              {isCrypto && (
                <div className="grid gap-4 rounded-lg border p-4 sm:grid-cols-2">
                  <p className="text-sm font-semibold sm:col-span-2">Crypto wallet details</p>
                  <Field label="Coin / asset"><TextInput value={m.coinSymbol ?? "USDT"} onChange={(v) => set(m.id, { coinSymbol: v })} /></Field>
                  <Field label="Network"><TextInput value={m.network ?? "TRC-20"} onChange={(v) => set(m.id, { network: v })} /></Field>
                  <div className="sm:col-span-2">
                    <Field label="Wallet address"><TextInput value={m.walletAddress ?? ""} onChange={(v) => set(m.id, { walletAddress: v })} placeholder="e.g. T… (TRC-20)" /></Field>
                  </div>
                  <div className="sm:col-span-2">
                    <Field label="Payment instructions"><TextArea value={m.instructions ?? ""} onChange={(v) => set(m.id, { instructions: v })} rows={3} /></Field>
                  </div>
                </div>
              )}

              {isCard && (
                <div className="grid gap-4 rounded-lg border p-4 sm:grid-cols-2">
                  <p className="text-sm font-semibold sm:col-span-2">Card gateway details</p>
                  <Field label="Processor"><TextInput value={m.cardProcessor ?? ""} onChange={(v) => set(m.id, { cardProcessor: v })} placeholder="e.g. Stripe, 2Checkout" /></Field>
                  <Field label="Merchant ID"><TextInput value={m.merchantId ?? ""} onChange={(v) => set(m.id, { merchantId: v })} /></Field>
                  <div className="sm:col-span-2">
                    <Field label="Instructions for customer"><TextArea value={m.instructions ?? ""} onChange={(v) => set(m.id, { instructions: v })} rows={3} /></Field>
                  </div>
                </div>
              )}

              <div className="grid gap-4 rounded-lg border p-4">
                <p className="text-sm font-semibold">QR code payment</p>
                <div className="flex flex-wrap items-center gap-3">
                  {m.qrImageUrl ? (
                    <img src={m.qrImageUrl} alt="Uploaded QR" className="h-24 w-24 rounded-lg border bg-white object-contain" />
                  ) : (
                    <div className="flex h-24 w-24 items-center justify-center rounded-lg border bg-muted text-xs text-muted-foreground">No image</div>
                  )}
                  <div className="space-y-1">
                    <Button type="button" variant="outline" size="sm" asChild>
                      <label className="cursor-pointer">
                        <ImagePlus className="mr-1.5 h-3.5 w-3.5" /> {m.qrImageUrl ? "Replace QR image" : "Upload QR image"}
                        <input type="file" accept=".jpg,.jpeg,.png,.webp" className="hidden" onChange={(e) => onUploadQr(m.id, e.target.files?.[0])} />
                      </label>
                    </Button>
                    {m.qrImageUrl && (
                      <Button type="button" variant="ghost" size="sm" onClick={() => set(m.id, { qrImageUrl: undefined })}>Remove image</Button>
                    )}
                  </div>
                </div>
                <Field
                  label="QR payload (optional)"
                  hint="If you upload a QR image, it is shown to customers as-is. The payload text below is used only to auto-generate a QR when no image is uploaded."
                >
                  <TextArea value={m.qrPayload ?? ""} onChange={(v) => set(m.id, { qrPayload: v })} rows={2} />
                </Field>
              </div>
            </SectionCard>
          );
        })}
      </div>
    </div>
  );
}
