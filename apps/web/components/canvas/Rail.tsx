"use client";

import { useEffect, useMemo, useRef } from "react";
import { PRODUCTS } from "@/lib/catalog";
import { useStore } from "@/lib/store";
import type { SceneLook } from "@/lib/theme";
import { ROD_Y, SPACING, WALL_Z } from "@/lib/world";
import { Garment, loadRail } from "./Garment";
import { rig } from "./rig";

const ROD_START = -0.9;
const ROD_END = (PRODUCTS.length - 1) * SPACING + 0.9;

export function Rail({ focus, look }: { focus: string | null; look: SceneLook }) {
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

  const pipe = look.hanger !== "wood";
  const brackets = useMemo(() => {
    const out: number[] = [];
    for (let x = ROD_START + 0.3; x < ROD_END; x += 3.4) out.push(x);
    out.push(ROD_END - 0.3);
    return out;
  }, []);

  return (
    <group>
      <mesh position={[(ROD_START + ROD_END) / 2, ROD_Y, 0]} rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow>
        <cylinderGeometry args={[pipe ? 0.016 : 0.012, pipe ? 0.016 : 0.012, ROD_END - ROD_START, 24]} />
        <meshStandardMaterial color={look.rod} metalness={look.rodMetal} roughness={pipe ? 0.42 : 0.3} />
      </mesh>
      {brackets.map((x) => (
        <group key={x}>
          <mesh position={[x, ROD_Y, WALL_Z / 2]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[pipe ? 0.013 : 0.008, pipe ? 0.013 : 0.008, -WALL_Z, 12]} />
            <meshStandardMaterial color={pipe ? look.rod : "#5f5a53"} metalness={pipe ? look.rodMetal : 1} roughness={0.4} />
          </mesh>
          {pipe && (
            <mesh position={[x, ROD_Y, 0]}>
              <sphereGeometry args={[0.024, 16, 12]} />
              <meshStandardMaterial color={look.rod} metalness={look.rodMetal} roughness={0.4} />
            </mesh>
          )}
          <mesh position={[x, ROD_Y, WALL_Z + 0.006]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[pipe ? 0.042 : 0.03, pipe ? 0.042 : 0.03, 0.012, 24]} />
            <meshStandardMaterial color={pipe ? look.rod : "#5f5a53"} metalness={pipe ? look.rodMetal : 1} roughness={0.4} />
          </mesh>
        </group>
      ))}
      {PRODUCTS.map((p) => (
        <Garment
          key={p.slug}
          p={p}
          x={layout.xs.get(p.slug)!}
          visible={layout.visible.has(p.slug)}
          focused={focus === p.slug}
          hangerStyle={look.hanger}
        />
      ))}
    </group>
  );
}
