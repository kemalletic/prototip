export type RGB = [number, number, number];

export function hex(h: string): RGB {
  const v = h.replace("#", "");
  const n = parseInt(v.length === 3 ? v.split("").map((c) => c + c).join("") : v, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgb([r, g, b]: RGB, a = 1) {
  return a >= 1 ? `rgb(${r | 0},${g | 0},${b | 0})` : `rgba(${r | 0},${g | 0},${b | 0},${a})`;
}

export function mix(a: string, b: string, t: number, alpha = 1) {
  const A = hex(a);
  const B = hex(b);
  return rgb([A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t], alpha);
}

/** amt > 0 posvjetljava prema bijeloj, amt < 0 tamni prema crnoj. */
export function shade(h: string, amt: number, alpha = 1) {
  return amt >= 0 ? mix(h, "#ffffff", amt, alpha) : mix(h, "#000000", -amt, alpha);
}

export function toHex(c: string) {
  // prima rgb(...) ili #hex, vraća #hex
  if (c.startsWith("#")) return c;
  const m = c.match(/\d+(\.\d+)?/g)!.map(Number);
  return "#" + m.slice(0, 3).map((x) => Math.round(x).toString(16).padStart(2, "0")).join("");
}

export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashString(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
