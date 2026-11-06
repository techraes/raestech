import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type ApprovalDecision = "approved" | "rejected";

/**
 * Admin review decisions for the imported concept-image manifest.
 * Keyed by model slug (matches the catalogue `product.image` basename).
 *
 * Safety: nothing is auto-published — a concept only appears on the storefront
 * once an administrator explicitly approves it here. QA-hold and reference-only
 * entries are excluded by the Admin/Review UI.
 */
interface ImageApprovalsState {
  decisions: Record<string, ApprovalDecision>;
  setDecision: (slug: string, decision: ApprovalDecision) => void;
  clearSlug: (slug: string) => void;
  resetAll: () => void;
}

export const useImageApprovals = create<ImageApprovalsState>()(
  persist(
    (set) => ({
      decisions: {},
      setDecision: (slug, decision) =>
        set((s) => ({ decisions: { ...s.decisions, [slug]: decision } })),
      clearSlug: (slug) =>
        set((s) => {
          const { [slug]: _drop, ...rest } = s.decisions;
          return { decisions: rest };
        }),
      resetAll: () => set({ decisions: {} }),
    }),
    {
      name: "raestech:image-approvals",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
