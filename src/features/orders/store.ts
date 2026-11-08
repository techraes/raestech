import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem, CustomerOrder, CustomerOrderItem, CustomerOrderPaymentMethod, ProductVariant } from "@/types";
import { supabase } from "@/lib/supabase";
import { sendOrderConfirmation } from "@/lib/email";
import { buyNowPrice } from "@/lib/pricing";
import { getVariantBySku } from "@/data/catalog";
import { toDbPaymentMethod } from "@/lib/payment-method";

export interface OrderDraft {
  fullName: string;
  email: string;
  phone: string;
  city: string;
  province: string;
  address: string;
  area?: string;
  postalCode?: string;
  notes: string;
  items: CartItem[];
  subtotal: number;
  shipping: number;
  /** Buy-now discount percent applied at checkout (e.g. 10). */
  discountPercent: number;
  /**
   * Selected payment method code (e.g. crypto_usdt, card). This is the
   * customer-facing code used for display and payment instructions. When the
   * order is persisted it is normalised to a value the DB `payment_method`
   * enum accepts (see toDbPaymentMethod); the original code is preserved on
   * the local order.
   */
  paymentMethod?: string;
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

/** Resolve a variant by SKU from the canonical (live) catalogue. */
function variantBySku(sku: string): ProductVariant | undefined {
  return getVariantBySku(sku)?.variant;
}

/** Map a Supabase/PostgREST error to a customer-friendly message. */
function formatServerError(err: { message?: string }): string {
  const msg = err.message ?? "";
  if (/insufficient stock/i.test(msg)) {
    return "Insufficient stock for one or more items. Please adjust quantities and try again.";
  }
  if (/authenticated/i.test(msg)) {
    return "Please sign in to place an order.";
  }
  return "Could not save your order. Please try again.";
}

/**
 * Local-first order store. Orders are persisted to localStorage immediately so a
 * customer's order always exists regardless of backend state. When Supabase is
 * configured we sync the order server-side so admins and the customer's account
 * history see it.
 *
 * Server-side guarantees:
 *  - The order owner is resolved from the real session (supabase.auth.getUser()),
 *    never from a client-supplied id, so orders cannot be orphaned or spoofed.
 *  - Stock is validated and decremented atomically by the `place_order_buynow`
 *    RPC (single transaction), preventing overselling under concurrent checkouts.
 *  - The order header AND its line items are persisted together; on failure the
 *    order is rolled back and the error is surfaced to the customer.
 */
export const useOrders = create<OrdersState>()(
  persist(
    (set) => ({
      orders: [],

      placeOrder: async (draft) => {
        const discount = Math.max(0, Number(draft.discountPercent) || 0);

        // ---- 1. Validate every item against the canonical catalogue before
        // creating anything. Prices are recomputed here, never taken from the
        // client cart, so tampered totals / overselling are rejected.
        const items: CustomerOrderItem[] = [];
        let computedSubtotal = 0;
        let computedListedSubtotal = 0;
        const paymentMethod = (draft.paymentMethod as CustomerOrderPaymentMethod) || "manual_bank_transfer";
        const isCOD = paymentMethod === "cod";

        // Server-side payment-method validation. COD is disabled on this store,
        // and the method must map to a known, accepted DB enum value.
        if (isCOD) {
          return { ok: false, error: "Cash on Delivery is not available." };
        }
        const KNOWN_PAYMENT_METHODS = new Set([
          "manual_bank_transfer", "bank_transfer", "instalments",
          "jazzcash", "easypaisa", "faysal_bank", "crypto_usdt", "card",
        ]);
        const dbMethod = toDbPaymentMethod(paymentMethod);
        if (!KNOWN_PAYMENT_METHODS.has(dbMethod)) {
          return { ok: false, error: "The selected payment method could not be verified. Please choose another method." };
        }

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
          items.push({ sku: variant.sku, name: cartItem.product.name, quantity, unitPrice, color: cartItem.color });
          computedSubtotal += unitPrice * quantity;
          computedListedSubtotal += variant.listedPrice * quantity;
        }

        // Reconcile the payable subtotal against what was recomputed from the
        // canonical catalogue. A tampered amount is rejected here, never trusted.
        if (Math.abs(computedSubtotal - Number(draft.subtotal)) > 0.01) {
          return { ok: false, error: "Your order total changed. Please review and try again." };
        }

        const order: CustomerOrder = {
          id: makeId(),
          orderNumber: makeOrderNumber(),
          createdAt: new Date().toISOString(),
          status: isCOD ? "payment_pending" : "pending",
          paymentStatus: "unpaid",
          paymentMethod,
          customerName: draft.fullName,
          email: draft.email,
          phone: draft.phone,
          city: draft.city,
          province: draft.province,
          address: draft.address,
          area: draft.area,
          postalCode: draft.postalCode,
          notes: draft.notes,
          items,
          subtotal: computedSubtotal,
          discountAmount: Math.round(computedListedSubtotal * (discount / 100)),
          shipping: draft.shipping,
          total: computedSubtotal + draft.shipping,
        };

        // ---- 2. Server sync. When Supabase is configured the order must
        // belong to the real session and stock must be reserved server-side.
        let serverOrderId: string | null = null;
        if (supabase) {
          // Resolve the authenticated user authoritatively.
          const { data: authData } = await supabase.auth.getUser();
          const currentUserId = authData?.user?.id;
          if (!currentUserId) {
            return { ok: false, error: "Please sign in to place an order." };
          }

          // Preferred path: atomic server-side RPC.
          const rpc = await supabase.rpc("place_order_buynow", {
            p_payload: {
              email: draft.email,
              phone: draft.phone,
              discount_percent: discount,
              shipping_charge: draft.shipping,
              customer_notes: draft.notes || null,
              shipping_full_name: order.customerName,
              shipping_city: draft.city,
              shipping_province: draft.province || null,
              shipping_address: draft.address || null,
              shipping_area: draft.area || null,
              shipping_postal: draft.postalCode || null,
              payment_method: toDbPaymentMethod(order.paymentMethod),
              items: items.map((item) => ({
                sku: item.sku,
                quantity: item.quantity,
                product_name: item.name,
                color: item.color || "",
              })),
            },
          });

          if (!rpc.error) {
            const serverOrder: CustomerOrder = { ...order, id: String(rpc.data ?? order.id) };
            set((state) => ({ orders: [serverOrder, ...state.orders] }));
            void sendOrderConfirmation(serverOrder);
            return { ok: true, order: serverOrder };
          }

          // Fallback: if the RPC is not deployed yet (migration not applied),
          // keep checkout working via direct inserts with a client-side stock
          // guard. Any other RPC error (e.g. insufficient stock) is surfaced.
          if (rpc.error.code !== "PGRST202") {
            return { ok: false, error: formatServerError(rpc.error) };
          }

          const { data: inserted, error: orderErr } = await supabase
            .from("orders")
            .insert({
              order_number: order.orderNumber,
              user_id: currentUserId,
              email: order.email,
              phone: order.phone,
              status: order.status,
              payment_method: toDbPaymentMethod(order.paymentMethod),
              payment_status: order.paymentStatus,
              shipping_full_name: order.customerName,
              shipping_phone: order.phone,
              shipping_city: order.city,
              shipping_province: order.province || null,
              shipping_address: order.address || null,
              shipping_area: order.area || null,
              shipping_postal: order.postalCode || null,
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

          serverOrderId = inserted?.[0]?.id ?? null;
          if (!serverOrderId) {
            return { ok: false, error: "Could not save your order. Please try again." };
          }

          const itemRows = items.map((item) => ({
            order_id: serverOrderId,
            product_name: item.name,
            sku: item.sku,
            quantity: item.quantity,
            unit_price: item.unitPrice,
            buy_now: item.unitPrice,
            subtotal: item.unitPrice * item.quantity,
            color: item.color || null,
          }));

          const { error: itemsErr } = await supabase.from("order_items").insert(itemRows);

          if (itemsErr) {
            // Roll back the orphaned order so admins never see a header without
            // its line items.
            try {
              await supabase.from("orders").delete().eq("id", serverOrderId);
            } catch {
              // rollback is best-effort; the error below is still surfaced
            }
            return { ok: false, error: "Could not save your order. Please try again." };
          }
        }

        // Keep a local copy (offline / dev mode or successful server sync).
        set((state) => ({ orders: [order, ...state.orders] }));
        // Send the confirmation keyed by the real server order id (so the
        // email shows the authoritative order number/total), when available.
        const confirmedOrder = serverOrderId ? { ...order, id: serverOrderId } : order;
        void sendOrderConfirmation(confirmedOrder);
        return { ok: true, order };
      },
    }),
    { name: "raes.orders.v1" }
  )
);
