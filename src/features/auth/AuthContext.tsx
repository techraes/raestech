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
      devSignIn,
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
