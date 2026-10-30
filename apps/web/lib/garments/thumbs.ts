"use client";

import type { Product } from "../catalog";
import { drawGarment } from "./draw";
import { drawDrape } from "./drape";

const cache = new Map<string, string>();

/** Mala slika komada za mrežu, korpu i laganu verziju sajta. */
export function thumbnail(p: Product, side: "front" | "back" = "front", width = 420): string {
  const key = `${p.slug}:${side}:${width}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const { color } = drawGarment(p, side, width, false);
  const url = color.toDataURL("image/png");
  cache.set(key, url);
  return url;
}

export function drapePreview(width = 900): string {
  const key = `drape:${width}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const url = drawDrape(false, width).color.toDataURL("image/jpeg", 0.86);
  cache.set(key, url);
  return url;
}

const big = new Map<string, HTMLCanvasElement>();

/** Velika slika za lupu u laganoj verziji. */
export function largeCanvas(p: Product, side: "front" | "back"): HTMLCanvasElement {
  const key = `${p.slug}:${side}`;
  const hit = big.get(key);
  if (hit) return hit;
  const c = drawGarment(p, side, 1400, false).color;
  big.set(key, c);
  return c;
}
