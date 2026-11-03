import { useEffect, useState } from "react";
import { useAudit, type AuditEntryView } from "@/features/audit/useAudit";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState, PageHeader } from "./_ui";

export function AdminAudit() {
  const { list } = useAudit();
  const [entries, setEntries] = useState<AuditEntryView[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    list(150).then((rows) => {
      setEntries(rows);
      setLoading(false);
    });
  }, [list]);

  return (
    <div className="space-y-6">
      <PageHeader title="Admin Activity & Audit Log" subtitle="Every recorded admin action is listed. Audit records are append-only for non-admins." />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent actions</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading audit log…</p>
          ) : entries.length === 0 ? (
            <EmptyState title="No audit entries yet" description="Actions such as saving settings, publishing branding or managing payment methods will appear here." />
          ) : (
            <div className="max-h-[540px] overflow-auto rounded-lg border">
              <table className="w-full min-w-[640px] text-sm">
                <thead className="sticky top-0 bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="p-2">When</th>
                    <th className="p-2">Action</th>
                    <th className="p-2">Entity</th>
                    <th className="p-2">Actor</th>
                    <th className="p-2">Detail</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((e, i) => (
                    <tr key={e.id ?? i} className="border-t align-top">
                      <td className="p-2 whitespace-nowrap">{new Date(e.at).toLocaleString()}</td>
                      <td className="p-2"><Badge variant="outline">{e.action}</Badge></td>
                      <td className="p-2">{e.entity ?? "—"}</td>
                      <td className="p-2">{e.actorRole ?? "—"}</td>
                      <td className="p-2 text-xs text-muted-foreground">
                        {e.reason ?? ""}
                        {e.newValue ? <span className="block truncate max-w-[260px]">{JSON.stringify(e.newValue).slice(0, 160)}</span> : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
