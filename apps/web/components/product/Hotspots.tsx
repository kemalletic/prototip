"use client";

import { useEffect, useRef } from "react";
import type { Hotspot } from "@/lib/catalog";
import { live } from "@/lib/store";

/** Tačke s detaljima, pozicionirane prema 3D komadu. */
export function Hotspots({ spots }: { spots: Hotspot[] }) {
  const refs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    live.spots = [];
    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      // na telefonu panel s tekstom klizi preko komada: tada sakrij tačke
      const covered = window.innerWidth < 900 && window.scrollY > 40;
      const op = covered ? 0 : live.spotOpacity;
      refs.current.forEach((el, i) => {
        const q = live.spots[i];
        if (!el || !q) return;
        el.style.transform = `translate(${q.x}px, ${q.y}px)`;
        el.style.opacity = String(op);
        el.style.visibility = op > 0.05 ? "visible" : "hidden";
      });
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [spots]);

  return (
    <div className="hotspots">
      {spots.map((h, i) => (
        <div key={h.label} ref={(el) => void (refs.current[i] = el)} className="hotspot-anchor" style={{ opacity: 0 }}>
          <div className="hotspot" tabIndex={0} aria-label={h.label}>
            <span className="hotspot__dot" aria-hidden />
            <span className="hotspot__label">{h.label}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
