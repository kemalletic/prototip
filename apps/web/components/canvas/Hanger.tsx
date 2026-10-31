"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { HOOK_DROP, UNIT, type HangerKind } from "@/lib/world";

const metal = new THREE.MeshStandardMaterial({ color: "#a39d93", metalness: 1, roughness: 0.28 });
const wood = new THREE.MeshStandardMaterial({ color: "#5b3f2b", metalness: 0, roughness: 0.55 });
const dark = new THREE.MeshStandardMaterial({ color: "#2a2826", metalness: 0.6, roughness: 0.45 });
const blackSteel = new THREE.MeshStandardMaterial({ color: "#161616", metalness: 0.7, roughness: 0.4 });
const brushed = new THREE.MeshStandardMaterial({ color: "#b4afa6", metalness: 1, roughness: 0.38 });
const brass = new THREE.MeshStandardMaterial({ color: "#c09a55", metalness: 1, roughness: 0.24, envMapIntensity: 1.6 });
const felt = new THREE.MeshStandardMaterial({ color: "#2b2622", roughness: 1 });

let walnutMat: THREE.MeshStandardMaterial | null = null;
/** Orah: tamno drvo s finim godovima. */
function walnut() {
  if (walnutMat) return walnutMat;
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 128;
  const x = c.getContext("2d")!;
  x.fillStyle = "#4a2f1e";
  x.fillRect(0, 0, 512, 128);
  for (let i = 0; i < 70; i++) {
    const y = Math.random() * 128;
    x.strokeStyle = Math.random() > 0.5 ? "rgba(120,80,50,0.35)" : "rgba(25,14,8,0.4)";
    x.lineWidth = 0.6 + Math.random() * 2;
    x.beginPath();
    x.moveTo(0, y);
    for (let s = 0; s <= 16; s++) x.lineTo((512 * s) / 16, y + Math.sin(s * 0.7 + i) * 3);
    x.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(2, 1);
  walnutMat = new THREE.MeshStandardMaterial({ map: t, roughness: 0.38, metalness: 0, envMapIntensity: 0.8 });
  return walnutMat;
}

export type HangerStyle = "wood" | "steel" | "black" | "walnut";

function hookCurve(drop: number) {
  // kuka preko šipke pa ravno dolje
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= 16; i++) {
    const a = Math.PI * 1.05 - (i / 16) * Math.PI * 1.25;
    pts.push(new THREE.Vector3(Math.cos(a) * 0.028, Math.sin(a) * 0.028, 0));
  }
  pts.push(new THREE.Vector3(0.0, -0.04, 0));
  pts.push(new THREE.Vector3(0, -drop, 0));
  return new THREE.CatmullRomCurve3(pts);
}

/** Široka, oblikovana ramena vješalice za jakne (profil izvučen u dubinu). */
function shoulderGeometry() {
  const half = 0.19;
  const top = (x: number) => -0.065 * Math.pow(Math.abs(x) / half, 1.6);
  const thick = (x: number) => 0.03 - 0.014 * (Math.abs(x) / half);
  const s = new THREE.Shape();
  const N = 24;
  s.moveTo(-half, top(-half));
  for (let i = 1; i <= N; i++) {
    const x = -half + (2 * half * i) / N;
    s.lineTo(x, top(x));
  }
  s.quadraticCurveTo(half + 0.012, top(half) - thick(half) / 2, half, top(half) - thick(half));
  for (let i = N - 1; i >= 0; i--) {
    const x = -half + (2 * half * i) / N;
    s.lineTo(x, top(x) - thick(x));
  }
  s.quadraticCurveTo(-half - 0.012, top(-half) - thick(-half) / 2, -half, top(-half));
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.026, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.005, bevelSegments: 3, curveSegments: 8 });
  g.translate(0, 0, -0.013);
  return g;
}

export function Hanger({ kind, style = "wood" }: { kind: HangerKind; style?: HangerStyle }) {
  const premium = style === "walnut";
  const geos = useMemo(() => {
    const hookDrop = kind === "hook" ? 0.07 : kind === "clip" ? 0.145 : premium ? 0.235 : 0.23;
    const hook = new THREE.TubeGeometry(hookCurve(hookDrop), 48, premium ? 0.0036 : 0.0032, 10);
    if (kind === "top") {
      if (premium) return { hook, body: shoulderGeometry() };
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
      return { hook, body: premium ? new THREE.CapsuleGeometry(0.011, 0.62, 6, 12) : new THREE.CylinderGeometry(0.006, 0.006, 0.66, 10) };
    }
    const lower = new THREE.CatmullRomCurve3(
      Array.from({ length: 13 }, (_, i) => {
        const a = Math.PI + (i / 12) * Math.PI;
        return new THREE.Vector3(Math.cos(a) * 0.02, -0.07 + Math.sin(a) * 0.02, 0);
      }),
    );
    return { hook, body: new THREE.TubeGeometry(lower, 24, 0.0034, 8) };
  }, [kind, style, premium]);

  const waistY = -HOOK_DROP - 30 * UNIT;
  const wire = premium ? brass : style === "black" ? blackSteel : style === "steel" ? brushed : metal;
  const arm = premium ? walnut() : style === "wood" ? wood : wire;
  const hookEnd = useMemo(() => {
    const a = Math.PI * 1.05;
    return [Math.cos(a) * 0.028, Math.sin(a) * 0.028, 0] as [number, number, number];
  }, []);

  return (
    <group>
      <mesh geometry={geos.hook} material={wire} castShadow />
      {premium && (
        <mesh position={hookEnd} material={brass}>
          <sphereGeometry args={[0.0058, 12, 10]} />
        </mesh>
      )}
      {kind === "top" && (
        <group position={[0, premium ? -0.232 : 0, premium ? -0.006 : 0]}>
          <mesh geometry={geos.body} material={arm} castShadow />
          {premium && (
            <mesh position={[0, 0.004, 0]} material={brass}>
              <cylinderGeometry args={[0.0075, 0.0075, 0.012, 16]} />
            </mesh>
          )}
        </group>
      )}
      {kind === "clip" && (
        <>
          <mesh geometry={geos.body} material={premium ? walnut() : wire} position={[0, waistY + 0.03, 0]} rotation={[0, 0, Math.PI / 2]} castShadow />
          {[-0.27, 0.27].map((x) => (
            <group key={x} position={[x, waistY + 0.005, 0]}>
              <mesh material={premium ? brass : dark} position={[0, 0, 0.013]} castShadow>
                <boxGeometry args={[0.036, 0.05, 0.006]} />
              </mesh>
              <mesh material={premium ? brass : dark} position={[0, 0, -0.013]}>
                <boxGeometry args={[0.036, 0.05, 0.006]} />
              </mesh>
              {premium && (
                <mesh material={felt} position={[0, -0.01, 0]}>
                  <boxGeometry args={[0.034, 0.028, 0.02]} />
                </mesh>
              )}
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
