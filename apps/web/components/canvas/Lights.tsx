"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import type { Ambient } from "@/lib/ambient";
import type { SceneLook } from "@/lib/theme";
import { WALL_Z } from "@/lib/world";
import { windowCookie } from "./concrete";
import { rig } from "./rig";

/**
 * Reflektor prati pogled kamere, drugi blago osvjetljava zid,
 * a u svijetlim temama treći baca svjetlo prozora na zid.
 */
export function Lights({ ambient, look }: { ambient: Ambient; look: SceneLook }) {
  const spot = useRef<THREE.SpotLight>(null);
  const wash = useRef<THREE.SpotLight>(null);
  const win = useRef<THREE.SpotLight>(null);
  const target = useMemo(() => new THREE.Object3D(), []);
  const washTarget = useMemo(() => new THREE.Object3D(), []);
  const winTarget = useMemo(() => new THREE.Object3D(), []);
  const cookie = useMemo(() => (look.window > 0 ? windowCookie() : null), [look.window]);

  useFrame((_, dt) => {
    const L = rig.look;
    const s = spot.current;
    const w = wash.current;
    if (!s || !w) return;
    const product = rig.mode === "product";
    s.position.set(L.x + 0.9, 4.9, L.z + 3.3);
    target.position.set(L.x - (product ? 0.36 : 0), L.y - 0.2, product ? L.z : 0);
    s.angle = THREE.MathUtils.damp(s.angle, product ? look.spotAngle * 0.6 : look.spotAngle, 3, dt);
    w.position.set(L.x, 4.2, 1.2);
    washTarget.position.set(L.x, 1.5, WALL_Z);
    if (win.current) {
      win.current.position.set(L.x - 3.4, 4.4, 3.6);
      winTarget.position.set(L.x + 0.9, 1.7, WALL_Z);
    }
  });

  return (
    <>
      <hemisphereLight args={["#fff3e4", look.ground, look.fill]} />
      <spotLight
        ref={spot}
        target={target}
        color={ambient.spot}
        intensity={ambient.spotIntensity * look.spot}
        angle={look.spotAngle}
        penumbra={look.plaster ? 0.95 : 0.85}
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
      <spotLight ref={wash} target={washTarget} color={ambient.spot} intensity={ambient.spotIntensity * look.wash} angle={0.85} penumbra={1} decay={2} distance={0} />
      {cookie && (
        <spotLight
          ref={win}
          target={winTarget}
          map={cookie}
          color="#fff6ea"
          intensity={ambient.spotIntensity * 1.6 * look.window}
          angle={0.42}
          penumbra={0.25}
          decay={2}
          distance={0}
          castShadow
          shadow-mapSize={[1024, 1024]}
          shadow-bias={-0.0004}
          shadow-normalBias={0.03}
          shadow-camera-near={1}
          shadow-camera-far={14}
        />
      )}
      <primitive object={target} />
      <primitive object={washTarget} />
      <primitive object={winTarget} />
    </>
  );
}
