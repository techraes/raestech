import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPKR(value: number | null | undefined): string {
  if (value == null) return "—";
  return `Rs. ${value.toLocaleString("en-PK")}`;
}

/**
 * Display label for a product's condition. Every catalogue item is sold
 * factory-sealed / new box packed, so no matter what raw value sits in the
 * seed data (e.g. "Kit - phone only, no box", "Retailer price listed…"),
 * the storefront surfaces a single clean label.
 */
export function displayCondition(): string {
  return "Box Packed";
}

export function formatDate(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("en-PK", { year: "numeric", month: "short", day: "numeric" });
}
