import { useRef, useState } from "react";
import { Save, RotateCcw, Upload } from "lucide-react";
import { useSettings, DEFAULT_THEME } from "@/features/settings/store";
import { useAudit } from "@/features/audit/useAudit";
import { Button } from "@/components/ui/button";
import { SectionCard, Field, TextInput, NumberInput, ColorInput, PageHeader } from "./_ui";
import type { ThemeTokens } from "@/types";

export function AdminAppearance() {
  const { settings, patchSettings } = useSettings();
  const { log } = useAudit();
  const [theme, setTheme] = useState<ThemeTokens>(settings.theme);
  const [logo, setLogo] = useState(settings.logoDataUrl);
  const [favicon, setFavicon] = useState(settings.faviconDataUrl);
  const [published, setPublished] = useState(false);
  const logoRef = useRef<HTMLInputElement>(null);
  const faviconRef = useRef<HTMLInputElement>(null);

  const setToken = <K extends keyof ThemeTokens>(key: K, value: ThemeTokens[K]) => {
    setTheme((t) => ({ ...t, [key]: value }));
    setPublished(false);
  };

  function readImage(file: File, onDone: (v: string) => void) {
    const r = new FileReader();
    r.onload = () => onDone(String(r.result ?? ""));
    r.readAsDataURL(file);
  }

  async function publish() {
    patchSettings({ theme, logoDataUrl: logo, faviconDataUrl: favicon });
    await log({ action: "appearance.publish", entity: "theme", newValue: theme, reason: "Published branding" });
    setPublished(true);
  }

  function restoreDefaults() {
    setTheme(DEFAULT_THEME);
    setLogo("");
    setFavicon("");
    setPublished(false);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Branding & Appearance"
        subtitle="Safe design tokens applied to the live site. No arbitrary CSS is executed."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={restoreDefaults}>
              <RotateCcw className="h-4 w-4" /> Restore defaults
            </Button>
            <Button onClick={publish} disabled={published}>
              {published ? <span>Published</span> : <><Save className="h-4 w-4" /> Publish</>}
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-3">
          <SectionCard title="Logo" description="Used in the header. Favicon shows in the browser tab.">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Main logo">
                <div className="flex items-center gap-3">
                  {logo ? <img src={logo} alt="logo" className="h-10 w-auto max-w-[140px] rounded border object-contain" /> : <div className="h-10 w-32 rounded border border-dashed" />}
                  <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) readImage(f, setLogo); e.target.value = ""; }} />
                  <Button variant="outline" size="sm" onClick={() => logoRef.current?.click()}><Upload className="h-4 w-4" /> Upload</Button>
                </div>
              </Field>
              <Field label="Favicon">
                <div className="flex items-center gap-3">
                  {favicon ? <img src={favicon} alt="favicon" className="h-8 w-8 rounded border object-contain" /> : <div className="h-8 w-8 rounded border border-dashed" />}
                  <input ref={faviconRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) readImage(f, setFavicon); e.target.value = ""; }} />
                  <Button variant="outline" size="sm" onClick={() => faviconRef.current?.click()}><Upload className="h-4 w-4" /> Upload</Button>
                </div>
              </Field>
            </div>
          </SectionCard>

          <SectionCard title="Colours" description="Brand palette shared across the site.">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Primary / button"><ColorInput value={theme.buttonColor} onChange={(v) => setToken("buttonColor", v)} /></Field>
              <Field label="Button hover"><ColorInput value={theme.buttonHoverColor} onChange={(v) => setToken("buttonHoverColor", v)} /></Field>
              <Field label="Accent"><ColorInput value={theme.accentColor} onChange={(v) => setToken("accentColor", v)} /></Field>
              <Field label="Background"><ColorInput value={theme.backgroundColor} onChange={(v) => setToken("backgroundColor", v)} /></Field>
              <Field label="Header"><ColorInput value={theme.headerColor} onChange={(v) => setToken("headerColor", v)} /></Field>
              <Field label="Footer"><ColorInput value={theme.footerColor} onChange={(v) => setToken("footerColor", v)} /></Field>
              <Field label="Text"><ColorInput value={theme.textColor} onChange={(v) => setToken("textColor", v)} /></Field>
              <Field label="Link / border"><ColorInput value={theme.linkColor} onChange={(v) => setToken("linkColor", v)} /></Field>
            </div>
          </SectionCard>

          <SectionCard title="Typography & shape">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Body font family"><TextInput value={theme.fontFamily} onChange={(v) => setToken("fontFamily", v)} /></Field>
              <Field label="Heading font family"><TextInput value={theme.headingFont} onChange={(v) => setToken("headingFont", v)} /></Field>
              <Field label="Border radius scale (rem)"><NumberInput value={theme.radiusScale} onChange={(v) => setToken("radiusScale", v)} /></Field>
            </div>
          </SectionCard>
        </div>

        <div className="lg:col-span-2">
          <SectionCard title="Live preview">
            <div className="overflow-hidden rounded-xl border shadow-sm" style={{ background: theme.backgroundColor, color: theme.textColor }}>
              <div className="px-4 py-3 text-sm font-bold" style={{ background: theme.headerColor, color: theme.textColor }}>
                {settings.storeName}
              </div>
              <div className="space-y-3 p-4">
                <p className="text-sm">Your brand preview with the current tokens.</p>
                <div className="inline-flex rounded-md px-4 py-2 text-sm font-semibold text-white" style={{ background: theme.buttonColor, borderRadius: `${theme.radiusScale}rem` }}>
                  Buy now
                </div>
                <div className="inline-flex ml-2 rounded-md border px-4 py-2 text-sm" style={{ borderColor: theme.accentColor, color: theme.accentColor, borderRadius: `${theme.radiusScale}rem` }}>
                  Instalments
                </div>
              </div>
              <div className="px-4 py-3 text-xs" style={{ background: theme.footerColor, color: "#fff" }}>
                © {new Date().getFullYear()} {settings.storeName}
              </div>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Colors, fonts and spacing are applied as CSS custom properties (tokens). Invalid or unsafe values are not executed.
            </p>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
