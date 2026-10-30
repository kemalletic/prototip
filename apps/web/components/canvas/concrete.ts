"use client";

import * as THREE from "three";
import { hashString, rng, shade } from "@/lib/garments/color";
import { heightToNormal } from "@/lib/garments/normal";

/** Jedna pločica = 2,4 × 1,2 m: dvije ploče oplate s rupama od ankera. */
export const TILE_W = 2.4;
export const TILE_H = 1.2;

export function concreteTextures(color: string, holes: boolean) {
  const W = 1024;
  const H = 512;
  const mk = () => {
    const c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    return c;
  };
  const colorC = mk();
  const heightC = mk();
  const c = colorC.getContext("2d", { willReadFrequently: true })!;
  const h = heightC.getContext("2d", { willReadFrequently: true })!;
  const r = rng(hashString(color + holes));
  c.fillStyle = color;
  c.fillRect(0, 0, W, H);
  h.fillStyle = "#808080";
  h.fillRect(0, 0, W, H);

  const wrap = (fn: (ox: number, oy: number) => void) => {
    for (const ox of [-W, 0, W]) for (const oy of [-H, 0, H]) fn(ox, oy);
  };
  // velike mrlje (nejednako sušenje betona)
  for (let i = 0; i < 70; i++) {
    const x = r() * W;
    const y = r() * H;
    const rad = 40 + r() * 160;
    const light = r() > 0.5;
    const a = 0.03 + r() * 0.06;
    wrap((ox, oy) => {
      const g = c.createRadialGradient(x + ox, y + oy, 0, x + ox, y + oy, rad);
      g.addColorStop(0, light ? `rgba(255,255,255,${a})` : `rgba(0,0,0,${a * 1.3})`);
      g.addColorStop(1, "rgba(0,0,0,0)");
      c.fillStyle = g;
      c.fillRect(x + ox - rad, y + oy - rad, rad * 2, rad * 2);
    });
  }
  // sitne pore
  for (let i = 0; i < 700; i++) {
    const x = r() * W;
    const y = r() * H;
    const s = 0.4 + r() * 1.1;
    c.fillStyle = `rgba(0,0,0,${0.04 + r() * 0.1})`;
    c.beginPath();
    c.arc(x, y, s, 0, Math.PI * 2);
    c.fill();
    h.fillStyle = "rgba(0,0,0,0.3)";
    h.beginPath();
    h.arc(x, y, s, 0, Math.PI * 2);
    h.fill();
  }
  // zrno
  const img = c.getImageData(0, 0, W, H);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (r() - 0.5) * 10;
    img.data[i] += n;
    img.data[i + 1] += n;
    img.data[i + 2] += n;
  }
  c.putImageData(img, 0, 0);

  if (holes) {
    // spojevi ploča oplate
    const seam = (x0: number, y0: number, x1: number, y1: number) => {
      c.strokeStyle = shade(color, -0.2, 0.45);
      c.lineWidth = 1.5;
      c.beginPath();
      c.moveTo(x0, y0);
      c.lineTo(x1, y1);
      c.stroke();
      c.strokeStyle = shade(color, 0.1, 0.25);
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(x0 + 1.5, y0 + 1.5);
      c.lineTo(x1 + 1.5, y1 + 1.5);
      c.stroke();
      h.strokeStyle = "#3a3a3a";
      h.lineWidth = 3;
      h.beginPath();
      h.moveTo(x0, y0);
      h.lineTo(x1, y1);
      h.stroke();
    };
    seam(0, 0.5, W, 0.5);
    seam(0.5, 0, 0.5, H);
    seam(W / 2, 0, W / 2, H);
    // rupe od ankera, četiri po ploči
    for (const px of [0, W / 2]) {
      for (const [u, v] of [[0.25, 0.5], [0.75, 0.5]]) {
        const x = px + u * (W / 2);
        const y = v * H;
        const g = c.createRadialGradient(x - 1, y - 1, 1, x, y, 8);
        g.addColorStop(0, shade(color, -0.38));
        g.addColorStop(0.6, shade(color, -0.22));
        g.addColorStop(1, shade(color, -0.05, 0));
        c.fillStyle = g;
        c.beginPath();
        c.arc(x, y, 8, 0, Math.PI * 2);
        c.fill();
        const hg = h.createRadialGradient(x, y, 0, x, y, 8);
        hg.addColorStop(0, "#101010");
        hg.addColorStop(0.7, "#606060");
        hg.addColorStop(1, "#808080");
        h.fillStyle = hg;
        h.beginPath();
        h.arc(x, y, 8, 0, Math.PI * 2);
        h.fill();
      }
    }
  }

  const map = new THREE.CanvasTexture(colorC);
  map.colorSpace = THREE.SRGBColorSpace;
  const normal = new THREE.CanvasTexture(heightToNormal(heightC, null, 0.035, 0));
  for (const t of [map, normal]) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = 8;
  }
  return { map, normal };
}

/** Svjetlo kroz prozor: okvir s prečkama, projektovan reflektorom na zid. */
export function windowCookie() {
  const S = 512;
  const c = document.createElement("canvas");
  c.width = c.height = S;
  const x = c.getContext("2d", { willReadFrequently: true })!;
  x.fillStyle = "#000";
  x.fillRect(0, 0, S, S);
  x.filter = "blur(5px)";
  x.fillStyle = "#fff";
  const cols = 3;
  const rows = 2;
  const pad = 70;
  const bar = 12;
  const pw = (S - pad * 2 - bar * (cols - 1)) / cols;
  const ph = (S - pad * 2 - bar * (rows - 1)) / rows;
  for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) x.fillRect(pad + i * (pw + bar), pad + j * (ph + bar), pw, ph);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
