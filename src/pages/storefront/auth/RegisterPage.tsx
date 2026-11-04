import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/features/auth/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

export function RegisterPage() {
  const { signUp, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  // Refs mirror the latest auth state so the async submit handler can observe
  // the session that Supabase propagates asynchronously after sign-up.
  const userRef = useRef(user);
  userRef.current = user;
  const authLoadingRef = useRef(authLoading);
  authLoadingRef.current = authLoading;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    const { error: err } = await signUp(email, password, name);
    setBusy(false);
    if (err) return setError(err);
    // When Supabase requires email confirmation, no session exists yet. Wait
    // briefly for a session to land (dev mode signs in immediately); if there
    // is still no user, prompt the customer to confirm their email.
    const deadline = Date.now() + 4000;
    while (Date.now() < deadline && authLoadingRef.current) {
      await new Promise((r) => setTimeout(r, 50));
    }
    if (userRef.current) {
      navigate("/account");
    } else {
      setNotice("Your account was created! Check your inbox for a confirmation link, then log in.");
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <Card>
        <CardContent className="p-8">
          <h1 className="text-2xl font-bold">Create your account</h1>
          <p className="mt-1 text-sm text-muted-foreground">Track orders, instalments and wishlist.</p>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div className="space-y-1.5"><Label>Full name</Label><Input required value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Email</Label><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Password</Label><Input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} /></div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            {notice && <p className="text-sm text-emerald-600">{notice}</p>}
            <Button type="submit" className="w-full" disabled={busy}>{busy ? "Creating…" : "Register"}</Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Already have an account? <Link to="/login" className="font-medium text-foreground hover:underline">Login</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
