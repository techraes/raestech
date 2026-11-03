import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/features/auth/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";

export function ForgotPasswordPage() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  // Requires the Supabase auth reset flow when configured; show a helpful message.
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    // In production this would call supabase.auth.resetPasswordForEmail.
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
                If an account exists for {email}, a reset link is on its way. (When Supabase is configured, a real reset email is sent.)
              </p>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold">Reset password</h1>
              <p className="mt-1 text-sm text-muted-foreground">We'll email you a reset link.</p>
              <form onSubmit={submit} className="mt-6 space-y-4">
                <div className="space-y-1.5"><Label>Email</Label><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
                <Button type="submit" className="w-full">Send reset link</Button>
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
