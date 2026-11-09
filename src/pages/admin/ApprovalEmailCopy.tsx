import { useCallback, useEffect, useRef, useState } from "react";
import {
  Copy, Check, Mail, Loader2, User, MessageSquare, AlertTriangle, ClipboardCopy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getEmailJobState, markOrderEmailManualSent, type OrderEmailJob } from "@/lib/auth-config";
import {
  buildOrderApprovalMessage,
  buildInstalmentApprovalMessage,
  type ApprovalMessage,
} from "@/lib/order-approved-email";

type CopyTarget = "recipient" | "subject" | "message" | "all";

/**
 * Admin panel shown when an automatic order-approval email has FAILED for an
 * approved order / instalment application. It lets an admin:
 *  - preview the exact confirmation email (recipient, subject, body),
 *  - copy the recipient / subject / message individually or all at once, and
 *  - record that they sent it manually (so later auto-retries don't duplicate
 *    the email). The original automatic failure stays visible in history.
 */
export function ApprovalEmailCopyPanel({
  kind,
  subjectId,
  approved,
}: {
  kind: "order" | "instalment";
  subjectId: string;
  approved: boolean;
}) {
  const [job, setJob] = useState<OrderEmailJob | null>(null);
  const [loadingJob, setLoadingJob] = useState(true);
  const [msg, setMsg] = useState<ApprovalMessage | null>(null);
  const [building, setBuilding] = useState(false);
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState<CopyTarget | null>(null);
  const [marking, setMarking] = useState(false);
  const [markError, setMarkError] = useState("");
  const [clipFailed, setClipFailed] = useState(false);
  const textRef = useRef<HTMLTextAreaElement | null>(null);

  const refresh = useCallback(() => {
    let active = true;
    setLoadingJob(true);
    void (async () => {
      const j = await getEmailJobState(kind, subjectId);
      if (active) {
        setJob(j);
        setLoadingJob(false);
      }
    })();
    return () => { active = false; };
  }, [kind, subjectId]);

  useEffect(refresh, [refresh]);

  const failed = !!job && job.status === "failed" && !job.manually_sent_at;
  const manuallySent = !!job?.manually_sent_at;

  const openPreview = useCallback(async () => {
    setOpen(true);
    setBuilding(true);
    setClipFailed(false);
    try {
      const built =
        kind === "order"
          ? await buildOrderApprovalMessage(subjectId)
          : await buildInstalmentApprovalMessage(subjectId);
      setMsg(built);
    } finally {
      setBuilding(false);
    }
  }, [kind, subjectId]);

  async function copyText(value: string, target: CopyTarget) {
    if (!value) {
      setCopied(null);
      return;
    }
    try {
      await navigator.clipboard.writeText(value);
      setClipFailed(false);
    } catch {
      // Clipboard API unavailable — keep the text selectable for manual copy.
      setClipFailed(true);
      // Try to select the plain-text field as a fallback.
      window.setTimeout(() => {
        textRef.current?.focus();
        textRef.current?.select();
      }, 0);
    }
    setCopied(target);
    window.setTimeout(() => setCopied(null), 1600);
  }

  async function markSent() {
    setMarking(true);
    setMarkError("");
    const res = await markOrderEmailManualSent(subjectId);
    setMarking(false);
    if (!res.ok) {
      setMarkError(res.error ?? "Could not record manual send.");
      return;
    }
    refresh();
  }

  if (loadingJob) {
    return <p className="text-xs text-muted-foreground">Checking email job…</p>;
  }
  if (!job) return null;

  // Only for approved records whose automatic confirmation failed and hasn't
  // already been sent manually.
  if (!approved || !failed) return null;

  return (
    <div className="rounded-lg border border-red-200 bg-red-50/40 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-start gap-2">
          <AlertTriangle className="mt-0.5 h-4 w-4 text-red-600" />
          <div>
            <p className="text-sm font-semibold text-red-700">Confirmation email failed</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              The automatic email could not be sent. You can review and copy it, or
              mark it as sent after sending it from your mailbox.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => void openPreview()}>
            <ClipboardCopy className="mr-1.5 h-3.5 w-3.5" /> Copy confirmation email
          </Button>
          <Button size="sm" variant="ghost" disabled={marking} onClick={() => void markSent()}>
            {marking ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Check className="mr-1.5 h-3.5 w-3.5" />}
            Mark as sent manually
          </Button>
        </div>
      </div>

      {markError && <p className="mt-2 text-xs text-red-600">{markError}</p>}

      {manuallySent && (
        <p className="mt-2 text-xs font-medium text-emerald-700">
          Marked as sent manually — automatic retries will not send a duplicate.
        </p>
      )}

      {open && (
        <div className="mt-3 space-y-3 rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold">Confirmation email preview</p>
            <div className="flex flex-wrap gap-1.5">
              <Button size="sm" variant="ghost" disabled={building || !msg?.recipient} onClick={() => void copyText(msg?.recipient ?? "", "recipient")}>
                {copied === "recipient" ? <Check className="mr-1 h-3.5 w-3.5 text-emerald-600" /> : <User className="mr-1 h-3.5 w-3.5" />}
                Copy recipient
              </Button>
              <Button size="sm" variant="ghost" disabled={building || !msg} onClick={() => void copyText(msg?.subject ?? "", "subject")}>
                {copied === "subject" ? <Check className="mr-1 h-3.5 w-3.5 text-emerald-600" /> : <Mail className="mr-1 h-3.5 w-3.5" />}
                Copy subject
              </Button>
              <Button size="sm" variant="ghost" disabled={building || !msg} onClick={() => void copyText(msg?.bodyText ?? "", "message")}>
                {copied === "message" ? <Check className="mr-1 h-3.5 w-3.5 text-emerald-600" /> : <MessageSquare className="mr-1 h-3.5 w-3.5" />}
                Copy message
              </Button>
              <Button size="sm" variant="default" disabled={building || !msg} onClick={() => void copyText(`${msg?.subject}\n\n${msg?.bodyText}`, "all")}>
                {copied === "all" ? <Check className="mr-1 h-3.5 w-3.5" /> : <Copy className="mr-1 h-3.5 w-3.5" />}
                Copy all
              </Button>
            </div>
          </div>

          {building ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Building message…
            </p>
          ) : msg ? (
            <div className="space-y-3">
              <div className="grid gap-2 sm:grid-cols-2">
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Recipient</p>
                  <p className="text-sm font-medium text-foreground">{msg.recipient || "—"}</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Subject</p>
                  <p className="text-sm font-medium text-foreground">{msg.subject}</p>
                </div>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Message body (plain text, for copying)</p>
                <textarea
                  ref={textRef}
                  readOnly
                  value={msg.bodyText}
                  rows={10}
                  className="mt-1 w-full rounded-lg border bg-muted/30 p-3 font-mono text-xs text-foreground"
                />
                <p className="mt-1 text-[11px] text-muted-foreground">
                  HTML version below renders the same content for preview.
                </p>
                <div
                  className="mt-2 max-h-64 overflow-auto rounded-lg border bg-white/60 p-3 text-sm text-foreground"
                  dangerouslySetInnerHTML={{ __html: msg.body }}
                />
              </div>
              {clipFailed && (
                <p className="text-xs text-amber-700">
                  Clipboard access was blocked — select the text above to copy manually.
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Could not build the message.</p>
          )}
        </div>
      )}
    </div>
  );
}
