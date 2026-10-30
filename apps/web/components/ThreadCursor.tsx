"use client";

import { useEffect, useRef } from "react";
import { isTouch } from "@/lib/device-tier";

const SEG = 14;
const LEN = 7;

/** Kratak komad niti visi s kursora i njiše se za njim. */
export function ThreadCursor() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (isTouch()) return;
    const c = ref.current!;
    const ctx = c.getContext("2d")!;
    let w = 0;
    let h = 0;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      c.width = w * dpr;
      c.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);
    const pts = Array.from({ length: SEG }, () => ({ x: -100, y: -100, px: -100, py: -100 }));
    let mx = -100;
    let my = -100;
    let visible = false;
    let raf = 0;
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      mx = e.clientX + 1;
      my = e.clientY + 1;
      if (!visible) {
        for (const p of pts) {
          p.x = p.px = mx;
          p.y = p.py = my;
        }
      }
      visible = true;
    };
    const onLeave = () => (visible = false);
    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);

    const tick = () => {
      raf = requestAnimationFrame(tick);
      ctx.clearRect(0, 0, w, h);
      if (!visible) return;
      pts[0].x = mx;
      pts[0].y = my;
      for (let i = 1; i < SEG; i++) {
        const p = pts[i];
        const vx = (p.x - p.px) * 0.93;
        const vy = (p.y - p.py) * 0.93;
        p.px = p.x;
        p.py = p.y;
        p.x += vx;
        p.y += vy + 0.55;
      }
      for (let k = 0; k < 6; k++) {
        for (let i = 1; i < SEG; i++) {
          const a = pts[i - 1];
          const b = pts[i];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const d = Math.hypot(dx, dy) || 1;
          const diff = (d - LEN) / d;
          if (i === 1) {
            b.x -= dx * diff;
            b.y -= dy * diff;
          } else {
            a.x += dx * diff * 0.5;
            a.y += dy * diff * 0.5;
            b.x -= dx * diff * 0.5;
            b.y -= dy * diff * 0.5;
          }
        }
        pts[0].x = mx;
        pts[0].y = my;
      }
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < SEG - 1; i++) {
        const xc = (pts[i].x + pts[i + 1].x) / 2;
        const yc = (pts[i].y + pts[i + 1].y) / 2;
        ctx.quadraticCurveTo(pts[i].x, pts[i].y, xc, yc);
      }
      const end = pts[SEG - 1];
      ctx.lineTo(end.x, end.y);
      ctx.strokeStyle = "#5162d6";
      ctx.lineWidth = 1.5;
      ctx.lineCap = "round";
      ctx.stroke();
      ctx.fillStyle = "#5162d6";
      ctx.beginPath();
      ctx.arc(end.x, end.y, 2.1, 0, Math.PI * 2);
      ctx.fill();
    };
    tick();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return <canvas ref={ref} className="pointer-events-none fixed inset-0 z-[55] h-full w-full" aria-hidden />;
}
