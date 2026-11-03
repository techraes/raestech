import { Mail, Phone, MessageCircle } from "lucide-react";
import { useSettings } from "@/features/settings/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";
import { CheckCircle2 } from "lucide-react";

export function ContactPage() {
  const { settings } = useSettings();
  const [sent, setSent] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const log = JSON.parse(localStorage.getItem("raes.contact.v1") ?? "[]") as unknown[];
      log.push({
        id: Date.now().toString(36),
        name,
        email,
        subject,
        message,
        createdAt: new Date().toISOString(),
      });
      localStorage.setItem("raes.contact.v1", JSON.stringify(log));
    } catch {
      /* storage unavailable — ignore */
    }
    setSent(true);
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Contact us</h1>
        <p className="mt-2 text-muted-foreground">We're here to help with your order, a product question, or an instalment enquiry.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardContent className="p-6">
            <h2 className="mb-4 text-lg font-bold">Send a message</h2>
            {sent ? (
              <div className="flex flex-col items-center py-10 text-center">
                <CheckCircle2 className="mb-3 h-10 w-10 text-emerald-600" />
                <p className="font-medium">Thanks — your message has been received.</p>
                <p className="text-sm text-muted-foreground">We'll reply by email or phone.</p>
              </div>
            ) : (
              <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5"><Label>Name</Label><Input required placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} /></div>
                <div className="space-y-1.5"><Label>Email</Label><Input required type="email" placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
                <div className="space-y-1.5 sm:col-span-2"><Label>Subject</Label><Input placeholder="How can we help?" value={subject} onChange={(e) => setSubject(e.target.value)} /></div>
                <div className="space-y-1.5 sm:col-span-2"><Label>Message</Label><Textarea required rows={5} value={message} onChange={(e) => setMessage(e.target.value)} /></div>
                <Button type="submit" className="sm:col-span-2">Send message</Button>
              </form>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardContent className="space-y-4 p-5">
              <div className="flex items-center gap-3"><Mail className="h-5 w-5 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">Email</p><p className="text-sm font-medium">{settings.supportEmail}</p></div></div>
              <div className="flex items-center gap-3"><Phone className="h-5 w-5 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">Phone</p><p className="text-sm font-medium">{settings.supportPhone}</p></div></div>
              <div className="flex items-center gap-3"><MessageCircle className="h-5 w-5 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">WhatsApp</p><p className="text-sm font-medium">{settings.whatsapp}</p></div></div>
            </CardContent>
          </Card>
          {settings.instagram && <a href={settings.instagram} target="_blank" rel="noreferrer" className="block rounded-xl border bg-card p-4 text-sm font-medium hover:bg-accent">Instagram — {settings.instagram}</a>}
          {settings.facebook && <a href={settings.facebook} target="_blank" rel="noreferrer" className="block rounded-xl border bg-card p-4 text-sm font-medium hover:bg-accent">Facebook</a>}
          {settings.tiktok && <a href={settings.tiktok} target="_blank" rel="noreferrer" className="block rounded-xl border bg-card p-4 text-sm font-medium hover:bg-accent">TikTok</a>}
        </div>
      </div>
    </div>
  );
}
