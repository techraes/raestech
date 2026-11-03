import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem, CustomerOrder, CustomerOrderItem, ProductVariant } from "@/types";
import { supabase } from "@/lib/supabase";
import { buyNowPrice } from "@/lib/pricing";
import { allProducts } from "@/data/catalog";

export interface OrderDraft {
  fullName: string;
  email: string;
  phone: string;
  city: string;
  province: string;
  address: string;
  notes: string;
  items: CartItem[];
  subtotal: number;
  shipping: number;
  /** Buy-now discount percent applied at checkout (e.g. 10). */
  discountPercent: number;
}

export type PlaceOrderResult =
  | { ok: true; order: CustomerOrder }
  | { ok: false; error: string };

interface OrdersState {
  orders: CustomerOrder[];
  placeOrder: (draft: OrderDraft, userId?: string | null) => Promise<PlaceOrderResult>;
}

function makeId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "ord-" + Math.random().toString(36).slice(2, 12);
}

function makeOrderNumber(): string {
  return "ORD-" + Math.random().toString(36).slice(2, 10).toUpperCase();
}

/** Resolve a variant by SKU from the canonical catalogue. */
function variantBySku(sku: string): ProductVariant | undefined {
  for (const product of allProducts) {
    const variant = product.variants.find((v) => v.sku === sku);
    if (variant) return variant;
  }
  return undefined;
}

/**
 * Local-first order store. Orders are persisted to localStorage immediately so a
 * customer's order always exists regardless of backend state. When Supabase is
 * configured and reachable we also sync the order server-side so admins can see
 * it. The UI reads from the local store.
 *
 * Server sync is authoritative where it matters:
 *  - Prices are recomputed from the canonical catalogue (never trusted from
 *    tampered client cart state) and every item is checked against stock before
 *    an order is created.
 *  - The order header AND its line items are written to Supabase; if the line
 *    items cannot be written the created order is rolled back so admins never
 *    see a header without products/SKUs/quantities, and the failure is surfaced
 *    to the customer instead of being silently swallowed.
 */
export const useOrders = create<OrdersState>()(
  persist(
    (set) => ({
      orders: [],

      placeOrder: async (draft, userId) => {
        const discount = Math.max(0, Number(draft.discountPercent) || 0);

        // ---- 1. Validate every item against the canonical catalogue before
        // creating anything. Prices are recomputed here, never taken from the
        // client cart, so tampered totals / overselling are rejected.
        const items: CustomerOrderItem[] = [];
        let computedSubtotal = 0;

        for (const cartItem of draft.items) {
          const variant = variantBySku(cartItem.variant.sku);
          if (!variant) {
            return {
              ok: false,
              error: `Unknown product (SKU ${cartItem.variant.sku}) — please refresh the catalogue and try again.`,
            };
          }
          const quantity = Math.max(1, Math.floor(Number(cartItem.quantity) || 1));
          if (quantity > variant.stock) {
            return {
              ok: false,
              error: `Insufficient stock for ${cartItem.product.name} — only ${variant.stock} left.`,
            };
          }
          const unitPrice = buyNowPrice(variant.listedPrice, discount);
          items.push({ sku: variant.sku, name: cartItem.product.name, quantity, unitPrice });
          computedSubtotal += unitPrice * quantity;
        }

        const order: CustomerOrder = {
          id: makeId(),
          orderNumber: makeOrderNumber(),
          createdAt: new Date().toISOString(),
          status: "pending",
          paymentStatus: "unpaid",
          paymentMethod: "bank_transfer",
          customerName: draft.fullName,
          email: draft.email,
          phone: draft.phone,
          city: draft.city,
          province: draft.province,
          address: draft.address,
          notes: draft.notes,
          items,
          subtotal: computedSubtotal,
          discountAmount: Math.round(computedSubtotal * (discount / 100)),
          shipping: draft.shipping,
          total: computedSubtotal + draft.shipping,
        };

        // Keep a local copy immediately so the customer always has a record.
        set((state) => ({ orders: [order, ...state.orders] }));

        // ---- 2. Server sync. When Supabase is configured we must persist BOTH
        // the order header and its line items. If that fails we surface an error
        // instead of silently leaving an empty/orphaned order row for admins.
        if (supabase) {
          const { data: inserted, error: orderErr } = await supabase
            .from("orders")
            .insert({
              order_number: order.orderNumber,
              user_id: userId ?? null,
              email: order.email,
              phone: order.phone,
              status: order.status,
              payment_method: "manual_bank_transfer",
              payment_status: order.paymentStatus,
              shipping_full_name: order.customerName,
              shipping_phone: order.phone,
              shipping_city: order.city,
              shipping_province: order.province || null,
              subtotal: order.subtotal,
              discount_amount: order.discountAmount,
              shipping_charge: order.shipping,
              total: order.total,
              customer_notes: order.notes || null,
            })
            .select("id");

          if (orderErr) {
            return { ok: false, error: "Could not save your order. Please try again." };
          }

          const orderId = inserted?.[0]?.id;
          if (!orderId) {
            return { ok: false, error: "Could not save your order. Please try again." };
          }

          const itemRows = items.map((item) => ({
            order_id: orderId,
            product_name: item.name,
            sku: item.sku,
            quantity: item.quantity,
            unit_price: item.unitPrice,
            buy_now: item.unitPrice,
            subtotal: item.unitPrice * item.quantity,
          }));

          const { error: itemsErr } = await supabase.from("order_items").insert(itemRows);

          if (itemsErr) {
            // Roll back the orphaned order so admins never see a header without
            // its line items (would make fulfilment impossible).
            try {
              await supabase.from("orders").delete().eq("id", orderId);
            } catch {
              // rollback is best-effort; the error below is still surfaced
            }
            return { ok: false, error: "Could not save your order. Please try again." };
          }
        }

        return { ok: true, order };
      },
    }),
    { name: "raes.orders.v1" }
  )
);
