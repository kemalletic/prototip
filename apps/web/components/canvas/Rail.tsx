"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { PRODUCTS } from "@/lib/catalog";
import { useStore } from "@/lib/store";
import type { SceneLook } from "@/lib/theme";
import { ROD_Y, SPACING, WALL_Z } from "@/lib/world";
import { Garment, loadRail } from "./Garment";
import { rig } from "./rig";

const ROD_START = -0.9;
const ROD_END = (PRODUCTS.length - 1) * SPACING + 0.9;

const brassMat = new THREE.MeshStandardMaterial({ color: "#bf9852", metalness: 1, roughness: 0.22, envMapIntensity: 1.8 });
const screwMat = new THREE.MeshStandardMaterial({ color: "#8a6a35", metalness: 1, roughness: 0.4 });

/** Tokareni završetak šipke (profil okrenut oko ose). */
function finialGeometry() {
  const pts = [
    [0, 0],
    [0.024, 0],
    [0.026, 0.006],
    [0.02, 0.014],
    [0.03, 0.03],
    [0.03, 0.038],
    [0.016, 0.052],
    [0.0, 0.058],
  ].map(([r, y]) => new THREE.Vector2(r, y));
  return new THREE.LatheGeometry(pts, 32);
}

/** Rozeta na zidu s tri vijka. */
function rosetteGeometry() {
  const pts = [
    [0, 0],
    [0.05, 0],
    [0.052, 0.006],
    [0.044, 0.014],
    [0.02, 0.018],
    [0.016, 0.03],
    [0, 0.03],
  ].map(([r, y]) => new THREE.Vector2(r, y));
  return new THREE.LatheGeometry(pts, 40);
}

let scallopTex: THREE.CanvasTexture | null = null;
/** Konus svjetla na zidu, kao od reflektora s plafona. */
function scallop() {
  if (scallopTex) return scallopTex;
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 512;
  const x = c.getContext("2d")!;
  const g = x.createRadialGradient(128, -60, 10, 128, 120, 300);
  g.addColorStop(0, "rgba(255,255,255,0.9)");
  g.addColorStop(0.35, "rgba(255,255,255,0.45)");
  g.addColorStop(0.75, "rgba(255,255,255,0.08)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  x.fillStyle = g;
  x.beginPath();
  x.moveTo(110, 0);
  x.lineTo(146, 0);
  x.bezierCurveTo(240, 220, 256, 380, 128, 512);
  x.bezierCurveTo(0, 380, 16, 220, 110, 0);
  x.fill();
  x.globalCompositeOperation = "destination-in";
  const fade = x.createLinearGradient(0, 0, 0, 512);
  fade.addColorStop(0, "rgba(0,0,0,1)");
  fade.addColorStop(0.7, "rgba(0,0,0,0.8)");
  fade.addColorStop(1, "rgba(0,0,0,0)");
  x.fillStyle = fade;
  x.fillRect(0, 0, 256, 512);
  scallopTex = new THREE.CanvasTexture(c);
  return scallopTex;
}

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
  const finial = useMemo(() => (look.brass ? finialGeometry() : null), [look.brass]);
  const rosette = useMemo(() => (look.brass ? rosetteGeometry() : null), [look.brass]);
  const scallopMat = useMemo(
    () =>
      look.scallops
        ? new THREE.MeshBasicMaterial({
            color: "#ffe2b8",
            alphaMap: scallop(),
            transparent: true,
            opacity: 0.09,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
          })
        : null,
    [look.scallops],
  );
  const brackets = useMemo(() => {
    const out: number[] = [];
    for (let x = ROD_START + 0.3; x < ROD_END; x += 3.4) out.push(x);
    out.push(ROD_END - 0.3);
    return out;
  }, []);

  if (look.brass && finial && rosette)
    return (
      <group>
        <mesh position={[(ROD_START + ROD_END) / 2, ROD_Y, 0]} rotation={[0, 0, Math.PI / 2]} material={brassMat} castShadow receiveShadow>
          <cylinderGeometry args={[0.011, 0.011, ROD_END - ROD_START, 32]} />
        </mesh>
        {[ROD_START, ROD_END].map((x, i) => (
          <mesh key={x} geometry={finial} material={brassMat} position={[x, ROD_Y, 0]} rotation={[0, 0, i === 0 ? Math.PI / 2 : -Math.PI / 2]} />
        ))}
        {brackets.map((x) => (
          <group key={x} position={[x, ROD_Y, 0]}>
            <mesh position={[0, 0, WALL_Z / 2]} rotation={[Math.PI / 2, 0, 0]} material={brassMat} castShadow>
              <cylinderGeometry args={[0.008, 0.008, -WALL_Z, 16]} />
            </mesh>
            <mesh material={brassMat} rotation={[0, Math.PI / 2, 0]}>
              <torusGeometry args={[0.0135, 0.004, 10, 28]} />
            </mesh>
            <mesh geometry={rosette} material={brassMat} position={[0, 0, WALL_Z]} rotation={[Math.PI / 2, 0, 0]} castShadow />
            {[0, 1, 2].map((k) => {
              const a = (k / 3) * Math.PI * 2 + Math.PI / 2;
              return (
                <mesh key={k} material={screwMat} position={[Math.cos(a) * 0.036, Math.sin(a) * 0.036, WALL_Z + 0.009]} rotation={[Math.PI / 2, 0, 0]}>
                  <cylinderGeometry args={[0.0042, 0.0042, 0.004, 12]} />
                </mesh>
              );
            })}
          </group>
        ))}
        {scallopMat &&
          PRODUCTS.filter((p) => layout.visible.has(p.slug)).map((p) => (
            <mesh key={`s-${p.slug}`} material={scallopMat} position={[layout.xs.get(p.slug)!, 2.3, WALL_Z + 0.01]} renderOrder={1}>
              <planeGeometry args={[0.78, 1.9]} />
            </mesh>
          ))}
        {PRODUCTS.map((p) => (
          <Garment
            key={p.slug}
            p={p}
            x={layout.xs.get(p.slug)!}
            visible={layout.visible.has(p.slug)}
            focused={focus === p.slug}
            hangerStyle={look.hanger}
            sheen={look.sheen}
          />
        ))}
      </group>
    );

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
