import { useState } from "react";
import { Save, Info } from "lucide-react";
import { useSettings } from "@/features/settings/store";
import { useAudit } from "@/features/audit/useAudit";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SectionCard, Field, TextInput, NumberInput, TextArea, Toggle, PageHeader } from "./_ui";
import type { PaymentMethod } from "@/types";

function isManualConfigured(m: PaymentMethod): boolean {
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
          const isBank = m.code === "faysal_bank";
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

              {m.type === "online" && (
                <p className="text-xs text-muted-foreground">
                  Online gateway — add a provider adapter, set secret credentials server-side and verify callbacks before activation.
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
            </SectionCard>
          );
        })}
      </div>
    </div>
  );
}
