import { create } from "zustand";
import type { CartItem, Product, ProductVariant } from "@/types";

interface CartState {
  items: CartItem[];
  addItem: (product: Product, variant: ProductVariant, quantity?: number, color?: string) => void;
  removeItem: (sku: string, color?: string) => void;
  updateQuantity: (sku: string, quantity: number, color?: string) => void;
  clear: () => void;
  count: () => number;
  subtotal: (mode: "listed" | "buyNow") => number;
}

/** Composite key so the same SKU with different colours are kept separately. */
function itemKey(sku: string, color?: string) {
  return `${sku}__${(color || "").toLowerCase()}`;
}

export const useCart = create<CartState>((set, get) => ({
  items: [],

  addItem: (product, variant, quantity = 1, color = "") =>
    set((state) => {
      const key = itemKey(variant.sku, color);
      const existing = state.items.find((i) => itemKey(i.variant.sku, i.color) === key);
      if (existing) {
        return {
          items: state.items.map((i) =>
            itemKey(i.variant.sku, i.color) === key ? { ...i, quantity: i.quantity + quantity } : i
          ),
        };
      }
      return { items: [...state.items, { product, variant, quantity, color }] };
    }),

  removeItem: (sku, color) =>
    set((state) => {
      const key = itemKey(sku, color);
      return { items: state.items.filter((i) => itemKey(i.variant.sku, i.color) !== key) };
    }),

  updateQuantity: (sku, quantity, color) =>
    set((state) => {
      const key = itemKey(sku, color);
      return {
        items: state.items
          .map((i) => (itemKey(i.variant.sku, i.color) === key ? { ...i, quantity: Math.max(1, quantity) } : i))
          .filter((i) => i.quantity > 0),
      };
    }),

  clear: () => set({ items: [] }),

  count: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

  subtotal: (mode) =>
    get().items.reduce((sum, i) => {
      const unit = mode === "buyNow" ? i.variant.buyNowPrice : i.variant.listedPrice;
      return sum + unit * i.quantity;
    }, 0),
}));
