"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { BENCH, DRAPE_POS, FACADE_Z, KABINA, ROOM, SHELF, TABLE, WINDOWS } from "@/lib/boutique";
import { DRAPE_H, DRAPE_W } from "@/lib/garments/drape";
import { curtainTextures, drapeTextures } from "@/lib/garments/textures";
import { useStore } from "@/lib/store";
import { Cloth } from "./Cloth";
import { oak, pavers, plaster, repeated, signTexture, travertine } from "./materials";
import type { BoutiqueLight } from "./lighting";

const WALL = "#f1ebe1";
const STONE = "#d3c9b9";

function Box({
  x0,
  x1,
  y0,
  y1,
  z0,
  z1,
  material,
  cast = true,
}: {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  z0: number;
  z1: number;
  material: THREE.Material;
  cast?: boolean;
}) {
  return (
    <mesh position={[(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2]} material={material} castShadow={cast} receiveShadow>
      <boxGeometry args={[x1 - x0, y1 - y0, z1 - z0]} />
    </mesh>
  );
}

/** Okvir prozora od crnog čelika. */
function Frame({ x0, x1, y0, y1, z, mullions = [], transom, steel }: { x0: number; x1: number; y0: number; y1: number; z: number; mullions?: number[]; transom?: number; steel: THREE.Material }) {
  const t = 0.05;
  const bars: [number, number, number, number][] = [
    [x0, x0 + t, y0, y1],
    [x1 - t, x1, y0, y1],
    [x0, x1, y0, y0 + t],
    [x0, x1, y1 - t, y1],
    ...mullions.map((m) => [m - t / 2, m + t / 2, y0, y1] as [number, number, number, number]),
    ...(transom ? [[x0, x1, transom - t / 2, transom + t / 2] as [number, number, number, number]] : []),
  ];
  return (
    <group>
      {bars.map(([a, b, c, d], i) => (
        <Box key={i} x0={a} x1={b} y0={c} y1={d} z0={z - 0.04} z1={z + 0.04} material={steel} />
      ))}
    </group>
  );
}

export function Boutique({ light }: { light: BoutiqueLight }) {
  const W = ROOM.x1 - ROOM.x0;
  const D = ROOM.z1 - ROOM.z0;
  const H = ROOM.h;

  const mats = useMemo(() => {
    const wall = plaster(WALL);
    const stone = plaster(STONE);
    const neighborA = plaster("#bdb3a4");
    const neighborB = plaster("#cfc5b5");
    const floor = oak("#c9a67a");
    const woodDark = oak("#a07a50");
    const trav = travertine();
    const street = pavers();
    const m = (maps: { map: THREE.Texture; normal: THREE.Texture }, rough: number, extra: THREE.MeshStandardMaterialParameters = {}) =>
      new THREE.MeshStandardMaterial({ map: maps.map, normalMap: maps.normal, roughness: rough, ...extra });
    return {
      backWall: m(repeated(wall, W / 2, H / 2), 0.95),
      sideWall: m(repeated(wall, D / 2, H / 2), 0.95),
      ceiling: m(repeated(wall, W / 2, D / 2), 0.98, { side: THREE.DoubleSide }),
      floor: m(repeated(floor, W / 1.44, D / 2.4), 0.55, { envMapIntensity: 0.5 }),
      facade: m(repeated(stone, 1.5, 1.5), 0.9),
      neighborA: m(repeated(neighborA, 4, 4), 0.95),
      neighborB: m(repeated(neighborB, 4, 4), 0.95),
      street: m(repeated(street, 32 / 2.4, 12 / 1.6), 0.85),
      road: new THREE.MeshStandardMaterial({ color: "#3d3b39", roughness: 0.92 }),
      trav: m(repeated(trav, 2, 1), 0.45, { envMapIntensity: 0.6 }),
      travSide: m(repeated(trav, 2, 0.15), 0.5),
      oak: m(repeated(woodDark, 1, 1), 0.6),
      oakLight: m(repeated(floor, 1, 0.6), 0.55),
      kabina: m(repeated(wall, 1, 1.2), 0.95),
      steel: new THREE.MeshStandardMaterial({ color: "#1b1b1b", metalness: 0.7, roughness: 0.42 }),
      brass: new THREE.MeshStandardMaterial({ color: "#a8834e", metalness: 1, roughness: 0.32 }),
      glass: new THREE.MeshStandardMaterial({
        color: "#dfe8ea",
        metalness: 0.1,
        roughness: 0.04,
        transparent: true,
        opacity: 0.08,
        envMapIntensity: 0.6,
        depthWrite: false,
      }),
      mirror: new THREE.MeshStandardMaterial({ color: "#cfd4d6", metalness: 1, roughness: 0.04, envMapIntensity: 1.6 }),
      shadeOut: new THREE.MeshStandardMaterial({ color: "#1d1c1a", metalness: 0.4, roughness: 0.5 }),
      shadeIn: new THREE.MeshStandardMaterial({ color: "#fff3df", emissive: "#ffd9a0", emissiveIntensity: 0.6, side: THREE.BackSide }),
      bulb: new THREE.MeshStandardMaterial({ color: "#fff", emissive: "#ffe2b0", emissiveIntensity: 3 }),
    };
  }, [W, D, H]);

  const sign = useMemo(() => signTexture("NIT"), []);
  const signMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#1f1d1a",
        alphaMap: sign,
        transparent: true,
        roughness: 0.6,
        emissive: "#ffe1b0",
        emissiveMap: sign,
        emissiveIntensity: 0,
      }),
    [sign],
  );
  useEffect(() => {
    signMat.emissiveIntensity = light.sign;
    mats.shadeIn.emissiveIntensity = light.lamps * 0.12;
    mats.bulb.emissiveIntensity = 1 + light.lamps * 0.4;
  }, [light, signMat, mats]);

  const drape = useMemo(() => drapeTextures(), []);
  const curtain = useMemo(() => curtainTextures(), []);
  const curtainMaps = useMemo(() => ({ map: curtain.map, normal: curtain.normal }), [curtain]);
  const setStore = useStore((s) => s.set);
  const small = useMemo(() => window.innerWidth < 768, []);

  // vrata se otvore kad kamera priđe
  const door = useRef<THREE.Group>(null);
  useFrame((state, dt) => {
    const d = door.current;
    if (!d) return;
    const z = state.camera.position.z;
    const open = THREE.MathUtils.clamp((7 - z) / 1.6, 0, 1);
    d.rotation.y = THREE.MathUtils.damp(d.rotation.y, open * 1.45, 6, dt);
  });

  const fz = ROOM.z1;
  const fz2 = FACADE_Z;
  const { left, right, door: dr, sill, top, doorTop } = WINDOWS;
  const rowH = (SHELF.h - SHELF.base) / SHELF.rows;
  const shelfZ0 = ROOM.z0;
  const shelfZ1 = ROOM.z0 + SHELF.d;

  return (
    <group>
      {/* pod, plafon, zidovi */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} material={mats.floor} receiveShadow>
        <planeGeometry args={[W, D]} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, H, 0]} material={mats.ceiling} castShadow receiveShadow>
        <planeGeometry args={[W + 0.4, D + 0.4]} />
      </mesh>
      <mesh position={[0, H / 2, ROOM.z0]} material={mats.backWall} receiveShadow>
        <planeGeometry args={[W, H]} />
      </mesh>
      <mesh position={[ROOM.x0, H / 2, 0]} rotation={[0, Math.PI / 2, 0]} material={mats.sideWall} receiveShadow castShadow>
        <planeGeometry args={[D, H]} />
      </mesh>
      <mesh position={[ROOM.x1, H / 2, 0]} rotation={[0, -Math.PI / 2, 0]} material={mats.sideWall} receiveShadow castShadow>
        <planeGeometry args={[D, H]} />
      </mesh>

      {/* prednji zid s izlozima i fasada */}
      <Box x0={ROOM.x0 - 0.2} x1={left[0]} y0={0} y1={7} z0={fz} z1={fz2} material={mats.facade} />
      <Box x0={right[1]} x1={ROOM.x1 + 0.2} y0={0} y1={7} z0={fz} z1={fz2} material={mats.facade} />
      <Box x0={left[1]} x1={dr[0]} y0={0} y1={7} z0={fz} z1={fz2} material={mats.facade} />
      <Box x0={dr[1]} x1={right[0]} y0={0} y1={7} z0={fz} z1={fz2} material={mats.facade} />
      <Box x0={left[0]} x1={left[1]} y0={0} y1={sill} z0={fz} z1={fz2} material={mats.facade} />
      <Box x0={right[0]} x1={right[1]} y0={0} y1={sill} z0={fz} z1={fz2} material={mats.facade} />
      <Box x0={ROOM.x0 - 0.2} x1={ROOM.x1 + 0.2} y0={top} y1={7} z0={fz} z1={fz2} material={mats.facade} />
      <Frame x0={left[0]} x1={left[1]} y0={sill} y1={top} z={(fz + fz2) / 2} mullions={[-4.85, -2.95]} transom={2.9} steel={mats.steel} />
      <Frame x0={right[0]} x1={right[1]} y0={sill} y1={top} z={(fz + fz2) / 2} mullions={[2.1, 4.5]} transom={2.9} steel={mats.steel} />
      <Frame x0={dr[0]} x1={dr[1]} y0={doorTop} y1={top} z={(fz + fz2) / 2} steel={mats.steel} />
      {[
        [left[0], left[1], sill, top],
        [right[0], right[1], sill, top],
        [dr[0], dr[1], doorTop, top],
      ].map(([a, b, c, d], i) => (
        <mesh key={i} position={[(a + b) / 2, (c + d) / 2, (fz + fz2) / 2]} material={mats.glass} renderOrder={2}>
          <planeGeometry args={[b - a, d - c]} />
        </mesh>
      ))}
      {/* vrata */}
      <group ref={door} position={[dr[0], 0, (fz + fz2) / 2]}>
        <group position={[(dr[1] - dr[0]) / 2, 0, 0]}>
          <mesh position={[0, doorTop / 2, 0]} material={mats.glass} renderOrder={2}>
            <planeGeometry args={[dr[1] - dr[0] - 0.1, doorTop - 0.1]} />
          </mesh>
          <Frame x0={-(dr[1] - dr[0]) / 2} x1={(dr[1] - dr[0]) / 2} y0={0} y1={doorTop} z={0} steel={mats.steel} />
          <Box x0={0.62} x1={0.66} y0={0.75} y1={1.55} z0={0.05} z1={0.09} material={mats.brass} />
        </group>
      </group>
      {/* natpis */}
      <mesh position={[0, 3.62, fz2 + 0.012]} material={signMat}>
        <planeGeometry args={[2.4, 0.6]} />
      </mesh>
      <mesh position={[0, 3.24, fz2 + 0.006]} material={mats.steel}>
        <boxGeometry args={[2.6, 0.04, 0.012]} />
      </mesh>

      {/* susjedne zgrade, trotoar i ulica */}
      <mesh position={[-12, 4, fz2 - 0.3]} material={mats.neighborA} receiveShadow>
        <planeGeometry args={[9.6, 8]} />
      </mesh>
      <mesh position={[12, 4, fz2 - 0.3]} material={mats.neighborB} receiveShadow>
        <planeGeometry args={[9.6, 8]} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, fz2 + 4.5]} material={mats.street} receiveShadow>
        <planeGeometry args={[32, 9]} />
      </mesh>
      <Box x0={-16} x1={16} y0={-0.02} y1={0.1} z0={fz2 + 9} z1={fz2 + 9.2} material={mats.facade} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.04, fz2 + 15]} material={mats.road} receiveShadow>
        <planeGeometry args={[40, 12]} />
      </mesh>

      {/* denim u izlogu */}
      <Cloth
        width={DRAPE_W}
        height={DRAPE_H}
        cols={small ? 22 : 30}
        rows={small ? 30 : 40}
        position={[DRAPE_POS.x, DRAPE_POS.top, DRAPE_POS.z]}
        front={{ map: drape.front, normal: drape.frontNormal }}
        back={{ map: drape.back, normal: drape.backNormal }}
        activeRadius={11}
        hang="cables"
        ceiling={H}
      />

      {/* sto s majicama */}
      <Box x0={TABLE.x - TABLE.w / 2} x1={TABLE.x + TABLE.w / 2} y0={TABLE.h - 0.06} y1={TABLE.h} z0={TABLE.z - TABLE.d / 2} z1={TABLE.z + TABLE.d / 2} material={mats.trav} />
      {[-1, 1].map((s) => (
        <Box
          key={s}
          x0={TABLE.x + s * 0.82 - 0.09}
          x1={TABLE.x + s * 0.82 + 0.09}
          y0={0}
          y1={TABLE.h - 0.06}
          z0={TABLE.z - TABLE.d / 2 + 0.12}
          z1={TABLE.z + TABLE.d / 2 - 0.12}
          material={mats.travSide}
        />
      ))}
      {/* viseće lampe iznad stola */}
      {[-0.6, 0.6].map((x) => (
        <group key={x} position={[TABLE.x + x, 2.42, TABLE.z]}>
          <mesh position={[0, (H - 2.42) / 2 + 0.1, 0]}>
            <cylinderGeometry args={[0.004, 0.004, H - 2.42 - 0.2, 6]} />
            <meshStandardMaterial color="#111" />
          </mesh>
          <mesh material={mats.shadeOut} castShadow>
            <cylinderGeometry args={[0.035, 0.14, 0.16, 32, 1, true]} />
          </mesh>
          <mesh material={mats.shadeIn}>
            <cylinderGeometry args={[0.034, 0.139, 0.159, 32, 1, true]} />
          </mesh>
          <mesh position={[0, -0.045, 0]} material={mats.bulb}>
            <sphereGeometry args={[0.03, 16, 12]} />
          </mesh>
        </group>
      ))}

      {/* hrastove police za farmerke */}
      <group>
        <Box x0={SHELF.x - SHELF.w / 2} x1={SHELF.x + SHELF.w / 2} y0={0} y1={SHELF.base} z0={shelfZ0} z1={shelfZ1} material={mats.oak} />
        {Array.from({ length: SHELF.rows + 1 }, (_, r) => (
          <Box
            key={`h${r}`}
            x0={SHELF.x - SHELF.w / 2}
            x1={SHELF.x + SHELF.w / 2}
            y0={SHELF.base + r * rowH - 0.03}
            y1={SHELF.base + r * rowH}
            z0={shelfZ0}
            z1={shelfZ1}
            material={mats.oak}
          />
        ))}
        {Array.from({ length: SHELF.cols + 1 }, (_, c) => (
          <Box
            key={`v${c}`}
            x0={SHELF.x - SHELF.w / 2 + c * (SHELF.w / SHELF.cols) - 0.015}
            x1={SHELF.x - SHELF.w / 2 + c * (SHELF.w / SHELF.cols) + 0.015}
            y0={SHELF.base}
            y1={SHELF.h}
            z0={shelfZ0}
            z1={shelfZ1}
            material={mats.oak}
          />
        ))}
      </group>

      {/* klupa */}
      <Box x0={BENCH.x - BENCH.w / 2} x1={BENCH.x + BENCH.w / 2} y0={BENCH.h - 0.05} y1={BENCH.h} z0={BENCH.z - BENCH.d / 2} z1={BENCH.z + BENCH.d / 2} material={mats.oakLight} />
      {[-1, 1].map((s) => (
        <Box
          key={s}
          x0={BENCH.x + s * (BENCH.w / 2 - 0.12) - 0.02}
          x1={BENCH.x + s * (BENCH.w / 2 - 0.12) + 0.02}
          y0={0}
          y1={BENCH.h - 0.05}
          z0={BENCH.z - BENCH.d / 2 + 0.04}
          z1={BENCH.z + BENCH.d / 2 - 0.04}
          material={mats.steel}
        />
      ))}

      {/* kabina */}
      <Box x0={KABINA.x0} x1={KABINA.x1} y0={0} y1={KABINA.h} z0={KABINA.z0 - 0.06} z1={KABINA.z0} material={mats.kabina} />
      <Box x0={KABINA.x0} x1={KABINA.x1} y0={0} y1={KABINA.h} z0={KABINA.z1} z1={KABINA.z1 + 0.06} material={mats.kabina} />
      <Box x0={KABINA.x0} x1={KABINA.x1} y0={KABINA.h - 0.04} y1={KABINA.h} z0={KABINA.z0} z1={KABINA.z1} material={mats.kabina} />
      <mesh position={[ROOM.x1 - 0.01, 1.3, (KABINA.z0 + KABINA.z1) / 2]} rotation={[0, -Math.PI / 2, 0]} material={mats.mirror}>
        <planeGeometry args={[0.8, 1.9]} />
      </mesh>
      <Cloth
        width={KABINA.z1 - KABINA.z0 - 0.08}
        height={KABINA.h - 0.12}
        cols={24}
        rows={34}
        gather={0.78}
        pinEvery={2}
        folds={9}
        bend={0.12}
        breeze={0.25}
        position={[KABINA.x0 - 0.02, KABINA.h - 0.1, (KABINA.z0 + KABINA.z1) / 2]}
        rotationY={-Math.PI / 2}
        front={curtainMaps}
        back={curtainMaps}
        roughness={0.92}
        normalScale={1.2}
        activeRadius={6}
        hang="rings"
        onClick={() => setStore({ cartOpen: true })}
        onHover={(over) => {
          document.body.style.cursor = over ? "pointer" : "";
        }}
      />

      {/* šine sa svjetlima na plafonu */}
      {[-1.7, 1.5].map((z) => (
        <group key={z}>
          <Box x0={-6} x1={6} y0={H - 0.04} y1={H} z0={z - 0.02} z1={z + 0.02} material={mats.steel} cast={false} />
          {[-5, -3, -1, 1, 3, 5].map((x) => (
            <group key={x} position={[x, H - 0.12, z]} rotation={[z < 0 ? 0.5 : -0.5, 0, 0]}>
              <mesh material={mats.steel}>
                <cylinderGeometry args={[0.035, 0.035, 0.14, 16]} />
              </mesh>
              <mesh position={[0, -0.071, 0]} material={mats.bulb}>
                <circleGeometry args={[0.028, 16]} />
              </mesh>
            </group>
          ))}
        </group>
      ))}
    </group>
  );
}
