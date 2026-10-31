"use client";

import { useEffect, useRef } from "react";
import { formatNo, getProduct } from "@/lib/catalog";
import { formatPrice } from "@/lib/region";
import { live, useStore } from "@/lib/store";

/** Etiketa koja visi na niti s komada ispod kursora. */
export function HangTag() {
  const hovered = useStore((s) => s.hovered);
  const region = useStore((s) => s.region);
  const ref = useRef<HTMLDivElement>(null);
  const p = hovered ? getProduct(hovered) : undefined;

  useEffect(() => {
    if (!p) return;
    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (ref.current) ref.current.style.transform = `translate(${live.tag.x}px, ${live.tag.y}px)`;
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [p]);

  if (!p) return null;
  return (
    <div ref={ref} className="hang-tag-anchor" aria-hidden>
      <div className="hang-tag">
        <span className="hang-tag__no">{formatNo(p.no)}</span>
        <span className="hang-tag__name">{p.name}</span>
        <span className="hang-tag__price tabular">{formatPrice(p.price, region)}</span>
      </div>
    </div>
  );
}
