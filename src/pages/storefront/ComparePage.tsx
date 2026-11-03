import { useState } from "react";
import { Link } from "react-router-dom";
import { Trash2, Plus } from "lucide-react";
import { allProducts } from "@/data/catalog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatPKR } from "@/lib/utils";

export function ComparePage() {
  const [selected, setSelected] = useState<number[]>([allProducts[0]?.id, allProducts[1]?.id].filter(Boolean));
  const products = allProducts.filter((p) => selected.includes(p.id));
  const options = allProducts.filter((p) => !selected.includes(p.id));

  function add(id: number) {
    if (selected.length < 4) setSelected((prev) => [...prev, id]);
  }
  function remove(id: number) {
    setSelected((prev) => prev.filter((x) => x !== id));
  }

  const rows = [
    { label: "Brand", get: (p: any) => p.brand },
    { label: "Model", get: (p: any) => p.model },
    { label: "Storage", get: (p: any) => p.variants[0]?.storage },
    { label: "RAM", get: (p: any) => p.variants[0]?.ram },
    { label: "Display", get: (p: any) => p.variants[0]?.display },
    { label: "Chipset", get: (p: any) => p.variants[0]?.chipset },
    { label: "Battery", get: (p: any) => p.variants[0]?.battery },
    { label: "Network", get: (p: any) => p.variants[0]?.network },
    { label: "List price", get: (p: any) => formatPKR(p.variants[0]?.listedPrice) },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold sm:text-3xl">Compare Phones</h1>

      <div className="flex flex-wrap items-center gap-2">
        {options.slice(0, 8).map((p) => (
          <Button key={p.id} size="sm" variant="outline" onClick={() => add(p.id)}>
            <Plus className="h-3.5 w-3.5" /> {p.model}
          </Button>
        ))}
      </div>

      {products.length === 0 ? (
        <p className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">Add phones to compare.</p>
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="w-40 border-b p-3 text-left font-medium text-muted-foreground">Feature</th>
                {products.map((p) => (
                  <th key={p.id} className="border-b p-3 text-left">
                    <div className="flex items-start justify-between gap-2">
                      <Link to={`/product/${p.slug}`} className="line-clamp-2 font-semibold hover:underline">{p.name}</Link>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-red-600" onClick={() => remove(p.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.label}>
                  <td className="border-b p-3 font-medium text-muted-foreground">{row.label}</td>
                  {products.map((p) => (
                    <td key={p.id} className="border-b p-3">{row.get(p) || "—"}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
