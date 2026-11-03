import { Landmark, Upload, ClipboardList } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useSettings } from "@/features/settings/store";
import { Button } from "@/components/ui/button";

export function PaymentInstructionsPage() {
  const { settings } = useSettings();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Payment instructions</h1>
        <p className="mt-2 text-muted-foreground">
          We accept manual bank transfers only. Cash on Delivery is not available.
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <Landmark className="h-8 w-8" />
            <div>
              <p className="text-lg font-bold">Faysal Bank</p>
              <p className="text-sm text-muted-foreground">Manual bank transfer</p>
            </div>
          </div>
          <div className="mt-5 rounded-xl bg-muted/50 p-5 text-sm">
            <p className="text-muted-foreground">
              Bank account details are configured by the store owner in the Admin Panel. After placing an order, the exact account
              details for your payment will be shown on your order.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h2 className="mb-4 text-lg font-bold">How to pay</h2>
          <ol className="space-y-3 text-sm">
            <li className="flex gap-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">1</span> Place your order and note the total amount.</li>
            <li className="flex gap-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">2</span> Transfer the exact amount to the Faysal Bank account shown on your order.</li>
            <li className="flex gap-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">3</span> Enter your payment reference and upload a screenshot/receipt of the transfer.</li>
            <li className="flex gap-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">4</span> Our staff verify the payment against the actual bank transaction before we dispatch your order.</li>
          </ol>
          <div className="mt-5 flex items-start gap-2 rounded-xl bg-amber-50 p-4 text-xs text-amber-800">
            <ClipboardList className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              An uploaded receipt is not proof of payment. A payment is only confirmed after our staff independently verify it in the
              bank account. This protects both you and us.
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <Upload className="h-8 w-8" />
            <div>
              <p className="font-semibold">Upload your receipt</p>
              <p className="text-sm text-muted-foreground">After ordering, go to My Orders → your order → Upload receipt.</p>
            </div>
          </div>
          <Button asChild variant="outline" className="mt-4"><a href="/account/orders">Go to My Orders</a></Button>
        </CardContent>
      </Card>

      <p className="text-center text-xs text-muted-foreground">
        Questions? Contact {settings.supportEmail} or {settings.supportPhone}.
      </p>
    </div>
  );
}
