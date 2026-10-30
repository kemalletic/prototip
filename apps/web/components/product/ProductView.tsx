"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { categorySingular, formatNo, getProduct } from "@/lib/catalog";
import { largeCanvas, thumbnail } from "@/lib/garments/thumbs";
import { formatPrice } from "@/lib/region";
import { live, useStore } from "@/lib/store";
import { ZipperButton } from "../ZipperButton";
import { Hotspots } from "./Hotspots";

export function ProductView({ slug }: { slug: string }) {
  const p = getProduct(slug)!;
  const router = useRouter();
  const tier = useStore((s) => s.tier);
  const region = useStore((s) => s.region);
  const addToCart = useStore((s) => s.addToCart);
  const set = useStore((s) => s.set);
  const [size, setSize] = useState<string | null>(null);
  const [warn, setWarn] = useState(false);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    live.rotate = 0;
    window.scrollTo(0, 0);
    return () => {
      useStore.getState().set({ lens: { ...useStore.getState().lens, active: false } });
    };
  }, [slug]);

  // prevlačenje okreće komad
  useEffect(() => {
    if (tier !== "full") return;
    let startX = 0;
    let startRot = 0;
    let active = false;
    const down = (e: PointerEvent) => {
      if (!(e.target instanceof HTMLCanvasElement)) return;
      active = true;
      startX = e.clientX;
      startRot = live.rotate;
    };
    const move = (e: PointerEvent) => {
      if (!active) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 3 && !live.dragging) {
        live.dragging = true;
        useStore.getState().set({ lens: { ...useStore.getState().lens, active: false } });
      }
      live.rotate = startRot + dx * 0.009;
    };
    const up = () => {
      active = false;
      setTimeout(() => (live.dragging = false), 0);
    };
    window.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      window.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
  }, [tier]);

  const back = () => {
    if (window.history.length > 1 && useStore.getState().returnScroll != null) router.back();
    else router.push("/#kolekcija", { scroll: false });
  };

  return (
    <div className="product">
      {tier === "static" && <StaticGarment slug={slug} />}
      {tier === "full" && <Hotspots spots={p.hotspots} />}
      {tier === "full" && (
        <div className="product__stage-hint" aria-hidden>
          <span>Prevuci da okreneš komad.</span>
          <span className="hidden md:inline">Pređi kursorom preko tkanine za lupu.</span>
        </div>
      )}
      <article className="product__panel" aria-labelledby="proizvod-naslov">
        <button type="button" className="link-quiet text-sm" onClick={back}>
          Nazad na kolekciju
        </button>
        <p className="mt-8 text-sm text-siva tabular">
          {`${formatNo(p.no)}, ${categorySingular(p.category).toLowerCase()}`}
        </p>
        <h1 id="proizvod-naslov" className="display product__title">
          {p.name}
        </h1>
        <p className="mt-2 text-kost-2">{p.colorName}</p>
        <p className="product__price tabular">{formatPrice(p.price, region)}</p>
        <p className="product__summary">{p.summary}</p>

        <fieldset className="sizes">
          <legend>
            Veličina
            {warn && !size && (
              <span role="alert" className="sizes__warn">
                Izaberi veličinu prije dodavanja.
              </span>
            )}
          </legend>
          <div className="sizes__row">
            {p.sizes.map((s) => (
              <label key={s} className="size">
                <input
                  type="radio"
                  name="velicina"
                  value={s}
                  checked={size === s}
                  onChange={() => {
                    setSize(s);
                    setWarn(false);
                  }}
                />
                <span className="tabular">{s}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <ZipperButton
          price={formatPrice(p.price, region)}
          canAdd={!!size}
          onBlocked={() => setWarn(true)}
          onAdd={() => {
            addToCart(p.slug, size!);
            setAdded(true);
          }}
        />
        {added && (
          <button type="button" className="link-quiet mt-3 text-sm underline underline-offset-4" onClick={() => set({ cartOpen: true })}>
            Otvori korpu
          </button>
        )}

        <dl className="product__facts">
          <dt>Materijal</dt>
          {p.materials.map((m) => (
            <dd key={m}>{m}</dd>
          ))}
          <dt>Dostava</dt>
          <dd>BiH dva radna dana, region tri do četiri. Plaćanje pouzećem ili karticom.</dd>
        </dl>
        <Link href="/#kolekcija" className="sr-only">
          Sva kolekcija
        </Link>
      </article>
    </div>
  );
}

/** Lagana verzija: slika komada s lupom, bez 3D-a. */
function StaticGarment({ slug }: { slug: string }) {
  const p = getProduct(slug)!;
  const [side, setSide] = useState<"front" | "back">("front");
  const [src, setSrc] = useState<string | null>(null);
  const img = useRef<HTMLImageElement>(null);

  useEffect(() => {
    setSrc(thumbnail(p, side, 900));
    useStore.getState().set({ lensSlug: p.slug, lensSource: (s) => largeCanvas(p, s) });
  }, [p, side]);

  const onMove = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    const r = img.current!.getBoundingClientRect();
    const u = (e.clientX - r.left) / r.width;
    const v = 1 - (e.clientY - r.top) / r.height;
    useStore.getState().set({ lens: { active: true, x: e.clientX, y: e.clientY, u, v, side } });
  };

  return (
    <div className="product__static">
      {src && (
        <img
          ref={img}
          src={src}
          alt={`${p.name}, ${side === "front" ? "prednja" : "stražnja"} strana`}
          onPointerMove={onMove}
          onPointerLeave={() => useStore.getState().set({ lens: { ...useStore.getState().lens, active: false } })}
        />
      )}
      <div className="view-toggle mt-4" role="group" aria-label="Strana">
        <button type="button" aria-pressed={side === "front"} onClick={() => setSide("front")}>
          Prednja
        </button>
        <button type="button" aria-pressed={side === "back"} onClick={() => setSide("back")}>
          Stražnja
        </button>
      </div>
    </div>
  );
}
