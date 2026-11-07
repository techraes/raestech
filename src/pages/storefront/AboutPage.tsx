import { useSettings } from "@/features/settings/store";
import { Seo } from "@/lib/seo";

export function AboutPage() {
  const { settings } = useSettings();
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Seo title={`About ${settings.storeName} | RAES TECH`} canonicalPath="/about" />
      <h1 className="text-3xl font-bold">About {settings.storeName}</h1>
      <p className="text-muted-foreground">
        {settings.storeName} is a Pakistan-based smartphone store. We offer genuine, clearly-conditioned smartphones at honest prices —
        with a 22% Buy-Now discount or 0%-markup instalment plans — and deliver nationwide.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border bg-card p-5">
          <p className="font-semibold">Honest listings</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Every phone states its condition, PTA status, SIM-lock status and warranty. JV / SIM-locked phones are never advertised as factory-unlocked.
          </p>
        </div>
        <div className="rounded-2xl border bg-card p-5">
          <p className="font-semibold">Flexible payment</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Pay in full and save 22%, or spread the cost over interest-free instalments with a 20% advance (11% off during the 11.11 sale).
          </p>
        </div>
        <div className="rounded-2xl border bg-card p-5">
          <p className="font-semibold">Nationwide delivery</p>
          <p className="mt-1 text-sm text-muted-foreground">We ship across Pakistan and keep you updated at every step.</p>
        </div>
        <div className="rounded-2xl border bg-card p-5">
          <p className="font-semibold">Verified payments</p>
          <p className="mt-1 text-sm text-muted-foreground">Bank transfers are verified manually before dispatch for your protection.</p>
        </div>
      </div>
      <p className="text-sm text-muted-foreground">
        Contact us at {settings.supportEmail} or {settings.supportPhone}.
      </p>
    </div>
  );
}
