import type { GarmentKind } from "./catalog";
import { DH, DW } from "./garments/draw";

/** Metara po jedinici kroja. */
export const UNIT = 0.00085;
export const GW = DW * UNIT;
export const GH = DH * UNIT;
export const ROD_Y = 2.32;
export const HOOK_DROP = 0.15;
export const SPACING = 0.98;
export const WALL_Z = -0.62;
export const HERO_X = -3.7;
export const DRAPE_TOP = 3.05;
export const FOCUS_Z = 0.95;
export const FOV = 35;

/** Koliko se komad "naduje" iz ravni (metri). */
export const DEPTH: Record<GarmentKind, number> = {
  puffer: 0.1,
  vest: 0.085,
  knit: 0.06,
  hoodie: 0.06,
  denimjacket: 0.05,
  trackjacket: 0.045,
  rollneck: 0.045,
  tee: 0.04,
  jeans: 0.045,
  trousers: 0.04,
  belt: 0.012,
  parka: 0.06,
  bomber: 0.07,
  softshell: 0.05,
  fleecevest: 0.07,
  quiltvest: 0.05,
};

export type HangerKind = "top" | "clip" | "hook";

export const hangerFor = (k: GarmentKind): HangerKind =>
  k === "jeans" || k === "trousers" ? "clip" : k === "belt" ? "hook" : "top";

/** Lokalna pozicija tačke iz kroja (u odnosu na tačku vješanja). */
export const designToLocal = (x: number, y: number): [number, number] => [(x - DW / 2) * UNIT, -HOOK_DROP - y * UNIT];
