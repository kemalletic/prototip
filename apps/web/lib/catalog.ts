// Privremeni katalog za prototip. U fazi 2 dolazi iz Medusa backenda.

export type Category =
  | "jakne"
  | "prsluci"
  | "dzemperi"
  | "majice"
  | "trenerke"
  | "farmerke"
  | "pantalone"
  | "kaisevi";

export type GarmentKind =
  | "tee"
  | "hoodie"
  | "trackjacket"
  | "puffer"
  | "denimjacket"
  | "vest"
  | "knit"
  | "rollneck"
  | "jeans"
  | "trousers"
  | "belt";

export type Fabric =
  | "denim"
  | "jersey"
  | "fleece"
  | "nylon"
  | "rib"
  | "fineknit"
  | "wool"
  | "twill"
  | "leather";

export interface Hotspot {
  /** Koordinate u prostoru kroja (0..1000, 0..1300). */
  x: number;
  y: number;
  label: string;
}

export interface Product {
  slug: string;
  no: number;
  name: string;
  category: Category;
  kind: GarmentKind;
  fabric: Fabric;
  color: string;
  /** Boja konca za šavove i sitne detalje. */
  thread: string;
  accent?: string;
  wash?: "raw" | "light";
  price: number; // KM
  sizes: string[];
  colorName: string;
  summary: string;
  materials: string[];
  hotspots: Hotspot[];
}

export const CATEGORIES: { id: Category; label: string }[] = [
  { id: "jakne", label: "Jakne" },
  { id: "prsluci", label: "Prsluci" },
  { id: "dzemperi", label: "Džemperi" },
  { id: "majice", label: "Majice" },
  { id: "trenerke", label: "Trenerke" },
  { id: "farmerke", label: "Farmerke" },
  { id: "pantalone", label: "Pantalone" },
  { id: "kaisevi", label: "Kaiševi" },
];

const TOPS = ["XS", "S", "M", "L", "XL", "XXL"];
const WAIST = ["28", "30", "31", "32", "33", "34", "36"];
const BELT = ["85", "90", "95", "100", "105"];

export const PRODUCTS: Product[] = [
  {
    slug: "jakna-kozara",
    no: 1,
    name: "Kozara",
    category: "jakne",
    kind: "denimjacket",
    fabric: "denim",
    color: "#33497a",
    thread: "#c79a55",
    wash: "raw",
    price: 219,
    sizes: TOPS,
    colorName: "Srednji indigo",
    summary: "Kratka teksas jakna klasičnog kroja, s dva džepa na prsima i bakarnom dugmadi.",
    materials: ["100% pamuk, 12 oz denim", "Bakarna dugmad", "Prošiveno zlatnim koncem"],
    hotspots: [
      { x: 330, y: 360, label: "Džep s preklopom i dugmetom" },
      { x: 500, y: 600, label: "Bakarna dugmad" },
    ],
  },
  {
    slug: "dzemper-vlasic",
    no: 2,
    name: "Vlašić",
    category: "dzemperi",
    kind: "knit",
    fabric: "rib",
    color: "#cbbfa6",
    thread: "#b9ac92",
    price: 149,
    sizes: TOPS,
    colorName: "Zob",
    summary: "Debeli pleteni džemper s pletenicama po sredini. Pleten polako, na starim mašinama.",
    materials: ["70% vuna, 30% alpaka", "Gramaža pletiva 7", "Rebrasti rubovi"],
    hotspots: [
      { x: 500, y: 520, label: "Ručno dizajnirana pletenica" },
      { x: 500, y: 1150, label: "Rebrasti rub od 6 cm" },
    ],
  },
  {
    slug: "farmerke-prenj",
    no: 3,
    name: "Prenj",
    category: "farmerke",
    kind: "jeans",
    fabric: "denim",
    color: "#1d2748",
    thread: "#c79a55",
    wash: "raw",
    price: 159,
    sizes: WAIST,
    colorName: "Sirovi indigo",
    summary: "Ravne farmerke od sirovog denima. Bez pranja i bez omekšavanja, poprimaju tvoj oblik.",
    materials: ["100% pamuk, 14 oz selvedge denim", "Bakarne zakovice", "Dugmad umjesto patenta"],
    hotspots: [
      { x: 500, y: 70, label: "Metalno dugme s utisnutim znakom" },
      { x: 300, y: 270, label: "Bakarne zakovice na džepovima" },
      { x: 200, y: 1250, label: "Selvedge rub iznutra" },
    ],
  },
  {
    slug: "jakna-bjelasnica",
    no: 4,
    name: "Bjelašnica",
    category: "jakne",
    kind: "puffer",
    fabric: "nylon",
    color: "#222327",
    thread: "#34353a",
    price: 289,
    sizes: TOPS,
    colorName: "Ugljen",
    summary:
      "Pernata jakna s horizontalnim kanalima i visokim ovratnikom. Topla do minus deset, a teška tek 690 grama.",
    materials: ["Vanjski sloj: 100% reciklirani najlon, mat", "Punjenje: 90% pačje paperje, 10% perje", "Dvosmjerni patent"],
    hotspots: [
      { x: 500, y: 110, label: "Ovratnik od 9 cm, podstavljen flisom" },
      { x: 330, y: 520, label: "Kanali od 11 cm drže paperje na mjestu" },
      { x: 520, y: 760, label: "Dvosmjerni patent" },
    ],
  },
  {
    slug: "majica-vran",
    no: 5,
    name: "Vran",
    category: "majice",
    kind: "tee",
    fabric: "jersey",
    color: "#e4ddd0",
    thread: "#d2cabb",
    price: 49,
    sizes: TOPS,
    colorName: "Kost",
    summary: "Teška pamučna majica koja drži formu i nakon pedeset pranja. Malo šira u ramenima.",
    materials: ["100% organski pamuk, 260 g/m²", "Rebrasti ovratnik", "Dvostruki šav na rubovima"],
    hotspots: [
      { x: 500, y: 140, label: "Rebrasti ovratnik koji se ne rasteže" },
      { x: 660, y: 1130, label: "Dvostruki šav" },
    ],
  },
  {
    slug: "trenerka-kampus",
    no: 6,
    name: "Kampus",
    category: "trenerke",
    kind: "trackjacket",
    fabric: "twill",
    color: "#1f3a2e",
    thread: "#2a4a3c",
    accent: "#e4ddd0",
    price: 139,
    sizes: TOPS,
    colorName: "Tamnozelena",
    summary: "Gornji dio trenerke od matiranog trikota, sa stojećim ovratnikom i prugama niz rukave.",
    materials: ["100% reciklirani poliester, mat", "Patent cijelom dužinom", "Rebrasti rubovi"],
    hotspots: [
      { x: 500, y: 90, label: "Stojeći ovratnik" },
      { x: 905, y: 700, label: "Pruge utkane, ne štampane" },
    ],
  },
  {
    slug: "prsluk-igman",
    no: 7,
    name: "Igman",
    category: "prsluci",
    kind: "vest",
    fabric: "nylon",
    color: "#4b4a36",
    thread: "#5d5c45",
    price: 189,
    sizes: TOPS,
    colorName: "Maslina",
    summary: "Lagani prošiveni prsluk za slojevito oblačenje. Ide preko džempera ili ispod jakne.",
    materials: ["Vanjski sloj: 100% najlon ripstop", "Punjenje: sintetičko, 80 g/m²", "Džepovi s patentom"],
    hotspots: [
      { x: 500, y: 100, label: "Mekani stojeći ovratnik" },
      { x: 330, y: 820, label: "Džepovi s patentom" },
    ],
  },
  {
    slug: "pantalone-jahorina",
    no: 8,
    name: "Jahorina",
    category: "pantalone",
    kind: "trousers",
    fabric: "wool",
    color: "#38383b",
    thread: "#2f2f32",
    price: 169,
    sizes: WAIST,
    colorName: "Antracit",
    summary: "Vunene pantalone s dvije falte i ispeglanom crtom. Za posao, svadbu i nedjelju.",
    materials: ["98% vuna, 2% elastan", "Dvije falte s prednje strane", "Kosi bočni džepovi"],
    hotspots: [
      { x: 360, y: 200, label: "Dvostruke falte" },
      { x: 290, y: 800, label: "Ispeglana crta" },
    ],
  },
  {
    slug: "kais-maglic",
    no: 9,
    name: "Maglić",
    category: "kaisevi",
    kind: "belt",
    fabric: "leather",
    color: "#1a1513",
    thread: "#3a2f29",
    accent: "#b08d57",
    price: 69,
    sizes: BELT,
    colorName: "Crna koža",
    summary: "Kaiš od jednog komada goveđe kože, širok 3,5 cm. Kopča od punog mesinga.",
    materials: ["Puna goveđa koža, 4 mm", "Mesingana kopča", "Ručno bojeni rubovi"],
    hotspots: [{ x: 452, y: 720, label: "Kopča od punog mesinga" }],
  },
  {
    slug: "trenerka-trebevic",
    no: 10,
    name: "Trebević",
    category: "trenerke",
    kind: "hoodie",
    fabric: "fleece",
    color: "#8d8a86",
    thread: "#7c7974",
    price: 119,
    sizes: TOPS,
    colorName: "Siva melanža",
    summary: "Duks s kapuljačom od gustog flisa, četkanog s unutrašnje strane. Rebrasti rubovi.",
    materials: ["80% pamuk, 20% poliester, 420 g/m²", "Četkana unutrašnjost", "Pamučne vezice"],
    hotspots: [
      { x: 455, y: 420, label: "Debele pamučne vezice" },
      { x: 500, y: 860, label: "Džep preko cijele širine" },
    ],
  },
  {
    slug: "farmerke-cvrsnica",
    no: 11,
    name: "Čvrsnica",
    category: "farmerke",
    kind: "jeans",
    fabric: "denim",
    color: "#6f87ab",
    thread: "#c9a46a",
    wash: "light",
    price: 149,
    sizes: WAIST,
    colorName: "Svijetlo isprane",
    summary: "Uže farmerke, isprane kamenom do svijetloplave. Mekane od prvog dana.",
    materials: ["99% pamuk, 1% elastan, 12 oz", "Isprane kamenom", "Bakarne zakovice"],
    hotspots: [
      { x: 300, y: 270, label: "Bakarne zakovice na džepovima" },
      { x: 330, y: 820, label: "Prirodno isprano na koljenima" },
    ],
  },
  {
    slug: "dzemper-zelengora",
    no: 12,
    name: "Zelengora",
    category: "dzemperi",
    kind: "rollneck",
    fabric: "fineknit",
    color: "#2b2d33",
    thread: "#25272c",
    price: 129,
    sizes: TOPS,
    colorName: "Grafit",
    summary: "Rolka od fine merino vune. Dovoljno tanka za sako, dovoljno topla za januar.",
    materials: ["100% merino vuna, 17,5 mikrona", "Gramaža pletiva 14", "Duplo presavijen ovratnik"],
    hotspots: [{ x: 500, y: 90, label: "Duplo presavijen ovratnik" }],
  },
  {
    slug: "majica-visocica",
    no: 13,
    name: "Visočica",
    category: "majice",
    kind: "tee",
    fabric: "jersey",
    color: "#1c1c1e",
    thread: "#2a2a2c",
    price: 49,
    sizes: TOPS,
    colorName: "Crna",
    summary: "Ista teška majica, u crnoj boji koja ne blijedi. Bojena prije krojenja.",
    materials: ["100% organski pamuk, 260 g/m²", "Bojeno u masi", "Dvostruki šav na rubovima"],
    hotspots: [{ x: 500, y: 140, label: "Rebrasti ovratnik koji se ne rasteže" }],
  },
  {
    slug: "pantalone-treskavica",
    no: 14,
    name: "Treskavica",
    category: "pantalone",
    kind: "trousers",
    fabric: "twill",
    color: "#b3a27f",
    thread: "#a39270",
    price: 129,
    sizes: WAIST,
    colorName: "Pijesak",
    summary: "Široke pamučne pantalone od gustog kepera. Opušten kroj, visok struk.",
    materials: ["100% pamučni keper, 320 g/m²", "Dvije falte", "Kosi bočni džepovi"],
    hotspots: [{ x: 360, y: 200, label: "Dvostruke falte" }],
  },
  {
    slug: "kais-romanija",
    no: 15,
    name: "Romanija",
    category: "kaisevi",
    kind: "belt",
    fabric: "leather",
    color: "#5a3622",
    thread: "#6e4a33",
    accent: "#b9bcc0",
    price: 69,
    sizes: BELT,
    colorName: "Konjak",
    summary: "Kaiš od biljno štavljene kože koja s godinama potamni. Kopča od brušenog čelika.",
    materials: ["Biljno štavljena koža, 4 mm", "Kopča od brušenog čelika", "Ručno bojeni rubovi"],
    hotspots: [{ x: 452, y: 720, label: "Kopča od brušenog čelika" }],
  },
];

export const getProduct = (slug: string) => PRODUCTS.find((p) => p.slug === slug);

export const categoryLabel = (c: Category) => CATEGORIES.find((x) => x.id === c)?.label ?? c;

const SINGULAR: Record<Category, string> = {
  jakne: "Jakna",
  prsluci: "Prsluk",
  dzemperi: "Džemper",
  majice: "Majica",
  trenerke: "Trenerka",
  farmerke: "Farmerke",
  pantalone: "Pantalone",
  kaisevi: "Kaiš",
};
export const categorySingular = (c: Category) => SINGULAR[c];

export const formatNo = (n: number) => `Nº ${String(n).padStart(2, "0")}`;
