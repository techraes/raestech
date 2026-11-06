import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Product } from "@/types";
import seed from "@/data/catalog_seed.json";

interface SeedShape {
  brands: unknown[];
  products: Product[];
}

const data = seed as unknown as SeedShape;

/** The factory-seeded catalogue. Used as the default whenever no saved edits exist. */
export const SEED_PRODUCTS: Product[] = data.products;

function maxSeedId(): number {
  return SEED_PRODUCTS.reduce((m, p) => Math.max(m, Number(p.id) || 0), 0);
}

/**
 * Wrap localStorage so an oversized / full storage never crashes the app (a
 * single product edit should not brick the store). On quota errors we silently
 * downgrade to in-memory-only persistence for that write.
 */
const safeStorage = {
  getItem: (name: string) => {
    try {
      return localStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: (name: string, value: string) => {
    try {
      localStorage.setItem(name, value);
    } catch {
      /* QuotaExceededError or private mode — ignore. */
    }
  },
  removeItem: (name: string) => {
    try {
      localStorage.removeItem(name);
    } catch {
      /* ignore */
    }
  },
};

interface ProductsState {
  /** Live catalogue (factory seed, overridden by admin edits). */
  products: Product[];
  /** Highest numeric product id ever allocated, so new products are unique. */
  maxId: number;
  upsertProduct: (product: Product) => number;
  deleteProduct: (id: number | string) => void;
  resetProducts: () => void;
  /** Next unique numeric id (bigger than everything seen so far). */
  nextId: () => number;
}

export const useProductStore = create<ProductsState>()(
  persist(
    (set, get) => ({
      products: SEED_PRODUCTS,
      maxId: maxSeedId() + 1,

      nextId: () => get().maxId,

      upsertProduct: (product) => {
        const s = get();
        let id = Number(product.id);
        if (!id || String(id) === "0" || String(id) === "") {
          id = s.maxId;
        }
        const idStr = String(id);
        const exists = s.products.some((p) => String(p.id) === idStr);
        const clean: Product = { ...product, id };
        const products = exists
          ? s.products.map((p) => (String(p.id) === idStr ? clean : p))
          : [...s.products, clean];
        set({ products, maxId: Math.max(s.maxId, Number(id) + 1) });
        return Number(id);
      },

      deleteProduct: (id) =>
        set((s) => {
          const idStr = String(id);
          return { products: s.products.filter((p) => String(p.id) !== idStr) };
        }),

      resetProducts: () => set({ products: SEED_PRODUCTS, maxId: maxSeedId() + 1 }),
    }),
    {
      name: "raestech:products",
      storage: createJSONStorage(() => safeStorage),
    }
  )
);

/** Read the live catalogue outside of React (services, other stores). */
export function getAllProducts(): Product[] {
  const stored = useProductStore.getState().products;
  return stored && stored.length ? stored : SEED_PRODUCTS;
}
