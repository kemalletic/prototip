"use client";

import { Environment, Lightformer } from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, useLayoutEffect, useMemo } from "react";
import * as THREE from "three";
import { getAmbient } from "@/lib/ambient";
import { FIXTURES } from "@/lib/boutique";
import { PRODUCTS } from "@/lib/catalog";
import { isTouch } from "@/lib/device-tier";
import { useStore } from "@/lib/store";
import { FOV } from "@/lib/world";
import { Boutique } from "./Boutique";
import { CameraRig } from "./CameraRig";
import { FixtureView } from "./Fixture";
import { Folded } from "./Folded";
import { loadRail } from "./Garment";
import { boutiqueLight } from "./lighting";
import { Lights } from "./Lights";
import { rig } from "./rig";

function Exposure({ value }: { value: number }) {
  const gl = useThree((s) => s.gl);
  useLayoutEffect(() => {
    gl.toneMappingExposure = value;
  }, [gl, value]);
  return null;
}

function Ready() {
  useEffect(() => {
    Promise.all(PRODUCTS.map((p) => loadRail(p))).then(() => useStore.getState().set({ ready: true }));
  }, []);
  return null;
}

export default function Experience() {
  const pathname = usePathname();
  const focus = pathname?.startsWith("/proizvod/") ? decodeURIComponent(pathname.split("/")[2] ?? "") : null;
  const ambient = useMemo(getAmbient, []);
  const light = useMemo(() => boutiqueLight(ambient), [ambient]);
  const lite = useMemo(() => isTouch() || window.innerWidth < 768, []);

  useLayoutEffect(() => {
    rig.mode = focus ? "product" : "home";
    rig.focus = focus;
  }, [focus]);

  return (
    <div className="fixed inset-0 z-0" aria-hidden>
      <Canvas
        shadows={{ type: THREE.PCFShadowMap }}
        dpr={lite ? [1, 1.5] : [1, 1.75]}
        camera={{ fov: FOV, near: 0.05, far: 80, position: [-4.7, 1.6, 7.8] }}
        gl={{ antialias: true, powerPreference: "high-performance" }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
        }}
      >
        <Exposure value={light.exposure} />
        <color attach="background" args={[light.sky]} />
        <fog attach="fog" args={[light.sky, light.fogNear, light.fogFar]} />
        <Suspense fallback={null}>
          <Boutique light={light} />
          <Lights ambient={ambient} light={light} lite={lite} />
          {FIXTURES.map((f) => (
            <FixtureView key={f.id} f={f} focus={focus} />
          ))}
          <Folded />
          <Ready />
          <Environment resolution={128} frames={1} environmentIntensity={light.env}>
            <Lightformer form="rect" intensity={3} position={[0, 4, 6]} scale={[12, 3, 1]} />
            <Lightformer form="rect" intensity={1.2} position={[0, 3.5, -2]} rotation-x={Math.PI / 2} scale={[10, 4, 1]} />
            <Lightformer form="rect" intensity={0.6} position={[-6, 2, 0]} rotation-y={Math.PI / 2} scale={[6, 2, 1]} />
          </Environment>
        </Suspense>
        <CameraRig />
      </Canvas>
    </div>
  );
}
