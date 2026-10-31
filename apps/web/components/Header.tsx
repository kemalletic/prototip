"use client";

import Link from "next/link";
import { REGIONS, type RegionId } from "@/lib/region";
import { useStore } from "@/lib/store";
import { Wordmark } from "./brand/Wordmark";

export function Header() {
  const region = useStore((s) => s.region);
  const sound = useStore((s) => s.sound);
  const count = useStore((s) => s.cart.reduce((n, l) => n + l.qty, 0));
  const set = useStore((s) => s.set);

  return (
    <header className="site-header pointer-events-none fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between px-4 md:h-20 md:px-10">
      <Link href="/" className="wordmark pointer-events-auto" aria-label="NIT, početna">
        <Wordmark className="wordmark__svg" />
      </Link>
      <nav className="pointer-events-auto flex items-center gap-4 text-[13px] md:gap-7 md:text-sm" aria-label="Glavna">
        <a href="/#lookbook" className="link-quiet hidden md:inline">
          Lookbook
        </a>
        <label className="select-wrap">
          <span className="sr-only">Država i valuta</span>
          <select value={region} onChange={(e) => set({ region: e.target.value as RegionId })}>
            {REGIONS.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </select>
        </label>
        <button type="button" className="link-quiet hidden sm:inline" aria-pressed={sound} onClick={() => set({ sound: !sound })}>
          Zvuk {sound ? "uključen" : "isključen"}
        </button>
        <button type="button" className="cart-btn" onClick={() => set({ cartOpen: true })}>
          Korpa
          <span className="stitch-count tabular" aria-label={`${count} komada`}>
            {count}
          </span>
        </button>
      </nav>
    </header>
  );
}
