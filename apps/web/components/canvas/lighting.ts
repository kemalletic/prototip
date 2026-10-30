import type { Ambient } from "@/lib/ambient";

/** Postavke svjetla butika za doba dana. */
export interface BoutiqueLight {
  sky: string;
  fogNear: number;
  fogFar: number;
  sun: number;
  sunColor: string;
  sunPos: [number, number, number];
  hemi: number;
  hemiSky: string;
  hemiGround: string;
  lamps: number;
  walls: number;
  key: number;
  sign: number;
  street: number;
  exposure: number;
  env: number;
}

export function boutiqueLight(a: Ambient): BoutiqueLight {
  switch (a.phase) {
    case "jutro":
      return {
        sky: "#d9d4cc",
        fogNear: 18,
        fogFar: 60,
        sun: 3.2,
        sunColor: "#ffe0bd",
        sunPos: [-9, 5, 12],
        hemi: 1.15,
        hemiSky: "#f0ebe2",
        hemiGround: "#b8996f",
        lamps: 3,
        walls: 15,
        key: 14,
        sign: 0,
        street: 0,
        exposure: 1.0,
        env: 0.55,
      };
    case "dan":
      return {
        sky: "#d3d9dc",
        fogNear: 18,
        fogFar: 60,
        sun: 3.6,
        sunColor: "#fff4e4",
        sunPos: [-5, 9, 12],
        hemi: 1.35,
        hemiSky: "#f4f2ee",
        hemiGround: "#b8996f",
        lamps: 2.5,
        walls: 16,
        key: 12,
        sign: 0,
        street: 0,
        exposure: 1.0,
        env: 0.6,
      };
    case "vece":
      return {
        sky: "#3e4257",
        fogNear: 14,
        fogFar: 45,
        sun: 1.5,
        sunColor: "#ff9f62",
        sunPos: [-12, 2.6, 9],
        hemi: 0.42,
        hemiSky: "#8a8ea8",
        hemiGround: "#6b543c",
        lamps: 7,
        walls: 15,
        key: 16,
        sign: 0.8,
        street: 7,
        exposure: 1.05,
        env: 0.4,
      };
    default:
      return {
        sky: "#0f131c",
        fogNear: 12,
        fogFar: 40,
        sun: 0.25,
        sunColor: "#9fb2e8",
        sunPos: [8, 10, 12],
        hemi: 0.2,
        hemiSky: "#2b3550",
        hemiGround: "#4a3a2a",
        lamps: 9,
        walls: 18,
        key: 18,
        sign: 1.6,
        street: 4,
        exposure: 1.08,
        env: 0.3,
      };
  }
}
