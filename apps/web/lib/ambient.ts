// Svjetlo na sajtu prati doba dana kod posjetioca.

export type Phase = "jutro" | "dan" | "vece" | "noc";

export interface Ambient {
  phase: Phase;
  label: string;
  spot: string;
  spotIntensity: number;
  fill: number;
  wall: string;
  fog: string;
}

const AMBIENTS: Record<Phase, Ambient> = {
  jutro: { phase: "jutro", label: "jutarnje svjetlo", spot: "#ffe6c9", spotIntensity: 46, fill: 0.5, wall: "#1a1917", fog: "#0d0c0b" },
  dan: { phase: "dan", label: "dnevno svjetlo", spot: "#fff6ea", spotIntensity: 50, fill: 0.62, wall: "#1c1c1b", fog: "#0e0e0d" },
  vece: { phase: "vece", label: "večernje svjetlo", spot: "#ffc890", spotIntensity: 48, fill: 0.34, wall: "#171310", fog: "#0c0a09" },
  noc: { phase: "noc", label: "noćno svjetlo", spot: "#ffd9ad", spotIntensity: 56, fill: 0.16, wall: "#121110", fog: "#0b0b0c" },
};

export function phaseForHour(h: number): Phase {
  if (h >= 6 && h < 10) return "jutro";
  if (h >= 10 && h < 17) return "dan";
  if (h >= 17 && h < 21) return "vece";
  return "noc";
}

export function getAmbient(): Ambient {
  let hour = new Date().getHours();
  if (typeof window !== "undefined") {
    const q = new URLSearchParams(window.location.search).get("sat");
    if (q !== null && !Number.isNaN(Number(q))) hour = Number(q) % 24;
  }
  return AMBIENTS[phaseForHour(hour)];
}

export function visitorCity(): string | null {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const city = tz.split("/")[1];
    return city ? city.replace(/_/g, " ") : null;
  } catch {
    return null;
  }
}
