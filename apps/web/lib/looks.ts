// Složeni outfiti za lookbook (privremeni; u fazi 2 s pravim fotografijama).

export interface Look {
  id: string;
  name: string;
  note: string;
  /** Slojevi odozdo prema gore, s položajem na kartici (u % širine i visine) i rotacijom. */
  items: { slug: string; x: number; y: number; w: number; r: number }[];
}

export const LOOKS: Look[] = [
  {
    id: "grad",
    name: "Grad, jesen",
    note: "Bomber preko teške majice, sirovi denim i crni kaiš.",
    items: [
      { slug: "farmerke-prenj", x: 52, y: 30, w: 46, r: 3 },
      { slug: "majica-vran", x: 6, y: 34, w: 44, r: -4 },
      { slug: "jakna-cincar", x: 2, y: 2, w: 54, r: -2 },
      { slug: "kais-maglic", x: 28, y: 52, w: 34, r: 78 },
    ],
  },
  {
    id: "planina",
    name: "Planina, vikend",
    note: "Parka za vjetar, pletenica ispod i široke pantalone od kepera.",
    items: [
      { slug: "pantalone-treskavica", x: 54, y: 28, w: 44, r: 2 },
      { slug: "dzemper-vlasic", x: 22, y: 38, w: 44, r: 5 },
      { slug: "jakna-vranica", x: 0, y: 0, w: 54, r: -3 },
    ],
  },
  {
    id: "kampus",
    name: "Kampus",
    note: "Flis prsluk preko crne majice, isprane farmerke.",
    items: [
      { slug: "farmerke-cvrsnica", x: 52, y: 26, w: 46, r: -2 },
      { slug: "majica-visocica", x: 4, y: 30, w: 44, r: 3 },
      { slug: "prsluk-ozren", x: 14, y: 4, w: 44, r: -5 },
    ],
  },
];

/** Srednja veličina za brzo dodavanje cijelog looka. */
export function defaultSize(sizes: string[]) {
  if (sizes.includes("M")) return "M";
  if (sizes.includes("32")) return "32";
  return sizes[Math.floor(sizes.length / 2)];
}
