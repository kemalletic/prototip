// Teme izgleda. "noc" je sadašnji izgled; "grafit" i "svijetla" su probne verzije.

import type { Ambient } from "./ambient";
import { mix, shade, toHex } from "./garments/color";

export type Tema = "noc" | "grafit" | "svijetla";

export const TEME: Tema[] = ["noc", "grafit", "svijetla"];

export function readTema(): Tema {
  if (typeof window === "undefined") return "noc";
  const q = new URLSearchParams(window.location.search).get("tema");
  return (TEME as string[]).includes(q ?? "") ? (q as Tema) : "noc";
}

export interface SceneLook {
  wall: string;
  floor: string;
  fog: string;
  concrete: boolean;
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

/** Zid je malo svjetliji danju i dublji noću. */
const dayLift = (a: Ambient) => (a.phase === "dan" ? 0.07 : a.phase === "jutro" ? 0.05 : a.phase === "noc" ? -0.05 : 0);

export function sceneLook(tema: Tema, a: Ambient): SceneLook {
  if (tema === "grafit") {
    const wall = toHex(shade("#393632", dayLift(a)));
    return {
      wall,
      floor: "#2a2825",
      fog: toHex(mix(wall, "#000000", 0.55)),
      concrete: true,
      fill: a.fill * 1.1 + 0.08,
      spot: 1.5,
      spotAngle: 0.5,
      wash: 0.7,
      window: 1,
      exposure: 1.08,
      rod: "#1d1d1c",
      rodMetal: 0.65,
      hanger: "steel",
      fogNear: 6,
      fogFar: 15,
    };
  }
  if (tema === "svijetla") {
    const wall = toHex(shade("#c9c4bb", dayLift(a) * 0.6));
    return {
      wall,
      floor: "#b3aea5",
      fog: toHex(shade(wall, 0.05)),
      concrete: true,
      fill: 1.15,
      spot: 1.0,
      spotAngle: 0.55,
      wash: 0.45,
      window: 1.6,
      exposure: 1.0,
      rod: "#1a1a1a",
      rodMetal: 0.6,
      hanger: "black",
      fogNear: 7,
      fogFar: 17,
    };
  }
  return {
    wall: a.wall,
    floor: "#0d0c0b",
    fog: a.fog,
    concrete: false,
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
