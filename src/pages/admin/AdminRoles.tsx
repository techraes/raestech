import { useState } from "react";
import { Save, ShieldCheck } from "lucide-react";
import { useAuth } from "@/features/auth/AuthContext";
import { ADMIN_ROLES, ALL_PERMISSIONS, DEFAULT_ROLE_PERMISSIONS, roleLabel } from "@/features/auth/permissions";
import { useAudit } from "@/features/audit/useAudit";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SectionCard, PageHeader } from "./_ui";
import type { UserRole } from "@/types";

export function AdminRoles() {
  const { isSuperAdmin } = useAuth();
  const { log } = useAudit();
  const [matrix, setMatrix] = useState<Record<UserRole, string[]>>(() => {
    const base = { ...DEFAULT_ROLE_PERMISSIONS };
    for (const r of ADMIN_ROLES) base[r] = [...DEFAULT_ROLE_PERMISSIONS[r]];
    return base;
  });
  const [saved, setSaved] = useState(false);

  function toggle(role: UserRole, permission: string, on: boolean) {
    setMatrix((m) => {
      const next = on ? Array.from(new Set([...m[role], permission])) : m[role].filter((p) => p !== permission);
      return { ...m, [role]: next };
    });
    setSaved(false);
  }

  async function save() {
    await log({ action: "roles.publish", entity: "admin_permissions", newValue: matrix });
    if (supabase) {
      for (const role of ADMIN_ROLES) {
        await supabase.from("admin_permissions").upsert({ role, permissions: matrix[role] });
      }
    }
    setSaved(true);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Roles & Permissions"
        subtitle="Only a Super Admin can modify permissions. Measures are enforced server-side via RLS and privileged functions."
        actions={
          isSuperAdmin ? (
            <Button onClick={save} disabled={saved}>{saved ? "Saved" : <><Save className="h-4 w-4" /> Save roles</>}</Button>
          ) : (
            <Badge variant="outline"><ShieldCheck className="h-3 w-3" /> Read-only</Badge>
          )
        }
      />

      {!isSuperAdmin && (
        <p className="text-sm text-muted-foreground">You have view-only access to this module.</p>
      )}

      <SectionCard title="Permission matrix">
        <div className="overflow-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-muted-foreground">
                <th className="p-2">Role</th>
                {ALL_PERMISSIONS.map((p) => (
                  <th key={p} className="p-2 text-center font-medium">{p}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ADMIN_ROLES.map((role) => (
                <tr key={role} className="border-t align-middle">
                  <td className="p-2 font-medium">{roleLabel(role)}</td>
                  {ALL_PERMISSIONS.map((p) => {
                    const on = role === "super_admin" || matrix[role].includes(p);
                    return (
                      <td key={p} className="p-2 text-center">
                        <input
                          type="checkbox"
                          disabled={!isSuperAdmin || role === "super_admin"}
                          checked={on}
                          onChange={(e) => toggle(role, p, e.target.checked)}
                          className="h-4 w-4 accent-neutral-900"
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}
