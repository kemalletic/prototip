// Crta kroj odjevnog predmeta u dva kanvasa: boju i visinu.
// Koordinate kroja: 1000 × 1300 jedinica, vješalica je iznad y = 0.
// Ovaj sistem kasnije zamjenjuje AI pipeline (prava fotografija + dubinska mapa),
// a izlaz je isti: boja + visina.

import type { Product } from "../catalog";
import { shade, toHex } from "./color";
import { fabricTile, patternFor, type TileKind } from "./fabrics";

export const DW = 1000;
export const DH = 1300;

type Pt = [number, number, number?];
type XY = [number, number];

function poly(pts: Pt[], r = 16): Path2D {
  const p = new Path2D();
  const n = pts.length;
  const mid = (a: Pt, b: Pt): XY => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const s = mid(pts[n - 1], pts[0]);
  p.moveTo(s[0], s[1]);
  for (let i = 0; i < n; i++) {
    const cur = pts[i];
    const m = mid(cur, pts[(i + 1) % n]);
    const rr = cur[2] ?? r;
    if (rr <= 0) {
      p.lineTo(cur[0], cur[1]);
      p.lineTo(m[0], m[1]);
    } else p.arcTo(cur[0], cur[1], m[0], m[1], rr);
  }
  p.closePath();
  return p;
}

/** Desna polovina (dx od sredine) od vrha po sredini do dna po sredini; vraća cijeli obris. */
function half(right: Pt[]): Pt[] {
  const R = right.map(([x, y, r]) => [500 + x, y, r] as Pt);
  const L = right
    .slice()
    .reverse()
    .filter((p, i, arr) => !((i === 0 || i === arr.length - 1) && p[0] === 0))
    .map(([x, y, r]) => [500 - x, y, r] as Pt);
  return [...R, ...L];
}

const mx = (pts: Pt[]): Pt[] => pts.map(([x, y, r]) => [1000 - x, y, r] as Pt);
const mxy = (pts: XY[]): XY[] => pts.map(([x, y]) => [1000 - x, y] as XY);

function curve(pts: XY[]): Path2D {
  const p = new Path2D();
  p.moveTo(pts[0][0], pts[0][1]);
  if (pts.length === 2) {
    p.lineTo(pts[1][0], pts[1][1]);
    return p;
  }
  for (let i = 1; i < pts.length - 1; i++) {
    const m: XY = [(pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2];
    if (i === pts.length - 2) p.quadraticCurveTo(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1]);
    else p.quadraticCurveTo(pts[i][0], pts[i][1], m[0], m[1]);
  }
  return p;
}

const off = (pts: XY[], dx: number, dy: number): XY[] => pts.map(([x, y]) => [x + dx, y + dy] as XY);

const METALS = {
  copper: ["#f0b98c", "#a8653a", "#4a2a16"],
  steel: ["#f2f3f4", "#9a9ea3", "#3a3d40"],
  brass: ["#f3dc9f", "#b08d57", "#5a4426"],
  matte: ["#6a6a6c", "#2e2e30", "#121213"],
} as const;
type Metal = keyof typeof METALS;

class Painter {
  readonly main: CanvasPattern;
  readonly hasHeight: boolean;
  constructor(
    readonly c: CanvasRenderingContext2D,
    readonly h: CanvasRenderingContext2D | null,
    readonly m: CanvasRenderingContext2D,
    readonly k: number,
    readonly p: Product,
    readonly front: boolean,
  ) {
    this.main = this.pat(p.fabric, p.color);
    this.hasHeight = !!h;
  }

  pat(kind: TileKind, color: string, scale = 1) {
    return patternFor(this.c, fabricTile(kind, toHex(color)), scale);
  }

  trim(color = shade(this.p.color, -0.12)) {
    return this.pat("ribtrim", color);
  }

  /** Popunjava dio kroja: boja s mekim sjenčenjem i "kupola" u karti visine. */
  part(path: Path2D, fill: string | CanvasPattern, o: { puff?: number; rim?: number; light?: number } = {}) {
    const { puff = 0.8, rim = 1, light = 1 } = o;
    const c = this.c;
    c.save();
    c.fillStyle = fill;
    c.fill(path);
    c.clip(path);
    const g = c.createLinearGradient(0, 0, 0, DH);
    g.addColorStop(0, `rgba(255,248,236,${0.06 * light})`);
    g.addColorStop(0.45, "rgba(0,0,0,0)");
    g.addColorStop(1, `rgba(0,0,0,${0.24 * light})`);
    c.fillStyle = g;
    c.fill(path);
    if (rim > 0) {
      c.shadowColor = `rgba(0,0,0,${0.55 * rim})`;
      c.shadowBlur = 34 * this.k;
      c.lineWidth = 8;
      c.strokeStyle = `rgba(0,0,0,${0.45 * rim})`;
      c.stroke(path);
    }
    c.restore();

    this.m.fill(path);

    const h = this.h;
    if (!h) return;
    h.save();
    const v = Math.round(255 * puff);
    h.fillStyle = `rgb(${v},${v},${v})`;
    h.fill(path);
    h.clip(path);
    h.shadowColor = "#000";
    h.shadowBlur = 70 * this.k;
    h.lineWidth = 26;
    h.strokeStyle = "#000";
    h.stroke(path);
    h.restore();
  }

  /** Podiže ili spušta površinu bez novog obrisa (džep, pletenica). */
  raise(path: Path2D, amount: number, blur = 6) {
    const h = this.h;
    if (!h) return;
    h.save();
    h.globalCompositeOperation = amount > 0 ? "lighter" : "source-over";
    const v = Math.round(Math.abs(amount) * 255);
    h.fillStyle = amount > 0 ? `rgb(${v},${v},${v})` : `rgba(0,0,0,${Math.abs(amount)})`;
    h.filter = `blur(${blur * this.k}px)`;
    h.fill(path);
    h.restore();
  }

  /** Šav: udubljenje u visini i tamna linija u boji. */
  groove(path: Path2D, w = 4, strength = 1) {
    const c = this.c;
    c.save();
    c.lineCap = "round";
    c.strokeStyle = `rgba(0,0,0,${0.42 * strength})`;
    c.lineWidth = w;
    c.shadowColor = `rgba(0,0,0,${0.5 * strength})`;
    c.shadowBlur = 6 * this.k;
    c.stroke(path);
    c.translate(1.5, 2);
    c.strokeStyle = `rgba(255,250,240,${0.06 * strength})`;
    c.lineWidth = w * 0.6;
    c.shadowBlur = 0;
    c.stroke(path);
    c.restore();
    const h = this.h;
    if (!h) return;
    h.save();
    h.lineCap = "round";
    h.strokeStyle = `rgba(0,0,0,${0.5 * strength})`;
    h.lineWidth = w * 2.4;
    h.filter = `blur(${3 * this.k}px)`;
    h.stroke(path);
    h.restore();
  }

  stitch(path: Path2D, o: { color?: string; w?: number; dash?: [number, number]; alpha?: number } = {}) {
    const { color = this.p.thread, w = 2.6, dash = [8, 5], alpha = 0.95 } = o;
    const c = this.c;
    c.save();
    c.setLineDash(dash);
    c.lineCap = "round";
    c.translate(0.8, 1.4);
    c.strokeStyle = "rgba(0,0,0,0.45)";
    c.lineWidth = w;
    c.stroke(path);
    c.translate(-0.8, -1.4);
    c.globalAlpha = alpha;
    c.strokeStyle = color;
    c.lineWidth = w * 0.8;
    c.stroke(path);
    c.restore();
    const h = this.h;
    if (!h) return;
    h.save();
    h.setLineDash(dash);
    h.strokeStyle = "rgba(0,0,0,0.35)";
    h.lineWidth = w * 1.6;
    h.stroke(path);
    h.restore();
  }

  /** Dvostruki šav, kao na farmerkama. */
  double(pts: XY[], gap = 9, o?: Parameters<Painter["stitch"]>[1]) {
    const [a, b] = [pts[0], pts[pts.length - 1]];
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    this.stitch(curve(off(pts, (nx * gap) / 2, (ny * gap) / 2)), o);
    this.stitch(curve(off(pts, (-nx * gap) / 2, (-ny * gap) / 2)), o);
  }

  /** Mekani okomiti nabor: tamna dolina s blagim odsjajem do nje. */
  fold(x: number, y0: number, y1: number, w: number, strength = 0.2, clip?: Path2D) {
    const ry = (y1 - y0) / 2;
    const cy = (y0 + y1) / 2;
    const blob = (ctx: CanvasRenderingContext2D, ox: number, color: string, a: number) => {
      ctx.save();
      if (clip) ctx.clip(clip);
      ctx.translate(x + ox, cy);
      ctx.scale(1, ry / w);
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, w);
      g.addColorStop(0, `rgba(${color},${a})`);
      g.addColorStop(1, `rgba(${color},0)`);
      ctx.fillStyle = g;
      ctx.fillRect(-w, -w, w * 2, w * 2);
      ctx.restore();
    };
    blob(this.c, 0, "0,0,0", strength);
    blob(this.c, w * 0.7, "255,248,236", strength * 0.3);
    if (this.h) blob(this.h, 0, "0,0,0", strength * 0.9);
  }

  glow(x: number, y: number, rx: number, ry: number, alpha: number, color = "255,250,240") {
    const c = this.c;
    c.save();
    c.translate(x, y);
    c.scale(1, ry / rx);
    const g = c.createRadialGradient(0, 0, 0, 0, 0, rx);
    g.addColorStop(0, `rgba(${color},${alpha})`);
    g.addColorStop(1, `rgba(${color},0)`);
    c.fillStyle = g;
    c.fillRect(-rx, -rx, rx * 2, rx * 2);
    c.restore();
  }

  metal(x: number, y: number, r: number, kind: Metal, o: { ring?: boolean } = {}) {
    const [hi, mid, lo] = METALS[kind];
    const c = this.c;
    c.save();
    c.shadowColor = "rgba(0,0,0,0.6)";
    c.shadowBlur = 6 * this.k;
    c.shadowOffsetY = 2 * this.k;
    const g = c.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r);
    g.addColorStop(0, hi);
    g.addColorStop(0.55, mid);
    g.addColorStop(1, lo);
    c.fillStyle = g;
    c.beginPath();
    c.arc(x, y, r, 0, Math.PI * 2);
    c.fill();
    c.restore();
    if (o.ring) {
      c.save();
      c.strokeStyle = "rgba(0,0,0,0.35)";
      c.lineWidth = r * 0.14;
      c.beginPath();
      c.arc(x, y, r * 0.62, 0, Math.PI * 2);
      c.stroke();
      c.restore();
    }
    this.m.beginPath();
    this.m.arc(x, y, r, 0, Math.PI * 2);
    this.m.fill();
    if (this.h) {
      const h = this.h;
      h.save();
      h.globalCompositeOperation = "lighter";
      const hg = h.createRadialGradient(x, y, 0, x, y, r);
      hg.addColorStop(0, "rgb(120,120,120)");
      hg.addColorStop(1, "rgb(40,40,40)");
      h.fillStyle = hg;
      h.beginPath();
      h.arc(x, y, r, 0, Math.PI * 2);
      h.fill();
      h.restore();
    }
  }

  inside(path: Path2D, depth = 0.55) {
    // unutrašnjost (npr. kroz otvor vrata se vidi unutrašnja strana leđa)
    const c = this.c;
    c.save();
    c.fillStyle = this.main;
    c.fill(path);
    c.fillStyle = `rgba(0,0,0,${depth})`;
    c.fill(path);
    c.restore();
    this.m.fill(path);
    if (this.h) {
      this.h.save();
      this.h.fillStyle = "rgb(70,70,70)";
      this.h.fill(path);
      this.h.restore();
    }
  }

  zipper(x: number, y0: number, y1: number, kind: Metal = "matte", w = 14) {
    const c = this.c;
    c.save();
    c.fillStyle = "rgba(0,0,0,0.55)";
    c.fillRect(x - w / 2 - 3, y0, w + 6, y1 - y0);
    const [hi, mid] = METALS[kind];
    for (let y = y0; y < y1; y += 6) {
      c.fillStyle = (y / 6) % 2 < 1 ? mid : hi;
      const left = Math.round(y / 6) % 2 === 0;
      c.fillRect(left ? x - w / 2 : x - 1, y, w / 2 + 1, 3.6);
    }
    c.restore();
    this.groove(curve([[x, y0], [x, y1]]), 3, 0.8);
  }

  pull(x: number, y: number, kind: Metal = "matte") {
    const [hi, mid, lo] = METALS[kind];
    const c = this.c;
    c.save();
    c.shadowColor = "rgba(0,0,0,0.6)";
    c.shadowBlur = 8 * this.k;
    c.shadowOffsetY = 3 * this.k;
    const g = c.createLinearGradient(x - 12, 0, x + 12, 0);
    g.addColorStop(0, lo);
    g.addColorStop(0.4, hi);
    g.addColorStop(1, mid);
    c.fillStyle = g;
    c.beginPath();
    c.roundRect(x - 11, y, 22, 26, 6);
    c.fill();
    c.beginPath();
    c.roundRect(x - 8, y + 22, 16, 44, 7);
    c.fill();
    c.restore();
  }

  /** Tekst koji ostaje čitljiv i na zrcaljenoj (stražnjoj) strani. */
  text(str: string, x: number, y: number, size: number, color: string) {
    const c = this.c;
    c.save();
    c.translate(x, y);
    if (!this.front) c.scale(-1, 1);
    c.fillStyle = color;
    c.font = `600 ${size}px Georgia, serif`;
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText(str, 0, 0);
    c.restore();
  }

  label(x: number, y: number, w: number, hgt: number, bg: string, fg: string) {
    const c = this.c;
    c.save();
    c.fillStyle = bg;
    c.fillRect(x - w / 2, y, w, hgt);
    c.restore();
    this.text("NIT", x, y + hgt / 2 + 1, hgt * 0.62, fg);
  }
}

// ------------------------------------------------------------------ krojevi

function sleeves(P: Painter, right: Pt[], fill: string | CanvasPattern, puff = 0.7) {
  const R = poly(right);
  const L = poly(mx(right));
  P.part(R, fill, { puff });
  P.part(L, fill, { puff });
  return [R, L] as const;
}

function cuffs(P: Painter, right: Pt[], fill: string | CanvasPattern) {
  const R = poly(right, 6);
  const L = poly(mx(right), 6);
  P.part(R, fill, { puff: 0.75, rim: 0.6 });
  P.part(L, fill, { puff: 0.75, rim: 0.6 });
}

function crewNeck(P: Painter, side: number, depth: number, band: number) {
  // side: x pola širine vrata; depth: koliko prednji izrez ide dolje
  const a = 500 - side;
  const b = 500 + side;
  const topY = 84;
  if (P.front) {
    const inner = new Path2D();
    inner.moveTo(a, topY);
    inner.quadraticCurveTo(500, topY + 32, b, topY);
    inner.quadraticCurveTo(500, topY + depth * 2, a, topY);
    P.inside(inner, 0.5);
    const backBand = new Path2D();
    backBand.moveTo(a, topY + 6);
    backBand.quadraticCurveTo(500, topY + 38, b, topY + 6);
    P.c.save();
    P.c.strokeStyle = P.trim(shade(P.p.color, -0.32));
    P.c.lineWidth = band * 0.5;
    P.c.stroke(backBand);
    P.c.restore();
    P.label(500, topY + 22, 30, 18, P.p.color === "#1c1c1e" ? "#e4ddd0" : "#141414", P.p.color === "#1c1c1e" ? "#1c1c1e" : "#e4ddd0");
    const frontBand = new Path2D();
    frontBand.moveTo(a - 4, topY - 2);
    frontBand.quadraticCurveTo(500, topY + depth * 2 + band, b + 4, topY - 2);
    P.c.save();
    P.c.strokeStyle = P.trim();
    P.c.lineWidth = band;
    P.c.shadowColor = "rgba(0,0,0,0.5)";
    P.c.shadowBlur = 6 * P.k;
    P.c.stroke(frontBand);
    P.c.restore();
    P.groove(frontBand, 2, 0.3);
    const st = new Path2D();
    st.moveTo(a - 10, topY + 4);
    st.quadraticCurveTo(500, topY + depth * 2 + band * 2.1, b + 10, topY + 4);
    P.stitch(st, { color: shade(P.p.color, -0.18) });
  } else {
    const band2 = new Path2D();
    band2.moveTo(a - 4, topY);
    band2.quadraticCurveTo(500, topY + 32 + band, b + 4, topY);
    P.c.save();
    P.c.strokeStyle = P.trim();
    P.c.lineWidth = band;
    P.c.stroke(band2);
    P.c.restore();
  }
}

function tee(P: Painter) {
  const body = poly(half([[0, 100, 0], [95, 84, 10], [305, 128, 26], [452, 395, 16], [338, 450, 10], [270, 338, 18], [282, 1165, 14], [0, 1172, 0]]));
  P.part(body, P.main, { puff: 0.85 });
  for (const s of [1, -1]) {
    const X = (x: number) => 500 + s * x;
    P.groove(curve([[X(300), 130], [X(282), 240], [X(268), 336]]), 3, 0.7);
    P.groove(curve([[X(95), 86], [X(303), 130]]), 2.5, 0.6);
    P.stitch(curve([[X(462), 372], [X(326), 437]]), { color: shade(P.p.color, -0.2) });
    P.stitch(curve([[X(460), 362], [X(322), 427]]), { color: shade(P.p.color, -0.2) });
    P.fold(X(215), 360, 1160, 60, 0.12, body);
    P.fold(X(120), 500, 1160, 40, 0.08, body);
  }
  P.stitch(curve([[180, 1138], [820, 1138]]), { color: shade(P.p.color, -0.2) });
  P.stitch(curve([[180, 1148], [820, 1148]]), { color: shade(P.p.color, -0.2) });
  crewNeck(P, 95, 58, 24);
}

function hoodie(P: Painter) {
  const darker = shade(P.p.color, -0.12);
  if (P.front) {
    const hoodBack = poly([[372, 98], [380, 40, 30], [500, 18, 60], [620, 40, 30], [628, 98]]);
    P.part(hoodBack, P.pat(P.p.fabric, toHex(shade(P.p.color, -0.25))), { puff: 0.5 });
  }
  const body = poly(half([[0, 100, 0], [120, 86, 10], [310, 140, 24], [288, 390, 40], [292, 1112, 6], [0, 1112, 0]]));
  P.part(body, P.main, { puff: 0.85 });
  const right: Pt[] = [[810, 138], [896, 560], [912, 1035], [828, 1040], [800, 960], [776, 392]];
  sleeves(P, right, P.main);
  P.groove(curve([[776, 392], [800, 960], [826, 1036]]), 3, 0.7);
  P.groove(curve(mxy([[776, 392], [800, 960], [826, 1036]])), 3, 0.7);
  P.part(poly(half([[0, 1100, 0], [292, 1100, 6], [290, 1186, 10], [0, 1190, 0]]), 6), P.trim(), { puff: 0.8, rim: 0.5 });
  cuffs(P, [[826, 1030], [914, 1028], [918, 1118], [838, 1122]], P.trim());

  if (P.front) {
    // kapuljača oko vrata
    const band = new Path2D();
    band.moveTo(378, 82);
    band.bezierCurveTo(392, 200, 450, 280, 500, 284);
    band.bezierCurveTo(550, 280, 608, 200, 622, 82);
    band.lineTo(588, 90);
    band.bezierCurveTo(574, 180, 540, 232, 500, 234);
    band.bezierCurveTo(460, 232, 426, 180, 412, 90);
    band.closePath();
    const opening = new Path2D();
    opening.moveTo(412, 90);
    opening.bezierCurveTo(426, 180, 460, 232, 500, 234);
    opening.bezierCurveTo(540, 232, 574, 180, 588, 90);
    opening.quadraticCurveTo(500, 120, 412, 90);
    P.inside(opening, 0.6);
    P.c.save();
    P.c.shadowColor = "rgba(0,0,0,0.6)";
    P.c.shadowBlur = 18 * P.k;
    P.c.shadowOffsetY = 8 * P.k;
    P.c.fillStyle = P.main;
    P.c.fill(band);
    P.c.restore();
    P.part(band, P.main, { puff: 0.95, rim: 0.6 });
    // vezice
    for (const s of [-1, 1]) {
      const x = 500 + s * 30;
      P.metal(x, 246, 8, "steel", { ring: true });
      const cord = curve([[x, 246], [x - s * 6, 330], [x - s * 2, 430], [x + s * 4, 480]]);
      P.c.save();
      P.c.lineCap = "round";
      P.c.shadowColor = "rgba(0,0,0,0.55)";
      P.c.shadowBlur = 8 * P.k;
      P.c.shadowOffsetY = 4 * P.k;
      P.c.strokeStyle = "#d8d1c4";
      P.c.lineWidth = 11;
      P.c.stroke(cord);
      P.c.restore();
      P.raise(cord, 0.2, 4);
      P.c.save();
      P.c.fillStyle = METALS.steel[1];
      P.c.beginPath();
      P.c.roundRect(x + s * 4 - 6, 478, 12, 28, 4);
      P.c.fill();
      P.c.restore();
    }
    // džep klokan
    const pocket = poly(half([[0, 770, 0], [200, 770, 8], [252, 905, 10], [262, 1045, 6], [0, 1045, 0]]), 8);
    P.c.save();
    P.c.fillStyle = P.main;
    P.c.shadowColor = "rgba(0,0,0,0.4)";
    P.c.shadowBlur = 10 * P.k;
    P.c.shadowOffsetY = 4 * P.k;
    P.c.fill(pocket);
    P.c.restore();
    P.raise(pocket, 0.08);
    for (const s of [1, -1]) {
      P.groove(curve([[500 + s * 200, 772], [500 + s * 252, 905]]), 6, 1.2);
    }
    P.stitch(curve([[300, 782], [700, 782]]), { color: darker });
    P.stitch(curve([[248, 1034], [752, 1034]]), { color: darker });
  } else {
    const hood = poly(half([[0, 92, 0], [170, 95, 20], [205, 250, 60], [150, 485, 60], [0, 545, 0]]));
    P.c.save();
    P.c.shadowColor = "rgba(0,0,0,0.6)";
    P.c.shadowBlur = 24 * P.k;
    P.c.shadowOffsetY = 10 * P.k;
    P.c.fillStyle = P.main;
    P.c.fill(hood);
    P.c.restore();
    P.part(hood, P.main, { puff: 1 });
    P.groove(curve([[500, 95], [500, 540]]), 3, 0.8);
  }
  for (const s of [1, -1]) P.fold(500 + s * 200, 420, 1100, 55, 0.12, body);
}

function trackjacket(P: Painter) {
  const accent = P.p.accent ?? "#e4ddd0";
  const body = poly(half([[0, 96, 0], [115, 86, 10], [306, 138, 24], [286, 390, 40], [290, 1112, 6], [0, 1112, 0]]));
  P.part(body, P.main, { puff: 0.82 });
  const right: Pt[] = [[806, 136], [892, 560], [906, 1035], [826, 1040], [798, 960], [774, 392]];
  const [SR, SL] = sleeves(P, right, P.main);
  for (const [S, s] of [[SR, 1], [SL, -1]] as const) {
    P.c.save();
    P.c.clip(S);
    P.c.strokeStyle = accent;
    P.c.lineWidth = 12;
    for (const d of [-22, -44]) {
      const pts: XY[] = [[806 + d, 150], [892 + d, 560], [906 + d, 1040]];
      P.c.stroke(curve(s === 1 ? pts : mxy(pts)));
    }
    P.c.restore();
  }
  P.groove(curve([[774, 392], [798, 960], [824, 1036]]), 3, 0.7);
  P.groove(curve(mxy([[774, 392], [798, 960], [824, 1036]])), 3, 0.7);
  P.part(poly(half([[0, 1098, 0], [290, 1098, 6], [288, 1172, 10], [0, 1176, 0]]), 6), P.trim(), { puff: 0.8, rim: 0.5 });
  cuffs(P, [[824, 1030], [908, 1028], [910, 1104], [834, 1108]], P.trim());
  const collar = poly(half([[0, 26, 0], [118, 28, 18], [128, 130, 8], [0, 142, 0]]), 10);
  P.c.save();
  P.c.shadowColor = "rgba(0,0,0,0.55)";
  P.c.shadowBlur = 14 * P.k;
  P.c.shadowOffsetY = 6 * P.k;
  P.c.fillStyle = P.main;
  P.c.fill(collar);
  P.c.restore();
  P.part(collar, P.trim(shade(P.p.color, -0.05)), { puff: 0.9, rim: 0.5 });
  if (P.front) {
    P.zipper(500, 26, 1176, "matte", 12);
    P.pull(500, 170, "steel");
  }
  for (const s of [1, -1]) {
    P.fold(500 + s * 190, 420, 1100, 50, 0.1, body);
  }
}

function channels(P: Painter, clip: Path2D, y0: number, y1: number, step: number) {
  const c = P.c;
  c.save();
  c.clip(clip);
  for (let y = y0; y < y1; y += step) {
    const g = c.createLinearGradient(0, y, 0, y + step);
    g.addColorStop(0, "rgba(0,0,0,0.55)");
    g.addColorStop(0.12, "rgba(255,255,255,0.0)");
    g.addColorStop(0.26, "rgba(255,255,255,0.10)");
    g.addColorStop(0.5, "rgba(255,255,255,0.02)");
    g.addColorStop(0.86, "rgba(0,0,0,0.28)");
    g.addColorStop(1, "rgba(0,0,0,0.6)");
    c.fillStyle = g;
    c.fillRect(0, y, DW, step);
  }
  c.restore();
  if (P.h) {
    const h = P.h;
    h.save();
    h.clip(clip);
    for (let y = y0; y < y1; y += step) {
      const g = h.createLinearGradient(0, y, 0, y + step);
      g.addColorStop(0, "rgba(0,0,0,0.5)");
      g.addColorStop(0.45, "rgba(0,0,0,0)");
      g.addColorStop(0.55, "rgba(0,0,0,0)");
      g.addColorStop(1, "rgba(0,0,0,0.5)");
      h.fillStyle = g;
      h.fillRect(0, y, DW, step);
    }
    h.restore();
  }
  for (let y = y0; y <= y1; y += step) {
    P.stitch(curve([[0, y], [DW, y]]), { color: shade(P.p.color, -0.3), dash: [6, 4], alpha: 0.6 });
  }
}

function puffer(P: Painter) {
  const body = poly(half([[0, 72, 0], [130, 68, 10], [332, 150, 30], [326, 420, 40], [320, 1110, 40], [0, 1138, 0]]));
  P.part(body, P.main, { puff: 1 });
  channels(P, body, 168, 1140, 108);
  const right: Pt[] = [[820, 148], [930, 560], [945, 1030], [950, 1072], [852, 1080], [822, 1000], [800, 420]];
  const [SR, SL] = sleeves(P, right, P.main, 0.9);
  channels(P, SR, 200, 1080, 104);
  channels(P, SL, 200, 1080, 104);
  P.groove(curve([[800, 420], [822, 1000], [850, 1078]]), 4, 0.8);
  P.groove(curve(mxy([[800, 420], [822, 1000], [850, 1078]])), 4, 0.8);
  cuffs(P, [[848, 1044], [950, 1040], [952, 1094], [852, 1098]], P.trim(shade(P.p.color, -0.2)));
  const collar = poly(half([[0, 10, 0], [150, 12, 30], [156, 152, 10], [0, 164, 0]]), 12);
  P.c.save();
  P.c.shadowColor = "rgba(0,0,0,0.65)";
  P.c.shadowBlur = 20 * P.k;
  P.c.shadowOffsetY = 8 * P.k;
  P.c.fillStyle = P.main;
  P.c.fill(collar);
  P.c.restore();
  P.part(collar, P.main, { puff: 0.95 });
  channels(P, collar, 10, 170, 80);
  if (P.front) {
    P.zipper(500, 10, 1138, "matte", 12);
    P.pull(500, 150, "matte");
    P.label(680, 300, 46, 16, "#d9d2c4", "#1a1a1a");
  }
}

function vest(P: Painter) {
  const body = poly(half([[0, 72, 0], [128, 70, 10], [238, 132, 16], [205, 255, 70], [290, 450, 40], [300, 1112, 40], [0, 1130, 0]]));
  P.part(body, P.main, { puff: 1 });
  channels(P, body, 160, 1135, 115);
  // porub oko otvora za ruke
  for (const s of [1, -1]) {
    const pts: XY[] = [[500 + s * 238, 134], [500 + s * 206, 255], [500 + s * 236, 380], [500 + s * 290, 452]];
    P.c.save();
    P.c.strokeStyle = shade(P.p.color, -0.3);
    P.c.lineWidth = 16;
    P.c.stroke(curve(pts));
    P.c.restore();
  }
  const collar = poly(half([[0, 15, 0], [146, 17, 26], [150, 140, 10], [0, 150, 0]]), 12);
  P.c.save();
  P.c.shadowColor = "rgba(0,0,0,0.6)";
  P.c.shadowBlur = 18 * P.k;
  P.c.shadowOffsetY = 8 * P.k;
  P.c.fillStyle = P.main;
  P.c.fill(collar);
  P.c.restore();
  P.part(collar, P.main, { puff: 0.95 });
  channels(P, collar, 15, 150, 68);
  if (P.front) {
    P.zipper(500, 15, 1130, "matte", 12);
    P.pull(500, 140, "matte");
    for (const s of [1, -1]) {
      const a: XY = [500 + s * 150, 815];
      const b: XY = [500 + s * 232, 935];
      P.groove(curve([a, b]), 9, 1.2);
      P.c.save();
      P.c.fillStyle = METALS.matte[0];
      P.c.translate(a[0], a[1]);
      P.c.rotate(Math.atan2(b[1] - a[1], b[0] - a[0]) - Math.PI / 2);
      P.c.fillRect(-6, -4, 12, 30);
      P.c.restore();
    }
  }
}

function cable(P: Painter, cx: number, y0: number, y1: number, width: number, period: number, lw: number) {
  const c = P.c;
  const light = shade(P.p.color, 0.12);
  const dark = shade(P.p.color, -0.45);
  // podloga (lijeva strana pletiva)
  c.save();
  c.fillStyle = shade(P.p.color, -0.3, 0.6);
  c.fillRect(cx - width / 2 - lw * 0.6, y0, width + lw * 1.2, y1 - y0);
  c.restore();
  const half = width / 2;
  const strands: Path2D[] = [];
  const under: Path2D[] = [];
  for (let y = y0; y < y1; y += period) {
    const a = new Path2D();
    a.moveTo(cx - half, y);
    a.bezierCurveTo(cx - half, y + period * 0.5, cx + half, y + period * 0.5, cx + half, y + period);
    strands.push(a);
    const b = new Path2D();
    b.moveTo(cx + half, y);
    b.bezierCurveTo(cx + half, y + period * 0.5, cx - half, y + period * 0.5, cx - half, y + period);
    under.push(b);
  }
  for (const [paths, k] of [[under, 0.75], [strands, 1]] as const) {
    const all = new Path2D();
    for (const s of paths) all.addPath(s);
    c.save();
    c.lineCap = "round";
    c.strokeStyle = dark;
    c.lineWidth = lw * 1.25;
    c.shadowColor = "rgba(0,0,0,0.6)";
    c.shadowBlur = 8 * P.k;
    c.stroke(all);
    c.shadowBlur = 0;
    c.strokeStyle = P.pat(P.p.fabric, toHex(shade(P.p.color, k === 1 ? 0.05 : -0.08)), 0.7);
    c.lineWidth = lw;
    c.stroke(all);
    c.strokeStyle = light;
    c.globalAlpha = 0.25;
    c.lineWidth = lw * 0.3;
    c.stroke(all);
    c.restore();
    if (P.h) {
      const h = P.h;
      h.save();
      h.globalCompositeOperation = "lighter";
      h.strokeStyle = `rgba(255,255,255,${0.35 * k})`;
      h.lineWidth = lw;
      h.lineCap = "round";
      h.filter = `blur(${5 * P.k}px)`;
      h.stroke(all);
      h.restore();
    }
  }
}

function knit(P: Painter) {
  const body = poly(half([[0, 98, 0], [110, 88, 10], [340, 165, 30], [300, 420, 50], [305, 1112, 6], [0, 1112, 0]]));
  P.part(body, P.main, { puff: 0.9 });
  cable(P, 500, 210, 1100, 62, 132, 34);
  cable(P, 288, 230, 1100, 34, 98, 22);
  cable(P, 712, 230, 1100, 34, 98, 22);
  const right: Pt[] = [[835, 160], [920, 580], [930, 1010], [848, 1014], [818, 940], [800, 420]];
  sleeves(P, right, P.main, 0.8);
  P.groove(curve([[800, 420], [818, 940], [846, 1010]]), 4, 0.8);
  P.groove(curve(mxy([[800, 420], [818, 940], [846, 1010]])), 4, 0.8);
  P.part(poly(half([[0, 1100, 0], [308, 1100, 6], [304, 1192, 12], [0, 1196, 0]]), 6), P.trim(), { puff: 0.85, rim: 0.5 });
  cuffs(P, [[846, 1000], [932, 996], [930, 1110], [852, 1114]], P.trim());
  crewNeck(P, 110, 64, 34);
}

function rollneck(P: Painter) {
  const body = poly(half([[0, 112, 0], [120, 100, 10], [312, 140, 24], [286, 390, 40], [290, 1112, 6], [0, 1112, 0]]));
  P.part(body, P.main, { puff: 0.85 });
  const right: Pt[] = [[806, 138], [884, 560], [898, 1030], [826, 1034], [798, 960], [774, 392]];
  sleeves(P, right, P.main, 0.7);
  P.groove(curve([[774, 392], [798, 960], [824, 1030]]), 3, 0.7);
  P.groove(curve(mxy([[774, 392], [798, 960], [824, 1030]])), 3, 0.7);
  P.part(poly(half([[0, 1100, 0], [290, 1100, 6], [288, 1172, 10], [0, 1176, 0]]), 6), P.trim(), { puff: 0.8, rim: 0.5 });
  cuffs(P, [[824, 1024], [900, 1022], [902, 1100], [832, 1104]], P.trim());
  const collar = poly(half([[0, 8, 0], [136, 10, 30], [150, 178, 14], [0, 186, 0]]), 12);
  P.c.save();
  P.c.shadowColor = "rgba(0,0,0,0.6)";
  P.c.shadowBlur = 22 * P.k;
  P.c.shadowOffsetY = 10 * P.k;
  P.c.fillStyle = P.main;
  P.c.fill(collar);
  P.c.restore();
  P.part(collar, P.trim(shade(P.p.color, 0.02)), { puff: 1 });
  // pregib ovratnika
  P.c.save();
  P.c.clip(collar);
  const g = P.c.createLinearGradient(0, 90, 0, 128);
  g.addColorStop(0, "rgba(255,248,236,0.12)");
  g.addColorStop(0.3, "rgba(0,0,0,0.0)");
  g.addColorStop(0.55, "rgba(0,0,0,0.45)");
  g.addColorStop(1, "rgba(0,0,0,0)");
  P.c.fillStyle = g;
  P.c.fillRect(0, 90, DW, 40);
  P.c.restore();
  P.groove(curve([[352, 110], [500, 116], [648, 110]]), 5, 0.6);
  for (const s of [1, -1]) P.fold(500 + s * 180, 420, 1100, 45, 0.1, body);
}

function denimjacket(P: Painter) {
  const body = poly(half([[0, 72, 0], [110, 82, 8], [322, 140, 22], [302, 400, 34], [300, 968, 6], [0, 968, 0]]));
  P.part(body, P.main, { puff: 0.85 });
  const right: Pt[] = [[812, 140], [905, 560], [918, 975], [836, 982], [800, 900], [790, 400]];
  const [SR, SL] = sleeves(P, right, P.main, 0.8);
  P.groove(curve([[790, 400], [800, 900], [834, 978]]), 4, 0.9);
  P.groove(curve(mxy([[790, 400], [800, 900], [834, 978]])), 4, 0.9);
  for (const [S, s] of [[SR, 1], [SL, -1]] as const) {
    const pts: XY[] = [[905 - 10, 560], [918 - 10, 975]];
    P.stitch(curve(s === 1 ? pts : mxy(pts)));
    P.fold(500 + s * 360, 600, 960, 30, 0.14, S);
  }
  const waist = poly(half([[0, 958, 0], [304, 958, 6], [302, 1042, 8], [0, 1046, 0]]), 6);
  P.part(waist, P.main, { puff: 0.9, rim: 0.6 });
  P.stitch(curve([[200, 966], [800, 966]]));
  P.stitch(curve([[200, 1034], [800, 1034]]));
  const cuffR: Pt[] = [[832, 970], [920, 966], [924, 1058], [840, 1062]];
  cuffs(P, cuffR, P.main);
  P.stitch(curve([[836, 978], [920, 974]]));
  P.stitch(curve(mxy([[836, 978], [920, 974]])));

  if (P.front) {
    P.inside(poly([[470, 74], [530, 74], [524, 176], [476, 176]], 6), 0.6);
    // uspravne pregibne linije
    for (const s of [1, -1]) {
      const X = (x: number) => 500 + s * x;
      P.groove(curve([[X(125), 470], [X(112), 958]]), 4, 0.9);
      P.groove(curve([[X(250), 470], [X(258), 958]]), 4, 0.9);
      P.double([[X(135), 470], [X(122), 958]], 9);
      P.double([[X(240), 470], [X(248), 958]], 9);
      P.double([[X(32), 272], [X(150), 266], [X(300), 290]], 10);
      // džep
      const pocket = poly([[X(95), 300], [X(280), 300], [X(280), 470, 8], [X(95), 470, 8]], 4);
      P.raise(pocket, 0.06);
      P.stitch(pocket);
      const flap = poly([[X(90), 292], [X(285), 292], [X(285), 352, 6], [X(187), 398, 6], [X(90), 352, 6]], 4);
      P.c.save();
      P.c.shadowColor = "rgba(0,0,0,0.6)";
      P.c.shadowBlur = 10 * P.k;
      P.c.shadowOffsetY = 5 * P.k;
      P.c.fillStyle = P.main;
      P.c.fill(flap);
      P.c.restore();
      P.raise(flap, 0.12);
      P.stitch(poly([[X(100), 300], [X(275), 300], [X(275), 346, 4], [X(187), 386, 4], [X(100), 346, 4]], 4));
      P.metal(X(187), 360, 14, "copper", { ring: true });
      P.metal(X(262), 1000, 14, "copper", { ring: true });
    }
    // lajsna s dugmadima
    const placket = poly([[468, 172], [532, 172], [532, 1046], [468, 1046]], 2);
    P.c.save();
    P.c.shadowColor = "rgba(0,0,0,0.5)";
    P.c.shadowBlur = 8 * P.k;
    P.c.shadowOffsetX = 3 * P.k;
    P.c.fillStyle = P.main;
    P.c.fill(placket);
    P.c.restore();
    P.raise(placket, 0.06);
    P.stitch(curve([[475, 172], [475, 1046]]));
    P.stitch(curve([[525, 172], [525, 1046]]));
    for (const y of [222, 388, 552, 716, 878, 1002]) P.metal(500, y, 16, "copper", { ring: true });
    // kragna
    for (const s of [1, -1]) {
      const pts: Pt[] = [[512, 92], [630, 62, 10], [718, 118, 12], [668, 262, 6], [572, 214, 10], [520, 170, 6]];
      const collar = poly(s === 1 ? pts : mx(pts), 8);
      P.c.save();
      P.c.shadowColor = "rgba(0,0,0,0.65)";
      P.c.shadowBlur = 16 * P.k;
      P.c.shadowOffsetY = 7 * P.k;
      P.c.fillStyle = P.main;
      P.c.fill(collar);
      P.c.restore();
      P.part(collar, P.main, { puff: 1, rim: 0.5 });
      const inner: XY[] = [[530, 102], [628, 76], [702, 122], [660, 246], [576, 204], [532, 168]];
      P.stitch(curve(s === 1 ? inner : mxy(inner)));
    }
  } else {
    P.double([[200, 330], [500, 420], [800, 330]], 10);
    P.groove(curve([[200, 330], [500, 420], [800, 330]]), 4, 0.9);
    for (const s of [1, -1]) {
      P.groove(curve([[500 + s * 130, 420], [500 + s * 120, 958]]), 4, 0.9);
      P.double([[500 + s * 140, 420], [500 + s * 130, 958]], 9);
    }
    const band = poly(half([[0, 60, 0], [150, 62, 20], [160, 132, 10], [0, 138, 0]]), 10);
    P.part(band, P.main, { puff: 0.9, rim: 0.6 });
    P.stitch(curve([[360, 126], [640, 126]]));
  }
}

function bottoms(P: Painter, wide: boolean, jeans: boolean) {
  const sil = jeans
    ? half([[0, 40, 0], [335, 40, 4], [350, 400, 40], [322, 1288, 6], [42, 1294, 6], [0, 552, 30]])
    : half([[0, 40, 0], [330, 40, 4], [342, 380, 40], [wide ? 356 : 330, 1290, 6], [wide ? 58 : 72, 1295, 6], [0, 556, 30]]);
  const legs = poly(sil);
  P.part(legs, P.main, { puff: 0.8 });
  const waist = poly(half([[0, 38, 0], [jeans ? 335 : 330, 38, 4], [jeans ? 338 : 333, jeans ? 110 : 104, 4], [0, jeans ? 110 : 104, 0]]), 4);
  P.part(waist, P.main, { puff: 0.92, rim: 0.4 });
  const wy = jeans ? 110 : 104;
  if (jeans) {
    P.stitch(curve([[170, 47], [830, 47]]));
    P.stitch(curve([[170, 101], [830, 101]]));
  }
  // gajke za kaiš
  for (const dx of jeans ? [-255, -95, 95, 255] : [-290, -110, 110, 290]) {
    if (!P.front && Math.abs(dx) < 100) continue;
    const w = jeans ? 26 : 18;
    const loop = poly([[500 + dx - w / 2, 30], [500 + dx + w / 2, 30], [500 + dx + w / 2, wy + 10], [500 + dx - w / 2, wy + 10]], 3);
    P.c.save();
    P.c.shadowColor = "rgba(0,0,0,0.55)";
    P.c.shadowBlur = 6 * P.k;
    P.c.shadowOffsetX = 2 * P.k;
    P.c.fillStyle = P.main;
    P.c.fill(loop);
    P.c.restore();
    P.raise(loop, 0.15, 2);
    if (jeans) {
      P.stitch(curve([[500 + dx - w / 2, 40], [500 + dx + w / 2, 40]]));
      P.stitch(curve([[500 + dx - w / 2, wy], [500 + dx + w / 2, wy]]));
    }
  }
  // nabori nogavica
  for (const s of [1, -1]) {
    const X = (x: number) => 500 + s * x;
    P.fold(X(110), 640, 1290, 40, 0.18, legs);
    P.fold(X(270), 500, 1290, 46, 0.14, legs);
    P.fold(X(200), 1180, 1290, 60, 0.12, legs);
  }
  P.groove(curve([[500, wy], [500, 548]]), 3, 0.8);
}

function jeans(P: Painter) {
  bottoms(P, false, true);
  const light = P.p.wash === "light";
  const legs = poly(half([[0, 40, 0], [335, 40, 4], [350, 400, 40], [322, 1288, 6], [42, 1294, 6], [0, 552, 30]]));
  // ispranost
  P.c.save();
  P.c.clip(legs);
  for (const s of [1, -1]) {
    const X = (x: number) => 500 + s * x;
    P.glow(X(180), 480, 150, 220, light ? 0.22 : 0.06);
    P.glow(X(175), 830, 110, 150, light ? 0.24 : 0.07);
    P.c.save();
    P.c.lineCap = "round";
    P.c.shadowColor = `rgba(255,250,240,${light ? 0.5 : 0.18})`;
    P.c.shadowBlur = 10 * P.k;
    P.c.strokeStyle = `rgba(255,250,240,${light ? 0.18 : 0.06})`;
    P.c.lineWidth = 7;
    for (let i = 0; i < 5; i++) {
      const y = 440 + i * 26;
      P.c.stroke(curve([[X(40), y + 40], [X(120), y + 6], [X(230), y - 20 + i * 4]]));
    }
    P.c.restore();
  }
  P.c.restore();

  if (P.front) {
    P.metal(512, 74, 17, "steel", { ring: true });
    P.double([[548, 112], [550, 420], [506, 505]], 9);
    for (const s of [1, -1]) {
      const X = (x: number) => 500 + s * x;
      const open: XY[] = [[X(128), 110], [X(200), 170], [X(270), 260], [X(348), 320]];
      P.c.save();
      P.c.clip(legs);
      P.c.shadowColor = "rgba(0,0,0,0.75)";
      P.c.shadowBlur = 12 * P.k;
      P.c.shadowOffsetY = 4 * P.k;
      P.c.strokeStyle = "rgba(0,0,0,0.4)";
      P.c.lineWidth = 4;
      P.c.stroke(curve(open));
      P.c.restore();
      P.raise(curve(open), -0.4, 3);
      P.stitch(curve(off(open, -s * 10, 10)));
      P.stitch(curve(off(open, -s * 19, 19)));
      P.metal(X(134), 118, 8, "copper");
      P.metal(X(340), 318, 8, "copper");
      P.double([[X(338), 110], [X(350), 400], [X(322), 1284]].map(([x, y]) => [x - s * 10, y] as XY), 7);
    }
    const coin = poly([[205, 120], [298, 120], [300, 214], [207, 214]], 3);
    P.raise(coin, 0.05);
    P.stitch(curve([[208, 120], [208, 212], [296, 212], [296, 120]]));
    P.stitch(curve([[206, 128], [298, 128]]));
  } else {
    const patch = poly([[610, 48], [770, 48], [770, 104], [610, 104]], 4);
    P.c.save();
    P.c.fillStyle = P.pat("leather", "#9c7248");
    P.c.fill(patch);
    P.c.restore();
    P.text("NIT", 690, 77, 30, "rgba(50,30,15,0.55)");
    P.raise(patch, 0.1);
    P.groove(curve([[150, 250], [500, 300], [850, 250]]), 4, 0.9);
    P.double([[150, 258], [500, 308], [850, 258]], 9);
    for (const s of [1, -1]) {
      const pts: Pt[] = [[580, 320], [800, 310], [790, 520, 6], [690, 570, 6], [592, 525, 6]];
      const pk = poly(s === 1 ? pts : mx(pts), 4);
      P.c.save();
      P.c.shadowColor = "rgba(0,0,0,0.5)";
      P.c.shadowBlur = 8 * P.k;
      P.c.shadowOffsetY = 3 * P.k;
      P.c.fillStyle = P.main;
      P.c.fill(pk);
      P.c.restore();
      P.raise(pk, 0.07);
      const inner: Pt[] = [[590, 330], [790, 320], [781, 513, 6], [690, 558, 6], [600, 517, 6]];
      P.stitch(poly(s === 1 ? inner : mx(inner), 4));
      // potpis: jedna ravna nit niz džep
      const sig: XY[] = [[690, 340], [690, 540]];
      P.stitch(curve(s === 1 ? sig : mxy(sig)), { color: "#e4ddd0", w: 3 });
    }
  }

  if (P.p.wash === "raw") {
    // posuvraćeni rub sa selvedge ivicom
    for (const s of [1, -1]) {
      const X = (x: number) => 500 + s * x;
      const cuff = poly([[X(42), 1196], [X(324), 1196], [X(322), 1292], [X(42), 1296]], 2);
      P.c.save();
      P.c.shadowColor = "rgba(0,0,0,0.6)";
      P.c.shadowBlur = 12 * P.k;
      P.c.shadowOffsetY = -4 * P.k;
      P.c.fillStyle = P.pat("denimback", P.p.color);
      P.c.fill(cuff);
      P.c.restore();
      P.raise(cuff, 0.12);
      const sx = s === 1 ? X(318) : X(318) - 12;
      P.c.save();
      P.c.fillStyle = "#e9e4da";
      P.c.fillRect(Math.min(sx, sx + 12) - 0, 1196, 12, 98);
      P.c.fillStyle = "#4b5bc9";
      P.c.fillRect(Math.min(sx, sx + 12) + 5, 1196, 2.4, 98);
      P.c.restore();
      P.stitch(curve([[X(48), 1206], [X(318), 1206]]));
    }
  } else {
    P.stitch(curve([[160, 1268], [460, 1270]]));
    P.stitch(curve([[540, 1270], [840, 1268]]));
  }
}

function trousers(P: Painter) {
  const wide = P.p.fabric === "twill";
  bottoms(P, wide, false);
  const legs = poly(half([[0, 40, 0], [330, 40, 4], [342, 380, 40], [wide ? 356 : 330, 1290, 6], [wide ? 58 : 72, 1295, 6], [0, 556, 30]]));
  for (const s of [1, -1]) {
    const X = (x: number) => 500 + s * x;
    const creaseX = wide ? 205 : 192;
    // ispeglana crta
    P.c.save();
    P.c.clip(legs);
    P.c.strokeStyle = "rgba(255,250,240,0.16)";
    P.c.lineWidth = 3;
    P.c.stroke(curve([[X(creaseX - 4), 280], [X(creaseX), 1292]]));
    P.c.shadowColor = "rgba(0,0,0,0.5)";
    P.c.shadowBlur = 10 * P.k;
    P.c.strokeStyle = "rgba(0,0,0,0.22)";
    P.c.lineWidth = 8;
    P.c.stroke(curve([[X(creaseX + 8), 300], [X(creaseX + 12), 1292]]));
    P.c.restore();
    if (P.h) {
      P.h.save();
      P.h.globalCompositeOperation = "lighter";
      P.h.strokeStyle = "rgba(255,255,255,0.25)";
      P.h.lineWidth = 10;
      P.h.filter = `blur(${4 * P.k}px)`;
      P.h.stroke(curve([[X(creaseX - 4), 280], [X(creaseX), 1292]]));
      P.h.restore();
    }
    if (P.front) {
      P.groove(curve([[X(creaseX - 2), 104], [X(creaseX - 4), 330]]), 4, 0.8);
      P.groove(curve([[X(creaseX - 76), 104], [X(creaseX - 70), 260]]), 4, 0.6);
      P.groove(curve([[X(302), 104], [X(338), 300]]), 5, 1);
      P.stitch(curve([[X(290), 104], [X(326), 300]]), { alpha: 0.5 });
    } else {
      P.groove(curve([[X(150), 104], [X(154), 240]]), 3, 0.6);
      P.groove(curve([[X(95), 212], [X(260), 212]]), 6, 1.2);
      P.metal(X(178), 236, 9, "matte");
    }
  }
  if (P.front) {
    const tab = poly([[486, 48], [566, 48], [566, 96], [486, 96]], 6);
    P.raise(tab, 0.08);
    P.metal(546, 72, 10, "matte");
    P.stitch(curve([[548, 106], [548, 420], [506, 500]]), { alpha: 0.5 });
  }
}

function belt(P: Painter) {
  const c = P.c;
  const strap = new Path2D();
  strap.moveTo(463, 700);
  strap.lineTo(463, 92);
  strap.arc(500, 92, 37, Math.PI, 0);
  strap.lineTo(537, 1150);
  const tip = poly([[514, 1146], [560, 1146], [560, 1168, 4], [537, 1212, 6], [514, 1168, 4]], 4);
  c.save();
  c.lineCap = "butt";
  c.shadowColor = "rgba(0,0,0,0.6)";
  c.shadowBlur = 10 * P.k;
  c.shadowOffsetY = 4 * P.k;
  c.strokeStyle = shade(P.p.color, -0.4);
  c.lineWidth = 48;
  c.stroke(strap);
  c.fillStyle = shade(P.p.color, -0.4);
  c.fill(tip);
  c.restore();
  c.save();
  c.strokeStyle = P.main;
  c.lineWidth = 42;
  c.stroke(strap);
  c.fillStyle = P.main;
  c.fill(tip);
  const g = c.createLinearGradient(0, 0, 0, DH);
  g.addColorStop(0, "rgba(255,240,220,0.08)");
  g.addColorStop(1, "rgba(0,0,0,0.25)");
  c.strokeStyle = g;
  c.stroke(strap);
  c.restore();
  // maska i visina
  P.m.save();
  P.m.lineWidth = 48;
  P.m.stroke(strap);
  P.m.fill(tip);
  P.m.restore();
  if (P.h) {
    P.h.save();
    P.h.strokeStyle = "#bdbdbd";
    P.h.lineWidth = 44;
    P.h.stroke(strap);
    P.h.fillStyle = "#bdbdbd";
    P.h.fill(tip);
    P.h.restore();
  }
  for (const d of [-15, 15]) {
    P.stitch(curve([[463 + d, 690], [463 + d, 92]]), { w: 2.2, dash: [6, 4] });
    P.stitch(curve([[537 + d, 92], [537 + d, 1160]]), { w: 2.2, dash: [6, 4] });
  }
  for (let i = 0; i < 5; i++) {
    const y = 1000 + i * 30;
    c.save();
    c.fillStyle = "#050505";
    c.beginPath();
    c.ellipse(537, y, 5, 6, 0, 0, Math.PI * 2);
    c.fill();
    c.restore();
  }
  // omča
  const keeper = poly([[434, 636], [492, 636], [492, 662], [434, 662]], 4);
  c.save();
  c.shadowColor = "rgba(0,0,0,0.6)";
  c.shadowBlur = 6 * P.k;
  c.shadowOffsetY = 3 * P.k;
  c.fillStyle = P.pat("leather", toHex(shade(P.p.color, -0.12)));
  c.fill(keeper);
  c.restore();
  P.raise(keeper, 0.15, 2);
  // kopča
  const tone: Metal = (P.p.accent ?? "").startsWith("#b0") ? "brass" : "steel";
  const [hi, mid, lo] = METALS[tone];
  const frame = new Path2D();
  frame.roundRect(463 - 44, 694, 88, 94, 12);
  c.save();
  c.shadowColor = "rgba(0,0,0,0.7)";
  c.shadowBlur = 12 * P.k;
  c.shadowOffsetY = 5 * P.k;
  const mg = c.createLinearGradient(419, 694, 507, 788);
  mg.addColorStop(0, hi);
  mg.addColorStop(0.45, mid);
  mg.addColorStop(0.7, lo);
  mg.addColorStop(1, mid);
  c.strokeStyle = mg;
  c.lineWidth = 12;
  c.stroke(frame);
  c.restore();
  c.save();
  c.strokeStyle = mg;
  c.lineWidth = 7;
  c.lineCap = "round";
  c.beginPath();
  c.moveTo(463, 698);
  c.lineTo(463, 786);
  c.stroke();
  c.restore();
  P.m.save();
  P.m.lineWidth = 12;
  P.m.stroke(frame);
  P.m.fillRect(459, 696, 8, 92);
  P.m.restore();
  if (P.h) {
    P.h.save();
    P.h.strokeStyle = "#ffffff";
    P.h.lineWidth = 12;
    P.h.stroke(frame);
    P.h.restore();
  }
}


// ------------------------------------------------------------ jakne i prsluci (novi)

function hoodPeek(P: Painter, w = 130, top = 20, color = shade(P.p.color, -0.25)) {
  if (!P.front) return;
  const hood = poly([[500 - w - 6, 96], [500 - w, top + 14, 36], [500, top - 8, 70], [500 + w, top + 14, 36], [500 + w + 6, 96]]);
  P.part(hood, P.pat(P.p.fabric, toHex(color)), { puff: 0.55 });
}

function snaps(P: Painter, x: number, ys: number[], r = 9, kind: Metal = "steel") {
  for (const y of ys) P.metal(x, y, r, kind, { ring: true });
}

function flapPocket(P: Painter, x0: number, x1: number, y0: number, flapH: number, bodyH: number, snap = true) {
  const body = poly([[x0, y0], [x1, y0], [x1, y0 + bodyH, 8], [x0, y0 + bodyH, 8]], 4);
  P.raise(body, 0.05);
  P.stitch(poly([[x0 + 8, y0], [x1 - 8, y0], [x1 - 8, y0 + bodyH - 8, 6], [x0 + 8, y0 + bodyH - 8, 6]], 4));
  const flap = poly([[x0 - 6, y0 - 8], [x1 + 6, y0 - 8], [x1 + 6, y0 + flapH, 6], [x0 - 6, y0 + flapH, 6]], 4);
  P.c.save();
  P.c.shadowColor = "rgba(0,0,0,0.55)";
  P.c.shadowBlur = 10 * P.k;
  P.c.shadowOffsetY = 5 * P.k;
  P.c.fillStyle = P.main;
  P.c.fill(flap);
  P.c.restore();
  P.raise(flap, 0.1);
  P.stitch(poly([[x0 + 2, y0], [x1 - 2, y0], [x1 - 2, y0 + flapH - 8, 4], [x0 + 2, y0 + flapH - 8, 4]], 4));
  if (snap) P.metal((x0 + x1) / 2, y0 + flapH * 0.55, 8, "matte");
}

function parka(P: Painter) {
  hoodPeek(P, 140, 14);
  const body = poly(half([[0, 95, 0], [125, 85, 10], [330, 150, 26], [330, 420, 40], [348, 1250, 20], [0, 1262, 0]]));
  P.part(body, P.main, { puff: 0.82 });
  const right: Pt[] = [[820, 148], [925, 580], [940, 1080], [852, 1088], [820, 1000], [800, 420]];
  const [SR, SL] = sleeves(P, right, P.main, 0.8);
  P.groove(curve([[800, 420], [820, 1000], [850, 1084]]), 4, 0.8);
  P.groove(curve(mxy([[800, 420], [820, 1000], [850, 1084]])), 4, 0.8);
  for (const [S, s] of [[SR, 1], [SL, -1]] as const) {
    P.fold(500 + s * 380, 620, 1060, 34, 0.14, S);
    const tab: Pt[] = [[858, 1030], [932, 1026], [934, 1064], [860, 1068]];
    const t = poly(s === 1 ? tab : mx(tab), 4);
    P.raise(t, 0.08);
    P.stitch(t, { color: shade(P.p.color, -0.25) });
  }
  // tunel s vezicom u struku
  P.stitch(curve([[175, 630], [825, 630]]), { color: shade(P.p.color, -0.25) });
  P.stitch(curve([[175, 672], [825, 672]]), { color: shade(P.p.color, -0.25) });
  const collar = poly(half([[0, 30, 0], [132, 34, 16], [140, 152, 8], [0, 160, 0]]), 10);
  P.c.save();
  P.c.shadowColor = "rgba(0,0,0,0.55)";
  P.c.shadowBlur = 14 * P.k;
  P.c.shadowOffsetY = 6 * P.k;
  P.c.fillStyle = P.main;
  P.c.fill(collar);
  P.c.restore();
  P.part(collar, P.main, { puff: 0.95, rim: 0.5 });
  P.stitch(curve([[372, 140], [628, 140]]), { color: shade(P.p.color, -0.25) });
  if (P.front) {
    for (const s of [1, -1]) {
      const X = (x: number) => 500 + s * x;
      flapPocket(P, Math.min(X(95), X(265)), Math.max(X(95), X(265)), 330, 58, 170);
      flapPocket(P, Math.min(X(80), X(300)), Math.max(X(80), X(300)), 830, 70, 250);
      P.fold(X(200), 700, 1250, 50, 0.12, body);
    }
    // lajsna preko patenta
    const placket = poly([[468, 40], [532, 40], [532, 1256], [468, 1256]], 2);
    P.c.save();
    P.c.shadowColor = "rgba(0,0,0,0.5)";
    P.c.shadowBlur = 8 * P.k;
    P.c.shadowOffsetX = 3 * P.k;
    P.c.fillStyle = P.main;
    P.c.fill(placket);
    P.c.restore();
    P.raise(placket, 0.05);
    P.stitch(curve([[474, 40], [474, 1256]]), { color: shade(P.p.color, -0.25) });
    P.stitch(curve([[526, 40], [526, 1256]]), { color: shade(P.p.color, -0.25) });
    snaps(P, 500, [110, 300, 480, 760, 960, 1160], 10, "matte");
    // vezice s kopčama
    for (const s of [-1, 1]) {
      const x = 500 + s * 62;
      const cord = curve([[x, 652], [x + s * 6, 700], [x + s * 2, 760]]);
      P.c.save();
      P.c.lineCap = "round";
      P.c.strokeStyle = "#1c1c1c";
      P.c.lineWidth = 7;
      P.c.stroke(cord);
      P.c.fillStyle = "#151515";
      P.c.beginPath();
      P.c.roundRect(x + s * 2 - 9, 755, 18, 30, 6);
      P.c.fill();
      P.c.restore();
    }
  } else {
    P.groove(curve([[500, 160], [500, 1258]]), 3, 0.6);
    for (const s of [1, -1]) P.fold(500 + s * 180, 400, 1250, 55, 0.12, body);
  }
}

function bomber(P: Painter) {
  const body = poly(half([[0, 90, 0], [120, 82, 10], [330, 150, 30], [340, 420, 50], [330, 905, 10], [0, 905, 0]]));
  P.part(body, P.main, { puff: 0.9 });
  const right: Pt[] = [[825, 148], [935, 560], [935, 990], [850, 996], [818, 920], [800, 420]];
  const [SR, SL] = sleeves(P, right, P.main, 0.95);
  P.groove(curve([[800, 420], [818, 920], [848, 992]]), 4, 0.8);
  P.groove(curve(mxy([[800, 420], [818, 920], [848, 992]])), 4, 0.8);
  for (const [S, s] of [[SR, 1], [SL, -1]] as const) {
    P.fold(500 + s * 390, 450, 980, 26, 0.18, S);
    P.fold(500 + s * 360, 600, 980, 22, 0.12, S);
  }
  const trim = P.trim(shade(P.p.color, -0.05));
  P.part(poly(half([[0, 895, 0], [318, 895, 8], [310, 990, 14], [0, 994, 0]]), 6), trim, { puff: 0.85, rim: 0.5 });
  cuffs(P, [[848, 985], [936, 982], [930, 1075], [856, 1080]], trim);
  const collar = poly(half([[0, 28, 0], [132, 30, 20], [140, 122, 10], [0, 130, 0]]), 10);
  P.c.save();
  P.c.shadowColor = "rgba(0,0,0,0.55)";
  P.c.shadowBlur = 14 * P.k;
  P.c.shadowOffsetY = 6 * P.k;
  P.c.fillStyle = trim;
  P.c.fill(collar);
  P.c.restore();
  P.part(collar, trim, { puff: 0.95, rim: 0.4 });
  for (const s of [1, -1]) P.fold(500 + s * 200, 300, 890, 60, 0.12, body);
  if (P.front) {
    P.zipper(500, 28, 994, "steel", 12);
    P.pull(500, 150, "steel");
    for (const s of [1, -1]) {
      const pts: Pt[] = [[590, 700], [770, 640], [782, 682], [602, 742]];
      const flap = poly(s === 1 ? pts : mx(pts), 6);
      P.c.save();
      P.c.shadowColor = "rgba(0,0,0,0.6)";
      P.c.shadowBlur = 10 * P.k;
      P.c.shadowOffsetY = 5 * P.k;
      P.c.fillStyle = P.main;
      P.c.fill(flap);
      P.c.restore();
      P.raise(flap, 0.1);
      P.stitch(poly(s === 1 ? [[598, 706], [764, 650], [772, 676], [606, 732]] : mx([[598, 706], [764, 650], [772, 676], [606, 732]]), 4));
    }
    // džep na rukavu
    P.c.save();
    P.c.clip(SL);
    const pk = poly([[84, 300], [150, 296], [154, 430, 6], [88, 434, 6]], 6);
    P.c.fillStyle = P.main;
    P.c.shadowColor = "rgba(0,0,0,0.5)";
    P.c.shadowBlur = 8 * P.k;
    P.c.fill(pk);
    P.c.restore();
    P.raise(pk, 0.08);
    P.stitch(poly([[90, 306], [144, 302], [148, 424, 4], [94, 428, 4]], 4));
    P.zipper(118, 312, 340, "steel", 8);
    for (const x of [98, 112, 126, 140]) {
      P.c.save();
      P.c.strokeStyle = "rgba(0,0,0,0.45)";
      P.c.lineWidth = 3;
      P.c.beginPath();
      P.c.moveTo(x, 360);
      P.c.lineTo(x, 410);
      P.c.stroke();
      P.c.restore();
    }
  } else {
    P.groove(curve([[500, 130], [500, 900]]), 3, 0.5);
  }
}

function softshell(P: Painter) {
  hoodPeek(P, 128, 4);
  const body = poly(half([[0, 90, 0], [118, 80, 10], [315, 140, 24], [300, 400, 40], [310, 1080, 24], [0, 1092, 0]]));
  P.part(body, P.main, { puff: 0.8 });
  const right: Pt[] = [[810, 138], [905, 560], [918, 1040], [836, 1046], [806, 960], [786, 400]];
  const [SR, SL] = sleeves(P, right, P.main, 0.75);
  P.groove(curve([[786, 400], [806, 960], [834, 1042]]), 3, 0.7);
  P.groove(curve(mxy([[786, 400], [806, 960], [834, 1042]])), 3, 0.7);
  for (const [S, s] of [[SR, 1], [SL, -1]] as const) {
    P.fold(500 + s * 365, 560, 1030, 26, 0.12, S);
    const tab: Pt[] = [[840, 1004], [916, 1000], [918, 1036], [842, 1040]];
    P.raise(poly(s === 1 ? tab : mx(tab), 4), 0.07);
    P.groove(poly(s === 1 ? tab : mx(tab), 4), 2, 0.5);
  }
  // panelni šavovi
  for (const s of [1, -1]) {
    const X = (x: number) => 500 + s * x;
    P.groove(curve([[X(250), 150], [X(190), 520], [X(205), 1080]]), 4, 0.7);
  }
  const collar = poly(half([[0, 10, 0], [128, 14, 24], [136, 142, 10], [0, 152, 0]]), 12);
  P.c.save();
  P.c.shadowColor = "rgba(0,0,0,0.6)";
  P.c.shadowBlur = 16 * P.k;
  P.c.shadowOffsetY = 7 * P.k;
  P.c.fillStyle = P.main;
  P.c.fill(collar);
  P.c.restore();
  P.part(collar, P.main, { puff: 1, rim: 0.5 });
  const indigo = "#3b4bc4";
  const cordPull = (x: number, y: number) => {
    P.c.save();
    P.c.lineCap = "round";
    P.c.strokeStyle = indigo;
    P.c.lineWidth = 5;
    P.c.beginPath();
    P.c.moveTo(x, y);
    P.c.quadraticCurveTo(x + 8, y + 30, x, y + 52);
    P.c.stroke();
    P.c.fillStyle = "#1a1a1a";
    P.c.beginPath();
    P.c.roundRect(x - 6, y + 48, 12, 18, 4);
    P.c.fill();
    P.c.restore();
  };
  if (P.front) {
    // vodootporni patent: bez vidljivih zuba
    P.c.save();
    P.c.strokeStyle = "rgba(0,0,0,0.55)";
    P.c.lineWidth = 6;
    P.c.beginPath();
    P.c.moveTo(500, 10);
    P.c.lineTo(500, 1092);
    P.c.stroke();
    P.c.strokeStyle = "rgba(255,255,255,0.08)";
    P.c.lineWidth = 2;
    P.c.beginPath();
    P.c.moveTo(503, 10);
    P.c.lineTo(503, 1092);
    P.c.stroke();
    P.c.restore();
    P.groove(curve([[500, 10], [500, 1092]]), 3, 0.6);
    cordPull(504, 150);
    // džep na prsima i bočni džepovi
    P.groove(curve([[600, 330], [728, 300]]), 6, 1);
    cordPull(606, 330);
    for (const s of [1, -1]) {
      const X = (x: number) => 500 + s * x;
      P.groove(curve([[X(150), 690], [X(200), 900]]), 6, 1);
      cordPull(X(152), 694);
    }
    P.metal(330, 280, 7, "steel");
  } else {
    P.groove(curve([[300, 330], [500, 360], [700, 330]]), 4, 0.6);
  }
}

function binding(P: Painter, path: Path2D, color: string, w = 16) {
  P.c.save();
  P.c.strokeStyle = color;
  P.c.lineWidth = w;
  P.c.lineJoin = "round";
  P.c.shadowColor = "rgba(0,0,0,0.35)";
  P.c.shadowBlur = 4 * P.k;
  P.c.stroke(path);
  P.c.restore();
  P.m.save();
  P.m.lineWidth = w;
  P.m.lineJoin = "round";
  P.m.stroke(path);
  P.m.restore();
  P.stitch(path, { color: shade(color, -0.25), w: 2, dash: [6, 4], alpha: 0.7 });
}

function fleecevest(P: Painter) {
  const accent = P.p.accent ?? "#6b5a45";
  const right: Pt[] = [[0, 72, 0], [128, 70, 10], [238, 132, 16], [205, 255, 70], [290, 450, 40], [300, 1080, 30], [0, 1092, 0]];
  const body = poly(half(right));
  P.part(body, P.main, { puff: 0.95 });
  for (const s of [1, -1]) P.fold(500 + s * 170, 500, 1080, 60, 0.1, body);
  for (const s of [1, -1]) {
    const pts: XY[] = [[500 + s * 238, 134], [500 + s * 206, 255], [500 + s * 236, 380], [500 + s * 290, 452]];
    binding(P, curve(pts), accent);
  }
  binding(P, curve([[200, 1086], [500, 1092], [800, 1086]]), accent);
  const collar = poly(half([[0, 18, 0], [140, 20, 24], [146, 140, 10], [0, 150, 0]]), 12);
  P.c.save();
  P.c.shadowColor = "rgba(0,0,0,0.5)";
  P.c.shadowBlur = 16 * P.k;
  P.c.shadowOffsetY = 7 * P.k;
  P.c.fillStyle = P.main;
  P.c.fill(collar);
  P.c.restore();
  P.part(collar, P.main, { puff: 1, rim: 0.5 });
  binding(P, curve([[356, 22], [500, 18], [644, 22]]), accent, 14);
  if (P.front) {
    binding(P, curve([[500, 18], [500, 1092]]), accent, 18);
    P.zipper(500, 18, 1092, "matte", 10);
    P.pull(500, 140, "matte");
    const pk = poly([[600, 300], [742, 300], [742, 420, 6], [600, 420, 6]], 6);
    P.part(pk, P.pat("nylon", accent), { puff: 0.8, rim: 0.4 });
    P.stitch(poly([[606, 306], [736, 306], [736, 414, 4], [606, 414, 4]], 4), { color: shade(accent, -0.3) });
    P.zipper(671, 312, 316, "matte", 6);
  }
}

function quiltvest(P: Painter) {
  const lining = P.p.accent ?? "#9a5a2e";
  const right: Pt[] = [[0, 82, 0], [125, 76, 10], [235, 132, 16], [204, 255, 70], [288, 450, 40], [296, 1062, 30], [0, 1074, 0]];
  const body = poly(half(right));
  P.part(body, P.main, { puff: 0.85 });
  // rombovi
  const step = 92;
  const lines = new Path2D();
  for (let d = -1400; d < 1400; d += step) {
    lines.moveTo(d, 0);
    lines.lineTo(d + 1300, 1300);
    lines.moveTo(d + 1300, 0);
    lines.lineTo(d, 1300);
  }
  P.c.save();
  P.c.clip(body);
  P.c.strokeStyle = "rgba(0,0,0,0.5)";
  P.c.lineWidth = 4;
  P.c.shadowColor = "rgba(0,0,0,0.6)";
  P.c.shadowBlur = 14 * P.k;
  P.c.stroke(lines);
  P.c.shadowBlur = 0;
  P.c.translate(2, 3);
  P.c.strokeStyle = "rgba(255,255,255,0.07)";
  P.c.lineWidth = 3;
  P.c.stroke(lines);
  P.c.restore();
  P.c.save();
  P.c.clip(body);
  P.c.setLineDash([6, 4]);
  P.c.strokeStyle = shade(P.p.color, -0.35);
  P.c.lineWidth = 2;
  P.c.stroke(lines);
  P.c.restore();
  if (P.h) {
    P.h.save();
    P.h.clip(body);
    P.h.strokeStyle = "rgba(0,0,0,0.7)";
    P.h.lineWidth = 12;
    P.h.filter = `blur(${10 * P.k}px)`;
    P.h.stroke(lines);
    P.h.restore();
  }
  const edge = shade(P.p.color, -0.3);
  for (const s of [1, -1]) {
    const pts: XY[] = [[500 + s * 235, 134], [500 + s * 205, 255], [500 + s * 234, 380], [500 + s * 288, 452]];
    binding(P, curve(pts), edge, 14);
  }
  binding(P, curve([[204, 1066], [500, 1074], [796, 1066]]), edge, 14);
  if (P.front) {
    // izrez bez ovratnika: vidi se postava u kontrastnoj boji
    const neck = new Path2D();
    neck.moveTo(375, 78);
    neck.quadraticCurveTo(500, 104, 625, 78);
    neck.lineTo(512, 300);
    neck.lineTo(488, 300);
    neck.closePath();
    P.c.save();
    P.c.fillStyle = P.pat("lining", lining);
    P.c.fill(neck);
    P.c.fillStyle = "rgba(0,0,0,0.25)";
    P.c.fill(neck);
    P.c.restore();
    binding(P, curve([[378, 80], [430, 190], [500, 300]]), edge, 14);
    binding(P, curve([[622, 80], [570, 190], [500, 300]]), edge, 14);
    binding(P, curve([[500, 300], [500, 1074]]), edge, 12);
    snaps(P, 500, [360, 520, 680, 840, 1000], 10, "steel");
    for (const s of [1, -1]) {
      const X = (x: number) => 500 + s * x;
      P.groove(curve([[X(120), 820], [X(250), 820]]), 7, 1.2);
      P.metal(X(185), 845, 8, "steel");
    }
  }
}

const DRAW: Record<Product["kind"], (P: Painter) => void> = {
  tee,
  hoodie,
  trackjacket,
  puffer,
  denimjacket,
  vest,
  knit,
  rollneck,
  jeans,
  trousers,
  belt,
  parka,
  bomber,
  softshell,
  fleecevest,
  quiltvest,
};

export interface Drawn {
  color: HTMLCanvasElement;
  height: HTMLCanvasElement | null;
}

/** Crta jednu stranu komada. widthPx je širina kanvasa u pikselima. */
export function drawGarment(p: Product, side: "front" | "back", widthPx: number, withHeight = true): Drawn {
  const w = Math.round(widthPx);
  const hgt = Math.round((widthPx * DH) / DW);
  const k = w / DW;
  const mk = () => {
    const cv = document.createElement("canvas");
    cv.width = w;
    cv.height = hgt;
    return cv;
  };
  const colorC = mk();
  const maskC = mk();
  const heightC = withHeight ? mk() : null;
  // Kanvasi u memoriji procesora: GPU kanvas preglednik može obrisati pod
  // pritiskom memorije (gubitak konteksta), a ovi se samo čitaju i šalju u 3D.
  const ctx2d = (cv: HTMLCanvasElement) => cv.getContext("2d", { willReadFrequently: true })!;
  const c = ctx2d(colorC);
  const m = ctx2d(maskC);
  const h = heightC ? ctx2d(heightC) : null;
  const front = side === "front";
  // leđa crtamo kako se vide odostraga (zrcaljeno)
  for (const ctx of [c, m, h]) {
    if (!ctx) continue;
    if (front) ctx.setTransform(k, 0, 0, k, 0, 0);
    else ctx.setTransform(-k, 0, 0, k, w, 0);
    ctx.imageSmoothingQuality = "high";
  }
  m.fillStyle = "#fff";
  m.strokeStyle = "#fff";
  if (h) {
    h.fillStyle = "#000";
    h.fillRect(0, 0, DW, DH);
  }
  const P = new Painter(c, h, m, k, p, front);
  DRAW[p.kind](P);

  // sve izvan obrisa se briše
  for (const ctx of [c, h]) {
    if (!ctx) continue;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = "destination-in";
    ctx.drawImage(maskC, 0, 0);
    ctx.restore();
  }
  return { color: colorC, height: heightC };
}


/** Složen komad viđen odozgo (za sto i police). Isječak prednje strane uz sjenu pregiba. */
export function drawFolded(p: Product, widthPx: number): HTMLCanvasElement {
  const bottoms = p.kind === "jeans" || p.kind === "trousers";
  const src = drawGarment(p, "front", widthPx * 1.9, false).color;
  const k = src.width / DW;
  const [x0, y0, x1, y1] = bottoms ? [150, 22, 850, 560] : [215, 40, 785, 660];
  const w = Math.round(widthPx);
  const h = Math.round((widthPx * (y1 - y0)) / (x1 - x0));
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const x = c.getContext("2d", { willReadFrequently: true })!;
  const r = Math.min(w, h) * 0.06;
  x.save();
  x.beginPath();
  x.roundRect(0, 0, w, h, r);
  x.clip();
  x.fillStyle = patternFor(x, fabricTile(p.fabric, toHex(p.color)), w / (x1 - x0));
  x.fillRect(0, 0, w, h);
  x.drawImage(src, x0 * k, y0 * k, (x1 - x0) * k, (y1 - y0) * k, 0, 0, w, h);
  // pregib dolje i blago sjenčenje
  const g = x.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, "rgba(255,250,240,0.06)");
  g.addColorStop(0.82, "rgba(0,0,0,0)");
  g.addColorStop(0.93, "rgba(0,0,0,0.22)");
  g.addColorStop(1, "rgba(0,0,0,0.4)");
  x.fillStyle = g;
  x.fillRect(0, 0, w, h);
  const s = x.createLinearGradient(0, 0, w, 0);
  s.addColorStop(0, "rgba(0,0,0,0.25)");
  s.addColorStop(0.08, "rgba(0,0,0,0)");
  s.addColorStop(0.92, "rgba(0,0,0,0)");
  s.addColorStop(1, "rgba(0,0,0,0.25)");
  x.fillStyle = s;
  x.fillRect(0, 0, w, h);
  x.restore();
  return c;
}
