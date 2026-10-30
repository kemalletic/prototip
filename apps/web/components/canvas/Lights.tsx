"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import type { Ambient } from "@/lib/ambient";
import { DRAPE_POS, FACADE_Z, FIXTURES, ROOM, SHELF, TABLE } from "@/lib/boutique";
import type { BoutiqueLight } from "./lighting";
import { rig } from "./rig";

const WARM = "#ffd8a8";

/** Reflektor koji prati pogled kamere (sa sjenama), za detalje na komadima. */
function KeySpot({ intensity, color }: { intensity: number; color: string }) {
  const spot = useRef<THREE.SpotLight>(null);
  const target = useMemo(() => new THREE.Object3D(), []);
  const right = useMemo(() => new THREE.Vector3(), []);
  const fwd = useMemo(() => new THREE.Vector3(), []);
  useFrame((state, dt) => {
    const s = spot.current;
    if (!s) return;
    const cam = state.camera;
    cam.getWorldDirection(fwd);
    right.crossVectors(fwd, cam.up).normalize();
    const product = rig.mode === "product";
    // napolju (ispred fasade) reflektor se gasi: fasadu osvjetljava samo ulica
    const outside = THREE.MathUtils.clamp((cam.position.z - FACADE_Z - 0.5) / 2, 0, 1);
    s.position.copy(cam.position).addScaledVector(cam.up, 1.7).addScaledVector(right, 0.7).addScaledVector(fwd, -0.4);
    target.position.copy(rig.look);
    s.angle = THREE.MathUtils.damp(s.angle, product ? 0.32 : 0.5, 3, dt);
    s.intensity = THREE.MathUtils.damp(s.intensity, (product ? intensity * 1.5 : intensity) * (1 - outside * 0.92), 3, dt);
  });
  return (
    <>
      <spotLight
        ref={spot}
        target={target}
        color={color}
        intensity={intensity}
        angle={0.5}
        penumbra={0.9}
        decay={2}
        distance={0}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0003}
        shadow-normalBias={0.02}
        shadow-radius={6}
        shadow-camera-near={0.5}
        shadow-camera-far={14}
      />
      <primitive object={target} />
    </>
  );
}

function WallSpot({ pos, at, intensity, angle = 0.7 }: { pos: [number, number, number]; at: [number, number, number]; intensity: number; angle?: number }) {
  const target = useMemo(() => {
    const o = new THREE.Object3D();
    o.position.set(...at);
    return o;
  }, [at]);
  return (
    <>
      <spotLight position={pos} target={target} color={WARM} intensity={intensity} angle={angle} penumbra={1} decay={2} distance={0} />
      <primitive object={target} />
    </>
  );
}

export function Lights({ ambient, light, lite }: { ambient: Ambient; light: BoutiqueLight; lite: boolean }) {
  const sunTarget = useMemo(() => {
    const o = new THREE.Object3D();
    o.position.set(-1, 0, 0);
    return o;
  }, []);
  const [L, Rr] = FIXTURES;
  void ambient;
  return (
    <>
      <hemisphereLight args={[light.hemiSky, light.hemiGround, light.hemi * (lite ? 1.4 : 1)]} />
      <directionalLight
        position={light.sunPos}
        target={sunTarget}
        color={light.sunColor}
        intensity={light.sun}
        castShadow
        shadow-mapSize={lite ? [1024, 1024] : [2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.03}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={9}
        shadow-camera-bottom={-6}
        shadow-camera-near={1}
        shadow-camera-far={40}
      />
      <primitive object={sunTarget} />
      <KeySpot intensity={light.key} color={WARM} />
      {/* viseće lampe iznad stola */}
      {[-0.6, 0.6].map((x) => (
        <pointLight key={x} position={[TABLE.x + x, 2.32, TABLE.z]} color="#ffcf8f" intensity={light.lamps} distance={6} decay={2} />
      ))}
      {!lite && (
        <>
          <WallSpot pos={[L.x + 2.2, ROOM.h - 0.15, L.z]} at={[ROOM.x0, 1.4, L.z]} intensity={light.walls} angle={0.95} />
          <WallSpot pos={[Rr.x - 2.2, ROOM.h - 0.15, Rr.z]} at={[ROOM.x1, 1.4, Rr.z]} intensity={light.walls * 0.8} angle={0.85} />
          <WallSpot pos={[SHELF.x, ROOM.h - 0.15, -1.6]} at={[SHELF.x, 1.1, ROOM.z0]} intensity={light.walls * 0.8} angle={0.8} />
          <WallSpot pos={[3.9, ROOM.h - 0.15, -1.6]} at={[3.9, 1.2, ROOM.z0]} intensity={light.walls * 0.5} angle={0.6} />
        </>
      )}
      {/* izlog je uvijek osvijetljen */}
      <WallSpot
        pos={[DRAPE_POS.x - 0.4, ROOM.h - 0.1, DRAPE_POS.z - 1.6]}
        at={[DRAPE_POS.x, 1.6, DRAPE_POS.z]}
        intensity={light.walls * 0.9}
        angle={0.55}
      />
      {light.street > 0 && (
        <WallSpot pos={[0, 5.4, FACADE_Z + 3]} at={[0, 2.6, FACADE_Z]} intensity={light.street} angle={1.0} />
      )}
    </>
  );
}
