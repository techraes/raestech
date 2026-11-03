import type { ProductVariant } from "@/types";

export type PtaTone = "success" | "warning" | "outline";

export interface PtaInfo {
  label: string;
  tone: PtaTone;
  code: "pta" | "nonpta" | "jv" | "unknown";
}

/**
 * Classify a variant's PTA / SIM-lock status from its real listing data.
 * JV / SIM-locked devices are always labelled as such (never factory-unlocked).
 */
export function ptaInfo(variant: Pick<ProductVariant, "pta_status" | "notes"> | { pta_status?: string; notes?: string }): PtaInfo {
  const combined = `${variant.pta_status ?? ""} ${variant.notes ?? ""}`.toLowerCase();
  if (/jv|sim-locked|carrier-locked|sim locked/.test(combined)) {
    return { label: "JV / SIM-Locked", tone: "warning", code: "jv" };
  }
  if (/(non-pta|non pta|not pta|unregistered)/.test(combined)) {
    return { label: "Non-PTA", tone: "outline", code: "nonpta" };
  }
  if (/pta approved|pta tax paid|pta registered|official pta/.test(combined)) {
    return { label: "PTA Approved", tone: "success", code: "pta" };
  }
  return { label: "PTA — verify", tone: "outline", code: "unknown" };
}
