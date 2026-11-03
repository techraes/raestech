import { Link } from "react-router-dom";
import { ShoppingBag, CreditCard, CalendarClock, Heart, MapPin } from "lucide-react";
import { useAuth } from "@/features/auth/AuthContext";
import { Card, CardContent } from "@/components/ui/card";

export function AccountHome() {
  const { user } = useAuth();
  const tiles = [
    { to: "/account/orders", icon: ShoppingBag, label: "Orders", desc: "View order history & tracking" },
    { to: "/account/payments", icon: CreditCard, label: "Payments", desc: "Upload receipts & see status" },
    { to: "/account/instalments", icon: CalendarClock, label: "Instalments", desc: "Applications & schedules" },
    { to: "/account/wishlist", icon: Heart, label: "Wishlist", desc: "Your saved phones" },
    { to: "/account/addresses", icon: MapPin, label: "Addresses", desc: "Manage saved addresses" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Dashboard</h1>
        <p className="text-sm text-muted-foreground">Welcome back, {user?.fullName || "customer"}.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tiles.map((t) => (
          <Link key={t.to} to={t.to}>
            <Card className="h-full transition-colors hover:border-primary">
              <CardContent className="p-5">
                <t.icon className="mb-3 h-6 w-6" />
                <p className="font-semibold">{t.label}</p>
                <p className="text-sm text-muted-foreground">{t.desc}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
