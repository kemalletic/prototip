// Teme izgleda. "studio" je glavni, svijetli izgled; "noc" je prva, tamna verzija (?tema=noc).

import type { Ambient } from "./ambient";
import type { Category } from "./catalog";
import { shade, toHex } from "./garments/color";

export type Tema = "studio" | "noc";

export const TEME: Tema[] = ["studio", "noc"];

export function readTema(): Tema {
  if (typeof window === "undefined") return "studio";
  const q = new URLSearchParams(window.location.search).get("tema");
  return (TEME as string[]).includes(q ?? "") ? (q as Tema) : "studio";
}

export interface SceneLook {
  wall: string;
  floor: string;
  fog: string;
  ground: string;
  plaster: boolean;
  /** Boja zida se mijenja prema kategoriji komada ispred njega. */
  tint: boolean;
  fill: number;
  spot: number;
  spotAngle: number;
  wash: number;
  window: number;
  exposure: number;
  rod: string;
  rodMetal: number;
  hanger: "wood" | "steel" | "black";
  fogNear: number;
  fogFar: number;
}

/** Topli, prigušeni tonovi zida po kategoriji. */
export const CATEGORY_TINT: Record<Category, string> = {
  jakne: "#e6d9c5",
  prsluci: "#dfdac8",
  dzemperi: "#ebe2d0",
  majice: "#efeae1",
  trenerke: "#dcdfd3",
  farmerke: "#d9dee3",
  pantalone: "#e2d9cb",
  kaisevi: "#e4d4bf",
};

const dayLift = (a: Ambient) => (a.phase === "dan" ? 0.03 : a.phase === "jutro" ? 0.02 : a.phase === "noc" ? -0.06 : -0.02);

export function sceneLook(tema: Tema, a: Ambient): SceneLook {
  if (tema === "studio") {
    const wall = toHex(shade("#ece5d8", dayLift(a)));
    const night = a.phase === "noc" || a.phase === "vece";
    return {
      wall,
      floor: "#d6cab6",
      fog: toHex(shade("#f1ebe1", dayLift(a))),
      ground: "#b9a68a",
      plaster: true,
      tint: true,
      fill: night ? 0.6 : 0.78,
      spot: night ? 1.5 : 1.35,
      spotAngle: 0.55,
      wash: 0.55,
      window: night ? 0.35 : 1.15,
      exposure: 1.0,
      rod: "#141414",
      rodMetal: 0.6,
      hanger: "black",
      fogNear: 9,
      fogFar: 24,
    };
  }
  return {
    wall: a.wall,
    floor: "#0d0c0b",
    fog: a.fog,
    ground: "#0b0b0c",
    plaster: false,
    tint: false,
    fill: a.fill,
    spot: 1.7,
    spotAngle: 0.4,
    wash: 0.9,
    window: 0,
    exposure: 1.05,
    rod: "#8b857c",
    rodMetal: 1,
    hanger: "wood",
    fogNear: 5.5,
    fogFar: 13,
  };
}
