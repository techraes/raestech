import { MapPin, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function AccountAddresses() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Address book</h1>
        <Button size="sm"><Plus className="h-4 w-4" /> Add</Button>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center py-16 text-center">
          <MapPin className="mb-3 h-10 w-10 text-muted-foreground" />
          <p className="font-medium">No saved addresses</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Save delivery addresses to check out faster. You can also enter a new address at checkout.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
