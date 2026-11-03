import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPKR(value: number | null | undefined): string {
  if (value == null) return "—";
  return `Rs. ${value.toLocaleString("en-PK")}`;
}

export function formatDate(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("en-PK", { year: "numeric", month: "short", day: "numeric" });
}
