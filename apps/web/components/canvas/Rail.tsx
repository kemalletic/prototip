"use client";

import { useEffect, useMemo, useRef } from "react";
import { PRODUCTS } from "@/lib/catalog";
import { useStore } from "@/lib/store";
import { ROD_Y, SPACING, WALL_Z } from "@/lib/world";
import { Garment, loadRail } from "./Garment";
import { rig } from "./rig";

const ROD_START = -0.9;
const ROD_END = (PRODUCTS.length - 1) * SPACING + 0.9;

export function Rail({ focus }: { focus: string | null }) {
  const filter = useStore((s) => s.filter);
  const last = useRef(new Map<string, number>());

  const layout = useMemo(() => {
    const visible = PRODUCTS.filter((p) => filter === "sve" || p.category === filter);
    const xs = new Map<string, number>();
    visible.forEach((p, i) => xs.set(p.slug, i * SPACING));
    for (const p of PRODUCTS) if (!xs.has(p.slug)) xs.set(p.slug, last.current.get(p.slug) ?? PRODUCTS.indexOf(p) * SPACING);
    return { visible: new Set(visible.map((p) => p.slug)), xs, n: visible.length };
  }, [filter]);

  useEffect(() => {
    last.current = layout.xs;
    rig.xs = layout.xs;
    rig.first = 0;
    rig.last = Math.max(0, (layout.n - 1) * SPACING);
  }, [layout]);

  useEffect(() => {
    Promise.all(PRODUCTS.map((p) => loadRail(p))).then(() => useStore.getState().set({ ready: true }));
  }, []);

  const brackets = useMemo(() => {
    const out: number[] = [];
    for (let x = ROD_START + 0.3; x < ROD_END; x += 3.4) out.push(x);
    out.push(ROD_END - 0.3);
    return out;
  }, []);

  return (
    <group>
      <mesh position={[(ROD_START + ROD_END) / 2, ROD_Y, 0]} rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow>
        <cylinderGeometry args={[0.012, 0.012, ROD_END - ROD_START, 24]} />
        <meshStandardMaterial color="#8b857c" metalness={1} roughness={0.3} />
      </mesh>
      {brackets.map((x) => (
        <group key={x}>
          <mesh position={[x, ROD_Y, WALL_Z / 2]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.008, 0.008, -WALL_Z, 12]} />
            <meshStandardMaterial color="#5f5a53" metalness={1} roughness={0.4} />
          </mesh>
          <mesh position={[x, ROD_Y, WALL_Z + 0.004]}>
            <cylinderGeometry args={[0.03, 0.03, 0.008, 24]} />
            <meshStandardMaterial color="#5f5a53" metalness={1} roughness={0.4} />
          </mesh>
        </group>
      ))}
      {PRODUCTS.map((p) => (
        <Garment key={p.slug} p={p} x={layout.xs.get(p.slug)!} visible={layout.visible.has(p.slug)} focused={focus === p.slug} />
      ))}
    </group>
  );
}
