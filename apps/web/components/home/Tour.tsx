"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { keyframes, zoneForCategory, zoneStart, ZONES, type ZoneId } from "@/lib/boutique";
import { CATEGORIES, categorySingular, formatNo, PRODUCTS, type Category } from "@/lib/catalog";
import { thumbnail } from "@/lib/garments/thumbs";
import { formatPrice } from "@/lib/region";
import { scrollToY } from "@/lib/scroll";
import { live, useStore } from "@/lib/store";
import { Hero } from "./Hero";

const VH_PER_W = 62;

/** Tačke zona na mini tlocrtu (u koordinatama 140 × 84). */
const MAP_DOTS: Record<ZoneId, [number, number]> = {
  izlog: [38, 80],
  ulaz: [70, 70],
  sto: [70, 44],
  jakne: [12, 40],
  farmerke: [62, 10],
  dzemperi: [128, 30],
  kabina: [124, 66],
};

export function Tour() {
  const tier = useStore((s) => s.tier);
  const view = useStore((s) => s.view);
  const hovered = useStore((s) => s.hovered);
  const region = useStore((s) => s.region);
  const set = useStore((s) => s.set);
  const section = useRef<HTMLElement>(null);
  const [zone, setZone] = useState<ZoneId>("izlog");
  const [portrait, setPortrait] = useState(false);
  const tour = tier === "full" && view === "sina";

  useEffect(() => {
    const on = () => setPortrait(window.innerWidth / window.innerHeight < 0.9);
    on();
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);

  const keys = useMemo(() => keyframes(portrait), [portrait]);
  const total = keys.reduce((a, k) => a + k.w, 0);

  // scroll → napredak šetnje
  useEffect(() => {
    let raf = 0;
    let last: ZoneId | null = null;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const el = section.current;
      if (!el) return;
      const vh = window.innerHeight;
      const p = tour ? Math.min(1, Math.max(0, (window.scrollY - el.offsetTop) / Math.max(1, el.offsetHeight - vh))) : 0;
      live.tourP = p;
      live.heroP = Math.min(1, window.scrollY / vh);
      // zona prema segmentu putanje
      let acc = 0;
      let z: ZoneId = keys[0].zone;
      for (const k of keys) {
        if (p * total + 0.15 >= acc) z = k.zone;
        acc += k.w;
      }
      if (z !== last) {
        last = z;
        setZone(z);
      }
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [tour, keys, total]);

  // povratak sa stranice proizvoda na isto mjesto
  useEffect(() => {
    const y = useStore.getState().returnScroll;
    if (y == null) return;
    let n = 0;
    let raf = 0;
    const again = () => {
      scrollToY(y, true);
      if (++n < 6 && Math.abs(window.scrollY - y) > 2) raf = requestAnimationFrame(again);
    };
    again();
    useStore.getState().set({ returnScroll: null });
    return () => cancelAnimationFrame(raf);
  }, []);

  const goZone = (z: ZoneId) => {
    const el = section.current;
    if (!el) return;
    const s = zoneStart(keys, z) + 0.15 / total;
    scrollToY(el.offsetTop + s * (el.offsetHeight - window.innerHeight));
  };

  const info = ZONES.find((z) => z.id === zone)!;
  const items = PRODUCTS.filter((p) => info.categories.includes(p.category));

  return (
    <>
      <section
        id="butik"
        ref={section}
        className={tour ? "tour" : "tour tour--off"}
        style={tour ? { height: `calc(100svh + ${total * VH_PER_W}svh)` } : undefined}
        aria-label="Butik"
      >
        {tour && (
          <div className="tour__sticky">
            <div className={`tour__zone ${zone === "izlog" ? "is-hidden" : ""}`} aria-live="polite">
              <h2 className="tour__title">{info.title}</h2>
              {info.lede && <p className="tour__lede">{info.lede}</p>}
              {zone === "kabina" && (
                <button type="button" className="btn-solid mt-5" onClick={() => set({ cartOpen: true })}>
                  Otvori kabinu
                </button>
              )}
            </div>

            <nav className={`tour__nav ${zone === "izlog" ? "is-hidden" : ""}`} aria-label="Kategorije">
              <div className="filters">
                {CATEGORIES.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    aria-pressed={info.categories.includes(c.id as Category)}
                    onClick={() => goZone(zoneForCategory(c.id))}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
              <div className="view-toggle" role="group" aria-label="Prikaz">
                <button type="button" aria-pressed={view === "sina"} onClick={() => set({ view: "sina" })}>
                  Butik
                </button>
                <button type="button" aria-pressed={view !== "sina"} onClick={() => set({ view: "mreza" })}>
                  Mreža
                </button>
              </div>
            </nav>

            <div className={`tour__bottom ${zone === "izlog" ? "is-hidden" : ""}`}>
              {items.length > 0 ? (
                <ol className="rail-index" aria-label={`Komadi: ${info.title}`}>
                  {items.map((p) => (
                    <li key={p.slug}>
                      <Link
                        href={`/proizvod/${p.slug}`}
                        scroll={false}
                        onClick={(e) => {
                          e.preventDefault();
                          useStore.getState().navigate(`/proizvod/${p.slug}`);
                        }}
                        onFocus={() => set({ hovered: p.slug })}
                        onBlur={() => set({ hovered: null })}
                        onMouseEnter={() => set({ hovered: p.slug })}
                        onMouseLeave={() => set({ hovered: null })}
                        data-hover={hovered === p.slug || undefined}
                      >
                        <span className="rail-index__no tabular">{formatNo(p.no)}</span>
                        <span className="rail-index__name">{p.name}</span>
                        <span className="rail-index__price tabular">{formatPrice(p.price, region)}</span>
                      </Link>
                    </li>
                  ))}
                </ol>
              ) : (
                <span />
              )}
              <MiniMap current={zone} onGo={goZone} />
            </div>
          </div>
        )}
        <Hero />
        {!tour && <Grid />}
      </section>
    </>
  );
}

function MiniMap({ current, onGo }: { current: ZoneId; onGo: (z: ZoneId) => void }) {
  return (
    <div className="minimap">
      <svg viewBox="-4 -4 148 96" width="148" height="96" aria-hidden>
        <rect x="0" y="0" width="140" height="74" rx="2" className="minimap__room" />
        <line x1="10" y1="74" x2="58" y2="74" className="minimap__glass" />
        <line x1="82" y1="74" x2="130" y2="74" className="minimap__glass" />
        <rect x="56" y="36" width="28" height="13" rx="1.5" className="minimap__thing" />
        <rect x="20" y="2" width="46" height="5" className="minimap__thing" />
        <rect x="112" y="54" width="26" height="18" className="minimap__thing" />
      </svg>
      {ZONES.map((z) => {
        const [x, y] = MAP_DOTS[z.id];
        return (
          <button
            key={z.id}
            type="button"
            className="minimap__dot"
            style={{ left: x, top: y }}
            data-on={current === z.id || undefined}
            aria-label={`Idi na: ${z.title}`}
            title={z.title}
            onClick={() => onGo(z.id)}
          />
        );
      })}
    </div>
  );
}

function Grid() {
  const region = useStore((s) => s.region);
  const set = useStore((s) => s.set);
  const tier = useStore((s) => s.tier);
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
    <div className="collection collection--grid">
      <div className="collection__flow">
        <div className="collection__head">
          <div>
            <h2 className="display collection__title">Sve na jednom mjestu</h2>
            <p className="collection__count tabular">{PRODUCTS.length} komada</p>
          </div>
          {tier === "full" && (
            <div className="view-toggle" role="group" aria-label="Prikaz">
              <button type="button" aria-pressed={false} onClick={() => set({ view: "sina" })}>
                Butik
              </button>
              <button type="button" aria-pressed>
                Mreža
              </button>
            </div>
          )}
        </div>
        {CATEGORIES.map((c) => {
          const list = PRODUCTS.filter((p) => p.category === c.id);
          if (!list.length) return null;
          return (
            <div key={c.id} className="grid-group">
              <h3 className="grid-group__title">{c.label}</h3>
              <ul className="grid-view">
                {list.map((p) => (
                  <li key={p.slug}>
                    <Link href={`/proizvod/${p.slug}`} className="grid-card">
                      <div className="grid-card__img">{thumbs[p.slug] && <img src={thumbs[p.slug]} alt={`${p.name}, ${p.colorName}`} />}</div>
                      <div className="grid-card__meta">
                        <span className="tabular text-siva">{formatNo(p.no)}</span>
                        <span className="grid-card__name">{p.name}</span>
                        <span className="tabular">{formatPrice(p.price, region)}</span>
                      </div>
                      <p className="text-sm text-kost-2">
                        {categorySingular(p.category)}, {p.colorName.toLowerCase()}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
