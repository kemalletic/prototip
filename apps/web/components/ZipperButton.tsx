"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { haptic, playZip } from "@/lib/sound";
import { useStore } from "@/lib/store";

interface Props {
  price: string;
  canAdd: boolean;
  onAdd: () => void;
  onBlocked: () => void;
}

/** "Dodaj u korpu" kao patent: povuci klizač do kraja ili samo klikni. */
export function ZipperButton({ price, canAdd, onAdd, onBlocked }: Props) {
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const track = useRef<HTMLDivElement>(null);
  const drag = useRef<{ start: number; moved: boolean } | null>(null);
  const anim = useRef(0);
  const sound = useStore((s) => s.sound);

  const animateTo = useCallback((to: number, ms: number, then?: () => void) => {
    cancelAnimationFrame(anim.current);
    const from = progressRef.current;
    const t0 = performance.now();
    const step = (t: number) => {
      const k = Math.min(1, (t - t0) / ms);
      const e = 1 - Math.pow(1 - k, 3);
      setProgress(from + (to - from) * e);
      if (k < 1) anim.current = requestAnimationFrame(step);
      else then?.();
    };
    anim.current = requestAnimationFrame(step);
  }, []);

  const progressRef = useRef(0);
  progressRef.current = progress;

  const complete = useCallback(() => {
    if (sound) playZip();
    haptic([8, 30, 8]);
    animateTo(1, 220, () => {
      onAdd();
      setDone(true);
      setTimeout(() => {
        animateTo(0, 700);
        setDone(false);
      }, 1800);
    });
  }, [animateTo, onAdd, sound]);

  useEffect(() => () => cancelAnimationFrame(anim.current), []);

  const onClick = () => {
    if (drag.current?.moved) return;
    if (!canAdd) return onBlocked();
    if (sound) playZip(0.5);
    haptic(10);
    animateTo(0.98, 480, complete);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (!canAdd) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = { start: e.clientX, moved: false };
    cancelAnimationFrame(anim.current);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current || !track.current) return;
    const r = track.current.getBoundingClientRect();
    const k = Math.max(0, Math.min(1, (e.clientX - r.left - 20) / (r.width - 40)));
    if (Math.abs(e.clientX - drag.current.start) > 4) drag.current.moved = true;
    setProgress(k);
  };
  const onPointerUp = () => {
    if (!drag.current) return;
    const moved = drag.current.moved;
    setTimeout(() => (drag.current = null), 0);
    if (!moved) return;
    if (progressRef.current > 0.75) complete();
    else animateTo(0, 500);
  };

  return (
    <div className="zip" data-done={done || undefined}>
      <div
        ref={track}
        className="zip__track"
        role="button"
        tabIndex={0}
        aria-label={`Dodaj u korpu, ${price}`}
        onClick={onClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onClick();
          }
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        style={{ "--p": progress } as React.CSSProperties}
      >
        <span className="zip__teeth zip__teeth--closed" aria-hidden />
        <span className="zip__teeth zip__teeth--open" aria-hidden />
        <span className="zip__label">
          <span>{done ? "Dodano u korpu" : "Dodaj u korpu"}</span>
          <span className="tabular">{price}</span>
        </span>
        <span className="zip__pull" aria-hidden>
          <span className="zip__tab" />
        </span>
      </div>
      <p className="zip__hint">Klikni ili povuci klizač do kraja.</p>
    </div>
  );
}
