"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";

/** Nit se ispliće u znak, a onda se zavjesa podigne. */
export function Loader() {
  const ready = useStore((s) => s.ready);
  const tier = useStore((s) => s.tier);
  const [minDone, setMinDone] = useState(false);
  const [gone, setGone] = useState(false);
  const [quick, setQuick] = useState(false);

  useEffect(() => {
    let seen = false;
    try {
      seen = sessionStorage.getItem("nit-uvod") === "1";
      sessionStorage.setItem("nit-uvod", "1");
    } catch {
      /* privatni prozor */
    }
    setQuick(seen);
    const id = setTimeout(() => setMinDone(true), seen ? 200 : 2100);
    const max = setTimeout(() => useStore.getState().set({ ready: true }), 6000);
    return () => {
      clearTimeout(id);
      clearTimeout(max);
    };
  }, []);

  const leaving = minDone && ready && tier !== "pending";

  useEffect(() => {
    if (!leaving) return;
    const id = setTimeout(() => setGone(true), 1100);
    return () => clearTimeout(id);
  }, [leaving]);

  if (gone) return null;
  return (
    <div className={`loader ${leaving ? "loader--out" : ""} ${quick ? "loader--quick" : ""}`} role="status" aria-label="Učitavanje">
      <svg viewBox="0 0 340 150" className="loader__mark" aria-hidden>
        <path
          pathLength={1}
          d="M -30 128 C 0 128, 18 126, 30 118 L 30 22 L 108 118 L 108 22 C 112 2, 146 2, 150 22 L 150 118 C 154 140, 186 70, 182 24 L 292 24 L 236 24 L 236 118 C 240 136, 300 132, 370 130"
        />
      </svg>
      <p className="loader__note">Pripremamo kolekciju</p>
    </div>
  );
}
