"use client";

import { useEffect, useState } from "react";
import { DROP } from "@/lib/catalog";

/** Odbrojavanje do sljedećeg dropa. */
export function DropCountdown({ className = "" }: { className?: string }) {
  const [left, setLeft] = useState<number | null>(null);
  useEffect(() => {
    const t = new Date(DROP.next).getTime();
    const tick = () => setLeft(Math.max(0, t - Date.now()));
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, []);
  if (left === null) return null;
  const d = Math.floor(left / 86400000);
  const h = Math.floor((left % 86400000) / 3600000);
  return (
    <p className={`countdown ${className}`}>
      Drop 02 stiže za{" "}
      <span className="tabular">
        {d} {d === 1 ? "dan" : "dana"} i {h} h
      </span>
    </p>
  );
}
