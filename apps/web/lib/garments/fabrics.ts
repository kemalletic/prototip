// Proceduralne pločice tkanina. Svaka pločica je bešavna i ima
// kartu boje i kartu visine (za normal mapu).

import type { Fabric } from "../catalog";
import { hashString, hex, mix, rng, shade } from "./color";

export const TILE = 256;

export type TileKind = Fabric | "ribtrim" | "denimback" | "lining";

export interface Tile {
  color: HTMLCanvasElement;
  height: HTMLCanvasElement;
  /** Koliko jedinica kroja pokriva jedna pločica. */
  units: number;
}

const cache = new Map<string, Tile>();

function canvas(w = TILE, h = TILE) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}

/** Crta pravougaonik i njegove kopije preko ivica da pločica ostane bešavna. */
function wrapRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  for (const ox of [0, -TILE, TILE]) {
    for (const oy of [0, -TILE, TILE]) {
      if (x + ox + w < 0 || x + ox > TILE || y + oy + h < 0 || y + oy > TILE) continue;
      ctx.fillRect(x + ox, y + oy, w, h);
    }
  }
}

function wrapEllipse(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, rot = 0) {
  for (const ox of [0, -TILE, TILE]) {
    for (const oy of [0, -TILE, TILE]) {
      const cx = x + ox;
      const cy = y + oy;
      if (cx + rx < 0 || cx - rx > TILE || cy + ry < 0 || cy - ry > TILE) continue;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, rot, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function diagonals(ctx: CanvasRenderingContext2D, step: number, slope: number) {
  // linije (x,0) -> (x + slope*T, T); slope*T mora biti djeljivo sa step
  for (let x = -TILE * 2; x < TILE * 2; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + slope * TILE, TILE);
    ctx.stroke();
  }
}

function noise(ctx: CanvasRenderingContext2D, amount: number, r: () => number) {
  const img = ctx.getImageData(0, 0, TILE, TILE);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (r() - 0.5) * amount;
    d[i] += n;
    d[i + 1] += n;
    d[i + 2] += n;
  }
  ctx.putImageData(img, 0, 0);
}

function knitV(
  c: CanvasRenderingContext2D,
  h: CanvasRenderingContext2D,
  base: string,
  wale: number,
  course: number,
  r: () => number,
) {
  c.fillStyle = shade(base, -0.28);
  c.fillRect(0, 0, TILE, TILE);
  h.fillStyle = "#202020";
  h.fillRect(0, 0, TILE, TILE);
  const cols = TILE / wale;
  const rows = TILE / course;
  for (let j = 0; j < rows + 1; j++) {
    for (let i = 0; i < cols; i++) {
      const x = i * wale;
      const y = j * course - course / 2;
      const jitter = (r() - 0.5) * 0.12;
      for (const side of [-1, 1]) {
        const cx = x + wale / 2 + side * wale * 0.22;
        const lg = c.createLinearGradient(cx, y, cx, y + course * 1.2);
        lg.addColorStop(0, shade(base, 0.12 + jitter));
        lg.addColorStop(1, shade(base, -0.1 + jitter));
        c.fillStyle = lg;
        h.fillStyle = "#e8e8e8";
        for (const ctx of [c, h]) {
          ctx.save();
          ctx.translate(cx, y + course * 0.6);
          ctx.rotate(side * -0.5);
          ctx.beginPath();
          ctx.ellipse(0, 0, wale * 0.24, course * 0.62, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }
    }
  }
}

export function fabricTile(kind: TileKind, color: string): Tile {
  const key = `${kind}:${color}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const colorC = canvas();
  const heightC = canvas();
  const c = colorC.getContext("2d", { willReadFrequently: true })!;
  const h = heightC.getContext("2d", { willReadFrequently: true })!;
  const r = rng(hashString(key));
  let units = 120;

  c.fillStyle = color;
  c.fillRect(0, 0, TILE, TILE);
  h.fillStyle = "#808080";
  h.fillRect(0, 0, TILE, TILE);

  switch (kind) {
    case "denim":
    case "denimback": {
      const back = kind === "denimback";
      units = 150;
      // varijacija osnove (indigo niti nisu iste nijanse)
      for (let i = 0; i < 90; i++) {
        c.fillStyle = r() > 0.5 ? shade(color, 0.08 + r() * 0.12, 0.35) : shade(color, -0.2 - r() * 0.15, 0.4);
        wrapRect(c, r() * TILE, 0, 0.6 + r() * 1.8, TILE);
      }
      // keper dijagonale
      c.lineWidth = 1.7;
      c.strokeStyle = back ? "rgba(245,240,230,0.45)" : shade(color, 0.32, 0.28);
      diagonals(c, 4, 0.5);
      c.save();
      c.translate(2, 0);
      c.lineWidth = 1.3;
      c.strokeStyle = shade(color, -0.35, back ? 0.2 : 0.38);
      diagonals(c, 4, 0.5);
      c.restore();
      // slub: nepravilnosti potke
      for (let i = 0; i < 160; i++) {
        c.fillStyle = `rgba(240,236,226,${(back ? 0.12 : 0.05) + r() * 0.1})`;
        wrapRect(c, r() * TILE, r() * TILE, 8 + r() * 50, 0.9);
      }
      h.lineWidth = 2;
      h.strokeStyle = "#d8d8d8";
      diagonals(h, 4, 0.5);
      noise(c, 14, r);
      break;
    }
    case "jersey": {
      units = 60;
      for (let x = 0; x < TILE; x += 4) {
        c.fillStyle = shade(color, -0.1, 0.5);
        c.fillRect(x, 0, 1.4, TILE);
        h.fillStyle = "#5a5a5a";
        h.fillRect(x, 0, 1.4, TILE);
      }
      for (let y = 0; y < TILE; y += 4) {
        c.fillStyle = shade(color, 0.05, 0.25);
        c.fillRect(0, y, TILE, 1);
      }
      noise(c, 10, r);
      break;
    }
    case "fleece": {
      units = 110;
      for (let i = 0; i < 4200; i++) {
        c.fillStyle = r() > 0.5 ? shade(color, 0.25 + r() * 0.2, 0.55) : shade(color, -0.25 - r() * 0.2, 0.55);
        wrapEllipse(c, r() * TILE, r() * TILE, 0.6 + r() * 1.1, 0.6 + r() * 2.2);
      }
      for (let x = 0; x < TILE; x += 4) {
        c.fillStyle = shade(color, -0.15, 0.18);
        c.fillRect(x, 0, 1, TILE);
      }
      h.fillStyle = "#909090";
      for (let i = 0; i < 1200; i++) wrapEllipse(h, r() * TILE, r() * TILE, 1.5, 1.5);
      noise(c, 12, r);
      break;
    }
    case "nylon": {
      units = 260;
      c.strokeStyle = shade(color, 0.08, 0.06);
      c.lineWidth = 1;
      for (let i = 0; i <= TILE; i += 32) {
        c.beginPath();
        c.moveTo(i, 0);
        c.lineTo(i, TILE);
        c.moveTo(0, i);
        c.lineTo(TILE, i);
        c.stroke();
      }
      h.strokeStyle = "#888888";
      for (let i = 0; i <= TILE; i += 32) {
        h.beginPath();
        h.moveTo(i, 0);
        h.lineTo(i, TILE);
        h.moveTo(0, i);
        h.lineTo(TILE, i);
        h.stroke();
      }
      noise(c, 5, r);
      break;
    }
    case "rib": {
      units = 95;
      knitV(c, h, color, 16, 12, r);
      noise(c, 10, r);
      break;
    }
    case "fineknit": {
      units = 44;
      knitV(c, h, color, 8, 6, r);
      noise(c, 8, r);
      break;
    }
    case "ribtrim": {
      units = 36;
      for (let x = 0; x < TILE; x += 16) {
        const g = c.createLinearGradient(x, 0, x + 16, 0);
        g.addColorStop(0, shade(color, -0.25));
        g.addColorStop(0.5, shade(color, 0.1));
        g.addColorStop(1, shade(color, -0.25));
        c.fillStyle = g;
        c.fillRect(x, 0, 16, TILE);
        const gh = h.createLinearGradient(x, 0, x + 16, 0);
        gh.addColorStop(0, "#303030");
        gh.addColorStop(0.5, "#e0e0e0");
        gh.addColorStop(1, "#303030");
        h.fillStyle = gh;
        h.fillRect(x, 0, 16, TILE);
      }
      noise(c, 8, r);
      break;
    }
    case "wool": {
      units = 90;
      for (let i = 0; i < 2600; i++) {
        c.fillStyle = r() > 0.5 ? shade(color, 0.12, 0.4) : shade(color, -0.18, 0.4);
        wrapEllipse(c, r() * TILE, r() * TILE, 0.5 + r() * 1.2, 0.5 + r());
      }
      c.lineWidth = 1;
      c.strokeStyle = shade(color, 0.14, 0.16);
      diagonals(c, 4, 0.5);
      h.strokeStyle = "#a8a8a8";
      diagonals(h, 4, 0.5);
      noise(c, 8, r);
      break;
    }
    case "twill": {
      units = 110;
      c.lineWidth = 1.6;
      c.strokeStyle = shade(color, 0.12, 0.22);
      diagonals(c, 4, 0.5);
      c.save();
      c.translate(2, 0);
      c.strokeStyle = shade(color, -0.15, 0.25);
      diagonals(c, 4, 0.5);
      c.restore();
      h.lineWidth = 1.6;
      h.strokeStyle = "#b0b0b0";
      diagonals(h, 4, 0.5);
      noise(c, 8, r);
      break;
    }
    case "leather": {
      units = 70;
      for (let i = 0; i < 1400; i++) {
        c.fillStyle = r() > 0.35 ? shade(color, -0.3, 0.25) : shade(color, 0.18, 0.18);
        wrapEllipse(c, r() * TILE, r() * TILE, 0.8 + r() * 2.6, 0.6 + r() * 1.6, r() * 3);
      }
      h.fillStyle = "#5a5a5a";
      for (let i = 0; i < 900; i++) wrapEllipse(h, r() * TILE, r() * TILE, 1 + r() * 2, 1 + r() * 1.4, r() * 3);
      noise(c, 10, r);
      break;
    }
    case "lining": {
      units = 80;
      c.lineWidth = 1;
      c.strokeStyle = shade(color, 0.08, 0.2);
      diagonals(c, 4, 0.5);
      noise(c, 6, r);
      break;
    }
  }

  const tile = { color: colorC, height: heightC, units };
  cache.set(key, tile);
  return tile;
}

export function patternFor(ctx: CanvasRenderingContext2D, tile: Tile, scale = 1) {
  const p = ctx.createPattern(tile.color, "repeat")!;
  const s = (tile.units * scale) / TILE;
  p.setTransform(new DOMMatrix().scale(s, s));
  return p;
}

export function heightPatternFor(ctx: CanvasRenderingContext2D, tile: Tile, scale = 1) {
  const p = ctx.createPattern(tile.height, "repeat")!;
  const s = (tile.units * scale) / TILE;
  p.setTransform(new DOMMatrix().scale(s, s));
  return p;
}

export { hex, mix, shade };
