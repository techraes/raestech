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
  signOut: () => Promise<void>;
  /**
   * Send an email OTP to auto-register a guest during checkout. When Supabase is
   * configured this creates the account (if missing) and emails a 6-digit code.
   * In dev mode it simulates the flow so checkout remains usable offline.
   */
  requestOtp: (email: string, fullName?: string) => Promise<{ error?: string; info?: string }>;
  /** Verify an email OTP to complete auto-registration / sign-in. */
  confirmOtp: (email: string, token: string) => Promise<{ error?: string }>;
  /** Google OAuth sign-in (requires the Google provider enabled in Supabase). */
  googleSignIn: () => Promise<{ error?: string }>;
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
  signOut: async () => {},
  requestOtp: async () => ({}),
  confirmOtp: async () => ({}),
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
      const { error } = await supabase!.auth.signInWithPassword({ email, password });
      return { error: error?.message };
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
      return { error: error?.message };
    }
    if (isDevMode()) {
      const dev: AuthUser = { id: "dev-user", email, fullName, role: "customer" };
      localStorage.setItem(DEV_USER_KEY, JSON.stringify(dev));
      setUser(dev);
      return {};
    }
    return {
      error:
        "Registration is not configured on this deployment. Please contact customer support to enable account creation, or try again shortly.",
    };
  }

  function friendlySendError(raw: string): string {
    const t = (raw || "").toLowerCase();
    if (t.includes("rate") || t.includes("too many") || t.includes("exceed")) {
      return "You've requested too many codes. Please wait a few minutes and try again.";
    }
    if (t.includes("over_email_send_rate_limit")) {
      return "You've requested too many codes. Please wait a few minutes and try again.";
    }
    if (t.includes("not allowed") || t.includes("disabled") || t.includes("smtp")) {
      return "Email sending is not configured yet. Please contact support or try again later.";
    }
    return "We couldn't send your verification code. Please try again.";
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
      const { error } = await supabase!.auth.verifyOtp({ email, token, type: "email" });
      if (error) return { error: error?.message };
      // Session is now established; onAuthStateChange updates `user`.
      return {};
    }
    if (isDevMode()) {
      if (!pendingOtpEmail || email.toLowerCase() !== pendingOtpEmail) {
        return { error: "That email has not been sent a code." };
      }
      // Dev mode only ever accepts the fixed simulated code. Any other token is
      // rejected so the flow behaves like a real OTP and cannot be spoofed.
      if (token !== DEV_OTP_CODE) {
        return { error: "Incorrect verification code. Use the demo code shown on screen." };
      }
      const dev: AuthUser = { id: "dev-" + email.replace(/[^a-z0-9]/gi, ""), email, fullName: pendingOtpName || "Customer", role: "customer" };
      localStorage.setItem(DEV_USER_KEY, JSON.stringify(dev));
      setUser(dev);
      return {};
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

  async function googleSignIn() {
    if (isSupabaseConfigured) {
      const { error } = await supabase!.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.origin },
      });
      if (error) return { error: error?.message };
      // signInWithOAuth redirects away to Google; on return Supabase Auth
      // creates the session and onAuthStateChange updates `user`.
      return {};
    }
    return { error: "Google sign-in is not configured on this deployment." };
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
