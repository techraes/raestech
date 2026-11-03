import { create } from "zustand";
import type { CartItem, Product, ProductVariant } from "@/types";

interface CartState {
  items: CartItem[];
  addItem: (product: Product, variant: ProductVariant, quantity?: number) => void;
  removeItem: (sku: string) => void;
  updateQuantity: (sku: string, quantity: number) => void;
  clear: () => void;
  count: () => number;
  subtotal: (mode: "listed" | "buyNow") => number;
}

export const useCart = create<CartState>((set, get) => ({
  items: [],

  addItem: (product, variant, quantity = 1) =>
    set((state) => {
      const existing = state.items.find((i) => i.variant.sku === variant.sku);
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.variant.sku === variant.sku ? { ...i, quantity: i.quantity + quantity } : i
          ),
        };
      }
      return { items: [...state.items, { product, variant, quantity }] };
    }),

  removeItem: (sku) =>
    set((state) => ({ items: state.items.filter((i) => i.variant.sku !== sku) })),

  updateQuantity: (sku, quantity) =>
    set((state) => ({
      items: state.items
        .map((i) => (i.variant.sku === sku ? { ...i, quantity: Math.max(1, quantity) } : i))
        .filter((i) => i.quantity > 0),
    })),

  clear: () => set({ items: [] }),

  count: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

  subtotal: (mode) =>
    get().items.reduce((sum, i) => {
      const unit = mode === "buyNow" ? i.variant.buyNowPrice : i.variant.listedPrice;
      return sum + unit * i.quantity;
    }, 0),
}));
