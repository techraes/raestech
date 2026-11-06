import { useState } from "react";
import { NavLink, Outlet, Link } from "react-router-dom";
import {
  LayoutDashboard, Package, ShoppingBag, Settings, LogOut, Store,
  CreditCard, ShieldCheck, ArrowLeft, FileUp, Palette, LayoutTemplate,
  Wrench, History, Search, Images,
} from "lucide-react";
import { useAuth } from "@/features/auth/AuthContext";
import { useSettings } from "@/features/settings/store";
import { useCan, type AdminPermission } from "@/features/auth/permissions";
import { cn } from "@/lib/utils";

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  perm: AdminPermission;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const GROUPS: NavGroup[] = [
  {
    title: "Overview",
    items: [
      { to: "/admin", label: "Dashboard", icon: LayoutDashboard, perm: "dashboard" },
      { to: "/admin/system", label: "System", icon: Wrench, perm: "system" },
    ],
  },
  {
    title: "Catalogue",
    items: [
      { to: "/admin/products", label: "Products", icon: Package, perm: "products" },
      { to: "/admin/import", label: "Import Catalogue", icon: FileUp, perm: "products" },
      { to: "/admin/images", label: "Image Manager", icon: Images, perm: "images" },
    ],
  },
  {
    title: "Sales",
    items: [
      { to: "/admin/orders", label: "Orders", icon: ShoppingBag, perm: "orders" },
      { to: "/admin/payments", label: "Payments", icon: CreditCard, perm: "payments" },
    ],
  },
  {
    title: "Design & Content",
    items: [
      { to: "/admin/appearance", label: "Branding & Appearance", icon: Palette, perm: "appearance" },
      { to: "/admin/homepage", label: "Homepage Builder", icon: LayoutTemplate, perm: "homepage" },
      { to: "/admin/settings", label: "Website Settings", icon: Settings, perm: "settings" },
    ],
  },
  {
    title: "Access & Activity",
    items: [
      { to: "/admin/roles", label: "Roles & Permissions", icon: ShieldCheck, perm: "roles" },
      { to: "/admin/audit", label: "Audit Log", icon: History, perm: "audit" },
    ],
  },
];

export function AdminLayout() {
  const { user, signOut } = useAuth();
  const { settings } = useSettings();
  const can = useCan();
  const [q, setQ] = useState("");

  const needle = q.trim().toLowerCase();
  const filteredGroups = GROUPS.map((g) => ({
    ...g,
    items: g.items.filter(
      (item) => can(item.perm) && (!needle || item.label.toLowerCase().includes(needle) || item.to.includes(needle))
    ),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="flex min-h-screen bg-muted/30">
      {/* Sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:flex">
        <div className="flex items-center gap-2 border-b px-5 py-4">
          <Store className="h-5 w-5" />
          <div>
            <p className="text-sm font-bold leading-tight">{settings.storeName}</p>
            <p className="text-[11px] text-sidebar-foreground/70">Admin Control Centre</p>
          </div>
        </div>

        <div className="border-b p-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-sidebar-foreground/50" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search admin…"
              className="h-9 w-full rounded-md border bg-background pl-9 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              aria-label="Search admin"
            />
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-3">
          {filteredGroups.map((group) => (
            <div key={group.title} className="mb-4">
              <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wide text-sidebar-foreground/70">
                {group.title}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === "/admin"}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                        isActive ? "bg-primary/20 text-primary-foreground" : "text-sidebar-foreground hover:bg-sidebar-foreground/10 hover:text-sidebar-foreground"
                      )
                    }
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t p-3">
          <div className="flex items-center gap-2 px-2 pb-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-900 text-xs font-bold text-white">
              {user?.fullName?.[0]?.toUpperCase() ?? "A"}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{user?.fullName || "Admin"}</p>
              <p className="truncate text-[11px] text-sidebar-foreground/60">{user?.role}</p>
            </div>
          </div>
          <Link to="/" className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-sidebar-foreground/70 hover:text-sidebar-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to store
          </Link>
          <button
            onClick={signOut}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-red-600 hover:bg-red-50"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </aside>

      {/* Mobile top bar + content */}
      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border bg-sidebar px-4 py-3 text-sidebar-foreground lg:hidden">
          <Link to="/admin" className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            <span className="text-sm font-bold">Admin</span>
          </Link>
          <button onClick={signOut} className="text-sm text-red-600">Sign out</button>
        </header>

        <main className="flex-1 p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
