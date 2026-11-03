import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, AlertCircle } from "lucide-react";

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setError("Password reset is unavailable because authentication is not configured on this deployment.");
      setChecking(false);
      return;
    }
    // Supabase restores the session (with recovery tokens) from the email link.
    supabase!.auth.getSession().finally(() => setChecking(false));
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setBusy(true);
    const { error: updErr } = await supabase!.auth.updateUser({ password });
    setBusy(false);
    if (updErr) {
      setError(updErr.message || "Could not update your password. Please try again.");
      return;
    }
    setDone(true);
    setTimeout(() => navigate("/login", { replace: true }), 1600);
  }

  if (checking) {
    return (
      <div className="mx-auto max-w-md">
        <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">Verifying your reset link…</CardContent></Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md">
      <Card>
        <CardContent className="p-8">
          {done ? (
            <div className="text-center">
              <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-emerald-600" />
              <h1 className="text-xl font-bold">Password updated</h1>
              <p className="mt-2 text-sm text-muted-foreground">Redirecting you to login…</p>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold">Set a new password</h1>
              <p className="mt-1 text-sm text-muted-foreground">Choose a strong password for your account.</p>
              <form onSubmit={submit} className="mt-6 space-y-4">
                <div className="space-y-1.5">
                  <Label>New password</Label>
                  <Input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Confirm new password</Label>
                  <Input type="password" required minLength={6} value={confirm} onChange={(e) => setConfirm(e.target.value)} />
                </div>
                {error && (
                  <p className="flex items-start gap-1.5 text-sm text-red-600">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
                  </p>
                )}
                <Button type="submit" className="w-full" disabled={busy}>
                  {busy ? "Updating…" : "Update password"}
                </Button>
              </form>
              <p className="mt-4 text-center text-sm">
                <Link to="/login" className="text-muted-foreground hover:underline">Back to login</Link>
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
