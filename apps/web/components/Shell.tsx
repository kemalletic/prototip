"use client";

import Lenis from "lenis";
import dynamic from "next/dynamic";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { detectTier } from "@/lib/device-tier";
import { scroller } from "@/lib/scroll";
import { live, useStore } from "@/lib/store";
import { readTema } from "@/lib/theme";
import { Cart } from "./Cart";
import { HangTag } from "./HangTag";
import { Header } from "./Header";
import { Lens } from "./Lens";
import { Loader } from "./Loader";
import { ThreadCursor } from "./ThreadCursor";

const Experience = dynamic(() => import("./canvas/Experience"), { ssr: false });

export function Shell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const tier = useStore((s) => s.tier);

  useEffect(() => {
    const tema = readTema();
    document.documentElement.dataset.tema = tema;
    useStore.getState().set({ tema });
  }, []);

  useEffect(() => {
    const t = detectTier();
    useStore.getState().set({ tier: t, ...(t === "static" ? { view: "mreza" as const, ready: true } : {}) });
  }, []);

  useEffect(() => {
    useStore.getState().set({
      navigate: (href: string) => {
        if (href.startsWith("/proizvod/") && pathname === "/") useStore.getState().set({ returnScroll: window.scrollY });
        router.push(href, { scroll: false });
      },
    });
  }, [router, pathname]);

  // glatki scroll
  useEffect(() => {
    if (tier !== "full") return;
    const lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.9, autoRaf: true });
    scroller.lenis = lenis;
    lenis.on("scroll", (l: Lenis) => {
      live.scrollVelocity = l.velocity;
    });
    return () => {
      lenis.destroy();
      scroller.lenis = null;
    };
  }, [tier]);

  // pokazivač i naginjanje telefona
  useEffect(() => {
    const p = live.pointer;
    const onMove = (e: PointerEvent) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = -(e.clientY / window.innerHeight) * 2 + 1;
      p.vx = nx - p.nx;
      p.vy = ny - p.ny;
      p.x = e.clientX;
      p.y = e.clientY;
      p.nx = nx;
      p.ny = ny;
      p.inside = true;
      p.t = performance.now();
    };
    const onLeave = () => {
      p.inside = false;
    };
    const onTilt = (e: DeviceOrientationEvent) => {
      if (e.gamma == null || e.beta == null) return;
      live.tilt.x = Math.max(-1, Math.min(1, e.gamma / 35));
      live.tilt.y = Math.max(-1, Math.min(1, (e.beta - 45) / 40));
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    window.addEventListener("deviceorientation", onTilt);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("deviceorientation", onTilt);
    };
  }, []);

  return (
    <>
      {tier === "full" && <Experience />}
      <Header />
      <main className="relative z-10">{children}</main>
      {tier === "full" && <HangTag />}
      <Cart />
      <Lens />
      {tier === "full" && <ThreadCursor />}
      <Loader />
      <div className="grain" aria-hidden />
    </>
  );
}
