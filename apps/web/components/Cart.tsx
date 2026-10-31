"use client";

import { useEffect, useState } from "react";
import { getProduct } from "@/lib/catalog";
import { thumbnail } from "@/lib/garments/thumbs";
import { formatPrice } from "@/lib/region";
import { useStore } from "@/lib/store";

export function Cart() {
  const open = useStore((s) => s.cartOpen);
  const cart = useStore((s) => s.cart);
  const region = useStore((s) => s.region);
  const set = useStore((s) => s.set);
  const removeLine = useStore((s) => s.removeLine);
  const setLineSize = useStore((s) => s.setLineSize);
  const [thumbs, setThumbs] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    const next: Record<string, string> = {};
    for (const l of cart) {
      const p = getProduct(l.slug);
      if (p) next[l.slug] = thumbnail(p, "front", 200);
    }
    setThumbs(next);
  }, [open, cart]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && set({ cartOpen: false });
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, set]);

  const total = cart.reduce((n, l) => n + (getProduct(l.slug)?.price ?? 0) * l.qty, 0);

  return (
    <div className={`cart ${open ? "cart--open" : ""}`} aria-hidden={!open}>
      <button type="button" className="cart__scrim" tabIndex={-1} aria-label="Zatvori korpu" onClick={() => set({ cartOpen: false })} />
      <aside className="cart__panel" role="dialog" aria-modal="true" aria-label="Korpa">
        <div className="cart__curtain" aria-hidden />
        <div className="cart__inner">
          <div className="flex items-baseline justify-between">
            <h2 className="display text-[40px]">Korpa</h2>
            <button type="button" className="link-quiet text-sm" onClick={() => set({ cartOpen: false })}>
              Zatvori
            </button>
          </div>
          {cart.length === 0 ? (
            <p className="mt-10 max-w-[30ch] text-kost-2">
              Korpa je prazna. Izaberi komad sa šine, odaberi veličinu i povuci patent.
            </p>
          ) : (
            <ul className="mt-8 flex flex-col divide-y divide-linija">
              {cart.map((l, i) => {
                const p = getProduct(l.slug);
                if (!p) return null;
                return (
                  <li key={`${l.slug}-${l.size}`} className="flex items-center gap-4 py-4">
                    {thumbs[l.slug] ? <img src={thumbs[l.slug]} alt="" className="h-20 w-16 object-contain" /> : <div className="h-20 w-16" />}
                    <div className="flex-1">
                      <p className="cart__name">{p.name}</p>
                      <p className="text-sm text-kost-2">
                        <label>
                          Veličina{" "}
                          <select className="cart__size" value={l.size} onChange={(e) => setLineSize(i, e.target.value)}>
                            {p.sizes.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                        </label>
                        {l.qty > 1 ? `, ${l.qty} komada` : ""}
                      </p>
                      <button type="button" className="link-quiet mt-1 text-xs" onClick={() => removeLine(i)}>
                        Ukloni
                      </button>
                    </div>
                    <span className="tabular text-sm">{formatPrice(p.price * l.qty, region)}</span>
                  </li>
                );
              })}
            </ul>
          )}
          <div className="mt-auto border-t border-linija pt-5">
            <div className="flex items-baseline justify-between">
              <span className="text-kost-2">Ukupno</span>
              <span className="tabular text-lg">{formatPrice(total, region)}</span>
            </div>
            <button type="button" className="btn-solid mt-5 w-full" disabled>
              Nastavi na plaćanje
            </button>
            <p className="mt-3 text-xs text-siva">
              Plaćanje pouzećem i karticom dolazi u fazi 2. Ovo je prototip.
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
}
