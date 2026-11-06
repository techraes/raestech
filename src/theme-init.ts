import { initTheme } from "@/lib/theme";

// Apply the saved/system theme as early as possible (before the first paint).
// Kept in a separate module so the logic is bundled and covered by the site's
// Content-Security-Policy instead of relying on an inline <script>.
initTheme();
