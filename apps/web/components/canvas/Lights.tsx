"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import type { Ambient } from "@/lib/ambient";
import { WALL_Z } from "@/lib/world";
import { rig } from "./rig";

/** Jedan reflektor prati pogled kamere; drugi blago osvjetljava zid iza komada. */
export function Lights({ ambient }: { ambient: Ambient }) {
  const spot = useRef<THREE.SpotLight>(null);
  const wash = useRef<THREE.SpotLight>(null);
  const target = useMemo(() => new THREE.Object3D(), []);
  const washTarget = useMemo(() => new THREE.Object3D(), []);

  useFrame((_, dt) => {
    const L = rig.look;
    const s = spot.current;
    const w = wash.current;
    if (!s || !w) return;
    const product = rig.mode === "product";
    s.position.set(L.x + 0.9, 4.9, L.z + 3.3);
    target.position.set(L.x - (product ? 0.36 : 0), L.y - 0.2, product ? L.z : 0);
    s.angle = THREE.MathUtils.damp(s.angle, product ? 0.24 : 0.4, 3, dt);
    w.position.set(L.x, 4.2, 1.2);
    washTarget.position.set(L.x, 1.5, WALL_Z);
  });

  return (
    <>
      <hemisphereLight args={["#fff3e4", "#0b0b0c", ambient.fill]} />
      <spotLight
        ref={spot}
        target={target}
        color={ambient.spot}
        intensity={ambient.spotIntensity * 1.7}
        angle={0.4}
        penumbra={0.85}
        decay={2}
        distance={0}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0003}
        shadow-normalBias={0.02}
        shadow-radius={6}
        shadow-blurSamples={16}
        shadow-camera-near={1}
        shadow-camera-far={12}
      />
      <spotLight ref={wash} target={washTarget} color={ambient.spot} intensity={ambient.spotIntensity * 0.9} angle={0.85} penumbra={1} decay={2} distance={0} />
      <primitive object={target} />
      <primitive object={washTarget} />
    </>
  );
}
