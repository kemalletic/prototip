"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { PRODUCTS } from "@/lib/catalog";
import { hashString, rng } from "@/lib/garments/color";
import { heightToNormal } from "@/lib/garments/normal";
import { drapeTextures } from "@/lib/garments/textures";
import { useStore } from "@/lib/store";
import { CATEGORY_TINT, type SceneLook } from "@/lib/theme";
import { SPACING, WALL_Z } from "@/lib/world";

const WALL_W = 40;
const WALL_H = 9;
const WALL_X = 6;
const FLOOR_D = 10;

/** Kreč: meke mrlje i tragovi gladilice. Pločica 2 × 2 m, skoro bijela (boju daje zid). */
function plasterMaps() {
  const S = 1024;
  const mk = () => {
    const c = document.createElement("canvas");
    c.width = c.height = S;
    return c;
  };
  const colorC = mk();
  const heightC = mk();
  const x = colorC.getContext("2d", { willReadFrequently: true })!;
  const y = heightC.getContext("2d", { willReadFrequently: true })!;
  const r = rng(hashString("kreč"));
  x.fillStyle = "#f4f1ec";
  x.fillRect(0, 0, S, S);
  y.fillStyle = "#808080";
  y.fillRect(0, 0, S, S);
  for (let i = 0; i < 80; i++) {
    const cx = r() * S;
    const cy = r() * S;
    const rad = 90 + r() * 260;
    const light = r() > 0.45;
    for (const ox of [-S, 0, S])
      for (const oy of [-S, 0, S]) {
        const g = x.createRadialGradient(cx + ox, cy + oy, 0, cx + ox, cy + oy, rad);
        g.addColorStop(0, light ? `rgba(255,255,255,${0.04 + r() * 0.05})` : `rgba(120,100,80,${0.012 + r() * 0.025})`);
        g.addColorStop(1, "rgba(0,0,0,0)");
        x.fillStyle = g;
        x.fillRect(cx + ox - rad, cy + oy - rad, rad * 2, rad * 2);
      }
  }
  for (let i = 0; i < 240; i++) {
    const cx = r() * S;
    const cy = r() * S;
    const len = 60 + r() * 180;
    const a = r() * Math.PI;
    y.strokeStyle = `rgba(${r() > 0.5 ? "255,255,255" : "0,0,0"},${0.04 + r() * 0.06})`;
    y.lineWidth = 6 + r() * 18;
    y.lineCap = "round";
    y.beginPath();
    y.moveTo(cx, cy);
    y.quadraticCurveTo(cx + Math.cos(a) * len * 0.5 + 20, cy + Math.sin(a) * len * 0.5, cx + Math.cos(a) * len, cy + Math.sin(a) * len);
    y.stroke();
  }
  const map = new THREE.CanvasTexture(colorC);
  map.colorSpace = THREE.SRGBColorSpace;
  const normal = new THREE.CanvasTexture(heightToNormal(heightC, null, 0.012, 0));
  for (const t of [map, normal]) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(WALL_W / 2, WALL_H / 2);
    t.anisotropy = 8;
  }
  return { map, normal };
}

/** Ciljne boje zida po x: svaka kategorija daje topli ton iza svojih komada. */
function tintTargets(geo: THREE.BufferGeometry, base: string, filter: string) {
  const visible = PRODUCTS.filter((p) => filter === "sve" || p.category === filter);
  const slots = visible.map((p, i) => ({ x: i * SPACING, c: new THREE.Color(CATEGORY_TINT[p.category]) }));
  const baseC = new THREE.Color(base);
  const pos = geo.attributes.position;
  const out = new Float32Array(pos.count * 3);
  const tmp = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const wx = pos.getX(i) + WALL_X;
    let wsum = 0.35;
    tmp.copy(baseC).multiplyScalar(0.35);
    for (const s of slots) {
      const d = (wx - s.x) / 0.85;
      const w = Math.exp(-d * d);
      if (w < 0.002) continue;
      tmp.r += s.c.r * w;
      tmp.g += s.c.g * w;
      tmp.b += s.c.b * w;
      wsum += w;
    }
    out[i * 3] = tmp.r / wsum;
    out[i * 3 + 1] = tmp.g / wsum;
    out[i * 3 + 2] = tmp.b / wsum;
  }
  return out;
}

/** Panel sirovog denima koji visi iza grupe farmerki. */
function DenimPanel({ filter }: { filter: string }) {
  const tex = useMemo(() => drapeTextures(), []);
  const group = useMemo(() => new THREE.Group(), []);
  const range = useMemo(() => {
    const visible = PRODUCTS.filter((p) => filter === "sve" || p.category === filter);
    const xs = visible.map((p, i) => (p.category === "farmerke" ? i * SPACING : null)).filter((x): x is number => x !== null);
    if (!xs.length) return null;
    return { x0: Math.min(...xs) - 0.62, x1: Math.max(...xs) + 0.62 };
  }, [filter]);
  const st = useMemo(() => ({ cx: range ? (range.x0 + range.x1) / 2 : 0, w: range ? range.x1 - range.x0 : 0.01, s: range ? 1 : 0 }), []);
  const H = 2.2;
  const top = 2.78;
  useFrame((_, dt) => {
    const k = 1 - Math.exp(-dt * 3);
    const tx = range ? (range.x0 + range.x1) / 2 : st.cx;
    const tw = range ? range.x1 - range.x0 : st.w;
    st.cx += (tx - st.cx) * k;
    st.w += (tw - st.w) * k;
    st.s += ((range ? 1 : 0) - st.s) * k;
    group.position.set(st.cx, top, WALL_Z + 0.03);
    group.scale.set(st.w, Math.max(0.001, st.s), 1);
    group.visible = st.s > 0.01;
  });
  return (
    <primitive object={group}>
      <mesh position={[0, -H / 2, 0]} receiveShadow>
        <planeGeometry args={[1, H]} />
        <meshStandardMaterial map={tex.front} normalMap={tex.frontNormal} roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.02, 0.012]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.009, 0.009, 1.04, 12]} />
        <meshStandardMaterial color="#141414" metalness={0.6} roughness={0.4} />
      </mesh>
    </primitive>
  );
}

export function Room({ look }: { look: SceneLook }) {
  const filter = useStore((s) => s.filter);
  const plaster = useMemo(() => (look.plaster ? plasterMaps() : null), [look.plaster]);
  const wallGeo = useMemo(() => {
    const g = new THREE.PlaneGeometry(WALL_W, WALL_H, look.tint ? 320 : 1, 1);
    if (look.tint) {
      const n = g.attributes.position.count;
      g.setAttribute("color", new THREE.BufferAttribute(new Float32Array(n * 3).fill(1), 3));
    }
    return g;
  }, [look.tint]);
  const target = useMemo(() => (look.tint ? tintTargets(wallGeo, look.wall, filter) : null), [wallGeo, look.wall, look.tint, filter]);
  const first = useMemo(() => ({ done: false }), []);
  // brušeni beton: ista tekstura kreča, krupnije ponavljanje
  const floorMaps = useMemo(() => {
    if (!plaster) return null;
    const map = plaster.map.clone();
    const normal = plaster.normal.clone();
    map.repeat.set(WALL_W / 3, FLOOR_D / 3);
    normal.repeat.set(WALL_W / 3, FLOOR_D / 3);
    map.needsUpdate = normal.needsUpdate = true;
    return { map, normal };
  }, [plaster]);

  // boja zida se meko pretapa kad se promijeni filter
  useFrame((_, dt) => {
    if (!target) return;
    const col = wallGeo.attributes.color as THREE.BufferAttribute;
    const a = col.array as Float32Array;
    const k = first.done ? 1 - Math.exp(-dt * 2.5) : 1;
    let moving = false;
    for (let i = 0; i < a.length; i++) {
      const d = target[i] - a[i];
      if (Math.abs(d) > 0.0005) moving = true;
      a[i] += d * k;
    }
    first.done = true;
    if (moving || k === 1) col.needsUpdate = true;
  });

  useEffect(
    () => () => {
      plaster?.map.dispose();
      plaster?.normal.dispose();
      wallGeo.dispose();
    },
    [plaster, wallGeo],
  );

  return (
    <group>
      <mesh position={[WALL_X, WALL_H / 2 - 1, WALL_Z]} geometry={wallGeo} receiveShadow>
        {plaster ? (
          <meshStandardMaterial
            color={look.tint ? "#ffffff" : look.wall}
            vertexColors={look.tint}
            map={plaster.map}
            normalMap={plaster.normal}
            roughness={0.95}
            envMapIntensity={0.3}
          />
        ) : (
          <meshStandardMaterial color={look.wall} roughness={0.96} />
        )}
      </mesh>
      <mesh position={[WALL_X, 0, WALL_Z + FLOOR_D / 2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[WALL_W, FLOOR_D]} />
        {floorMaps ? (
          <meshStandardMaterial color={look.floor} map={floorMaps.map} normalMap={floorMaps.normal} roughness={0.55} envMapIntensity={0.5} />
        ) : (
          <meshStandardMaterial color={look.floor} roughness={0.7} />
        )}
      </mesh>
      {look.tint && <DenimPanel filter={filter} />}
    </group>
  );
}
