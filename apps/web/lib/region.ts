export type RegionId = "ba" | "rs" | "hr" | "me";

export interface Region {
  id: RegionId;
  label: string;
  currency: "BAM" | "RSD" | "EUR";
  /** Koliko jedinica valute vrijedi 1 KM. */
  rate: number;
}

export const REGIONS: Region[] = [
  { id: "ba", label: "BiH (KM)", currency: "BAM", rate: 1 },
  { id: "rs", label: "Srbija (RSD)", currency: "RSD", rate: 59.9 },
  { id: "hr", label: "Hrvatska (EUR)", currency: "EUR", rate: 1 / 1.95583 },
  { id: "me", label: "Crna Gora (EUR)", currency: "EUR", rate: 1 / 1.95583 },
];

export const getRegion = (id: RegionId) => REGIONS.find((r) => r.id === id) ?? REGIONS[0];

export function formatPrice(km: number, regionId: RegionId) {
  const r = getRegion(regionId);
  const raw = km * r.rate;
  if (r.currency === "BAM") return `${Math.round(raw)} KM`;
  if (r.currency === "RSD") {
    const v = Math.round(raw / 100) * 100;
    return `${v.toLocaleString("sr-Latn-RS")} RSD`;
  }
  return `${Math.round(raw)} €`;
}
