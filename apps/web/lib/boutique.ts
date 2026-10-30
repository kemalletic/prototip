// Raspored butika (metri). Unutrašnjost: x od -7 do 7, z od -3.5 (zadnji zid)
// do 3.5 (izlog), plafon na 3.6. Ulica je ispred, z > 3.7.

import type { Category } from "./catalog";

export const ROOM = { x0: -7, x1: 7, z0: -3.5, z1: 3.5, h: 3.6, wall: 0.2 };
export const FACADE_Z = 3.7;

export const WINDOWS = {
  left: [-6.7, -1.05] as const,
  right: [1.05, 6.7] as const,
  door: [-0.85, 0.85] as const,
  sill: 0.35,
  top: 3.05,
  doorTop: 2.7,
};

export type FixtureKind = "rail" | "hooks" | "display";

export interface Fixture {
  id: string;
  kind: FixtureKind;
  /** Sredina šipke (x, z) i visina šipke. */
  x: number;
  z: number;
  rodY: number;
  /** Rotacija oko y: lokalno +z gleda u prostoriju. */
  rotY: number;
  spacing: number;
  /** Udaljenost šipke od zida (za nosače); 0 = bez nosača. */
  wallDist: number;
  products: string[];
  /** Za "display": lokalni x za svaki komad (iznad stola ili police). */
  slots?: number[];
}

export const FIXTURES: Fixture[] = [
  {
    id: "lijevi",
    kind: "rail",
    x: -6.3,
    z: -0.25,
    rodY: 2.3,
    rotY: Math.PI / 2,
    spacing: 0.78,
    wallDist: 0.6,
    products: [
      "jakna-kozara",
      "jakna-bjelasnica",
      "jakna-vranica",
      "jakna-cincar",
      "jakna-klekovaca",
      "prsluk-igman",
      "prsluk-ozren",
      "prsluk-konjuh",
    ],
  },
  {
    id: "desni",
    kind: "rail",
    x: 6.3,
    z: -1.3,
    rodY: 2.3,
    rotY: -Math.PI / 2,
    spacing: 0.85,
    wallDist: 0.6,
    products: ["dzemper-vlasic", "dzemper-zelengora", "trenerka-trebevic", "trenerka-kampus"],
  },
  {
    id: "kuke",
    kind: "hooks",
    x: 3.9,
    z: -3.08,
    rodY: 1.95,
    rotY: 0,
    spacing: 0.5,
    wallDist: 0.42,
    products: ["kais-maglic", "kais-romanija"],
  },
  {
    id: "police",
    kind: "display",
    x: -1.2,
    z: -2.25,
    rodY: 2.3,
    rotY: 0,
    spacing: 1,
    wallDist: 0,
    products: ["farmerke-prenj", "farmerke-cvrsnica", "pantalone-jahorina", "pantalone-treskavica"],
    slots: [-1.5, -0.5, 0.5, 1.5],
  },
  {
    id: "sto",
    kind: "display",
    x: 0.2,
    z: 0.3,
    rodY: 2.3,
    rotY: Math.PI / 2,
    spacing: 1,
    wallDist: 0,
    products: ["majica-vran", "majica-visocica"],
    slots: [-0.45, 0.45],
  },
];

export const fixtureOf = (slug: string) => FIXTURES.find((f) => f.products.includes(slug));

/** Lokalni x komada na njegovoj šini. */
export function slotX(f: Fixture, slug: string) {
  const i = f.products.indexOf(slug);
  if (f.slots) return f.slots[i];
  return (i - (f.products.length - 1) / 2) * f.spacing;
}

// ------------------------------------------------------------ namještaj

export const TABLE = { x: 0, z: 0.3, w: 2.4, d: 1.1, h: 0.86 };
export const SHELF = { x: -1.2, w: 4.0, h: 2.2, d: 0.42, cols: 4, rows: 2, base: 0.42 };
export const BENCH = { x: 3.2, z: 1.9, w: 1.4, d: 0.42, h: 0.45 };
export const KABINA = { x0: 5.2, x1: 6.9, z0: 1.5, z1: 3.3, h: 2.5 };
export const DRAPE_POS = { x: 3.3, top: 2.82, z: 3.22 };

/** Složeni komadi: [slug, x, z] na stolu, [slug, kolona, red] na policama. */
export const TABLE_STACKS: [string, number, number][] = [
  ["majica-vran", -0.72, 0.58],
  ["majica-visocica", 0, 0.58],
  ["majica-vran", 0.72, 0.58],
  ["majica-visocica", -0.72, 0.04],
  ["majica-vran", 0, 0.04],
  ["majica-visocica", 0.72, 0.04],
];

// ------------------------------------------------------------ zone i kamera

export type ZoneId = "izlog" | "ulaz" | "sto" | "jakne" | "farmerke" | "dzemperi" | "kabina";

export interface Zone {
  id: ZoneId;
  title: string;
  lede: string;
  categories: Category[];
}

export const ZONES: Zone[] = [
  { id: "izlog", title: "Izlog", lede: "", categories: [] },
  { id: "ulaz", title: "Dobro došao", lede: "Uđi i razgledaj. Sve što vidiš možeš kupiti.", categories: [] },
  { id: "sto", title: "Majice", lede: "Teški pamuk, složen na kamenom stolu.", categories: ["majice"] },
  { id: "jakne", title: "Jakne i prsluci", lede: "Parke, pernate jakne, bomberi i prsluci za svaku sezonu.", categories: ["jakne", "prsluci"] },
  { id: "farmerke", title: "Farmerke, pantalone i kaiševi", lede: "Složeno na hrastovim policama. Kaiševi vise do njih.", categories: ["farmerke", "pantalone", "kaisevi"] },
  { id: "dzemperi", title: "Džemperi i trenerke", lede: "Pletivo od vune i flis za hladnije dane.", categories: ["dzemperi", "trenerke"] },
  { id: "kabina", title: "Kabina", lede: "Tvoja korpa čeka iza zavjese.", categories: [] },
];

type V3 = [number, number, number];

export interface Key {
  pos: V3;
  look: V3;
  zone: ZoneId;
  /** Koliko scroll prostora (u visinama ekrana) treba do sljedeće tačke. */
  w: number;
}

const L = FIXTURES[0];
const R = FIXTURES[1];

export function keyframes(portrait: boolean): Key[] {
  const wallD = portrait ? 3.3 : 2.45;
  const lx = L.x + wallD;
  const rx = R.x - wallD;
  const lz0 = L.z + ((L.products.length - 1) / 2) * L.spacing;
  const lz1 = L.z - ((L.products.length - 1) / 2) * L.spacing;
  const rz0 = R.z - ((R.products.length - 1) / 2) * R.spacing;
  const rz1 = R.z + ((R.products.length - 1) / 2) * R.spacing;
  return [
    portrait
      ? { pos: [3.1, 1.35, 12.0], look: [3.3, 1.2, 3.7], zone: "izlog", w: 1.1 }
      : { pos: [1.7, 1.7, 10.8], look: [2.15, 2.15, 3.7], zone: "izlog", w: 1.1 },
    { pos: [0, 1.6, portrait ? 7.6 : 6.6], look: [0, 1.5, 0], zone: "ulaz", w: 1 },
    { pos: [0, 1.75, portrait ? 4.2 : 3.1], look: [0, 1.25, -1.5], zone: "ulaz", w: 0.9 },
    { pos: [0, portrait ? 2.5 : 2.15, portrait ? 2.9 : 2.2], look: [0, 0.85, 0.35], zone: "sto", w: 1.2 },
    { pos: [lx, 1.65, lz0], look: [L.x, 1.6, lz0], zone: "jakne", w: 3.2 },
    { pos: [lx, 1.65, lz1], look: [L.x, 1.6, lz1], zone: "jakne", w: 1.3 },
    { pos: [-2.4, 1.55, portrait ? 0.4 : -0.6], look: [-2.4, 1.25, -3.5], zone: "farmerke", w: 2.2 },
    { pos: [3.7, 1.5, portrait ? 0.2 : -0.7], look: [3.7, 1.3, -3.5], zone: "farmerke", w: 1.3 },
    { pos: [rx, 1.65, rz0], look: [R.x, 1.6, rz0], zone: "dzemperi", w: 1.8 },
    { pos: [rx, 1.65, rz1], look: [R.x, 1.6, rz1], zone: "dzemperi", w: 1.2 },
    { pos: [portrait ? 2.2 : 3.0, 1.6, portrait ? 1.6 : 1.4], look: [5.2, 1.4, 2.4], zone: "kabina", w: 0 },
  ];
}

/** Na kojem dijelu putanje (0..1) počinje zona; za filter i indeks. */
export function zoneStart(keys: Key[], zone: ZoneId) {
  const total = keys.reduce((a, k) => a + k.w, 0);
  let acc = 0;
  for (const k of keys) {
    if (k.zone === zone) return acc / total;
    acc += k.w;
  }
  return 0;
}

export function zoneForCategory(c: Category): ZoneId {
  return ZONES.find((z) => z.categories.includes(c))?.id ?? "jakne";
}
