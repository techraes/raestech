import { CalendarClock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function AccountInstalments() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Instalments</h1>
      <Card>
        <CardContent className="flex flex-col items-center py-16 text-center">
          <CalendarClock className="mb-3 h-10 w-10 text-muted-foreground" />
          <p className="font-medium">No instalment applications</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Submit an instalment application to see its status, your agreement and payment schedule here.
          </p>
          <Button asChild className="mt-5"><a href="/instalments/apply">Apply now</a></Button>
        </CardContent>
      </Card>
    </div>
  );
}
