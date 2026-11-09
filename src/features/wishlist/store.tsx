import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { useAuth } from "@/features/auth/AuthContext";

/**
 * Wishlist store.
 *
 * Identity: saved items are keyed by the product SLUG (a stable, public
 * identity used across cards, the product detail page and the wishlist page).
 * This is deliberately not the numeric client id, because the DB wishlist
 * tables reference products(id) as uuid while the bundled catalogue uses
 * numeric ids.
 *
 * Persistence:
 *  - Local storage is NAMESPACED by auth state so accounts never leak into each
 *    other on a shared device:
 *      * signed-out  -> `raes.wishlist.guest`
 *      * signed-in    -> `raes.wishlist.user.<userId>`
 *    When a guest signs in, the guest list is carried over into the user's own
 *    namespace (so a guest's saved items survive sign-up), and the user's
 *    namespace is then independent of any other account.
 *  - When Supabase is configured AND a user is signed in, the list is mirrored
 *    to the `user_wishlist` table (owner-only RLS). Sync is ROW-BY-ROW
 *    (upsert/delete of only the toggled slug) — never a full delete-and-reinsert
 *    — so concurrent writers/tabs never wipe each other's remote entries.
 *  - Remote rows are merged into the local list as a UNION at fetch/resolution
 *    time with a functional `setSlugs`, so a heart tapped while the fetch is in
 *    flight is preserved, never overwritten.
 */

const GUEST_KEY = "raes.wishlist.guest";
const USER_KEY_PREFIX = "raes.wishlist.user.";

interface WishlistValue {
  /** Saved product slugs (insertion order preserved, de-duplicated). */
  slugs: string[];
  loading: boolean;
  isSaved: (slug: string) => boolean;
  toggle: (
    slug: string
  ) => Promise<{ ok: boolean; needsAuth?: boolean; error?: string }>;
  count: number;
}

const WishlistContext = createContext<WishlistValue | null>(null);

function readLocal(key: string): string[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function writeLocal(key: string, slugs: string[]) {
  try {
    localStorage.setItem(key, JSON.stringify(slugs));
  } catch {
    /* quota / privacy mode – ignore */
  }
}

/** Union of two slug lists, preserving first-seen order. */
function mergeSlugs(a: string[], b: string[]): string[] {
  return Array.from(new Set([...a, ...b]));
}

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [slugs, setSlugs] = useState<string[]>([]);
  const [localLoaded, setLocalLoaded] = useState(false);
  // Tracks which auth identity ("guest" or a userId) the local list has been
  // loaded for, so storage is read once per identity (including on reload).
  const loadedAuthRef = useRef<string | null>(null);

  // Current local-storage key for this auth state.
  const localKey = user?.id ? `${USER_KEY_PREFIX}${user.id}` : GUEST_KEY;

  // Row-by-row remote sync for a single toggled slug. Only this slug changes
  // remotely, so other remote entries (and other tabs) are left untouched.
  const syncSlugRemote = useCallback(
    async (slug: string, present: boolean) => {
      if (!isSupabaseConfigured || !user?.id) return;
      try {
        const userId = user.id;
        if (present) {
          await supabase!.from("user_wishlist").upsert(
            { user_id: userId, product_slug: slug },
            { onConflict: "user_id,product_slug" }
          );
        } else {
          await supabase!
            .from("user_wishlist")
            .delete()
            .eq("user_id", userId)
            .eq("product_slug", slug);
        }
      } catch {
        /* offline / sync failure – local copy stays authoritative */
      }
    },
    [user?.id]
  );

  // Persist the active namespace's list whenever it changes. Side-effect is
  // kept out of state updaters so React StrictMode double-invoke stays pure.
  useEffect(() => {
    if (!localLoaded) return;
    writeLocal(localKey, slugs);
  }, [slugs, localKey, localLoaded]);

  // Auth-change / initial load. Loads the correct namespace for the current
  // auth state, once per identity. On guest -> user, the guest list is carried
  // into the user's own namespace, then remote rows are UNION-merged at
  // resolution time.
  useEffect(() => {
    if (authLoading) return;

    const currId = user?.id ?? null;
    const label = currId ? String(currId) : "guest";
    // Baseline local list for this identity (used for guest->user carry-over
    // and merging with remote). Defaults to current in-memory state.
    let base: string[] = slugs;

    // Load storage only when we haven't loaded this identity yet (covers the
    // first load AND a full reload for the same identity).
    if (loadedAuthRef.current !== label) {
      if (currId) {
        const userList = readLocal(`${USER_KEY_PREFIX}${currId}`);
        if (loadedAuthRef.current === "guest") {
          // Guest -> signed-in: carry the guest list into the user's namespace.
          base = mergeSlugs(userList, readLocal(GUEST_KEY));
        } else {
          base = userList;
        }
      } else {
        base = readLocal(GUEST_KEY);
      }
      loadedAuthRef.current = label;
      setSlugs((prev) => mergeSlugs(base, prev));
    }

    setLocalLoaded(true);

    if (isSupabaseConfigured && currId) {
      let active = true;
      void (async () => {
        try {
          const { data, error } = await supabase!
            .from("user_wishlist")
            .select("product_slug")
            .eq("user_id", currId);
          if (!active) return;
          if (!error && Array.isArray(data)) {
            const remote = data
              .map((r) => r.product_slug)
              .filter((x) => typeof x === "string");
            // Union-merge at resolution time (functional), so a quick toggle is
            // never overwritten by this fetch.
            setSlugs((prev) => {
              const merged = mergeSlugs(prev, remote);
              // Persist the merged user-namespace list (already handled by the
              // persist effect; writing here is only to keep guest->user carry
              // consistent if the effect hasn't run yet).
              writeLocal(`${USER_KEY_PREFIX}${currId}`, merged);
              return merged;
            });
            // Carry over local-only slugs to the remote account (non-destructive:
            // only additions for this user; no deletes).
            const mergedNow = mergeSlugs(base, remote);
            const missing = mergedNow.filter((s) => !remote.includes(s));
            if (missing.length > 0) {
              await supabase!.from("user_wishlist").upsert(
                missing.map((slug) => ({ user_id: currId, product_slug: slug })),
                { onConflict: "user_id,product_slug" }
              );
            }
          }
        } catch {
          /* ignore sync errors */
        } finally {
          if (active) setLocalLoaded(true);
        }
      })();
      return () => {
        active = false;
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user?.id]);

  const isSaved = useCallback((slug: string) => slugs.includes(slug), [slugs]);

  const toggle = useCallback(
    async (slug: string) => {
      const present = slugs.includes(slug);
      const next = present ? slugs.filter((s) => s !== slug) : [...slugs, slug];

      // Optimistic update (persisted by the effect above).
      setSlugs(next);

      // Single-row remote sync for just the toggled slug.
      await syncSlugRemote(slug, !present);

      return { ok: true, needsAuth: !isAuthenticated };
    },
    [slugs, syncSlugRemote, isAuthenticated]
  );

  const value = useMemo<WishlistValue>(
    () => ({
      slugs,
      loading: authLoading || !localLoaded,
      isSaved,
      toggle,
      count: slugs.length,
    }),
    [slugs, authLoading, localLoaded, isSaved, toggle]
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist(): WishlistValue {
  const ctx = useContext(WishlistContext);
  if (!ctx) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return ctx;
}
