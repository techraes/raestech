import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/**
 * Global theme system (light / dark / system).
 *
 * Preference is persisted to localStorage; the effective (resolved) theme is
 * applied by toggling the `dark` class on <html>, which flips the CSS custom
 * properties defined in src/styles/base.css. `initTheme` is called before the
 * first paint (in index.html) so there is no flash of the wrong theme.
 */

export type ThemePreference = "light" | "dark" | "system";

const STORAGE_KEY = "raes.theme";

function getStored(): ThemePreference {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === "light" || v === "dark" || v === "system") return v;
  } catch {
    /* ignore */
  }
  return "system";
}

function systemPrefersDark(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-color-scheme: dark)").matches === true
  );
}

/** Resolve a preference to an actual scheme. */
export function resolveTheme(pref: ThemePreference): "light" | "dark" {
  if (pref === "system") return systemPrefersDark() ? "dark" : "light";
  return pref;
}

/** Apply the resolved theme to the DOM (class + color-scheme). */
export function applyThemeClass(pref: ThemePreference): void {
  const resolved = resolveTheme(pref);
  document.documentElement.classList.toggle("dark", resolved === "dark");
  document.documentElement.style.colorScheme = resolved;
}

/** Read the stored preference and apply it — call before the app mounts. */
export function initTheme(): void {
  applyThemeClass(getStored());
}

interface ThemeContextValue {
  theme: ThemePreference;
  resolvedTheme: "light" | "dark";
  setTheme: (pref: ThemePreference) => void;
  /** Cycle light -> dark -> system -> light. */
  cycleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "system",
  resolvedTheme: "light",
  setTheme: () => {},
  cycleTheme: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemePreference>(getStored);
  const [sysDark, setSysDark] = useState<boolean>(systemPrefersDark);

  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!mq) return;
    const onChange = () => setSysDark(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const resolvedTheme: "light" | "dark" = useMemo(() => {
    if (theme === "system") return sysDark ? "dark" : "light";
    return theme;
  }, [theme, sysDark]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", resolvedTheme === "dark");
    document.documentElement.style.colorScheme = resolvedTheme;
  }, [resolvedTheme]);

  const setTheme = (pref: ThemePreference) => {
    setThemeState(pref);
    try {
      localStorage.setItem(STORAGE_KEY, pref);
    } catch {
      /* ignore */
    }
  };

  const cycleTheme = () => {
    const next =
      theme === "system" ? "light" : theme === "light" ? "dark" : "system";
    setTheme(next);
  };

  const value = useMemo(
    () => ({ theme, resolvedTheme, setTheme, cycleTheme }),
    [theme, resolvedTheme, setTheme, cycleTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
