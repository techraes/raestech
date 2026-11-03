import { Link } from "react-router-dom";
import { Banknote, Percent, ShieldCheck, Clock, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useSettings } from "@/features/settings/store";
import { instalmentPlan } from "@/lib/pricing";
import { formatPKR } from "@/lib/utils";

export function InstalmentInfoPage() {
  const { settings } = useSettings();
  const tenures = settings.instalmentTenures;
  const plan = (tenure: number) => instalmentPlan(100000, tenure, settings.instalmentAdvancePercent, settings.instalmentMarkupPercent);

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Instalment purchases</h1>
        <p className="mt-2 text-muted-foreground">
          Buy your phone on easy monthly instalments — full listed price, 0% markup, no guarantor required.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="p-5">
            <Percent className="mb-3 h-6 w-6" />
            <p className="font-semibold">0% markup</p>
            <p className="text-sm text-muted-foreground">You pay the same total as the listed price — no hidden interest.</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <Clock className="mb-3 h-6 w-6" />
            <p className="font-semibold">{settings.instalmentAdvancePercent}% advance</p>
            <p className="text-sm text-muted-foreground">A one-time advance payment, then monthly payments over your chosen tenure.</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-6">
          <h2 className="mb-4 text-lg font-bold">Example — Rs. 100,000 phone</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground">
                  <th className="pb-2">Tenure</th>
                  <th className="pb-2">Advance (20%)</th>
                  <th className="pb-2">Monthly</th>
                  <th className="pb-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {tenures.map((t) => {
                  const p = plan(t);
                  return (
                    <tr key={t} className="border-t">
                      <td className="py-2 font-semibold">{t} months</td>
                      <td className="py-2">{formatPKR(p.advance)}</td>
                      <td className="py-2">{formatPKR(p.monthly)}</td>
                      <td className="py-2">{formatPKR(p.total)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            The final instalment is rounded so the remaining balance reaches exactly zero. Illustration uses the 20% default advance.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3 p-6">
          <h2 className="text-lg font-bold">How it works</h2>
          <ul className="space-y-2 text-sm">
            <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 text-emerald-600" /> Choose your phone and preferred tenure (3, 6, 9 or 12 months).</li>
            <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 text-emerald-600" /> Submit an instalment application (name, contact, CNIC).</li>
            <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 text-emerald-600" /> Our team reviews your application and any documents securely.</li>
            <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 text-emerald-600" /> After approval you pay the advance and we prepare your agreement.</li>
            <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 text-emerald-600" /> You accept the agreement, then we dispatch your phone.</li>
            <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 text-emerald-600" /> Pay each monthly instalment by the due date. Late payments may affect your account.</li>
          </ul>
          <div className="flex items-start gap-2 rounded-xl bg-amber-50 p-4 text-xs text-amber-800">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
            <span>Instalment accounts are subject to review and approval. Not all applications are approved. See the Instalment Agreement for full terms.</span>
          </div>
        </CardContent>
      </Card>

      <Button asChild size="lg">
        <Link to="/instalments/apply">Apply for Instalments</Link>
      </Button>
    </div>
  );
}
