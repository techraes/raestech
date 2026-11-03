import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/features/auth/AuthContext";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, AlertCircle } from "lucide-react";

export function ForgotPasswordPage() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);

    if (!isSupabaseConfigured) {
      // No backend configured. We cannot send a real reset email; surface a
      // clear, honest error rather than pretending success.
      setError(
        "Password reset is unavailable because authentication is not configured on this deployment. Please contact support."
      );
      setBusy(false);
      return;
    }

    const { error: resetErr } = await supabase!.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setBusy(false);

    if (resetErr) {
      setError(resetErr.message || "Could not send a reset email. Please try again.");
      return;
    }
    setSent(true);
  }

  return (
    <div className="mx-auto max-w-md">
      <Card>
        <CardContent className="p-8">
          {sent ? (
            <div className="text-center">
              <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-emerald-600" />
              <h1 className="text-xl font-bold">Check your email</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                If an account exists for {email}, a password reset link is on its way.
              </p>
              <Button asChild variant="outline" className="mt-5">
                <Link to="/login">Back to login</Link>
              </Button>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold">Reset password</h1>
              <p className="mt-1 text-sm text-muted-foreground">We'll email you a secure reset link.</p>
              <form onSubmit={submit} className="mt-6 space-y-4">
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                {error && (
                  <p className="flex items-start gap-1.5 text-sm text-red-600">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
                  </p>
                )}
                <Button type="submit" className="w-full" disabled={busy}>
                  {busy ? "Sending…" : "Send reset link"}
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
