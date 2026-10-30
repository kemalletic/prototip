"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { heightToNormal } from "@/lib/garments/normal";
import type { SceneLook } from "@/lib/theme";
import { WALL_Z } from "@/lib/world";
import { concreteTextures, TILE_H, TILE_W } from "./concrete";

function plasterNormal() {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const x = c.getContext("2d", { willReadFrequently: true })!;
  x.fillStyle = "#808080";
  x.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 1600; i++) {
    const v = 100 + Math.random() * 60;
    x.fillStyle = `rgba(${v},${v},${v},0.35)`;
    x.beginPath();
    x.arc(Math.random() * 256, Math.random() * 256, 2 + Math.random() * 9, 0, Math.PI * 2);
    x.fill();
  }
  const n = heightToNormal(c, null, 0.02, 0);
  const t = new THREE.CanvasTexture(n);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(26, 5);
  return t;
}

const WALL_W = 40;
const WALL_H = 9;
const FLOOR_D = 10;

export function Room({ look }: { look: SceneLook }) {
  const plaster = useMemo(() => (look.concrete ? null : plasterNormal()), [look.concrete]);
  const wall = useMemo(() => {
    if (!look.concrete) return null;
    const t = concreteTextures(look.wall, true);
    t.map.repeat.set(WALL_W / TILE_W, WALL_H / TILE_H);
    t.normal.repeat.copy(t.map.repeat);
    // poravnaj spojeve ploča s podom
    t.map.offset.set(0, (WALL_H / TILE_H) % 1);
    t.normal.offset.copy(t.map.offset);
    return t;
  }, [look.concrete, look.wall]);
  const floor = useMemo(() => {
    if (!look.concrete) return null;
    const t = concreteTextures(look.floor, false);
    t.map.repeat.set(WALL_W / TILE_W, FLOOR_D / TILE_H);
    t.normal.repeat.copy(t.map.repeat);
    return t;
  }, [look.concrete, look.floor]);

  useEffect(
    () => () => {
      for (const t of [plaster, wall?.map, wall?.normal, floor?.map, floor?.normal]) t?.dispose();
    },
    [plaster, wall, floor],
  );

  return (
    <group>
      <mesh position={[6, WALL_H / 2 - 1, WALL_Z]} receiveShadow>
        <planeGeometry args={[WALL_W, WALL_H]} />
        {wall ? (
          <meshStandardMaterial map={wall.map} normalMap={wall.normal} roughness={0.92} envMapIntensity={0.3} />
        ) : (
          <meshStandardMaterial color={look.wall} roughness={0.96} normalMap={plaster} normalScale={new THREE.Vector2(0.6, 0.6)} />
        )}
      </mesh>
      <mesh position={[6, 0, WALL_Z + FLOOR_D / 2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[WALL_W, FLOOR_D]} />
        {floor ? (
          <meshStandardMaterial map={floor.map} normalMap={floor.normal} roughness={0.55} envMapIntensity={0.6} />
        ) : (
          <meshStandardMaterial color={look.floor} roughness={0.75} />
        )}
      </mesh>
    </group>
  );
}
