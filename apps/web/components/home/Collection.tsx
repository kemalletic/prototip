"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { CATEGORIES, PRODUCTS, categoryLabel, categorySingular, formatNo, type Category } from "@/lib/catalog";
import { thumbnail } from "@/lib/garments/thumbs";
import { formatPrice } from "@/lib/region";
import { scrollToY } from "@/lib/scroll";
import { live, useStore } from "@/lib/store";

const VH_PER_ITEM = 38;

export function Collection() {
  const tier = useStore((s) => s.tier);
  const view = useStore((s) => s.view);
  const filter = useStore((s) => s.filter);
  const hovered = useStore((s) => s.hovered);
  const region = useStore((s) => s.region);
  const set = useStore((s) => s.set);
  const section = useRef<HTMLElement>(null);
  const [current, setCurrent] = useState(0);

  const items = useMemo(() => PRODUCTS.filter((p) => filter === "sve" || p.category === filter), [filter]);
  const rail = tier === "full" && view === "sina";

  // scroll → napredak kamere
  useEffect(() => {
    let raf = 0;
    let lastIdx = -1;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const vh = window.innerHeight;
      const y = window.scrollY;
      live.heroP = Math.min(1, Math.max(0, y / vh));
      const el = section.current;
      if (!el) return;
      const top = el.offsetTop;
      const h = el.offsetHeight;
      live.railP = rail ? Math.min(1, Math.max(0, (y - top) / Math.max(1, h - vh))) : 0;
      const idx = Math.round(live.railP * (items.length - 1));
      if (idx !== lastIdx) {
        lastIdx = idx;
        setCurrent(idx);
      }
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [rail, items.length]);

  // povratak sa stranice proizvoda na isto mjesto
  useEffect(() => {
    const y = useStore.getState().returnScroll;
    if (y == null) return;
    scrollToY(y, true);
    requestAnimationFrame(() => scrollToY(y, true));
    useStore.getState().set({ returnScroll: null });
  }, []);

  const choose = (c: Category | "sve") => {
    set({ filter: c, hovered: null });
    const el = section.current;
    if (el && window.scrollY > el.offsetTop) scrollToY(el.offsetTop);
  };

  const focusItem = (i: number) => {
    const el = section.current;
    if (!el || !rail) return;
    const vh = window.innerHeight;
    const p = items.length > 1 ? i / (items.length - 1) : 0;
    scrollToY(el.offsetTop + p * (el.offsetHeight - vh));
  };

  return (
    <section
      id="kolekcija"
      ref={section}
      className={rail ? "collection collection--rail" : "collection collection--grid"}
      style={rail ? { height: `calc(100vh + ${Math.max(1, items.length - 1) * VH_PER_ITEM}vh)` } : undefined}
      aria-labelledby="kolekcija-naslov"
    >
      <div className={rail ? "collection__sticky" : "collection__flow"}>
        <div className="collection__head">
          <div>
            <h2 id="kolekcija-naslov" className={`display collection__title ${rail ? "collection__title--rail" : ""}`}>
              Kolekcija
            </h2>
            <p className="collection__count tabular">
              {items.length} {items.length === 1 ? "komad" : "komada"}
              {filter !== "sve" ? `, ${categoryLabel(filter).toLowerCase()}` : ""}
            </p>
          </div>
          <div className="collection__controls">
            <div className="filters" role="group" aria-label="Kategorije">
              <button type="button" aria-pressed={filter === "sve"} onClick={() => choose("sve")}>
                Sve
              </button>
              {CATEGORIES.map((c) => (
                <button key={c.id} type="button" aria-pressed={filter === c.id} onClick={() => choose(c.id)}>
                  {c.label}
                </button>
              ))}
            </div>
            {tier === "full" && (
              <div className="view-toggle" role="group" aria-label="Prikaz">
                <button type="button" aria-pressed={view === "sina"} onClick={() => set({ view: "sina" })}>
                  Šina
                </button>
                <button type="button" aria-pressed={view === "mreza"} onClick={() => set({ view: "mreza" })}>
                  Mreža
                </button>
              </div>
            )}
          </div>
        </div>

        {rail ? (
          <nav className="rail-index" aria-label="Komadi na šini">
            <ol>
              {items.map((p, i) => (
                <li key={p.slug}>
                  <Link
                    href={`/proizvod/${p.slug}`}
                    scroll={false}
                    onClick={(e) => {
                      e.preventDefault();
                      useStore.getState().navigate(`/proizvod/${p.slug}`);
                    }}
                    onFocus={() => {
                      focusItem(i);
                      set({ hovered: p.slug });
                    }}
                    onBlur={() => set({ hovered: null })}
                    onMouseEnter={() => set({ hovered: p.slug })}
                    onMouseLeave={() => set({ hovered: null })}
                    aria-current={i === current ? "true" : undefined}
                    data-hover={hovered === p.slug || undefined}
                  >
                    <span className="rail-index__no tabular">{formatNo(p.no)}</span>
                    <span className="rail-index__name">{p.name}</span>
                    <span className="rail-index__price tabular">{formatPrice(p.price, region)}</span>
                  </Link>
                </li>
              ))}
            </ol>
            <p className="rail-index__hint">Skrolaj za šetnju duž šine. Klikni na komad da ga skineš s vješalice.</p>
          </nav>
        ) : (
          <Grid items={items} />
        )}
      </div>
    </section>
  );
}

function Grid({ items }: { items: typeof PRODUCTS }) {
  const region = useStore((s) => s.region);
  const [thumbs, setThumbs] = useState<Record<string, string>>({});

  useEffect(() => {
    let i = 0;
    let alive = true;
    const next = () => {
      if (!alive || i >= PRODUCTS.length) return;
      const p = PRODUCTS[i++];
      const url = thumbnail(p);
      setThumbs((t) => ({ ...t, [p.slug]: url }));
      requestAnimationFrame(next);
    };
    next();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <ul className="grid-view">
      {items.map((p) => (
        <li key={p.slug}>
          <Link href={`/proizvod/${p.slug}`} className="grid-card">
            <div className="grid-card__img">{thumbs[p.slug] && <img src={thumbs[p.slug]} alt={`${p.name}, ${p.colorName}`} />}</div>
            <div className="grid-card__meta">
              <span className="tabular text-siva">{formatNo(p.no)}</span>
              <span className="font-display text-[21px] leading-none">{p.name}</span>
              <span className="tabular">{formatPrice(p.price, region)}</span>
            </div>
            <p className="text-sm text-kost-2">
              {categorySingular(p.category)}, {p.colorName.toLowerCase()}
            </p>
          </Link>
        </li>
      ))}
    </ul>
  );
}
