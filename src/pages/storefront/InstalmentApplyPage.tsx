import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CheckCircle2, ShieldCheck } from "lucide-react";
import { getProductBySlug } from "@/data/catalog";
import { useSettings } from "@/features/settings/store";
import { useAuth } from "@/features/auth/AuthContext";
import { instalmentPlan } from "@/lib/pricing";
import { formatPKR } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

export function InstalmentApplyPage() {
  const [params] = useSearchParams();
  const { settings } = useSettings();
  const { isAuthenticated } = useAuth();
  const productSlug = params.get("product") ?? "";
  const product = productSlug ? getProductBySlug(productSlug) : undefined;
  const variant = product?.variants[0];

  const [tenure, setTenure] = useState<number>(12);
  const [consent, setConsent] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    fullName: "", mobile: "", email: "", cnic: "", address: "", employment: "", income: "",
  });

  const plan = useMemo(
    () => (variant ? instalmentPlan(variant.listedPrice, tenure, settings.instalmentAdvancePercent, settings.instalmentMarkupPercent) : null),
    [variant, tenure, settings.instalmentAdvancePercent, settings.instalmentMarkupPercent]
  );

  function setField(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-xl py-10 text-center">
        <CheckCircle2 className="mx-auto mb-4 h-14 w-14 text-emerald-600" />
        <h1 className="text-2xl font-bold">Application submitted</h1>
        <p className="mt-2 text-muted-foreground">
          Our team will review your instalment application and contact you. You can track its status from your account.
        </p>
        <Button asChild className="mt-6"><a href="/account/instalments">Track status</a></Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">Instalment Application</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {product ? `Applying for ${product.name}` : "Tell us which phone you'd like on instalments."}
        </p>
      </div>

      {!product && (
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">
              Choose a phone from the catalog first, or continue and mention your preferred model in the notes.
            </p>
            <Button asChild variant="outline" className="mt-3"><a href="/phones">Browse phones</a></Button>
          </CardContent>
        </Card>
      )}

      {variant && plan && (
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="font-semibold">{product?.name}</p>
                <p className="text-sm text-muted-foreground">{variant.storage} · {variant.ram}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Listed price</p>
                <p className="text-xl font-bold">{formatPKR(variant.listedPrice)}</p>
              </div>
            </div>
            <Separator className="my-4" />
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Advance ({settings.instalmentAdvancePercent}%)</span><span className="font-semibold">{formatPKR(plan.advance)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Remaining balance</span><span className="font-semibold">{formatPKR(plan.remaining)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Monthly ({tenure} months)</span><span className="font-semibold">{formatPKR(plan.monthly)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Total payable (0% markup)</span><span className="font-semibold">{formatPKR(plan.total)}</span></div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-6">
          <h2 className="mb-4 text-lg font-bold">Your details</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Full name</Label>
              <Input required value={form.fullName} onChange={(e) => setField("fullName", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Mobile number</Label>
              <Input required value={form.mobile} onChange={(e) => setField("mobile", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setField("email", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>CNIC number</Label>
              <Input value={form.cnic} onChange={(e) => setField("cnic", e.target.value)} placeholder="XXXXX-XXXXXXX-X" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Current address</Label>
              <Textarea value={form.address} onChange={(e) => setField("address", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Employment status</Label>
              <Select value={form.employment} onValueChange={(v) => setField("employment", v)}>
                <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="employed">Employed</SelectItem>
                  <SelectItem value="self-employed">Self-employed</SelectItem>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Approx. monthly income</Label>
              <Input type="number" value={form.income} onChange={(e) => setField("income", e.target.value)} />
            </div>
          </div>

          <div className="mt-5 space-y-2">
            <div className="space-y-1.5">
              <Label>Preferred tenure</Label>
              <Select value={String(tenure)} onValueChange={(v) => setTenure(Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {settings.instalmentTenures.map((t) => (
                    <SelectItem key={t} value={String(t)}>{t} months</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <label className="mt-5 flex items-start gap-3 rounded-xl bg-muted/40 p-4 text-sm">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 h-4 w-4" />
            <span>
              I consent to RAES TECH securely processing my personal data, including my CNIC details, solely for the purpose of
              processing this instalment application and, if approved, administering my agreement. Documents are stored privately and
              access is restricted.
            </span>
          </label>

          <div className="mt-4 flex items-start gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
            <span>Documents you upload are kept in a private, access-controlled storage. No public links are ever generated.</span>
          </div>

          <Button
            size="lg"
            className="mt-6 w-full"
            disabled={!consent || !form.fullName || !form.mobile}
            onClick={() => setSubmitted(true)}
          >
            Submit Application
          </Button>
          {!isAuthenticated && (
            <p className="mt-2 text-center text-xs text-muted-foreground">
              You'll need to be logged in to track your application. <a href="/login" className="underline">Login</a> or <a href="/register" className="underline">create an account</a>.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
