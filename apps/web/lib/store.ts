"use client";

import { create } from "zustand";
import type { Category } from "./catalog";
import type { RegionId } from "./region";
import type { Tema } from "./theme";

export type Tier = "pending" | "full" | "static";

export interface CartLine {
  slug: string;
  size: string;
  qty: number;
}

interface State {
  tier: Tier;
  tema: Tema;
  ready: boolean;
  region: RegionId;
  sound: boolean;
  filter: Category | "sve";
  view: "sina" | "mreza";
  hovered: string | null;
  cart: CartLine[];
  cartOpen: boolean;
  returnScroll: number | null;
  lens: { active: boolean; x: number; y: number; u: number; v: number; side: "front" | "back" };
  lensSlug: string | null;
  lensSource: ((side: "front" | "back") => HTMLCanvasElement | null) | null;
  navigate: (href: string) => void;
  set: (p: Partial<State>) => void;
  addToCart: (slug: string, size: string) => void;
  removeLine: (i: number) => void;
}

export const useStore = create<State>((set) => ({
  tier: "pending",
  tema: "noc",
  ready: false,
  region: "ba",
  sound: false,
  filter: "sve",
  view: "sina",
  hovered: null,
  cart: [],
  cartOpen: false,
  returnScroll: null,
  lens: { active: false, x: 0, y: 0, u: 0, v: 0, side: "front" },
  lensSlug: null,
  lensSource: null,
  navigate: () => {},
  set: (p) => set(p),
  addToCart: (slug, size) =>
    set((s) => {
      const i = s.cart.findIndex((l) => l.slug === slug && l.size === size);
      if (i === -1) return { cart: [...s.cart, { slug, size, qty: 1 }] };
      const cart = s.cart.slice();
      cart[i] = { ...cart[i], qty: cart[i].qty + 1 };
      return { cart };
    }),
  removeLine: (i) => set((s) => ({ cart: s.cart.filter((_, j) => j !== i) })),
}));

/**
 * Stanje koje se mijenja svaki frame (scroll, pokazivač). Drži se van Reacta
 * da 3D scena može čitati bez re-rendera.
 */
export const live = {
  heroP: 0, // 0..1 koliko je hero odskrolan
  railP: 0, // 0..1 napredak duž šine
  railActive: 0, // 0..1 koliko je sekcija šine u kadru
  pointer: { x: 0, y: 0, nx: 0, ny: 0, vx: 0, vy: 0, inside: false, t: 0 },
  tilt: { x: 0, y: 0 },
  rotate: 0, // rotacija komada na stranici proizvoda (radijani)
  scrollVelocity: 0,
  dragging: false,
  tag: { x: -999, y: -999 },
  spots: [] as { x: number; y: number }[],
  spotOpacity: 0,
};
