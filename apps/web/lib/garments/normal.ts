import { DW } from "./draw";
import { TILE, type Tile } from "./fabrics";

/** Iz karte visine pravi normal mapu (Sobel), uz utkanu teksturu tkanine. */
export function heightToNormal(height: HTMLCanvasElement, tile: Tile | null, strength: number, weave = 0.28, designWidth = DW) {
  const w = height.width;
  const h = height.height;
  const src = document.createElement("canvas");
  src.width = w;
  src.height = h;
  const s = src.getContext("2d", { willReadFrequently: true })!;
  s.fillStyle = "#000";
  s.fillRect(0, 0, w, h);
  s.drawImage(height, 0, 0);
  if (tile && weave > 0) {
    const k = w / designWidth;
    const pat = s.createPattern(tile.height, "repeat")!;
    const sc = (tile.units * k) / TILE;
    pat.setTransform(new DOMMatrix().scale(sc, sc));
    s.globalAlpha = weave;
    s.fillStyle = pat;
    s.fillRect(0, 0, w, h);
    s.globalAlpha = 1;
  }
  const data = s.getImageData(0, 0, w, h).data;
  const out = document.createElement("canvas");
  out.width = w;
  out.height = h;
  const o = out.getContext("2d", { willReadFrequently: true })!;
  const img = o.createImageData(w, h);
  const d = img.data;
  for (let y = 0; y < h; y++) {
    const y0 = (y > 0 ? y - 1 : y) * w;
    const y1 = (y < h - 1 ? y + 1 : y) * w;
    const yr = y * w;
    for (let x = 0; x < w; x++) {
      const x0 = x > 0 ? x - 1 : x;
      const x1 = x < w - 1 ? x + 1 : x;
      const dx = data[(yr + x1) * 4] - data[(yr + x0) * 4];
      const dy = data[(y1 + x) * 4] - data[(y0 + x) * 4];
      const nx = -dx * strength;
      const ny = dy * strength;
      const l = Math.sqrt(nx * nx + ny * ny + 1);
      const i = (yr + x) * 4;
      d[i] = (nx / l) * 127.5 + 127.5;
      d[i + 1] = (ny / l) * 127.5 + 127.5;
      d[i + 2] = (1 / l) * 127.5 + 127.5;
      d[i + 3] = 255;
    }
  }
  o.putImageData(img, 0, 0);
  return out;
}

export function downscale(src: HTMLCanvasElement, width: number) {
  const c = document.createElement("canvas");
  c.width = width;
  c.height = Math.round((width * src.height) / src.width);
  const x = c.getContext("2d", { willReadFrequently: true })!;
  x.imageSmoothingQuality = "high";
  x.fillStyle = "#000";
  x.fillRect(0, 0, c.width, c.height);
  x.drawImage(src, 0, 0, c.width, c.height);
  return c;
}

/** Mala maska providnosti za pogađanje pokazivačem (samo pravi dio komada). */
export interface AlphaMask {
  w: number;
  h: number;
  data: Uint8Array;
}

export function alphaMask(color: HTMLCanvasElement, w = 80): AlphaMask {
  const hgt = Math.round((w * color.height) / color.width);
  const c = document.createElement("canvas");
  c.width = w;
  c.height = hgt;
  const x = c.getContext("2d", { willReadFrequently: true })!;
  x.drawImage(color, 0, 0, w, hgt);
  const img = x.getImageData(0, 0, w, hgt).data;
  const data = new Uint8Array(w * hgt);
  for (let i = 0; i < data.length; i++) data[i] = img[i * 4 + 3] > 100 ? 1 : 0;
  return { w, h: hgt, data };
}

export function hitMask(m: AlphaMask, u: number, v: number) {
  const x = Math.min(m.w - 1, Math.max(0, Math.floor(u * m.w)));
  const y = Math.min(m.h - 1, Math.max(0, Math.floor((1 - v) * m.h)));
  return m.data[y * m.w + x] === 1;
}
