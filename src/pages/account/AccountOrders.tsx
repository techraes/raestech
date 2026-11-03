import { ShoppingBag } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface OrderRow {
  id: string;
  date: string;
  status: string;
  total: string;
  items: number;
}

const SAMPLE_ORDERS: OrderRow[] = [];

export function AccountOrders() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">My Orders</h1>
      {SAMPLE_ORDERS.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-16 text-center">
            <ShoppingBag className="mb-3 h-10 w-10 text-muted-foreground" />
            <p className="font-medium">No orders yet</p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              When you place an order, it will appear here with its payment and tracking status.
            </p>
            <Button asChild className="mt-5"><a href="/phones">Browse phones</a></Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {SAMPLE_ORDERS.map((o) => (
            <Card key={o.id}>
              <CardContent className="flex items-center justify-between gap-4 p-4">
                <div>
                  <p className="font-semibold">{o.id}</p>
                  <p className="text-xs text-muted-foreground">{o.date} · {o.items} item(s)</p>
                </div>
                <Badge variant="secondary">{o.status}</Badge>
                <p className="font-bold">{o.total}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
