"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { getProduct } from "@/lib/catalog";
import { slotX, type Fixture } from "@/lib/boutique";
import { Garment } from "./Garment";
import { rig } from "./rig";

const steel = new THREE.MeshStandardMaterial({ color: "#1b1b1b", metalness: 0.7, roughness: 0.42 });

/** Šipka na zidu s komadima (ili nevidljivo mjesto za komade sa stola i polica). */
export function FixtureView({ f, focus }: { f: Fixture; focus: string | null }) {
  const group = useRef<THREE.Group>(null);

  useLayoutEffect(() => {
    if (group.current) {
      group.current.userData.rodY = f.rodY;
      rig.fixtures.set(f.id, group.current);
    }
    for (const slug of f.products) {
      rig.fixtureOf.set(slug, f.id);
      rig.xs.set(slug, slotX(f, slug));
    }
  }, [f]);

  const length = (f.products.length - 1) * f.spacing + (f.kind === "hooks" ? 0.5 : 0.9);
  const brackets = useMemo(() => {
    if (f.kind === "hooks") return [-length / 2 + 0.08, length / 2 - 0.08];
    const n = Math.max(2, Math.ceil(length / 2.6) + 1);
    return Array.from({ length: n }, (_, i) => -length / 2 + 0.15 + (i * (length - 0.3)) / (n - 1));
  }, [f.kind, length]);

  return (
    <group ref={group} position={[f.x, 0, f.z]} rotation={[0, f.rotY, 0]}>
      {f.kind !== "display" && (
        <group position={[0, f.rodY, 0]}>
          <mesh rotation={[0, 0, Math.PI / 2]} material={steel} castShadow receiveShadow>
            <cylinderGeometry args={[0.016, 0.016, length, 20]} />
          </mesh>
          {[-1, 1].map((s) => (
            <mesh key={s} position={[(s * length) / 2, 0, 0]} material={steel}>
              <sphereGeometry args={[0.022, 16, 12]} />
            </mesh>
          ))}
          {brackets.map((x) => (
            <group key={x} position={[x, 0, 0]}>
              <mesh position={[0, 0, -f.wallDist / 2]} rotation={[Math.PI / 2, 0, 0]} material={steel} castShadow>
                <cylinderGeometry args={[0.012, 0.012, f.wallDist, 12]} />
              </mesh>
              <mesh position={[0, 0, -f.wallDist + 0.006]} rotation={[Math.PI / 2, 0, 0]} material={steel}>
                <cylinderGeometry args={[0.04, 0.04, 0.012, 24]} />
              </mesh>
            </group>
          ))}
        </group>
      )}
      {f.products.map((slug) => {
        const p = getProduct(slug);
        if (!p) return null;
        return (
          <Garment
            key={slug}
            p={p}
            x={slotX(f, slug)}
            focused={focus === slug}
            fixtureId={f.id}
            rodY={f.rodY}
            display={f.kind === "display"}
            hangerStyle={f.kind === "hooks" ? "black" : "steel"}
          />
        );
      })}
    </group>
  );
}
