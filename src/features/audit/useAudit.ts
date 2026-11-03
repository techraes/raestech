import { supabase } from "@/lib/supabase";
import { useAuth } from "@/features/auth/AuthContext";

const LOCAL_KEY = "raes.audit.v1";

export interface AuditEntryInput {
  action: string;
  entity?: string;
  recordId?: string;
  previousValue?: unknown;
  newValue?: unknown;
  reason?: string;
}

export interface AuditEntryView {
  id?: string;
  actor?: string;
  actorRole?: string;
  action: string;
  entity?: string;
  recordId?: string;
  previousValue?: unknown;
  newValue?: unknown;
  reason?: string;
  at: string;
}

function readLocal(): AuditEntryView[] {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]") as AuditEntryView[];
  } catch {
    return [];
  }
}

function pushLocal(entry: AuditEntryView) {
  const list = [entry, ...readLocal()].slice(0, 500);
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}

/**
 * Audit logger. In local/dev mode entries are kept in a localStorage ring;
 * when Supabase is configured they are written to `admin_audit_log`
 * (server-side, append-only for non-admins).
 */
export function useAudit() {
  const { user } = useAuth();

  return {
    async log(input: AuditEntryInput) {
      const entry: AuditEntryView = {
        ...input,
        at: new Date().toISOString(),
        actor: user?.id ?? undefined,
        actorRole: user?.role ?? undefined,
      };
      if (!supabase) {
        pushLocal(entry);
        return;
      }
      await supabase.from("admin_audit_log").insert({
        actor_id: user?.id ?? null,
        action: input.action,
        entity: input.entity ?? null,
        record_id: input.recordId ?? null,
        prior_value: input.previousValue ?? null,
        new_value: input.newValue ?? null,
        reason: input.reason ?? null,
      });
    },

    async list(limit = 100): Promise<AuditEntryView[]> {
      if (!supabase) return readLocal();
      const { data, error } = await supabase
        .from("admin_audit_log")
        .select("id, action, entity, record_id, prior_value, new_value, reason, created_at, actor_id")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error || !data) return [];
      return (data as Array<Record<string, unknown>>).map((r) => ({
        id: r.id as string,
        action: r.action as string,
        entity: (r.entity as string) || undefined,
        recordId: (r.record_id as string) || undefined,
        previousValue: r.prior_value,
        newValue: r.new_value,
        reason: (r.reason as string) || undefined,
        at: r.created_at as string,
      }));
    },
  };
}
