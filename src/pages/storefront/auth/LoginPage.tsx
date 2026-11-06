import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/features/auth/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

export function LoginPage() {
  const { signIn, googleSignIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation() as { state?: { from?: string } };
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const { error: err } = await signIn(email, password);
    setBusy(false);
    if (err) {
      const lower = err.toLowerCase();
      if (/invalid login|incorrect|not found|credentials/i.test(lower)) {
        return setError(
          "We couldn't sign you in with those credentials. Double-check your email and password. If you are an administrator, make sure your admin account has been provisioned (see the deployment guide)."
        );
      }
      return setError(err);
    }
    navigate(location.state?.from ?? "/account", { replace: true });
  }

  return (
    <div className="mx-auto max-w-md">
      <Card>
        <CardContent className="p-8">
          <h1 className="text-2xl font-bold">Welcome back</h1>
          <p className="mt-1 text-sm text-muted-foreground">Log in to your RAES TECH account.</p>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div className="space-y-1.5"><Label>Email</Label><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Password</Label><Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} /></div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" className="w-full" disabled={busy}>{busy ? "Signing in…" : "Login"}</Button>
          </form>

          <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" />
            <span>or</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              setError("");
              const { error: err } = await googleSignIn();
              setBusy(false);
              if (err) setError(err);
            }}
          >
            {busy ? "Redirecting to Google…" : "Continue with Google"}
          </Button>

          <div className="mt-4 flex items-center justify-between text-sm">
            <Link to="/forgot-password" className="text-muted-foreground hover:underline">Forgot password?</Link>
            <Link to="/register" className="font-medium hover:underline">Create account</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
