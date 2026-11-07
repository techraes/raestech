import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { UserRole } from "@/types";

interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error?: string }>;
  setOtpPassword: (password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  /**
   * Send an email OTP to auto-register a guest during checkout. When Supabase is
   * configured this creates the account (if missing) and emails a 6-digit code.
   * In dev mode it simulates the flow so checkout remains usable offline.
   */
  requestOtp: (email: string, fullName?: string) => Promise<{ error?: string; info?: string }>;
  /** Verify an email OTP to complete auto-registration / sign-in. */
  confirmOtp: (email: string, token: string) => Promise<{ error?: string; authenticated?: boolean }>;
  /** Verify a sign-up confirmation code for an email + password signup. */
  confirmSignUp: (email: string, token: string) => Promise<{ error?: string; authenticated?: boolean }>;
  /** Google OAuth sign-in (requires the Google provider enabled in Supabase). */
  googleSignIn: () => Promise<{ error?: string; user?: AuthUser }>;
  /** Development-only: sign in to the local sample account. */
  devSignIn: () => Promise<{ error?: string }>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  isAuthenticated: false,
  isAdmin: false,
  isSuperAdmin: false,
  signIn: async () => ({}),
  signUp: async () => ({}),
  setOtpPassword: async () => ({}),
  signOut: async () => {},
  requestOtp: async () => ({}),
  confirmOtp: async () => ({}),
  confirmSignUp: async () => ({}),
  googleSignIn: async () => ({}),
  devSignIn: async () => ({}),
});

const DEV_USER_KEY = "raestech_dev_user";

/**
 * Dev-only local admin override. Credentials come from environment variables and
 * the whole fallback is only reachable in development builds (`vite dev`).
 * It is never compiled into production bundles and never used when Supabase is
 * configured. Production auth relies exclusively on Supabase Auth + DB roles.
 */
const isDevMode = () => Boolean(import.meta.env.DEV);
const DEV_ADMIN_EMAIL = (import.meta.env.VITE_DEV_ADMIN_EMAIL as string | undefined)?.toLowerCase();
const DEV_ADMIN_PASSWORD = import.meta.env.VITE_DEV_ADMIN_PASSWORD as string | undefined;
const DEV_ADMIN_NAME = "RAES TECH Admin";
// Simulated OTP code used only in dev mode (no mail server). The checkout screen
// shows this code as a prompt so developers can complete the flow.
const DEV_OTP_CODE = "123456";

async function fetchSupabaseRole(userId: string): Promise<UserRole> {
  if (!supabase) return "customer";
  try {
    const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId).maybeSingle();
    return (data?.role as UserRole) ?? "customer";
  } catch {
    return "customer";
  }
}

function toAuthUser(sbUser: { id: string; email?: string | null; user_metadata?: Record<string, unknown> }, role: UserRole): AuthUser {
  return { id: sbUser.id, email: sbUser.email ?? "", fullName: (sbUser.user_metadata?.full_name as string) ?? "", role };
}

function readDevUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(DEV_USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() =>
    isSupabaseConfigured ? null : readDevUser()
  );
  const [loading, setLoading] = useState(true);
  const [pendingOtpEmail, setPendingOtpEmail] = useState<string | null>(null);
  const [pendingOtpName, setPendingOtpName] = useState<string>("");

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    // Load session from Supabase Auth and resolve the user's role from the DB.
    supabase!.auth.getSession().then(async ({ data }) => {
      if (data.session?.user) {
        const role = await fetchSupabaseRole(data.session.user.id);
        setUser(toAuthUser(data.session.user, role));
      }
      setLoading(false);
    });

    const { data: sub } = supabase!.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchSupabaseRole(session.user.id).then((role) => setUser(toAuthUser(session.user, role)));
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function signIn(email: string, password: string) {
    if (isSupabaseConfigured) {
      const { error } = await supabase!.auth.signInWithPassword({ email: email.trim(), password });
      if (!error) return {};
      const t = (error.message || "").toLowerCase();
      const code = (error as { code?: string }).code;
      if (/network|fetch|failed to fetch|timed? out|unavailable/.test(t)) {
        return { error: "NetworkError" };
      }
      if (code === "email_not_confirmed" || /email not confirmed|not verified/.test(t)) {
        return { error: "EmailNotConfirmed" };
      }
      if (code === "invalid_credentials" || /invalid login|incorrect|not found|credentials/.test(t)) {
        return { error: "InvalidCredentials" };
      }
      if (/rate|too many|exceed/.test(t)) {
        return { error: "RateLimited" };
      }
      return { error: error.message };
    }
    // Local/dev demo only — never active in production builds.
    if (isDevMode()) {
      if (DEV_ADMIN_EMAIL && email.toLowerCase() === DEV_ADMIN_EMAIL) {
        if (password !== DEV_ADMIN_PASSWORD) {
          return { error: "Incorrect password for the admin account." };
        }
        const dev: AuthUser = { id: "dev-admin", email, fullName: DEV_ADMIN_NAME, role: "super_admin" };
        localStorage.setItem(DEV_USER_KEY, JSON.stringify(dev));
        setUser(dev);
        return {};
      }
      const dev: AuthUser = { id: "dev-user", email, fullName: email.split("@")[0], role: "customer" };
      localStorage.setItem(DEV_USER_KEY, JSON.stringify(dev));
      setUser(dev);
      return {};
    }
    return {
      error:
        "Authentication is not configured on this deployment. Please contact customer support to enable login, or try again shortly.",
    };
  }

  async function signUp(email: string, password: string, fullName: string) {
    if (isSupabaseConfigured) {
      const { error } = await supabase!.auth.signUp({ email, password, options: { data: { full_name: fullName } } });
      return { error: error ? friendlySendError(error.message) : undefined };
    }
    if (isDevMode()) {
      const dev: AuthUser = { id: "dev-user", email, fullName, role: "customer" };
      localStorage.setItem(DEV_USER_KEY, JSON.stringify(dev));
      setUser(dev);
      // Record the pending email so the dev OTP verification step can complete.
      setPendingOtpEmail(email.toLowerCase());
      setPendingOtpName(fullName);
      return {};
    }
    return {
      error:
        "Registration is not configured on this deployment. Please contact customer support to enable account creation, or try again shortly.",
    };
  }

  function friendlySendError(raw: string): string {
    const t = (raw || "").toLowerCase();
    // Rate-limit / abuse signals (Supabase auth error codes and human wording).
    if (
      t.includes("over_email_send_rate_limit") ||
      t.includes("rate") ||
      t.includes("too many") ||
      t.includes("exceed")
    ) {
      return "You've requested too many codes. Please wait a few minutes and try again.";
    }
    // Configuration / provider failures: map specific known Supabase error tokens
    // so we never swallow unrelated errors (timeouts, invalid email, duplicates).
    if (
      t.includes("smtp") ||
      t.includes("not allowed") ||
      t.includes("disabled") ||
      t.includes("error sending confirmation email") ||
      t.includes("validation_failed") ||
      t.includes("email_provider_not_configured") ||
      t.includes("mailer") ||
      t.includes("provider error")
    ) {
      return "We couldn't send the verification email. Email sending may not be configured for this site yet; please contact support or try again shortly.";
    }
    // Default: surface the original error so a distinct failure is never hidden.
    return raw || "We couldn't send your verification code. Please try again.";
  }

  /** Map a Supabase Google OAuth error to safe, user-facing copy. Never leak
   *  raw provider/upstream messages (e.g. a misconfigured client_id) to end
   *  users — they may contain internal/verbose detail. */
  function googleOAuthError(raw: string): string {
    const t = (raw || "").toLowerCase();
    // Provider misconfiguration / not-enabled signals from Supabase/Gotrue.
    if (
      t.includes("provider is not enabled") ||
      t.includes("provider not enabled") ||
      t.includes("not allowed") ||
      t.includes("disabled") ||
      t.includes("email_provider_not_configured") ||
      t.includes("client_id") ||
      t.includes("invalid_client") ||
      t.includes("redirect_uri") ||
      t.includes("configuration") ||
      t.includes("oauth")
    ) {
      return "Google sign-in isn't fully configured on this site yet. Please contact support or try again shortly.";
    }
    if (t.includes("rate") || t.includes("too many") || t.includes("exceed")) {
      return "You've tried Google sign-in too many times. Please wait a few minutes and try again.";
    }
    if (t.includes("cancel") || t.includes("dismissed") || t.includes("closed")) {
      return "Google sign-in was cancelled. You can try again when you're ready.";
    }
    // Default: keep it generic; do not surface the raw upstream message.
    return "We couldn't complete Google sign-in. Please try again.";
  }

  async function setOtpPassword(password: string) {
    if (isSupabaseConfigured) {
      const { error } = await supabase!.auth.updateUser({ password });
      if (error) return { error: error.message };
      return {};
    }
    return { error: "Setting a password is unavailable because authentication is not configured on this deployment." };
  }

  async function requestOtp(email: string, fullName?: string) {
    if (isSupabaseConfigured) {
      const { error } = await supabase!.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
          data: fullName ? { full_name: fullName } : undefined,
        },
      });
      if (error) return { error: friendlySendError(error.message) };
      // A successful response only means the provider accepted the request — it
      // does NOT guarantee inbox delivery. Never claim delivery here.
      return { info: "Verification code requested. Please check your inbox and spam folder." };
    }
    if (isDevMode()) {
      // Simulate the OTP flow offline: remember the pending email so the dev
      // "code" can complete registration without a mail server.
      setPendingOtpEmail(email.toLowerCase());
      setPendingOtpName(fullName ?? "");
      return {};
    }
    return { error: "Email verification is not configured on this deployment." };
  }

    async function confirmOtp(email: string, token: string) {
    if (isSupabaseConfigured) {
      const { error } = await supabase!.auth.verifyOtp({ email: email.trim(), token, type: "email" });
      if (error) {
        const t = (error.message || "").toLowerCase();
        if (/rate|too many|exceed/.test(t)) return { error: "RateLimited" };
        if (/expired|invalid|token|otp|verification failed/.test(t)) return { error: "InvalidOtp" };
        return { error: error.message };
      }
      const { data: sess } = await supabase!.auth.getSession();
      if (!sess.session?.user) {
        return { error: "Verification succeeded but no session was established. Please request a new code and try again." };
      }
      return { authenticated: true };
    }
    if (isDevMode()) {
      if (!pendingOtpEmail || email.toLowerCase() !== pendingOtpEmail) {
        return { error: "That email has not been sent a code." };
      }
      if (token !== DEV_OTP_CODE) {
        return { error: "Incorrect verification code. Use the demo code shown on screen." };
      }
      const dev: AuthUser = { id: "dev-" + email.replace(/[^a-z0-9]/gi, ""), email, fullName: pendingOtpName || "Customer", role: "customer" };
      localStorage.setItem(DEV_USER_KEY, JSON.stringify(dev));
      setUser(dev);
      return { authenticated: true };
    }
    return { error: "Email verification is not configured on this deployment." };
  }

  /** Verify a sign-up confirmation code sent after an email + password signup. */
  async function confirmSignUp(email: string, token: string) {
    if (isSupabaseConfigured) {
      const { error } = await supabase!.auth.verifyOtp({ email: email.trim(), token, type: "signup" });
      if (error) {
        const t = (error.message || "").toLowerCase();
        if (/rate|too many|exceed/.test(t)) return { error: "RateLimited" };
        if (/expired|invalid|token|otp|verification failed/.test(t)) return { error: "InvalidOtp" };
        return { error: error.message };
      }
      // A verified sign-up returns a session for the new account (the password
      // was already set at sign-up time).
      const { data: sess } = await supabase!.auth.getSession();
      if (!sess.session?.user) {
        return { error: "Your email was verified. Please sign in with your email and password." };
      }
      return { authenticated: true };
    }
    if (isDevMode()) {
      if (!pendingOtpEmail || email.toLowerCase() !== pendingOtpEmail) {
        return { error: "That email has not been sent a code." };
      }
      if (token !== DEV_OTP_CODE) {
        return { error: "Incorrect verification code. Use the demo code shown on screen." };
      }
      const dev: AuthUser = { id: "dev-" + email.replace(/[^a-z0-9]/gi, ""), email, fullName: pendingOtpName || "Customer", role: "customer" };
      localStorage.setItem(DEV_USER_KEY, JSON.stringify(dev));
      setUser(dev);
      return { authenticated: true };
    }
    return { error: "Email verification is not configured on this deployment." };
  }
  async function signOut() {
    if (isSupabaseConfigured) {
      await supabase!.auth.signOut();
    } else {
      localStorage.removeItem(DEV_USER_KEY);
      setUser(null);
    }
  }

  async function devSignIn() {
    if (isDevMode() && DEV_ADMIN_EMAIL) {
      const dev: AuthUser = { id: "dev-admin", email: DEV_ADMIN_EMAIL, fullName: DEV_ADMIN_NAME, role: "super_admin" };
      localStorage.setItem(DEV_USER_KEY, JSON.stringify(dev));
      setUser(dev);
      return {};
    }
    return { error: "Demo login is only available in development." };
  }

  async function googleSignIn(): Promise<{ error?: string; user?: AuthUser }> {
    if (!isSupabaseConfigured) {
      return { error: "Google sign-in is not configured on this deployment." };
    }
    const { error } = await supabase!.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (error) return { error: googleOAuthError(error.message) };
    // signInWithOAuth redirects the browser to Google. We deliberately do NOT
    // probe getUser() here: the OAuth flow completes across a redirect, and a
    // direct probe right now would read a stale/null session and make the UI
    // briefly drop back to "Continue with Google". Instead we treat a resolved
    // non-error as "redirect underway". When Google sends the user back,
    // onAuthStateChange fires with the new session and updates `user`, which
    // callers (e.g. RegisterPage's pendingGoogle effect) observe to land on
    // /account.
    return {};
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      isAdmin: Boolean(user && user.role !== "customer"),
      isSuperAdmin: Boolean(user && user.role === "super_admin"),
      signIn,
      signUp,
      signOut,
      requestOtp,
      confirmOtp,
      confirmSignUp,
      setOtpPassword,
      devSignIn,
      googleSignIn,
    }),
    [user, loading, pendingOtpEmail, pendingOtpName]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
