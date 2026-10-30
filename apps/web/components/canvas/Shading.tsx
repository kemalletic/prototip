"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { BENCH, ROOM, SHELF, TABLE } from "@/lib/boutique";

// Lažna ambijentalna sjena (ambient occlusion): tamni gradijenti u uglovima
// i ispod namještaja. Jeftino, a prostor odmah djeluje stvarnije.

let linear: THREE.CanvasTexture | null = null;
let radial: THREE.CanvasTexture | null = null;

function linearTex() {
  if (linear) return linear;
  const c = document.createElement("canvas");
  c.width = 4;
  c.height = 256;
  const x = c.getContext("2d")!;
  const g = x.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.35, "rgba(255,255,255,0.45)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  x.fillStyle = g;
  x.fillRect(0, 0, 4, 256);
  linear = new THREE.CanvasTexture(c);
  return linear;
}

function radialTex() {
  if (radial) return radial;
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const x = c.getContext("2d")!;
  const g = x.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.55, "rgba(255,255,255,0.55)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  x.fillStyle = g;
  x.fillRect(0, 0, 256, 256);
  radial = new THREE.CanvasTexture(c);
  return radial;
}

/** Traka s gradijentom: tamna na strani "from", nestaje prema drugoj. */
function Strip({ pos, rot, size, opacity }: { pos: [number, number, number]; rot: [number, number, number]; size: [number, number]; opacity: number }) {
  const mat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: "#2a1e12",
        alphaMap: linearTex(),
        transparent: true,
        opacity,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -2,
      }),
    [opacity],
  );
  return (
    <mesh position={pos} rotation={rot} material={mat} renderOrder={1}>
      <planeGeometry args={size} />
    </mesh>
  );
}

function Blob({ x, z, w, d, opacity }: { x: number; z: number; w: number; d: number; opacity: number }) {
  const mat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: "#22180e",
        alphaMap: radialTex(),
        transparent: true,
        opacity,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -2,
      }),
    [opacity],
  );
  return (
    <mesh position={[x, 0.003, z]} rotation={[-Math.PI / 2, 0, 0]} material={mat} renderOrder={1}>
      <planeGeometry args={[w, d]} />
    </mesh>
  );
}

export function Shading() {
  const W = ROOM.x1 - ROOM.x0;
  const D = ROOM.z1 - ROOM.z0;
  const H = ROOM.h;
  const e = 0.004;
  // alphaMap: v=1 (vrh slike) je tamno. Okrećemo trake tako da tamna strana ide u ugao.
  return (
    <group>
      {/* pod uz zidove */}
      <Strip pos={[0, e, ROOM.z0 + 0.3]} rot={[-Math.PI / 2, 0, 0]} size={[W, 0.6]} opacity={0.32} />
      <Strip pos={[ROOM.x0 + 0.3, e, 0]} rot={[-Math.PI / 2, 0, -Math.PI / 2]} size={[D, 0.6]} opacity={0.32} />
      <Strip pos={[ROOM.x1 - 0.3, e, 0]} rot={[-Math.PI / 2, 0, Math.PI / 2]} size={[D, 0.6]} opacity={0.32} />
      <Strip pos={[0, e, ROOM.z1 - 0.25]} rot={[-Math.PI / 2, 0, Math.PI]} size={[W, 0.5]} opacity={0.22} />
      {/* dno zidova */}
      <Strip pos={[0, 0.35, ROOM.z0 + e]} rot={[0, 0, Math.PI]} size={[W, 0.7]} opacity={0.22} />
      <Strip pos={[ROOM.x0 + e, 0.35, 0]} rot={[0, Math.PI / 2, Math.PI]} size={[D, 0.7]} opacity={0.22} />
      <Strip pos={[ROOM.x1 - e, 0.35, 0]} rot={[0, -Math.PI / 2, Math.PI]} size={[D, 0.7]} opacity={0.22} />
      {/* vrh zidova uz plafon */}
      <Strip pos={[0, H - 0.4, ROOM.z0 + e]} rot={[0, 0, 0]} size={[W, 0.8]} opacity={0.26} />
      <Strip pos={[ROOM.x0 + e, H - 0.4, 0]} rot={[0, Math.PI / 2, 0]} size={[D, 0.8]} opacity={0.26} />
      <Strip pos={[ROOM.x1 - e, H - 0.4, 0]} rot={[0, -Math.PI / 2, 0]} size={[D, 0.8]} opacity={0.26} />
      {/* ispod namještaja */}
      <Blob x={TABLE.x} z={TABLE.z} w={TABLE.w + 0.9} d={TABLE.d + 0.8} opacity={0.42} />
      <Blob x={BENCH.x} z={BENCH.z} w={BENCH.w + 0.6} d={BENCH.d + 0.5} opacity={0.38} />
      <Blob x={SHELF.x} z={ROOM.z0 + 0.3} w={SHELF.w + 0.8} d={0.9} opacity={0.4} />
    </group>
  );
}
