"use client";

import { useMemo } from "react";
import * as THREE from "three";
import type { Ambient } from "@/lib/ambient";
import { heightToNormal } from "@/lib/garments/normal";
import { WALL_Z } from "@/lib/world";

function plasterNormal() {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const x = c.getContext("2d")!;
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

export function Room({ ambient }: { ambient: Ambient }) {
  const normal = useMemo(plasterNormal, []);
  return (
    <group>
      <mesh position={[6, 3.5, WALL_Z]} receiveShadow>
        <planeGeometry args={[40, 9]} />
        <meshStandardMaterial color={ambient.wall} roughness={0.96} normalMap={normal} normalScale={new THREE.Vector2(0.6, 0.6)} />
      </mesh>
      <mesh position={[6, 0, 4]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[40, 10]} />
        <meshStandardMaterial color="#0d0c0b" roughness={0.75} />
      </mesh>
    </group>
  );
}
