import { useEffect, useRef, useState } from "react";

/**
 * Returns a ref and a boolean that flips to `true` once the
 * referenced element has scrolled into the viewport.
 *
 * - `once` (default true) keeps the element visible after first reveal.
 * - Uses IntersectionObserver with a small rootMargin so items reveal
 *   slightly before they fully enter the viewport.
 * - Respects `prefers-reduced-motion`: if reduced motion is requested,
 *   the hook reports `inView` immediately so no animation plays.
 */
export function useInView<T extends HTMLElement = HTMLDivElement>(options?: {
  once?: boolean;
  rootMargin?: string;
  threshold?: number;
}) {
  const { once = true, rootMargin = "0px 0px -12% 0px", threshold = 0.15 } = options ?? {};
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const hasReducedMotion = typeof window !== "undefined"
      && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    if (hasReducedMotion) {
      setInView(true);
      return;
    }

    const el = ref.current;
    if (!el) return;

    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          setInView(true);
          if (once) observer.unobserve(entry.target);
        } else if (!once) {
          setInView(false);
        }
      },
      { rootMargin, threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [once, rootMargin, threshold]);

  return { ref, inView };
}
