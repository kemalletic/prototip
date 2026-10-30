"use client";

import { useEffect, useRef } from "react";
import { formatNo, getProduct } from "@/lib/catalog";
import { formatPrice } from "@/lib/region";
import { live, useStore } from "@/lib/store";

/** Simboli za njegu: pranje na 30°, bez izbjeljivača, peglanje na nisko. */
function Care() {
  return (
    <svg width="78" height="16" viewBox="0 0 78 16" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden>
      <path d="M1 4 L3 14 H15 L17 4" />
      <path d="M1 4 C 4 7, 6 2, 9 5 S 14 2, 17 4" />
      <text x="9" y="12" fontSize="5.5" textAnchor="middle" fill="currentColor" stroke="none">30</text>
      <path d="M26 14 L33 2 L40 14 Z" />
      <path d="M27 3 L39 15" />
      <path d="M49 13 H63 L61 6 H53 C 50 6, 49 9, 49 13 Z" />
      <circle cx="56" cy="10" r="0.9" fill="currentColor" />
      <circle cx="71" cy="9" r="6" />
      <path d="M67 13 L75 5" />
    </svg>
  );
}

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
        <span className="hang-tag__sizes tabular">
          {p.sizes[0]}–{p.sizes[p.sizes.length - 1]}
        </span>
        <span className="hang-tag__care">
          <Care />
        </span>
      </div>
    </div>
  );
}
