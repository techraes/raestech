import { useState } from "react";
import { Save, ChevronUp, ChevronDown, Plus, Trash2, Eye, EyeOff } from "lucide-react";
import { useSettings } from "@/features/settings/store";
import { useAudit } from "@/features/audit/useAudit";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SectionCard, Field, TextInput, PageHeader } from "./_ui";
import type { HomepageSection, HomepageSectionKind } from "@/types";

const KIND_LABEL: Record<HomepageSectionKind, string> = {
  hero: "Hero banner",
  announcement: "Announcement",
  featuredBrands: "Featured brands",
  latest: "Latest smartphones",
  featuredIphones: "Featured iPhones",
  samsung: "Samsung phones",
  jvIphones: "JV iPhones",
  bestSellers: "Best sellers",
  newArrivals: "New arrivals",
  specialOffers: "Special offers",
  buyNowPromo: "Buy Now 10% promo",
  instalmentPromo: "0% instalment promo",
  testimonials: "Testimonials",
  faq: "FAQs",
  newsletter: "Newsletter",
  contact: "Contact",
};

const ADDABLE: HomepageSectionKind[] = [
  "featuredBrands", "latest", "featuredIphones", "samsung", "jvIphones",
  "bestSellers", "newArrivals", "specialOffers", "buyNowPromo",
  "instalmentPromo", "testimonials", "faq", "newsletter", "contact",
];

export function AdminHomepage() {
  const { settings, patchSettings } = useSettings();
  const { log } = useAudit();
  const [sections, setSections] = useState<HomepageSection[]>(settings.homepageSections);
  const [toAdd, setToAdd] = useState<HomepageSectionKind | "">("");
  const [saved, setSaved] = useState(false);

  function patch(id: string, partial: Partial<HomepageSection>) {
    setSections((list) => list.map((s) => (s.id === id ? { ...s, ...partial } : s)));
    setSaved(false);
  }

  function move(index: number, dir: -1 | 1) {
    setSections((list) => {
      const next = [...list];
      const j = index + dir;
      if (j < 0 || j >= next.length) return list;
      [next[index], next[j]] = [next[j], next[index]];
      return next.map((s, i) => ({ ...s, sort: i }));
    });
    setSaved(false);
  }

  function remove(id: string) {
    setSections((list) => list.filter((s) => s.id !== id));
    setSaved(false);
  }

  function add() {
    if (!toAdd) return;
    const id = `s-${toAdd}-${Date.now()}`;
    setSections((list) => [...list, { id, kind: toAdd, title: KIND_LABEL[toAdd], enabled: true, sort: list.length }]);
    setToAdd("");
    setSaved(false);
  }

  async function save() {
    const ordered = sections.map((s, i) => ({ ...s, sort: i }));
    patchSettings({ homepageSections: ordered });
    await log({ action: "homepage.publish", entity: "homepage_sections", newValue: ordered });
    setSaved(true);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Homepage Builder"
        subtitle="Reorder, show/hide and edit homepage sections. Changes go live after saving."
        actions={<Button onClick={save} disabled={saved}>{saved ? "Saved" : <><Save className="h-4 w-4" /> Save homepage</>}</Button>}
      />

      <SectionCard title="Sections" description="Drag-order via the arrows. Disabled sections are hidden from the homepage.">
        <div className="space-y-2">
          {sections.map((s, i) => (
            <div key={s.id} className="rounded-xl border bg-card p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{KIND_LABEL[s.kind]}</Badge>
                  <button onClick={() => patch(s.id, { enabled: !s.enabled })} aria-label={s.enabled ? "Hide" : "Show"}>
                    {s.enabled ? <Eye className="h-4 w-4 text-emerald-600" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
                  </button>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up"><ChevronUp className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => move(i, 1)} disabled={i === sections.length - 1} aria-label="Move down"><ChevronDown className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => remove(s.id)} aria-label="Delete"><Trash2 className="h-4 w-4 text-red-500" /></Button>
                </div>
              </div>
              {s.enabled && (
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <Field label="Heading"><TextInput value={s.title} onChange={(v) => patch(s.id, { title: v })} /></Field>
                  <Field label="Subheading"><TextInput value={s.subtitle ?? ""} onChange={(v) => patch(s.id, { subtitle: v })} /></Field>
                  <Field label="Button text"><TextInput value={s.buttonText ?? ""} onChange={(v) => patch(s.id, { buttonText: v })} /></Field>
                  <Field label="Button link"><TextInput value={s.buttonLink ?? ""} onChange={(v) => patch(s.id, { buttonLink: v })} /></Field>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t pt-4">
          <Select value={toAdd} onValueChange={(v) => setToAdd(v as HomepageSectionKind)}>
            <SelectTrigger className="w-64"><SelectValue placeholder="Add a section…" /></SelectTrigger>
            <SelectContent>
              {ADDABLE.map((k) => (
                <SelectItem key={k} value={k}>{KIND_LABEL[k]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={add} disabled={!toAdd}>
            <Plus className="h-4 w-4" /> Add section
          </Button>
        </div>
      </SectionCard>
    </div>
  );
}
