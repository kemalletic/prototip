import type { Tier } from "./store";

/**
 * Odlučuje da li uređaj dobija punu 3D verziju ili laganu verziju sa slikama.
 * 3D nikad ne smije blokirati kupovinu.
 */
export function detectTier(): Exclude<Tier, "pending"> {
  const q = new URLSearchParams(window.location.search).get("verzija");
  if (q === "lagana") return "static";
  if (q === "puna") return "full";

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return "static";

  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
  if (nav.connection?.saveData) return "static";
  if (nav.deviceMemory !== undefined && nav.deviceMemory < 3) return "static";

  try {
    const c = document.createElement("canvas");
    const gl = c.getContext("webgl2");
    if (!gl) return "static";
    const ext = gl.getExtension("WEBGL_lose_context");
    ext?.loseContext();
  } catch {
    return "static";
  }
  return "full";
}

export const isTouch = () =>
  typeof window !== "undefined" && window.matchMedia("(hover: none), (pointer: coarse)").matches;
