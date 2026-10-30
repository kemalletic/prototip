"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { HOOK_DROP, UNIT, type HangerKind } from "@/lib/world";

const metal = new THREE.MeshStandardMaterial({ color: "#a39d93", metalness: 1, roughness: 0.28 });
const wood = new THREE.MeshStandardMaterial({ color: "#5b3f2b", metalness: 0, roughness: 0.55 });
const dark = new THREE.MeshStandardMaterial({ color: "#2a2826", metalness: 0.6, roughness: 0.45 });
const blackSteel = new THREE.MeshStandardMaterial({ color: "#161616", metalness: 0.7, roughness: 0.4 });
const brushed = new THREE.MeshStandardMaterial({ color: "#b4afa6", metalness: 1, roughness: 0.38 });

export type HangerStyle = "wood" | "steel" | "black";

function hookCurve(drop: number) {
  // kuka preko šipke pa ravno dolje
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= 16; i++) {
    const a = Math.PI * 1.05 - (i / 16) * Math.PI * 1.25;
    pts.push(new THREE.Vector3(Math.cos(a) * 0.026, Math.sin(a) * 0.026, 0));
  }
  pts.push(new THREE.Vector3(0.0, -0.04, 0));
  pts.push(new THREE.Vector3(0, -drop, 0));
  return new THREE.CatmullRomCurve3(pts);
}

export function Hanger({ kind, style = "wood" }: { kind: HangerKind; style?: HangerStyle }) {
  const geos = useMemo(() => {
    const hook = new THREE.TubeGeometry(hookCurve(kind === "hook" ? 0.07 : kind === "clip" ? 0.145 : 0.23), 48, 0.0032, 8);
    if (kind === "top") {
      const arms = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.15, -0.3, -0.004),
        new THREE.Vector3(-0.08, -0.268, -0.004),
        new THREE.Vector3(0, -0.24, -0.004),
        new THREE.Vector3(0.08, -0.268, -0.004),
        new THREE.Vector3(0.15, -0.3, -0.004),
      ]);
      return { hook, body: new THREE.TubeGeometry(arms, 40, style === "wood" ? 0.011 : 0.0045, 10) };
    }
    if (kind === "clip") {
      return { hook, body: new THREE.CylinderGeometry(0.006, 0.006, 0.66, 10) };
    }
    const lower = new THREE.CatmullRomCurve3(
      Array.from({ length: 13 }, (_, i) => {
        const a = Math.PI + (i / 12) * Math.PI;
        return new THREE.Vector3(Math.cos(a) * 0.02, -0.07 + Math.sin(a) * 0.02, 0);
      }),
    );
    return { hook, body: new THREE.TubeGeometry(lower, 24, 0.0032, 8) };
  }, [kind, style]);

  const waistY = -HOOK_DROP - 30 * UNIT;
  const wire = style === "black" ? blackSteel : style === "steel" ? brushed : metal;
  const arm = style === "wood" ? wood : wire;

  return (
    <group>
      <mesh geometry={geos.hook} material={wire} castShadow />
      {kind === "top" && <mesh geometry={geos.body} material={arm} castShadow />}
      {kind === "clip" && (
        <>
          <mesh geometry={geos.body} material={wire} position={[0, waistY + 0.03, 0]} rotation={[0, 0, Math.PI / 2]} castShadow />
          {[-0.27, 0.27].map((x) => (
            <group key={x} position={[x, waistY + 0.005, 0]}>
              <mesh material={dark} position={[0, 0, 0.012]} castShadow>
                <boxGeometry args={[0.034, 0.05, 0.006]} />
              </mesh>
              <mesh material={dark} position={[0, 0, -0.012]}>
                <boxGeometry args={[0.034, 0.05, 0.006]} />
              </mesh>
              <mesh material={wire} position={[0, 0.03, 0]}>
                <cylinderGeometry args={[0.003, 0.003, 0.03, 6]} />
              </mesh>
            </group>
          ))}
        </>
      )}
      {kind === "hook" && <mesh geometry={geos.body} material={wire} castShadow />}
    </group>
  );
}
