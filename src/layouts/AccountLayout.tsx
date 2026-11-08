import { NavLink, Outlet, Link } from "react-router-dom";
import { LayoutDashboard, ShoppingBag, CreditCard, CalendarClock, Heart, MapPin, ArrowLeft } from "lucide-react";
import { useAuth } from "@/features/auth/AuthContext";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/account", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/account/orders", label: "Orders", icon: ShoppingBag },
  { to: "/account/payments", label: "Payments", icon: CreditCard },
  { to: "/account/instalments", label: "Instalments", icon: CalendarClock },
  { to: "/account/wishlist", label: "Wishlist", icon: Heart },
  { to: "/account/addresses", label: "Addresses", icon: MapPin },
];

export function AccountLayout() {
  const { user } = useAuth();
  return (
    <div className="mx-auto grid w-full max-w-7xl gap-6 lg:grid-cols-[240px_1fr]">
      <aside className="min-w-0 lg:border-r lg:pr-6">
        <div className="mb-4">
          <p className="text-lg font-bold">Hello, {user?.fullName || "Customer"}</p>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
        </div>
        <nav className="flex flex-wrap gap-1 lg:flex-col">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium",
                  isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )
              }
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span className="whitespace-nowrap">{item.label}</span>
            </NavLink>
          ))}
          <Link to="/" className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground">
            <ArrowLeft className="h-4 w-4 shrink-0" /> <span className="whitespace-nowrap">Back to store</span>
          </Link>
        </nav>
      </aside>
      <div className="min-w-0">
        <Outlet />
      </div>
    </div>
  );
}
