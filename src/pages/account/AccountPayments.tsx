import { CreditCard } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function AccountPayments() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">My Payments</h1>
      <Card>
        <CardContent className="flex flex-col items-center py-16 text-center">
          <CreditCard className="mb-3 h-10 w-10 text-muted-foreground" />
          <p className="font-medium">No payments yet</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            After placing an order you can upload your bank transfer receipt here for manual verification.
          </p>
          <Button asChild className="mt-5"><a href="/payment-instructions">View payment instructions</a></Button>
        </CardContent>
      </Card>
    </div>
  );
}
