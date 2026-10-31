"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getProduct } from "@/lib/catalog";
import { thumbnail } from "@/lib/garments/thumbs";
import { defaultSize, LOOKS } from "@/lib/looks";
import { formatPrice } from "@/lib/region";
import { useStore } from "@/lib/store";
import { Selvedge } from "../brand/Wordmark";

export function Lookbook() {
  const region = useStore((s) => s.region);
  const addToCart = useStore((s) => s.addToCart);
  const set = useStore((s) => s.set);
  const [thumbs, setThumbs] = useState<Record<string, string>>({});
  const [added, setAdded] = useState<string | null>(null);

  useEffect(() => {
    const slugs = [...new Set(LOOKS.flatMap((l) => l.items.map((i) => i.slug)))];
    let i = 0;
    let alive = true;
    const next = () => {
      if (!alive || i >= slugs.length) return;
      const p = getProduct(slugs[i++]);
      if (p) {
        const url = thumbnail(p, "front", 420);
        setThumbs((t) => ({ ...t, [p.slug]: url }));
      }
      requestAnimationFrame(next);
    };
    next();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <section id="lookbook" className="lookbook" aria-labelledby="lookbook-naslov">
      <Selvedge />
      <div className="lookbook__inner">
        <header className="lookbook__head">
          <h2 id="lookbook-naslov" className="display lookbook__title">
            Lookbook
          </h2>
          <p className="lookbook__lede">Komadi koji idu zajedno, složeni za tebe. Dodaj cijeli look jednim klikom.</p>
        </header>
        <ul className="lookbook__grid">
          {LOOKS.map((look) => {
            const items = look.items.map((i) => getProduct(i.slug)!).filter(Boolean);
            const total = items.reduce((n, p) => n + p.price, 0);
            return (
              <li key={look.id} className="look">
                <div className="look__board" aria-hidden>
                  {look.items.map((it) =>
                    thumbs[it.slug] ? (
                      <img
                        key={it.slug}
                        src={thumbs[it.slug]}
                        alt=""
                        style={{ left: `${it.x}%`, top: `${it.y}%`, width: `${it.w}%`, transform: `rotate(${it.r}deg)` }}
                      />
                    ) : null,
                  )}
                </div>
                <div className="look__body">
                  <h3 className="look__name">{look.name}</h3>
                  <p className="look__note">{look.note}</p>
                  <ul className="look__items">
                    {items.map((p) => (
                      <li key={p.slug}>
                        <Link href={`/proizvod/${p.slug}`}>{p.name}</Link>
                        <span className="tabular">{formatPrice(p.price, region)}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="look__total">
                    <span>Ukupno</span>
                    <span className="tabular">{formatPrice(total, region)}</span>
                  </div>
                  <button
                    type="button"
                    className="btn-solid look__add"
                    onClick={() => {
                      for (const p of items) addToCart(p.slug, defaultSize(p.sizes));
                      setAdded(look.id);
                      set({ cartOpen: true });
                    }}
                  >
                    {added === look.id ? "Look je u korpi" : "Dodaj cijeli look"}
                  </button>
                  <p className="look__hint">Dodajemo veličinu M ili 32. Promijeni je u korpi.</p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
