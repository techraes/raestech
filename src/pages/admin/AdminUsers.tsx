import { useCallback, useEffect, useMemo, useState } from "react";
import { Search, ShieldCheck, UserX, UserCheck, RefreshCw } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { useAuth } from "@/features/auth/AuthContext";
import { ADMIN_ROLES, roleLabel } from "@/features/auth/permissions";
import type { UserRole } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader, EmptyState, Stat } from "./_ui";

interface ProfileRow {
  id: string;
  email?: string | null;
  full_name?: string | null;
  phone?: string | null;
  created_at?: string;
}
interface RoleRow {
  user_id: string;
  role: UserRole;
}

const PAGE_SIZE = 25;
const ROLE_TONES: Record<string, "success" | "secondary" | "outline" | "warning" | "destructive"> = {
  super_admin: "destructive",
  finance_manager: "warning",
  product_manager: "success",
  content_manager: "success",
  order_manager: "success",
  payment_verifier: "secondary",
  instalment_reviewer: "secondary",
  support_staff: "secondary",
  customer: "outline",
};

export function AdminUsers() {
  const { user: me, isSuperAdmin } = useAuth();
  // Role changes are server-gated: only a Super Admin may assign roles.
  // The RPC `assign_user_role` and the RLS policy enforce this server-side;
  // this check is defense-in-depth in the UI.
  const canManageRoles = isSuperAdmin;

  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [rolesMap, setRolesMap] = useState<Record<string, UserRole>>({});
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all");
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setError("Supabase is not configured; user directory is unavailable.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const { data: p, error: pErr } = await supabase!
        .from("profiles")
        .select("id,email,full_name,phone,created_at")
        .order("created_at", { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
      if (pErr) throw pErr;

      const { data: r, error: rErr } = await supabase!.from("user_roles").select("user_id,role");
      if (rErr) throw rErr;

      const map: Record<string, UserRole> = {};
      for (const row of (r as RoleRow[]) || []) map[row.user_id] = row.role;
      setProfiles((p as ProfileRow[]) || []);
      setRolesMap(map);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load users.");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { void load(); }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return profiles.filter((p) => {
      const role = rolesMap[p.id] || "customer";
      if (roleFilter !== "all" && role !== roleFilter) return false;
      if (!q) return true;
      return (
        (p.full_name || "").toLowerCase().includes(q) ||
        (p.email || "").toLowerCase().includes(q)
      );
    });
  }, [profiles, rolesMap, query, roleFilter]);

  // Server-side total of Super Admins across ALL rows (not just the current
  // page) — used to block demoting the very last Super Admin.
  const [superAdminTotal, setSuperAdminTotal] = useState<number>(-1);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    void supabase!
      .from("user_roles")
      .select("user_id", { count: "exact", head: true })
      .eq("role", "super_admin")
      .then(({ count }) => setSuperAdminTotal(count ?? 0));
  }, []);

  async function setRole(userId: string, role: UserRole) {
    if (!canManageRoles) return;
    const current = rolesMap[userId] || "customer";
    if (current === "super_admin" && role !== "super_admin" && superAdminTotal === 1) {
      window.alert("Cannot demote the last active Super Admin.");
      return;
    }
    setBusyId(userId);
    try {
      // Go through the SECURITY DEFINER RPC. The browser client never writes
      // user_roles directly — the RPC (and the RLS policy) enforce that only a
      // Super Admin can change roles, and that the last Super Admin cannot be
      // demoted. This closes the direct-upsert escalation path.
      const { error } = await supabase!.rpc("assign_user_role", {
        p_user_id: userId,
        p_role: role,
      });
      if (error) throw error;
      setRolesMap((m) => ({ ...m, [userId]: role }));
    } catch (e) {
      window.alert("Failed to update role: " + (e instanceof Error ? e.message : "unknown error"));
    } finally {
      setBusyId(null);
    }
  }

  async function toggleStatus(userId: string, action: "suspend" | "reactivate") {
    window.alert(
      `Account ${action} is a server-side operation. ` +
        "It requires a service-role edge function (or Dashboard → Auth → Users) " +
        "to block the identity; the client SDK cannot suspend an auth user securely."
    );
  }

  async function deleteUser(userId: string) {
    window.alert(
      "Deleting an account requires a service-role edge function (auth.admin.deleteUser) " +
        "and a policy to anonymise the profile while retaining order/payment rows. " +
        "It is intentionally not exposed from the browser client."
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        subtitle="Directory of customer and staff accounts. Role changes go through the server-side assign_user_role RPC (writes to user_roles are Super-Admin-only via RLS). Sensitive account actions require server-side service-role functions."
        actions={
          <Button variant="outline" size="sm" onClick={() => void load()}>
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Total profiles" value={profiles.length} />
        <Stat label="Super Admins" value={superAdminTotal >= 0 ? superAdminTotal : "…"} tone="destructive" />
        <Stat label="Showing" value={filtered.length} tone="info" />
      </div>

      <Card>
        <CardContent className="space-y-4 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search by name or email"
                value={query}
                onChange={(e) => { setQuery(e.target.value); setPage(0); }}
              />
            </div>
            <select
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              value={roleFilter}
              onChange={(e) => { setRoleFilter(e.target.value as UserRole | "all"); setPage(0); }}
            >
              <option value="all">All roles</option>
              {ADMIN_ROLES.map((r) => <option key={r} value={r}>{roleLabel(r)}</option>)}
              <option value="customer">Customer</option>
            </select>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {loading && <p className="text-sm text-muted-foreground">Loading users…</p>}

          {!loading && !error && filtered.length === 0 && (
            <EmptyState
              title="No users found"
              description="No profile rows match the current search/filter. Profiles are created when a user signs in or is provisioned."
            />
          )}

          <div className="space-y-2">
            {filtered.map((p) => {
              const role = rolesMap[p.id] || "customer";
              const isMe = me?.id === p.id;
              return (
                <div key={p.id} className="rounded-xl border bg-card p-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <button
                      type="button"
                      className="text-left"
                      onClick={() => setExpandedId((x) => (x === p.id ? null : p.id))}
                    >
                      <div className="text-sm font-semibold">{p.full_name || "(no name)"} {isMe && <span className="text-xs text-muted-foreground">(you)</span>}</div>
                      <div className="text-xs text-muted-foreground">{p.email || "no email on profile"}</div>
                    </button>
                    <div className="flex items-center gap-2">
                      <Badge variant={ROLE_TONES[role] || "outline"}>
                        <ShieldCheck className="mr-1 h-3 w-3" /> {roleLabel(role)}
                      </Badge>
                      {canManageRoles && !isMe && (
                        <select
                          className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                          value={role}
                          disabled={busyId === p.id}
                          onChange={(e) => void setRole(p.id, e.target.value as UserRole)}
                          aria-label={`Change role for ${p.email || p.id}`}
                        >
                          {(["customer" as UserRole, ...ADMIN_ROLES]).map((r) => <option key={r} value={r}>{roleLabel(r)}</option>)}
                        </select>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => setExpandedId((x) => (x === p.id ? null : p.id))}>
                        {expandedId === p.id ? "Close" : "Details"}
                      </Button>
                    </div>
                  </div>

                  {expandedId === p.id && (
                    <div className="mt-3 space-y-3 border-t pt-3 text-sm">
                      <dl className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
                        <div><dt className="text-xs text-muted-foreground">Profile ID</dt><dd className="font-mono text-xs">{p.id}</dd></div>
                        <div><dt className="text-xs text-muted-foreground">Phone</dt><dd>{p.phone || "—"}</dd></div>
                        <div><dt className="text-xs text-muted-foreground">Signed up</dt><dd>{p.created_at ? new Date(p.created_at).toLocaleString() : "—"}</dd></div>
                        <div><dt className="text-xs text-muted-foreground">Role</dt><dd>{roleLabel(role)}</dd></div>
                      </dl>
                      <div className="flex flex-wrap gap-2 border-t pt-3">
                        <Button size="sm" variant="outline" onClick={() => toggleStatus(p.id, "suspend")}>
                          <UserX className="h-4 w-4" /> Suspend
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => toggleStatus(p.id, "reactivate")}>
                          <UserCheck className="h-4 w-4" /> Reactivate
                        </Button>
                        <Button size="sm" variant="outline" className="text-red-600" onClick={() => deleteUser(p.id)}>
                          Delete
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Suspend/reactivate/delete need a service-role edge function (server side); they are not run from the browser client to keep privileged keys server-side.
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-2">
            <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage((x) => Math.max(0, x - 1))}>
              Previous
            </Button>
            <span className="text-xs text-muted-foreground">Page {page + 1}</span>
            <Button size="sm" variant="outline" disabled={filtered.length < PAGE_SIZE} onClick={() => setPage((x) => x + 1)}>
              Next
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
