import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from "lucide-react";
import { useCart } from "@/store/cart";
import { useSettings } from "@/features/settings/store";
import { buyNowPrice, discountedPrice } from "@/lib/pricing";
import { formatPKR } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function CartPage() {
  const { items, updateQuantity, removeItem, subtotal } = useCart();
  const { settings } = useSettings();

  const buyNowSubtotal = items.reduce((s, i) => s + discountedPrice(i.variant.listedPrice, settings.buyNowDiscountPercent) * i.quantity, 0);
  const listedSubtotal = items.reduce((s, i) => s + i.variant.listedPrice * i.quantity, 0);
  const shipping = buyNowSubtotal >= settings.freeShippingThreshold || buyNowSubtotal === 0 ? 0 : settings.shippingCharge;
  const total = buyNowSubtotal + shipping;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold sm:text-3xl">Shopping Cart</h1>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-20 text-center">
          <ShoppingBag className="mb-4 h-10 w-10 text-muted-foreground" />
          <p className="text-lg font-medium">Your cart is empty</p>
          <p className="mt-1 text-sm text-muted-foreground">Explore our range of smartphones and find your next device.</p>
          <Button asChild className="mt-6">
            <Link to="/phones">Browse Smartphones</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
          <div className="space-y-4">
            {items.map((item) => {
              const bn = buyNowPrice(item.variant.listedPrice, settings.buyNowDiscountPercent);
              return (
                <Card key={`${item.variant.sku}__${(item.color || "").toLowerCase()}`} className="flex gap-4 p-4">
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-muted/50">
                    <span className="text-2xl font-black text-muted-foreground">{item.product.model[0]}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link to={`/product/${item.product.slug}`} className="font-semibold hover:underline">
                      {item.product.name}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {item.variant.storage} · {item.variant.ram}
                      {item.color ? ` · ${item.color}` : ""}
                    </p>
                    <p className="mt-1 text-sm font-bold">{formatPKR(bn * item.quantity)}</p>
                    <p className="text-xs text-muted-foreground line-through">{formatPKR(item.variant.listedPrice * item.quantity)}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.variant.sku, item.quantity - 1, item.color)}>
                        <Minus className="h-3.5 w-3.5" />
                      </Button>
                      <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                      <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.variant.sku, item.quantity + 1, item.color)}>
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="ml-auto h-8 w-8 text-red-600" onClick={() => removeItem(item.variant.sku, item.color)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          <div className="space-y-4">
            <Card className="p-5">
              <h2 className="mb-3 text-lg font-bold">Order summary</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal (Buy Now)</span>
                  <span className="font-semibold">{formatPKR(buyNowSubtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">List price value</span>
                  <span className="text-muted-foreground line-through">{formatPKR(listedSubtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">You save</span>
                  <span className="font-medium text-emerald-700">{formatPKR(listedSubtotal - buyNowSubtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>{shipping === 0 ? "Free" : formatPKR(shipping)}</span>
                </div>
                <div className="my-2 border-t" />
                <div className="flex justify-between text-base font-bold">
                  <span>Total</span>
                  <span>{formatPKR(total)}</span>
                </div>
              </div>
              <Button asChild size="lg" className="mt-4 w-full">
                <Link to="/checkout">Proceed to Checkout <ArrowRight className="h-4 w-4" /></Link>
              </Button>
              <p className="mt-3 text-center text-xs text-muted-foreground">
                Cash on Delivery is not available. Pay by bank transfer.
              </p>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
