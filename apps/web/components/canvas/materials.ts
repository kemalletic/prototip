"use client";

import * as THREE from "three";
import { hashString, mix, rng, shade } from "@/lib/garments/color";
import { heightToNormal } from "@/lib/garments/normal";

// Proceduralni materijali butika: kreč, hrast, travertin, kamene ploče.

interface Maps {
  map: THREE.CanvasTexture;
  normal: THREE.CanvasTexture;
}

const cache = new Map<string, Maps>();

function canvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}

function finish(key: string, color: HTMLCanvasElement, height: HTMLCanvasElement, strength: number): Maps {
  const map = new THREE.CanvasTexture(color);
  map.colorSpace = THREE.SRGBColorSpace;
  const normal = new THREE.CanvasTexture(heightToNormal(height, null, strength, 0, height.width));
  for (const t of [map, normal]) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = 8;
  }
  const out = { map, normal };
  cache.set(key, out);
  return out;
}

/** Vrati kopiju s vlastitim ponavljanjem (teksture dijele sliku). */
export function repeated(m: Maps, rx: number, ry: number): Maps {
  const map = m.map.clone();
  const normal = m.normal.clone();
  map.repeat.set(rx, ry);
  normal.repeat.set(rx, ry);
  map.needsUpdate = normal.needsUpdate = true;
  return { map, normal };
}

function wrapBlob(ctx: CanvasRenderingContext2D, W: number, H: number, x: number, y: number, r: number, color: string) {
  for (const ox of [-W, 0, W])
    for (const oy of [-H, 0, H]) {
      const g = ctx.createRadialGradient(x + ox, y + oy, 0, x + ox, y + oy, r);
      g.addColorStop(0, color);
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.fillRect(x + ox - r, y + oy - r, r * 2, r * 2);
    }
}

function grain(ctx: CanvasRenderingContext2D, W: number, H: number, amount: number, r: () => number) {
  const img = ctx.getImageData(0, 0, W, H);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (r() - 0.5) * amount;
    img.data[i] += n;
    img.data[i + 1] += n;
    img.data[i + 2] += n;
  }
  ctx.putImageData(img, 0, 0);
}

/** Kreč / tadelakt: meke oblačne mrlje i tragovi gladilice. Pločica 2 × 2 m. */
export function plaster(color: string): Maps {
  const key = `plaster:${color}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const W = 1024;
  const H = 1024;
  const c = canvas(W, H);
  const h = canvas(W, H);
  const x = c.getContext("2d", { willReadFrequently: true })!;
  const y = h.getContext("2d", { willReadFrequently: true })!;
  const r = rng(hashString(key));
  x.fillStyle = color;
  x.fillRect(0, 0, W, H);
  y.fillStyle = "#808080";
  y.fillRect(0, 0, W, H);
  for (let i = 0; i < 90; i++) {
    const light = r() > 0.5;
    wrapBlob(x, W, H, r() * W, r() * H, 80 + r() * 260, light ? `rgba(255,252,246,${0.03 + r() * 0.05})` : `rgba(120,95,70,${0.015 + r() * 0.03})`);
  }
  // tragovi gladilice
  for (let i = 0; i < 260; i++) {
    const cx = r() * W;
    const cy = r() * H;
    const len = 60 + r() * 180;
    const a = r() * Math.PI;
    y.strokeStyle = `rgba(${r() > 0.5 ? "255,255,255" : "0,0,0"},${0.04 + r() * 0.06})`;
    y.lineWidth = 6 + r() * 18;
    y.lineCap = "round";
    y.beginPath();
    y.moveTo(cx, cy);
    y.quadraticCurveTo(cx + Math.cos(a) * len * 0.5 + 20, cy + Math.sin(a) * len * 0.5, cx + Math.cos(a) * len, cy + Math.sin(a) * len);
    y.stroke();
  }
  grain(x, W, H, 6, r);
  return finish(key, c, h, 0.012);
}

/** Hrastove daske: pločica 1,44 m (8 dasaka od 18 cm) × 2,4 m. */
export function oak(base = "#c9a67a"): Maps {
  const key = `oak:${base}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const W = 768;
  const H = 1280;
  const c = canvas(W, H);
  const h = canvas(W, H);
  const x = c.getContext("2d", { willReadFrequently: true })!;
  const y = h.getContext("2d", { willReadFrequently: true })!;
  const r = rng(hashString(key));
  const plank = W / 8;
  y.fillStyle = "#808080";
  y.fillRect(0, 0, W, H);
  for (let i = 0; i < 8; i++) {
    let yy = -r() * H;
    while (yy < H) {
      const len = H * (0.35 + r() * 0.55);
      const tone = mix(base, r() > 0.5 ? "#e2c49c" : "#9c7548", r() * 0.35);
      for (const oy of [0, H]) {
        x.fillStyle = tone;
        x.fillRect(i * plank, yy - oy, plank, len);
        // godovi
        for (let g = 0; g < 26; g++) {
          const gx = i * plank + r() * plank;
          x.strokeStyle = r() > 0.5 ? shade(base, -0.18, 0.18) : shade(base, 0.12, 0.14);
          x.lineWidth = 0.6 + r() * 1.6;
          x.beginPath();
          x.moveTo(gx, yy - oy);
          for (let s = 0; s <= 10; s++) x.lineTo(gx + Math.sin(s * 0.9 + g) * (2 + r() * 3), yy - oy + (len * s) / 10);
          x.stroke();
        }
        // spoj dasaka po dužini
        x.fillStyle = "rgba(40,25,10,0.5)";
        x.fillRect(i * plank, yy - oy + len - 1.5, plank, 2.5);
        y.fillStyle = "#303030";
        y.fillRect(i * plank, yy - oy + len - 1.5, plank, 3);
      }
      yy += len;
    }
    x.fillStyle = "rgba(40,25,10,0.55)";
    x.fillRect(i * plank, 0, 2, H);
    y.fillStyle = "#2a2a2a";
    y.fillRect(i * plank, 0, 3, H);
  }
  grain(x, W, H, 8, r);
  return finish(key, c, h, 0.04);
}

/** Travertin: vodoravne žile i sitne pore. Pločica 1,2 × 0,6 m. */
export function travertine(base = "#d9ccb4"): Maps {
  const key = `trav:${base}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const W = 1024;
  const H = 512;
  const c = canvas(W, H);
  const h = canvas(W, H);
  const x = c.getContext("2d", { willReadFrequently: true })!;
  const y = h.getContext("2d", { willReadFrequently: true })!;
  const r = rng(hashString(key));
  x.fillStyle = base;
  x.fillRect(0, 0, W, H);
  y.fillStyle = "#808080";
  y.fillRect(0, 0, W, H);
  for (let i = 0; i < 60; i++) {
    const yy = r() * H;
    const th = 2 + r() * 14;
    x.fillStyle = r() > 0.5 ? shade(base, 0.08, 0.35) : shade(base, -0.12, 0.3);
    x.beginPath();
    x.moveTo(0, yy);
    for (let s = 0; s <= 16; s++) x.lineTo((W * s) / 16, yy + Math.sin(s * 0.8 + i) * 4 + (r() - 0.5) * 3);
    for (let s = 16; s >= 0; s--) x.lineTo((W * s) / 16, yy + th + Math.sin(s * 0.8 + i) * 4);
    x.fill();
  }
  for (let i = 0; i < 240; i++) {
    const px = r() * W;
    const py = r() * H;
    const rx = 0.8 + r() * 3.5;
    const ry = 0.5 + r() * 1.1;
    x.fillStyle = shade(base, -0.18, 0.35);
    x.beginPath();
    x.ellipse(px, py, rx, ry, 0, 0, Math.PI * 2);
    x.fill();
    y.fillStyle = "#2a2a2a";
    y.beginPath();
    y.ellipse(px, py, rx, ry, 0, 0, Math.PI * 2);
    y.fill();
  }
  grain(x, W, H, 6, r);
  return finish(key, c, h, 0.03);
}

/** Kamene ploče trotoara 60 × 40 cm. Pločica 2,4 × 1,6 m. */
export function pavers(base = "#9d978c"): Maps {
  const key = `pav:${base}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const W = 1024;
  const H = 682;
  const c = canvas(W, H);
  const h = canvas(W, H);
  const x = c.getContext("2d", { willReadFrequently: true })!;
  const y = h.getContext("2d", { willReadFrequently: true })!;
  const r = rng(hashString(key));
  y.fillStyle = "#909090";
  y.fillRect(0, 0, W, H);
  const pw = W / 4;
  const ph = H / 4;
  for (let j = 0; j < 4; j++)
    for (let i = 0; i < 5; i++) {
      const ox = (j % 2) * (pw / 2) + i * pw - pw / 2;
      x.fillStyle = mix(base, r() > 0.5 ? "#b8b1a5" : "#7d776d", r() * 0.4);
      x.fillRect(ox, j * ph, pw, ph);
      for (let k = 0; k < 40; k++) wrapBlob(x, W, H, ox + r() * pw, j * ph + r() * ph, 6 + r() * 20, `rgba(0,0,0,${r() * 0.05})`);
      x.fillStyle = "rgba(30,28,25,0.6)";
      x.fillRect(ox, j * ph, pw, 3);
      x.fillRect(ox, j * ph, 3, ph);
      y.fillStyle = "#202020";
      y.fillRect(ox, j * ph, pw, 4);
      y.fillRect(ox, j * ph, 4, ph);
    }
  grain(x, W, H, 12, r);
  return finish(key, c, h, 0.05);
}

/** Natpis s imenom za fasadu: tamna slova na kamenu, sa sjajem noću. */
export function signTexture(text: string) {
  const W = 1024;
  const H = 256;
  const c = canvas(W, H);
  const x = c.getContext("2d", { willReadFrequently: true })!;
  x.clearRect(0, 0, W, H);
  x.fillStyle = "#fff";
  x.font = `800 190px "Archivo Variable", "Archivo", "Helvetica Neue", Arial, sans-serif`;
  (x as CanvasRenderingContext2D & { fontStretch?: string }).fontStretch = "expanded";
  x.textAlign = "center";
  x.textBaseline = "middle";
  x.fillText(text, W / 2, H / 2 + 8);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
