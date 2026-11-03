import { ShoppingBag } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function AdminOrders() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Orders</h1>
      <Card>
        <CardContent className="flex flex-col items-center py-16 text-center">
          <ShoppingBag className="mb-3 h-10 w-10 text-muted-foreground" />
          <p className="font-medium">No orders yet</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Customer orders appear here with full payment and shipment status once Supabase is connected.
          </p>
          <Button asChild variant="outline" className="mt-5"><a href="/">Open storefront</a></Button>
        </CardContent>
      </Card>
    </div>
  );
}
