import { useEffect, useState } from "react";
import { Save, Check, Loader2 } from "lucide-react";
import { useSettings } from "@/features/settings/store";
import { useAuth } from "@/features/auth/AuthContext";
import { useAudit } from "@/features/audit/useAudit";
import { getSignupOtpRequired, setSignupOtpRequired } from "@/lib/auth-config";
import { Button } from "@/components/ui/button";
import { SectionCard, Field, TextInput, NumberInput, TextArea, Toggle, PageHeader } from "./_ui";
import type { SiteSettings } from "@/types";

export function AdminSettings() {
  const { settings, patchSettings } = useSettings();
  const { isSuperAdmin } = useAuth();
  const { log } = useAudit();
  const [draft, setDraft] = useState<SiteSettings>(settings);
  const [saved, setSaved] = useState(false);

  // ---- Authentication: signup OTP switch (Super Admin only) ----
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState("");
  const [requireOtp, setRequireOtp] = useState(true);
  const [authSaved, setAuthSaved] = useState(false);
  const [authSaving, setAuthSaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const v = await getSignupOtpRequired();
      if (mounted) {
        setRequireOtp(v);
        setAuthLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  async function toggleRequireOtp(next: boolean) {
    setAuthSaving(true);
    setAuthError("");
    setAuthSaved(false);
    const res = await setSignupOtpRequired(next);
    setAuthSaving(false);
    if (res.ok) {
      // Read back the effective state before reporting Saved.
      const effective = await getSignupOtpRequired();
      setRequireOtp(effective);
      setAuthSaved(true);
      await log({ action: "auth.email_verification.update", entity: "auth_email_config", newValue: { require_signup_otp: effective }, reason: "Super Admin changed signup email verification" });
    } else {
      if (typeof res.effective === "boolean") setRequireOtp(res.effective);
      setAuthError(res.error ?? "Could not update the verification setting.");
    }
  }

  useEffect(() => setDraft(settings), [settings]);

  const set = <K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
    setSaved(false);
  };

  async function saveAll() {
    patchSettings(draft);
    await log({ action: "settings.update", entity: "website_settings", newValue: draft, reason: "Admin saved website settings" });
    setSaved(true);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Website Settings"
        subtitle="Changes persist and reflect on the live website after saving."
        actions={
          <Button onClick={saveAll} disabled={saved}>
            {saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
            {saved ? "Saved" : "Save all changes"}
          </Button>
        }
      />

      <SectionCard title="General" description="Store identity, language and currency.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Website name"><TextInput value={draft.storeName} onChange={(v) => set("storeName", v)} /></Field>
          <Field label="Tagline"><TextInput value={draft.tagline} onChange={(v) => set("tagline", v)} /></Field>
          <Field label="Domain"><TextInput value={draft.domain} onChange={(v) => set("domain", v)} /></Field>
          <Field label="Language"><TextInput value={draft.language} onChange={(v) => set("language", v)} /></Field>
          <Field label="Country"><TextInput value={draft.country} onChange={(v) => set("country", v)} /></Field>
          <Field label="Time zone"><TextInput value={draft.timezone} onChange={(v) => set("timezone", v)} /></Field>
          <Field label="Date format"><TextInput value={draft.dateFormat} onChange={(v) => set("dateFormat", v)} /></Field>
          <Field label="Currency code"><TextInput value={draft.currency} onChange={(v) => set("currency", v)} /></Field>
          <Field label="Currency symbol"><TextInput value={draft.currencySymbol} onChange={(v) => set("currencySymbol", v)} /></Field>
          <Field label="Currency format"><TextInput value={draft.currencyFormat} onChange={(v) => set("currencyFormat", v)} /></Field>
        </div>
      </SectionCard>

      <SectionCard title="Authentication" description="Control whether new signups must verify their email with an OTP. Super Admin only.">
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4 rounded-2xl border p-4">
            <div className="min-w-0">
              <p className="text-sm font-semibold">Require email verification for new signups</p>
              <p className="mt-1 text-xs text-muted-foreground">
                When off, new customers can sign up and sign in immediately. Order confirmation emails are always enabled.
              </p>
              <p className="mt-2 text-xs font-medium text-muted-foreground">
                Current state: <span className="font-semibold text-foreground">{authLoading ? "loading…" : requireOtp ? "On" : "Off"}</span>
                {authSaved && <span className="ml-2 text-emerald-600 dark:text-emerald-400">Saved</span>}
              </p>
              {authError && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{authError}</p>}
            </div>
            <div className="shrink-0">
              {authLoading ? (
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              ) : (
                <Toggle
                  label=""
                  checked={requireOtp}
                  disabled={!isSuperAdmin || authSaving}
                  onChange={(v) => void toggleRequireOtp(v)}
                />
              )}
            </div>
          </div>
          {!isSuperAdmin && (
            <p className="text-xs text-amber-600 dark:text-amber-400">Only a Super Admin can change this setting.</p>
          )}
        </div>
      </SectionCard>

      <SectionCard title="Business" description="Business identity shown in the footer and contact pages.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Business name"><TextInput value={draft.businessName} onChange={(v) => set("businessName", v)} /></Field>
          <Field label="Business contact email"><TextInput value={draft.supportEmail} onChange={(v) => set("supportEmail", v)} /></Field>
          <Field label="Business phone"><TextInput value={draft.supportPhone} onChange={(v) => set("supportPhone", v)} /></Field>
          <Field label="WhatsApp number" hint="Used by the floating WhatsApp button."><TextInput value={draft.whatsapp} onChange={(v) => set("whatsapp", v)} /></Field>
        </div>
        <Field label="Business address"><TextArea value={draft.businessAddress} onChange={(v) => set("businessAddress", v)} rows={2} /></Field>
        <Field label="Business description"><TextArea value={draft.businessDescription} onChange={(v) => set("businessDescription", v)} rows={3} /></Field>
      </SectionCard>

      <SectionCard title="Announcement bar">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-sm font-medium">Show announcement bar</p>
            <p className="text-xs text-muted-foreground">Displays below the header on the homepage.</p>
          </div>
          <Toggle checked={draft.announcementEnabled} onChange={(v) => set("announcementEnabled", v)} label="" />
        </div>
        <Field label="Announcement text"><TextArea value={draft.announcementText} onChange={(v) => set("announcementText", v)} rows={2} /></Field>
      </SectionCard>

      {isSuperAdmin && (
        <SectionCard title="Shipping" description="Flat-rate delivery rules. Managed by the Super Admin (Discount Management).">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Shipping charge (PKR)"><NumberInput value={draft.shippingCharge} onChange={(v) => set("shippingCharge", v)} /></Field>
            <Field label="Free shipping threshold (PKR)"><NumberInput value={draft.freeShippingThreshold} onChange={(v) => set("freeShippingThreshold", v)} /></Field>
          </div>
        </SectionCard>
      )}

      <SectionCard title="SEO & footer" description="Browser title, meta description and copyright.">
        <Field label="Browser title"><TextInput value={draft.browserTitle} onChange={(v) => set("browserTitle", v)} /></Field>
        <Field label="Default meta description"><TextArea value={draft.defaultSeoDescription} onChange={(v) => set("defaultSeoDescription", v)} rows={2} /></Field>
        <Field label="Copyright text" hint="Use {year} as a placeholder for the current year."><TextInput value={draft.copyrightText} onChange={(v) => set("copyrightText", v)} /></Field>
      </SectionCard>

      <SectionCard title="Social links">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Instagram URL"><TextInput value={draft.instagram} onChange={(v) => set("instagram", v)} /></Field>
          <Field label="Facebook URL"><TextInput value={draft.facebook} onChange={(v) => set("facebook", v)} /></Field>
          <Field label="TikTok URL"><TextInput value={draft.tiktok} onChange={(v) => set("tiktok", v)} /></Field>
        </div>
      </SectionCard>
    </div>
  );
}
