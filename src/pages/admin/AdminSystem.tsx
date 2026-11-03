import { useState } from "react";
import { Save, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { useSettings } from "@/features/settings/store";
import { useAudit } from "@/features/audit/useAudit";
import { isSupabaseConfigured } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SectionCard, Toggle, PageHeader } from "./_ui";

function StatusRow({ label, ok, detail }: { label: string; ok: boolean; detail: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b py-3 last:border-b-0">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{detail}</p>
      </div>
      {ok ? (
        <Badge variant="success"><CheckCircle2 className="h-3 w-3" /> OK</Badge>
      ) : (
        <Badge variant="warning"><AlertTriangle className="h-3 w-3" /> Warning</Badge>
      )}
    </div>
  );
}

export function AdminSystem() {
  const { settings, patchSettings } = useSettings();
  const { log } = useAudit();
  const [saved, setSaved] = useState(false);
  const env = import.meta.env.DEV ? "development" : "production";
  const analyticsConfigured = settings.seoAnalytics.analyticsEnabled && settings.seoAnalytics.googleAnalyticsId.trim() !== "";

  async function toggleMaintenance(next: boolean) {
    patchSettings({ maintenanceMode: next });
    await log({ action: "system.maintenance", entity: "website_settings", newValue: { maintenanceMode: next } });
    setSaved(true);
  }

  return (
    <div className="space-y-6">
      <PageHeader title="System Control Centre" subtitle="Environment health and operational status. Secret values are never shown here." />

      <SectionCard title="Maintenance mode" description="When enabled, customers see a maintenance screen; administrators can still log in.">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm font-medium">Website availability</p>
          <Toggle checked={settings.maintenanceMode} onChange={toggleMaintenance} label={settings.maintenanceMode ? "Maintenance on" : "Live"} />
        </div>
        {settings.maintenanceMode && (
          <p className="text-xs text-amber-700">Maintenance mode is active for the storefront.</p>
        )}
      </SectionCard>

      <SectionCard title="Environment & integrations">
        <StatusRow label="Application environment" ok={true} detail={`Running in ${env} mode.`} />
        <StatusRow label="Database (Supabase)" ok={isSupabaseConfigured} detail={isSupabaseConfigured ? "Connected and configured." : "VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY missing — using local dev data."} />
        <StatusRow label="Analytics" ok={analyticsConfigured} detail={analyticsConfigured ? "Google Analytics configured and enabled." : "Analytics disabled or not configured (managed in SEO settings)."} />
        <StatusRow label="Payment gateways" ok={settings.paymentMethods.some((m) => m.enabled && m.verified)} detail={settings.paymentMethods.some((m) => m.enabled) ? "At least one payment method is active and verified." : "No verified payment method is active yet."} />
        <StatusRow label="Email / WhatsApp" ok={Boolean(settings.supportEmail)} detail="SMTP/WhatsApp provider credentials are required before sending; not yet configured." />
      </SectionCard>

      <div className="flex items-start gap-2 rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-800">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <div>
          <p className="font-semibold">Status note</p>
          <p className="mt-1">Integration health reflects real configuration state. No secret values are displayed. When Supabase is connected, admin activity is recorded to the audit log.</p>
        </div>
      </div>
    </div>
  );
}
