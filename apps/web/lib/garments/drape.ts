// Komad sirovog denima koji visi u heroju.

import { fabricTile, TILE } from "./fabrics";
import { heightToNormal } from "./normal";

export const DRAPE_W = 1.5;
export const DRAPE_H = 2.0;
const W = 1500;
const H = 2000;
export const DRAPE_BASE = "#18203f";

export function drawDrape(back: boolean, width: number) {
  const k = width / W;
  const cw = Math.round(width);
  const ch = Math.round((width * H) / W);
  const color = document.createElement("canvas");
  color.width = cw;
  color.height = ch;
  const height = document.createElement("canvas");
  height.width = cw;
  height.height = ch;
  const c = color.getContext("2d", { willReadFrequently: true })!;
  const h = height.getContext("2d", { willReadFrequently: true })!;
  c.setTransform(k, 0, 0, k, 0, 0);
  h.setTransform(k, 0, 0, k, 0, 0);
  const tile = fabricTile(back ? "denimback" : "denim", DRAPE_BASE);
  const pat = c.createPattern(tile.color, "repeat")!;
  pat.setTransform(new DOMMatrix().scale(tile.units / TILE, tile.units / TILE));
  c.fillStyle = pat;
  c.fillRect(0, 0, W, H);
  h.fillStyle = "#808080";
  h.fillRect(0, 0, W, H);

  // blage nepravilnosti boje, kao kod pravog indiga
  for (let i = 0; i < 14; i++) {
    const x = (i / 14) * W + Math.sin(i * 7.3) * 40;
    const g = c.createLinearGradient(x - 60, 0, x + 60, 0);
    const a = 0.04 + ((i * 37) % 10) / 160;
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(0.5, i % 2 ? `rgba(255,255,255,${a * 0.5})` : `rgba(0,0,0,${a})`);
    g.addColorStop(1, "rgba(0,0,0,0)");
    c.fillStyle = g;
    c.fillRect(x - 60, 0, 120, H);
  }

  // selvedge ivice
  for (const x of [0, W - 18]) {
    c.fillStyle = "#e6e0d4";
    c.fillRect(x, 0, 18, H);
    c.fillStyle = "#3d4fc4";
    c.fillRect(x + (x === 0 ? 11 : 4), 0, 3, H);
    c.fillStyle = "rgba(0,0,0,0.25)";
    c.fillRect(x === 0 ? 18 : W - 20, 0, 2, H);
    h.fillStyle = "#a0a0a0";
    h.fillRect(x, 0, 18, H);
  }

  const hem = (y: number, hgt: number) => {
    const g = c.createLinearGradient(0, y, 0, y + hgt);
    g.addColorStop(0, "rgba(0,0,0,0.35)");
    g.addColorStop(0.15, "rgba(255,255,255,0.05)");
    g.addColorStop(0.85, "rgba(0,0,0,0.0)");
    g.addColorStop(1, "rgba(0,0,0,0.4)");
    c.fillStyle = g;
    c.fillRect(0, y, W, hgt);
    h.fillStyle = "#b0b0b0";
    h.fillRect(0, y, W, hgt);
    h.fillStyle = "#404040";
    h.fillRect(0, y - 3, W, 3);
    h.fillRect(0, y + hgt, W, 3);
    c.save();
    c.setLineDash([9, 6]);
    c.strokeStyle = "#c79a55";
    c.lineWidth = 2.4;
    c.beginPath();
    c.moveTo(0, y + hgt - 10);
    c.lineTo(W, y + hgt - 10);
    c.stroke();
    c.restore();
  };
  hem(0, 70);
  hem(H - 60, 60);

  if (!back) {
    c.save();
    c.translate(W - 210, H - 200);
    c.fillStyle = "#e6e0d4";
    c.shadowColor = "rgba(0,0,0,0.5)";
    c.shadowBlur = 6 * k;
    c.shadowOffsetY = 2 * k;
    c.fillRect(0, 0, 120, 64);
    c.shadowColor = "transparent";
    c.fillStyle = "#1a1d2e";
    c.font = '800 36px "Bricolage Grotesque Variable", "Arial Black", sans-serif';
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText("NIT", 60, 34);
    c.setLineDash([5, 4]);
    c.strokeStyle = "#3d4fc4";
    c.lineWidth = 2;
    c.strokeRect(5, 5, 110, 54);
    c.restore();
    h.fillStyle = "#c0c0c0";
    h.fillRect(W - 210, H - 200, 120, 64);
  }
  const normal = heightToNormal(height, tile, 0.05 * (width / 1024), 0.55, W);
  return { color, normal };
}
