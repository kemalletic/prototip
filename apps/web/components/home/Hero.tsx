"use client";

import { useEffect, useState } from "react";
import { getAmbient, visitorCity } from "@/lib/ambient";
import { isTouch } from "@/lib/device-tier";
import { drapePreview } from "@/lib/garments/thumbs";
import { scrollToY } from "@/lib/scroll";
import { useStore } from "@/lib/store";

type OrientationPermission = { requestPermission?: () => Promise<"granted" | "denied"> };

export function Hero() {
  const tier = useStore((s) => s.tier);
  const [touch, setTouch] = useState(false);
  const [needsMotion, setNeedsMotion] = useState(false);
  const [ambient, setAmbient] = useState<{ label: string; city: string | null } | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    setTouch(isTouch());
    const DOE = (window as unknown as { DeviceOrientationEvent?: OrientationPermission }).DeviceOrientationEvent;
    setNeedsMotion(!!DOE?.requestPermission);
    setAmbient({ label: getAmbient().label, city: visitorCity() });
  }, []);

  useEffect(() => {
    if (tier === "static") setPreview(drapePreview(900));
  }, [tier]);

  const askMotion = async () => {
    const DOE = (window as unknown as { DeviceOrientationEvent?: OrientationPermission }).DeviceOrientationEvent;
    try {
      const r = await DOE?.requestPermission?.();
      if (r === "granted") setNeedsMotion(false);
    } catch {
      /* korisnik odbio */
    }
  };

  return (
    <section className="hero" aria-labelledby="hero-naslov">
      {tier === "static" && preview && (
        <div className="hero__static" aria-hidden>
          <img src={preview} alt="" />
        </div>
      )}
      <div className="hero__copy">
        <h1 id="hero-naslov" className="display hero__title">
          Sve počinje
          <br />
          od tkanine.
        </h1>
        <p className="hero__lede">
          Farmerke, jakne, prsluci i džemperi za svaki dan, napravljeni da traju. Dostava u BiH, Srbiju, Hrvatsku i Crnu
          Goru.
        </p>
        {tier === "full" && (
          <p className="hero__hint">
            {touch ? "Nagni telefon i gledaj kako se denim pomjera." : "Pređi kursorom preko denima."}
            {touch && needsMotion && (
              <button type="button" className="link-quiet ml-2 underline underline-offset-4" onClick={askMotion}>
                Uključi pokrete
              </button>
            )}
          </p>
        )}
      </div>
      <div className="hero__foot">
        <button
          type="button"
          className="hero__down"
          onClick={() => {
            const el = document.getElementById("kolekcija");
            if (el) scrollToY(el.offsetTop);
          }}
        >
          <span className="hero__down-thread" aria-hidden />
          Pogledaj kolekciju
        </button>
        {ambient && tier === "full" && (
          <p className="hero__ambient">
            Svjetlo prati tvoje doba dana: {ambient.label}
            {ambient.city ? `, ${ambient.city}` : ""}
          </p>
        )}
      </div>
    </section>
  );
}
