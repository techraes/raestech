import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/theme";

/**
 * Single accessible sun/moon control. Toggles from the theme actually visible
 * on screen (resolvedTheme), so one tap always flips the visible theme and
 * updates the icon + accessible label together — even when the stored
 * preference is "system" and the device's system theme is dark.
 */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  const toggle = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  const label =
    resolvedTheme === "dark"
      ? "Currently dark — click to switch to light"
      : "Currently light — click to switch to dark";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      className="inline-flex h-10 w-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:hover:bg-white/10"
    >
      {resolvedTheme === "dark" ? (
        <Sun className="h-5 w-5" strokeWidth={1.8} />
      ) : (
        <Moon className="h-5 w-5" strokeWidth={1.8} />
      )}
    </button>
  );
}
