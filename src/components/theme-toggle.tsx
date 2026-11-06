import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/theme";

/**
 * Cycles the theme light -> dark -> system -> light. Shows a sun when dark
 * (click to go lighter) and a moon when light/dark — compact enough for the
 * header, footer and account pages.
 */
export function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme();

  const cycle = () => {
    const next = theme === "system" ? "light" : theme === "light" ? "dark" : "system";
    setTheme(next);
  };

  const label =
    resolvedTheme === "dark"
      ? "Currently dark — click to switch theme"
      : "Currently light — click to switch theme";

  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={label}
      title={label}
      className="inline-flex h-10 w-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-black/5 dark:hover:bg-white/10"
    >
      {resolvedTheme === "dark" ? (
        <Sun className="h-5 w-5" strokeWidth={1.8} />
      ) : (
        <Moon className="h-5 w-5" strokeWidth={1.8} />
      )}
    </button>
  );
}
