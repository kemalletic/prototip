"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { getProduct, type Product } from "@/lib/catalog";
import { FIXTURES, ROOM, SHELF, TABLE, TABLE_STACKS } from "@/lib/boutique";
import { toHex } from "@/lib/garments/color";
import { drawFolded } from "@/lib/garments/draw";
import { fabricTile, TILE } from "@/lib/garments/fabrics";
import { live, useStore } from "@/lib/store";
import { rig } from "./rig";

interface StackDef {
  slug: string;
  x: number;
  y: number;
  z: number;
  count: number;
}

const matCache = new Map<string, THREE.Material[]>();

function stackMaterials(p: Product, w: number) {
  const hit = matCache.get(p.slug);
  if (hit) return hit;
  const topC = drawFolded(p, 300);
  const top = new THREE.CanvasTexture(topC);
  top.colorSpace = THREE.SRGBColorSpace;
  top.anisotropy = 8;
  const tile = fabricTile(p.fabric, toHex(p.color));
  const side = new THREE.CanvasTexture(tile.color);
  side.colorSpace = THREE.SRGBColorSpace;
  side.wrapS = side.wrapT = THREE.RepeatWrapping;
  side.repeat.set((w * 1000) / 0.85 / tile.units / (TILE / 256), 0.3);
  const rough = p.fabric === "denim" ? 0.9 : 0.95;
  const sideMat = new THREE.MeshStandardMaterial({ map: side, roughness: rough, color: "#d8d2c8" });
  const topMat = new THREE.MeshStandardMaterial({ map: top, roughness: rough });
  // redoslijed strana kutije: +x, -x, +y, -y, +z, -z
  const out = [sideMat, sideMat, topMat, sideMat, sideMat, sideMat];
  matCache.set(p.slug, out);
  return out;
}

function Stack({ def }: { def: StackDef }) {
  const p = getProduct(def.slug)!;
  const bottoms = p.kind === "jeans" || p.kind === "trousers";
  const w = bottoms ? 0.36 : 0.31;
  const d = bottoms ? 0.29 : 0.34;
  const t = bottoms ? 0.058 : 0.042;
  const mats = useMemo(() => stackMaterials(p, w), [p, w]);
  const group = useRef<THREE.Group>(null);
  const hovered = useStore((s) => s.hovered === def.slug);
  const tmp = useMemo(() => new THREE.Vector3(), []);
  const offsets = useMemo(
    () =>
      Array.from({ length: def.count }, (_, i) => ({
        x: Math.sin(i * 12.9898 + def.x * 7) * 0.008,
        z: Math.cos(i * 78.233 + def.z * 5) * 0.008,
        r: Math.sin(i * 3.1 + def.x) * 0.035,
      })),
    [def],
  );

  useFrame((state, dt) => {
    const g = group.current;
    if (!g) return;
    const lift = hovered && rig.mode === "home" ? 0.03 : 0;
    g.position.y = THREE.MathUtils.damp(g.position.y, def.y + lift, 8, dt);
    if (hovered && rig.mode === "home") {
      tmp.set(w * 0.35, def.count * t, d * 0.4);
      g.localToWorld(tmp);
      tmp.project(state.camera);
      live.tag.x = ((tmp.x + 1) / 2) * state.size.width;
      live.tag.y = ((1 - tmp.y) / 2) * state.size.height;
    }
  });

  return (
    <group
      ref={group}
      position={[def.x, def.y, def.z]}
      onPointerOver={(e) => {
        if (rig.mode !== "home") return;
        e.stopPropagation();
        useStore.getState().set({ hovered: def.slug });
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        if (useStore.getState().hovered === def.slug) useStore.getState().set({ hovered: null });
        document.body.style.cursor = "";
      }}
      onClick={(e) => {
        if (rig.mode !== "home") return;
        e.stopPropagation();
        document.body.style.cursor = "";
        useStore.getState().set({ hovered: null });
        useStore.getState().navigate(`/proizvod/${def.slug}`);
      }}
    >
      {offsets.map((o, i) => (
        <mesh key={i} position={[o.x, t * (i + 0.5), o.z]} rotation={[0, o.r, 0]} material={mats} castShadow receiveShadow>
          <boxGeometry args={[w, t * 0.96, d]} />
        </mesh>
      ))}
    </group>
  );
}

export function Folded() {
  const stacks = useMemo(() => {
    const out: StackDef[] = [];
    for (const [slug, x, z] of TABLE_STACKS) out.push({ slug, x: TABLE.x + x, y: TABLE.h, z: TABLE.z - TABLE.d / 2 + z + 0.2, count: 4 });
    const police = FIXTURES.find((f) => f.id === "police")!;
    const rowH = (SHELF.h - SHELF.base) / SHELF.rows;
    for (let c = 0; c < SHELF.cols; c++) {
      for (let r = 0; r < SHELF.rows; r++) {
        out.push({
          slug: police.products[c],
          x: SHELF.x - SHELF.w / 2 + (c + 0.5) * (SHELF.w / SHELF.cols),
          y: SHELF.base + r * rowH,
          z: ROOM.z0 + SHELF.d / 2 + 0.01,
          count: r === 0 ? 5 : 4,
        });
      }
    }
    return out;
  }, []);
  return (
    <group>
      {stacks.map((s, i) => (
        <Stack key={i} def={s} />
      ))}
    </group>
  );
}
