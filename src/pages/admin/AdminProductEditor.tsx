import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Save, Trash2, Plus, ArrowLeft, ImagePlus, RotateCcw, ShieldCheck } from "lucide-react";
import { useProductStore } from "@/store/products";
import { getBrandNames } from "@/data/catalog";
import { useCan } from "@/features/auth/permissions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SectionCard, Field, TextInput, NumberInput, TextArea, Toggle, PageHeader } from "./_ui";
import { ProductImage } from "@/components/product-image";
import type { Product, ProductVariant } from "@/types";

function slugify(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

function emptyVariant(): ProductVariant {
  return {
    sku: "",
    storage: "",
    ram: "",
    colors: [],
    display: "",
    chipset: "",
    rear_camera: "",
    front_camera: "",
    battery: "",
    network: "",
    pta_status: "",
    condition: "new_box_packed",
    box_pack: "",
    listedPrice: 0,
    buyNowPrice: 0,
    instalmentTotal: 0,
    monthly: 0,
    priceEvidence: "",
    sourceUrl: "",
    confidence: "",
    priceCheckedDate: "",
    requiresVerification: false,
    notes: "",
    stock: 0,
  };
}

function emptyProduct(): Product {
  return {
    id: 0,
    slug: "",
    brand: "",
    model: "",
    name: "",
    description: "",
    category: "Smartphones",
    seo_title: "",
    seo_description: "",
    featured: false,
    new_arrival: false,
    bestseller: false,
    image: undefined,
    variants: [emptyVariant()],
  };
}

export function AdminProductEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const can = useCan();
  const products = useProductStore((s) => s.products);
  const upsertProduct = useProductStore((s) => s.upsertProduct);
  const deleteProduct = useProductStore((s) => s.deleteProduct);
  const nextId = useProductStore((s) => s.nextId);
  const resetProducts = useProductStore((s) => s.resetProducts);

  const isNew = !id || id === "new";

  const existing = useMemo(() => {
    if (isNew) return null;
    return products.find((p) => String(p.id) === String(id)) ?? null;
  }, [id, products, isNew]);

  const [draft, setDraft] = useState<Product>(() => (existing ? JSON.parse(JSON.stringify(existing)) : emptyProduct()));
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const brands = getBrandNames();

  if (!can("products")) {
    return (
      <div className="space-y-4">
        <PageHeader title="Edit product" subtitle="Super Admin / Product Manager only" />
        <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <ShieldCheck className="h-5 w-5" />
          You don't have permission to edit products. Contact a Super Admin to grant product-manager access.
        </div>
      </div>
    );
  }

  const set = (patch: Partial<Product>) => {
    setDraft((d) => ({ ...d, ...patch }));
    setSaved(false);
  };

  const setVariant = (index: number, patch: Partial<ProductVariant>) => {
    setDraft((d) => {
      const variants = d.variants.map((v, i) => (i === index ? { ...v, ...patch } : v));
      return { ...d, variants };
    });
  };

  const addVariant = () => {
    setDraft((d) => ({ ...d, variants: [...d.variants, emptyVariant()] }));
  };

  const removeVariant = (index: number) => {
    setDraft((d) => ({ ...d, variants: d.variants.filter((_, i) => i !== index) }));
  };

  const uploadImage = async (file: File | undefined | null) => {
    if (!file) return;
    try {
      const url = await readFileAsDataURL(file);
      set({ image: url });
    } catch {
      setError("Could not read the selected image file.");
    }
  };

  const save = () => {
    setSaved(false);
    setError("");
    const name = draft.name.trim();
    if (!name) {
      setError("Product name is required.");
      return;
    }
    if (!draft.model.trim()) {
      setError("Model is required.");
      return;
    }
    const withSku = draft.variants.map((v, i) => ({
      ...v,
      sku: v.sku.trim() || `${slugify(draft.brand || "product")}-${slugify(draft.model || "model")}-${i + 1}`,
      colors: Array.isArray(v.colors) ? v.colors.map((c) => c.trim()).filter(Boolean) : [],
    }));
    const product: Product = {
      ...draft,
      name,
      slug: draft.slug.trim() || slugify(name),
      variants: withSku,
    };
    const savedId = upsertProduct(product);
    // Keep the local draft in sync with the persisted id so saving again updates
    // the same product (instead of creating a new one).
    setDraft((d) => ({ ...d, id: savedId }));
    setSaved(true);
    if (isNew && savedId) navigate(`/admin/products/${savedId}/edit`, { replace: true });
  };

  const remove = () => {
    if (isNew) return;
    if (window.confirm(`Delete "${draft.name}" and all its variants? This cannot be undone.`)) {
      deleteProduct(draft.id);
      navigate("/admin/products");
    }
  };

  const pricesOk = draft.variants.every((v) => Number.isFinite(v.listedPrice) && v.listedPrice >= 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title={isNew ? "New product" : `Edit — ${draft.name}`}
        subtitle="Fully customisable product (WooCommerce-style). Super Admin has 100% modification rights — every field, variant, price, stock and image can be changed. Changes apply to the whole storefront instantly."
        actions={
          <div className="flex items-center gap-2">
            <Button asChild variant="outline">
              <Link to="/admin/products"><ArrowLeft className="h-4 w-4" /> Back</Link>
            </Button>
            {!isNew && (
              <Button variant="outline" className="text-red-600" onClick={remove}>
                <Trash2 className="h-4 w-4" /> Delete
              </Button>
            )}
            <Button onClick={save} disabled={saved || !pricesOk}>
              <Save className="h-4 w-4" /> {saved ? "Saved ✓" : "Save product"}
            </Button>
          </div>
        }
      />

      {error && <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}
      {!pricesOk && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          All listed prices must be valid, non-negative numbers before saving.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          {/* ---- Core info ---- */}
          <SectionCard title="General information" description="Name, brand, model and category — used across the storefront and SEO.">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Product name *">
                <TextInput value={draft.name} onChange={(v) => set({ name: v })} placeholder="e.g. iPhone 15 Pro Max" />
              </Field>
              <Field label="Brand">
                <Input value={draft.brand} onChange={(e) => set({ brand: e.target.value })} list="brand-list" placeholder="e.g. Apple" />
                <datalist id="brand-list">
                  {brands.map((b) => <option key={b} value={b} />)}
                </datalist>
              </Field>
              <Field label="Model">
                <TextInput value={draft.model} onChange={(v) => set({ model: v })} placeholder="e.g. iPhone 15 Pro Max" />
              </Field>
              <Field label="Slug (URL)">
                <TextInput value={draft.slug} onChange={(v) => set({ slug: v })} placeholder="auto-generated from name" />
              </Field>
              <Field label="Category">
                <TextInput value={draft.category} onChange={(v) => set({ category: v })} placeholder="e.g. Smartphones" />
              </Field>
            </div>
            <Field label="Description">
              <TextArea value={draft.description} onChange={(v) => set({ description: v })} rows={4} placeholder="Short marketing description shown on the product page." />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="SEO title">
                <TextInput value={draft.seo_title} onChange={(v) => set({ seo_title: v })} />
              </Field>
              <Field label="SEO description">
                <TextInput value={draft.seo_description} onChange={(v) => set({ seo_description: v })} />
              </Field>
            </div>
          </SectionCard>

          {/* ---- Availability flags ---- */}
          <SectionCard title="Visibility & promotion" description="Control where this product appears on the storefront.">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border p-4"><Toggle checked={draft.featured} onChange={(v) => set({ featured: v })} label="Featured" /></div>
              <div className="rounded-lg border p-4"><Toggle checked={draft.new_arrival} onChange={(v) => set({ new_arrival: v })} label="New arrival" /></div>
              <div className="rounded-lg border p-4"><Toggle checked={draft.bestseller} onChange={(v) => set({ bestseller: v })} label="Best seller" /></div>
            </div>
          </SectionCard>

          {/* ---- Variants ---- */}
          <SectionCard
            title="Variants (options)"
            description="Each variant is a sellable stock-keeping unit (SKU) with its own storage, specs, prices and stock."
          >
            <div className="space-y-4">
              {draft.variants.map((v, idx) => (
                <div key={idx} className="rounded-xl border p-4">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">Variant {idx + 1}</Badge>
                      {v.sku && <Badge variant="outline">{v.sku}</Badge>}
                    </div>
                    {draft.variants.length > 1 && (
                      <Button type="button" variant="ghost" size="sm" className="text-red-600" onClick={() => removeVariant(idx)}>
                        <Trash2 className="h-4 w-4" /> Remove
                      </Button>
                    )}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <Field label="SKU"><TextInput value={v.sku} onChange={(val) => setVariant(idx, { sku: val })} placeholder="auto-generated" /></Field>
                    <Field label="Storage"><TextInput value={v.storage} onChange={(val) => setVariant(idx, { storage: val })} placeholder="e.g. 256GB" /></Field>
                    <Field label="RAM"><TextInput value={v.ram} onChange={(val) => setVariant(idx, { ram: val })} placeholder="e.g. 8GB" /></Field>
                    <Field label="Colours (comma separated)">
                      <TextInput value={(v.colors || []).join(", ")} onChange={(val) => setVariant(idx, { colors: val.split(",") })} placeholder="e.g. Black, Natural Titanium" />
                    </Field>
                    <Field label="Display"><TextInput value={v.display} onChange={(val) => setVariant(idx, { display: val })} /></Field>
                    <Field label="Chipset"><TextInput value={v.chipset} onChange={(val) => setVariant(idx, { chipset: val })} /></Field>
                    <Field label="Rear camera"><TextInput value={v.rear_camera} onChange={(val) => setVariant(idx, { rear_camera: val })} /></Field>
                    <Field label="Front camera"><TextInput value={v.front_camera} onChange={(val) => setVariant(idx, { front_camera: val })} /></Field>
                    <Field label="Battery"><TextInput value={v.battery} onChange={(val) => setVariant(idx, { battery: val })} /></Field>
                    <Field label="Network"><TextInput value={v.network} onChange={(val) => setVariant(idx, { network: val })} /></Field>
                    <Field label="PTA status"><TextInput value={v.pta_status} onChange={(val) => setVariant(idx, { pta_status: val })} /></Field>
                    <Field label="Condition"><TextInput value={v.condition} onChange={(val) => setVariant(idx, { condition: val })} /></Field>
                    <Field label="Box pack"><TextInput value={v.box_pack} onChange={(val) => setVariant(idx, { box_pack: val })} /></Field>
                    <Field label="Stock">
                      <NumberInput value={v.stock} onChange={(val) => setVariant(idx, { stock: val })} />
                    </Field>
                  </div>

                  <div className="mt-3 rounded-lg border border-dashed p-3">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Pricing (PKR)</p>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <Field label="Listed price">
                        <NumberInput value={v.listedPrice} onChange={(val) => setVariant(idx, { listedPrice: val })} />
                      </Field>
                      <Field label="Buy Now price (10% off)">
                        <NumberInput value={v.buyNowPrice} onChange={(val) => setVariant(idx, { buyNowPrice: val })} />
                      </Field>
                      <Field label="Instalment total">
                        <NumberInput value={v.instalmentTotal} onChange={(val) => setVariant(idx, { instalmentTotal: val })} />
                      </Field>
                      <Field label="Monthly payment">
                        <NumberInput value={v.monthly} onChange={(val) => setVariant(idx, { monthly: val })} />
                      </Field>
                    </div>
                    <Button type="button" variant="outline" size="sm" className="mt-3"
                      onClick={() => {
                        const listed = v.listedPrice;
                        setVariant(idx, {
                          buyNowPrice: Math.round(listed * 0.9),
                          instalmentTotal: listed,
                        });
                      }}>
                      Auto-fill from listed price
                    </Button>
                  </div>

                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <Field label="Notes"><TextArea value={v.notes} onChange={(val) => setVariant(idx, { notes: val })} rows={2} /></Field>
                    <Field label="Source URL"><TextInput value={v.sourceUrl} onChange={(val) => setVariant(idx, { sourceUrl: val })} /></Field>
                  </div>
                </div>
              ))}
            </div>

            <Button type="button" variant="outline" onClick={addVariant} className="mt-3">
              <Plus className="h-4 w-4" /> Add variant
            </Button>
          </SectionCard>
        </div>

        {/* ---- Sidebar: image + actions ---- */}
        <div className="space-y-6">
          <SectionCard title="Product image" description="Upload a real photo (JPG/PNG) or leave empty to use the generated SVG mockup.">
            <div className="aspect-square overflow-hidden rounded-xl border bg-muted">
              {draft.image ? (
                <img src={draft.image} alt={draft.name} className="h-full w-full object-cover" />
              ) : (
                <ProductImage product={draft} className="h-full w-full" />
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" asChild>
                <label className="cursor-pointer">
                  <ImagePlus className="h-4 w-4" /> Upload image
                  <input type="file" accept=".jpg,.jpeg,.png,.webp" className="hidden"
                    onChange={(e) => uploadImage(e.target.files?.[0])} />
                </label>
              </Button>
              {draft.image && (
                <Button type="button" variant="ghost" size="sm" onClick={() => set({ image: undefined })}>
                  Remove image
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              The uploaded image is stored as a data URL in your local product catalogue. For permanent hosting, prefer uploading to your image host.
            </p>
          </SectionCard>

          <SectionCard title="Danger zone">
            <div className="flex flex-col gap-2">
              <Button type="button" variant="outline" className="text-amber-700" onClick={() => { if (window.confirm("Restore the entire catalogue to the factory seed? All admin edits will be lost.")) resetProducts(); }}>
                <RotateCcw className="h-4 w-4" /> Reset catalogue to seed
              </Button>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
