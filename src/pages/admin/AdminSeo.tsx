import { useState } from "react";
import { Save, Check, Search } from "lucide-react";
import { useSettings } from "@/features/settings/store";
import { useProductStore } from "@/store/products";
import type { SeoAnalytics, Product } from "@/types";
import { Button } from "@/components/ui/button";
import { SectionCard, Field, TextInput, TextArea, Toggle, PageHeader, Stat, EmptyState } from "./_ui";

type ProductEdits = Partial<Pick<Product, "seo_title" | "seo_description" | "slug" | "indexable">>;

export function AdminSeo() {
  const { settings, patchSettings } = useSettings();
  const { products, upsertProduct } = useProductStore();

  const [draft, setDraft] = useState<SeoAnalytics>(() => ({ ...settings.seoAnalytics }));
  const [saved, setSaved] = useState(false);
  const [query, setQuery] = useState("");
  const [edits, setEdits] = useState<Record<string, ProductEdits>>({});

  const set = <K extends keyof SeoAnalytics>(key: K, value: SeoAnalytics[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
    setSaved(false);
  };

  const saveGlobal = () => {
    patchSettings({ seoAnalytics: draft });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  };

  const getEdit = (id: number | string): ProductEdits => edits[String(id)] || {};
  const setEdit = (id: number | string, patch: ProductEdits) => {
    setEdits((prev) => ({ ...prev, [String(id)]: { ...(prev[String(id)] || {}), ...patch } }));
  };

  const saveProduct = (p: Product) => {
    const e = edits[String(p.id)] || {};
    const indexable = e.indexable !== undefined ? e.indexable : p.indexable !== false;
    const slug = e.slug !== undefined ? (e.slug.trim() || p.slug) : p.slug;
    upsertProduct({
      ...p,
      seo_title: e.seo_title !== undefined ? e.seo_title : p.seo_title,
      seo_description: e.seo_description !== undefined ? e.seo_description : p.seo_description,
      slug,
      indexable,
    });
    setEdits((prev) => {
      const next = { ...prev };
      delete next[String(p.id)];
      return next;
    });
  };

  const needle = query.trim().toLowerCase();
  const filtered = needle
    ? products.filter((p) => `${p.name} ${p.brand} ${p.slug}`.toLowerCase().includes(needle))
    : products;

  const missingTitles = products.filter((p) => !p.seo_title || !p.seo_title.trim()).length;
  const missingDescriptions = products.filter((p) => !p.seo_description || !p.seo_description.trim()).length;
  const nonIndexable = products.filter((p) => p.indexable === false).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="SEO Management"
        subtitle="Site-wide search visibility settings and per-product SEO metadata. These are internal site audits — live Google indexing data requires Search Console access."
      />

      {/* Summary dashboard */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Total products" value={products.length} />
        <Stat label="Missing SEO titles" value={missingTitles} tone={missingTitles ? "warning" : "success"} />
        <Stat label="Missing SEO descriptions" value={missingDescriptions} tone={missingDescriptions ? "warning" : "success"} />
        <Stat label="Products excluded from indexing" value={nonIndexable} tone={nonIndexable ? "info" : "muted"} />
      </div>

      {/* Global SEO settings */}
      <SectionCard title="Global SEO Settings" description="Defaults used for pages that do not define their own metadata.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Default SEO title">
            <TextInput value={draft.browserTitle} onChange={(v) => set("browserTitle", v)} placeholder="RAES TECH — Smartphone Store Pakistan" />
          </Field>
          <Field label="Canonical domain" hint="Where the canonical browser-relative URLs point (e.g. https://raestech.store).">
            <TextInput value={draft.canonicalBase} onChange={(v) => set("canonicalBase", v)} placeholder="https://raestech.store" />
          </Field>
        </div>
        <Field label="Default meta description">
          <TextArea value={draft.defaultSeoDescription} onChange={(v) => set("defaultSeoDescription", v)} rows={2} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Default social sharing image" hint="Site-relative or absolute URL. Used as the Open Graph image when a page defines none.">
            <TextInput value={draft.socialImage || ""} onChange={(v) => set("socialImage", v)} placeholder="/images/concepts/apple-iphone-15-pro-1280.webp" />
          </Field>
          <Field label="Google Search Console verification" hint="The meta tag value (e.g. y2Sc-…). Keeps the google-site-verification tag in sync.">
            <TextInput value={draft.googleSearchConsoleVerification} onChange={(v) => set("googleSearchConsoleVerification", v)} placeholder="google-site-verification token" />
          </Field>
        </div>
        <Field label="robots.txt (reference)" hint="The served file lives at public/robots.txt and is deployed with the site. This copy is stored for auditing only.">
          <TextArea value={draft.robotsTxt} onChange={(v) => set("robotsTxt", v)} rows={5} />
        </Field>
        <div className="flex items-center gap-3">
          <Button onClick={saveGlobal}>
            {saved ? <Check className="mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
            {saved ? "Saved" : "Save global SEO settings"}
          </Button>
          {saved && <span className="text-sm text-emerald-600">Settings saved.</span>}
        </div>
      </SectionCard>

      {/* Product SEO editor */}
      <SectionCard
        title="Product SEO Editor"
        description="Edit SEO metadata per product. Empty fields fall back to auto-generated values on the live page."
      >
        <div className="mb-4 flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <TextInput value={query} onChange={setQuery} placeholder="Filter products…" className="max-w-sm" />
        </div>

        {filtered.length === 0 ? (
          <EmptyState title="No products match" description="Try a different search term." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="py-2 pr-3 font-medium">Product</th>
                  <th className="px-2 py-2 font-medium">SEO title</th>
                  <th className="px-2 py-2 font-medium">Meta description</th>
                  <th className="px-2 py-2 font-medium">Slug</th>
                  <th className="px-2 py-2 font-medium">Indexable</th>
                  <th className="py-2 pl-3 font-medium">Save</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => {
                  const e = getEdit(p.id);
                  const dirty = edits[String(p.id)] !== undefined;
                  const indexable = e.indexable !== undefined ? e.indexable : p.indexable !== false;
                  return (
                    <tr key={p.id} className="border-b align-top">
                      <td className="py-2 pr-3 font-medium">{p.name}</td>
                      <td className="px-2 py-2">
                        <TextInput value={e.seo_title !== undefined ? e.seo_title : p.seo_title} onChange={(v) => setEdit(p.id, { seo_title: v })} placeholder="Auto from product" />
                      </td>
                      <td className="px-2 py-2">
                        <TextArea value={e.seo_description !== undefined ? e.seo_description : p.seo_description} onChange={(v) => setEdit(p.id, { seo_description: v })} rows={2} />
                      </td>
                      <td className="px-2 py-2">
                        <TextInput value={e.slug !== undefined ? e.slug : p.slug} onChange={(v) => setEdit(p.id, { slug: v })} />
                      </td>
                      <td className="px-2 py-2">
                        <Toggle checked={indexable} onChange={(v) => setEdit(p.id, { indexable: v })} label="" />
                      </td>
                      <td className="py-2 pl-3">
                        <Button size="sm" variant={dirty ? "default" : "outline"} onClick={() => saveProduct(p)} disabled={!dirty}>
                          {dirty ? "Save" : "OK"}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
