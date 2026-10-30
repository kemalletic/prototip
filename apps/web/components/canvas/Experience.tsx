"use client";

import { Environment, Lightformer } from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import { usePathname } from "next/navigation";
import { Suspense, useLayoutEffect, useMemo } from "react";
import * as THREE from "three";
import { getAmbient } from "@/lib/ambient";
import { useStore } from "@/lib/store";
import { sceneLook } from "@/lib/theme";
import { FOV, HERO_X } from "@/lib/world";
import { CameraRig } from "./CameraRig";
import { Drape } from "./Drape";
import { Lights } from "./Lights";
import { Rail } from "./Rail";
import { rig } from "./rig";
import { Room } from "./Room";

function Exposure({ value }: { value: number }) {
  const gl = useThree((s) => s.gl);
  useLayoutEffect(() => {
    gl.toneMappingExposure = value;
  }, [gl, value]);
  return null;
}

export default function Experience() {
  const pathname = usePathname();
  const focus = pathname?.startsWith("/proizvod/") ? decodeURIComponent(pathname.split("/")[2] ?? "") : null;
  const ambient = useMemo(getAmbient, []);
  const tema = useStore((s) => s.tema);
  const look = useMemo(() => sceneLook(tema, ambient), [tema, ambient]);

  useLayoutEffect(() => {
    rig.mode = focus ? "product" : "home";
    rig.focus = focus;
  }, [focus]);

  return (
    <div className="fixed inset-0 z-0" aria-hidden>
      <Canvas
        shadows={{ type: THREE.PCFShadowMap }}
        dpr={[1, 1.75]}
        camera={{ fov: FOV, near: 0.05, far: 40, position: [HERO_X - 0.9, 2, 4] }}
        gl={{ antialias: true, powerPreference: "high-performance" }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
        }}
      >
        <Exposure value={look.exposure} />
        <color attach="background" args={[look.fog]} />
        <fog attach="fog" args={[look.fog, look.fogNear, look.fogFar]} />
        <Suspense fallback={null}>
          <Room look={look} />
          <Lights ambient={ambient} look={look} />
          <Drape look={look} />
          <Rail focus={focus} look={look} />
          <Environment resolution={128} frames={1} environmentIntensity={0.42}>
            <Lightformer form="rect" intensity={3} position={[0, 4, 3]} scale={[8, 1.5, 1]} />
            <Lightformer form="rect" intensity={1} position={[-5, 2, 1]} rotation-y={Math.PI / 2} scale={[4, 2, 1]} />
            <Lightformer form="rect" intensity={0.6} position={[5, 2, 2]} rotation-y={-Math.PI / 2} scale={[4, 2, 1]} />
          </Environment>
        </Suspense>
        <CameraRig />
      </Canvas>
    </div>
  );
}
