import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/features/auth/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { GoogleSignInButton } from "@/components/google-sign-in-button";
import { Eye, EyeOff, Mail } from "lucide-react";
import { validatePassword } from "@/lib/password";

const OTP_LENGTH = 6;
const RESEND_COOLDOWN_SEC = 60;
const MAX_ATTEMPTS = 5;

function OtpInput({ value, onChange, disabled }: { value: string; onChange: (v: string) => void; disabled?: boolean }) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  function selectRange() {
    // Select the first empty or last box on focus for easy overwrite.
    const idx = Math.min(value.length, OTP_LENGTH - 1);
    refs.current[idx]?.focus();
    refs.current[idx]?.select();
  }

  function handleChange(i: number, digit: string) {
    const clean = digit.replace(/\D/g, "");
    if (!clean) return;
    const next = value.slice(0, i) + clean.slice(-1) + value.slice(i + 1);
    onChange(next.slice(0, OTP_LENGTH));
    const nextEmpty = i + 1 < OTP_LENGTH ? i + 1 : i;
    refs.current[nextEmpty]?.focus();
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !value[i] && i > 0) {
      refs.current[i - 1]?.focus();
    }
  }

  return (
    <div className="flex justify-center gap-2" onFocus={selectRange}>
      {Array.from({ length: OTP_LENGTH }).map((_, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          maxLength={1}
          disabled={disabled}
          value={value[i] ?? ""}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={(e) => {
            e.preventDefault();
            const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
            if (pasted) onChange(pasted);
          }}
          aria-label={`Digit ${i + 1}`}
          className="h-14 w-11 rounded-xl border text-center text-xl font-bold outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
        />
      ))}
    </div>
  );
}

export function RegisterPage() {
  const { signUp, confirmSignUp, googleSignIn, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const dest = (location.state as { from?: string } | null)?.from || searchParams.get("redirect") || "/account";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

  const [phase, setPhase] = useState<"form" | "otp">("form");
  const [otp, setOtp] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [cooldown, setCooldown] = useState(0);
  const [otpBusy, setOtpBusy] = useState(false);
  const [verified, setVerified] = useState(false);

  const [pendingGoogle, setPendingGoogle] = useState(false);
  const mountedRef = useRef(true);
  const googleTimeoutRef = useRef<number | undefined>(undefined);

  // Component-lifetime guard so async handlers never touch state after unmount.
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (googleTimeoutRef.current) window.clearTimeout(googleTimeoutRef.current);
    };
  }, []);

  // If an OAuth redirect returns while we're still mounted and a Google attempt
  // is in flight, populate the form from the now-authenticated user and go to
  // the account page instead of leaving an empty email/name form behind.
  useEffect(() => {
    if (!pendingGoogle || !user) return;
    if (user.fullName) setName(user.fullName);
    if (user.email) setEmail(user.email);
    setPendingGoogle(false);
    setBusy(false);
    navigate("/account");
  }, [pendingGoogle, user, navigate]);

  const userRef = useRef(user);
  userRef.current = user;
  const authLoadingRef = useRef(authLoading);
  authLoadingRef.current = authLoading;

  // Resend cooldown ticker.
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setInfo("");
    const check = validatePassword(password);
    if (password && !check.ok) {
      setError(check.label || "Password is too short.");
      setBusy(false);
      return;
    }
    // Email + password signup. One tap submits signup exactly once — no
    // passwordless sign-in and no second email request.
    const { error: err, authenticated } = await signUp(email, password, name);
    setBusy(false);
    if (err) {
      setError(err);
      return;
    }
    // When signup OTP is OFF, Supabase returns a session immediately — the
    // customer is in and we send them back to where they came from. When OTP is
    // ON, no session exists until they verify the emailed code below.
    if (authenticated) {
      navigate(dest, { replace: true });
      return;
    }
    // Account created. A 6-digit confirmation code has been emailed; the user
    // enters it on the verification screen to activate the account.
    setPhase("otp");
    setCooldown(RESEND_COOLDOWN_SEC);
    setInfo("We've emailed you a 6-digit verification code. Enter it below to activate your account.");
  }

  async function verify() {
    setOtpBusy(true);
    setError("");
    setInfo("");
    if (otp.length !== OTP_LENGTH) {
      setError("Enter the 6-digit code we emailed you.");
      setOtpBusy(false);
      return;
    }
    const { error: err, authenticated } = await confirmSignUp(email, otp);
    setOtpBusy(false);
    if (err) {
      setAttempts((a) => a + 1);
      if (err === "InvalidOtp") setError("That code is incorrect or has expired. Please request a new one.");
      else if (err === "RateLimited") setError("Too many incorrect attempts. Please wait a few minutes and try again.");
      else setError(err);
      if (attempts + 1 >= MAX_ATTEMPTS) {
        setError("Too many incorrect attempts. Please request a new code.");
      }
      setOtp("");
      return;
    }
    if (!authenticated) {
      setError("We could not establish your session. Please request a new code and try again.");
      setOtp("");
      return;
    }
    setVerified(true);
    const deadline = Date.now() + 4000;
    while (Date.now() < deadline && authLoadingRef.current) {
      await new Promise((r) => setTimeout(r, 50));
    }
    if (userRef.current) {
      navigate("/account");
    }
  }

  async function resend() {
    setError("");
    setInfo("");
    setAttempts(0);
    // Re-invoking signup for a still-unconfirmed account resends the
    // confirmation code (same email + password).
    const { error: err } = await signUp(email, password, name);
    if (err) {
      setError(err);
      return;
    }
    setInfo("We've resent your verification code. Check your inbox and spam folder.");
    setCooldown(RESEND_COOLDOWN_SEC);
    setOtp("");
  }

  async function handleGoogle() {
    setError("");
    setInfo("");
    setBusy(true);
    setPendingGoogle(true);
    const result = await googleSignIn();
    if (!mountedRef.current) return;
    if (result.error) {
      setPendingGoogle(false);
      setBusy(false);
      setError(result.error);
      return;
    }
    if (result.user) {
      // Session already established without a redirect: populate the form and
      // continue to the account area.
      if (result.user.fullName) setName(result.user.fullName);
      if (result.user.email) setEmail(result.user.email);
      setPendingGoogle(false);
      setBusy(false);
      navigate("/account");
      return;
    }
    // Redirect to Google is underway. Keep the button busy; reset after a grace
    // period in case the redirect is aborted and we remain mounted.
    googleTimeoutRef.current = window.setTimeout(() => {
      if (mountedRef.current) {
        setPendingGoogle(false);
        setBusy(false);
      }
    }, 20000);
  }

  return (
    <div className="mx-auto max-w-md">
      <Card>
        <CardContent className="p-8">
          <h1 className="text-2xl font-bold">{phase === "otp" && !verified ? "Verify Your Email" : "Create your account"}</h1>

          {phase === "form" ? (
            <>
              <p className="mt-1 text-sm text-muted-foreground">Verify your email to activate your account.</p>
              <form onSubmit={submit} className="mt-6 space-y-4">
                <div className="space-y-1.5"><Label htmlFor="name">Full name</Label><Input id="name" required value={name} onChange={(e) => setName(e.target.value)} /></div>
                <div className="space-y-1.5"><Label htmlFor="email">Email</Label><Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
                <div className="space-y-1.5">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input id="password" type={showPw ? "text" : "password"} required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="pr-10" />
                    <button type="button" onClick={() => setShowPw((v) => !v)} aria-label={showPw ? "Hide password" : "Show password"} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {password && <p className="text-xs text-muted-foreground">{validatePassword(password).label}</p>}
                </div>
                {info && <p className="text-sm text-blue-600 dark:text-blue-400">{info}</p>}
                {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
                <Button type="submit" className="w-full" disabled={busy}>{busy ? "Sending code…" : "Continue"}</Button>
              </form>

              <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
                <div className="h-px flex-1 bg-border" />
                <span>or</span>
                <div className="h-px flex-1 bg-border" />
              </div>

              <GoogleSignInButton
                busy={busy}
                onClick={handleGoogle}
              />
            </>
          ) : verified ? (
            <div className="mt-6 text-center">
              <Mail className="mx-auto h-10 w-10 text-emerald-600" />
              <p className="mt-3 text-lg font-semibold">Welcome to RAES TECH!</p>
              <p className="mt-1 text-sm text-muted-foreground">Your email is verified and your account is active.</p>
              <Button asChild className="mt-6 w-full"><Link to="/account">Go to my account</Link></Button>
            </div>
          ) : (
            <>
              <p className="mt-1 text-sm text-muted-foreground">
                A six-digit verification code was requested for{" "}
                <span className="font-medium text-foreground">{email}</span>.{" "}
                Check your inbox and spam folder if it doesn't arrive.
              </p>
              <div className="mt-6 space-y-5">
                <div className="space-y-2">
                  <Label className="text-center">Enter verification code</Label>
                  <OtpInput value={otp} onChange={setOtp} disabled={otpBusy} />
                </div>
                {info && <p className="text-center text-sm text-blue-600 dark:text-blue-400">{info}</p>}
                {error && <p className="text-center text-sm text-red-600 dark:text-red-400">{error}</p>}
                <Button type="button" className="w-full" disabled={otpBusy || attempts >= MAX_ATTEMPTS} onClick={verify}>
                  {otpBusy ? "Verifying…" : "Verify & Create Account"}
                </Button>
                <div className="flex items-center justify-between text-sm">
                  <button type="button" disabled={cooldown > 0} onClick={resend} className="font-medium text-foreground underline-offset-2 hover:underline disabled:cursor-not-allowed disabled:text-muted-foreground">
                    {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend OTP"}
                  </button>
                  <button type="button" onClick={() => { setPhase("form"); setOtp(""); setAttempts(0); setError(""); }} className="text-muted-foreground underline-offset-2 hover:underline">
                    Change email address
                  </button>
                </div>
              </div>
            </>
          )}

          <p className="mt-4 text-center text-sm text-muted-foreground">
            Already have an account? <Link to="/login" className="font-medium text-foreground hover:underline">Login</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
