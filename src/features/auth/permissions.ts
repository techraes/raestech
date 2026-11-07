import { useAuth } from "./AuthContext";
import type { UserRole } from "@/types";

/**
 * RBAC: named admin capabilities. A role grants a set of permissions; the
 * Super Admin always has all of them. These checks gate admin UI/navigation,
 * but the real enforcement for sensitive operations lives server-side
 * (RLS + security-definer functions).
 */
export type AdminPermission =
  | "dashboard"
  | "settings"
  | "appearance"
  | "homepage"
  | "payments"
  | "shipping"
  | "warranty"
  | "content"
  | "menus"
  | "coupons"
  | "discounts"
  | "social"
  | "seo"
  | "roles"
  | "system"
  | "audit"
  | "products"
  | "images"
  | "orders"
  | "customers"
  | "instalments"
  | "communications";

export const ALL_PERMISSIONS: AdminPermission[] = [
  "dashboard", "settings", "appearance", "homepage", "payments", "shipping",
  "warranty", "content", "menus", "coupons", "discounts", "social", "seo", "roles",
  "system", "audit", "products", "images", "orders", "customers", "instalments", "communications",
];

export const ADMIN_ROLES: UserRole[] = [
  "super_admin", "product_manager", "order_manager", "payment_verifier",
  "instalment_reviewer", "content_manager", "finance_manager", "support_staff",
];

const ROLE_PERMISSIONS: Record<UserRole, Set<AdminPermission>> = {
  customer: new Set(),
  super_admin: new Set(ALL_PERMISSIONS),
  product_manager: new Set(["dashboard", "products", "images", "homepage", "seo", "settings"]),
  order_manager: new Set(["dashboard", "orders", "customers"]),
  payment_verifier: new Set(["dashboard", "payments", "orders", "audit"]),
  instalment_reviewer: new Set(["dashboard", "instalments", "customers"]),
  content_manager: new Set(["dashboard", "content", "menus", "social", "seo", "appearance", "homepage"]),
  finance_manager: new Set(["dashboard", "payments", "orders", "audit", "settings"]),
  support_staff: new Set(["dashboard", "customers", "orders", "content"]),
};

export const DEFAULT_ROLE_PERMISSIONS: Record<UserRole, AdminPermission[]> = Object.fromEntries(
  (Object.entries(ROLE_PERMISSIONS) as [UserRole, Set<AdminPermission>][]).map(([role, set]) => [role, Array.from(set)])
) as Record<UserRole, AdminPermission[]>;

export function roleCan(role: UserRole | undefined, permission: AdminPermission): boolean {
  if (role === "super_admin") return true;
  if (!role) return false;
  return ROLE_PERMISSIONS[role]?.has(permission) ?? false;
}

export function roleLabel(role: UserRole | undefined): string {
  if (!role) return "—";
  const map: Record<string, string> = {
    super_admin: "Super Admin",
    product_manager: "Product Manager",
    order_manager: "Order Manager",
    payment_verifier: "Payment Verifier",
    instalment_reviewer: "Instalment Reviewer",
    content_manager: "Content Manager",
    finance_manager: "Finance Manager",
    support_staff: "Support Staff",
  };
  return map[role] ?? role;
}

/** Returns a `can(permission)` predicate for the current user. */
export function useCan(): (permission: AdminPermission) => boolean {
  const { user, isSuperAdmin } = useAuth();
  const role = isSuperAdmin ? "super_admin" : (user?.role as UserRole | undefined);
  return (permission) => roleCan(role, permission);
}
