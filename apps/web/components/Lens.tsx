"use client";

import { useEffect, useRef } from "react";
import { getProduct } from "@/lib/catalog";
import { useStore } from "@/lib/store";

const SIZE = 210;

/** Lupa: makro prikaz tkanine ispod kursora. */
export function Lens() {
  const lens = useStore((s) => s.lens);
  const source = useStore((s) => s.lensSource);
  const ref = useRef<HTMLCanvasElement>(null);
  const slug = useStore((s) => s.lensSlug);
  const p = slug ? getProduct(slug) : undefined;

  useEffect(() => {
    const c = ref.current;
    if (!c || !lens.active || !source) return;
    const src = source(lens.side);
    if (!src) return;
    const ctx = c.getContext("2d")!;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    if (c.width !== SIZE * dpr) {
      c.width = c.height = SIZE * dpr;
    }
    const region = src.width * 0.075;
    const sx = lens.u * src.width - region / 2;
    const sy = (1 - lens.v) * src.height - region / 2;
    ctx.fillStyle = "#0b0b0c";
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(src, sx, sy, region, region, 0, 0, c.width, c.height);
    const g = ctx.createRadialGradient(c.width / 2, c.height / 2, c.width * 0.3, c.width / 2, c.height / 2, c.width / 2);
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(1, "rgba(0,0,0,0.45)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, c.width, c.height);
  }, [lens, source]);

  if (!lens.active || !p) return null;
  return (
    <div className="lens" style={{ transform: `translate(${lens.x - SIZE / 2}px, ${lens.y - SIZE / 2}px)` }} aria-hidden>
      <canvas ref={ref} style={{ width: SIZE, height: SIZE }} />
      <span className="lens__note">{p.materials[0]}</span>
    </div>
  );
}
