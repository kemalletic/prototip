"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { live } from "@/lib/store";
import { rig } from "./rig";

const STEP = 1 / 120;

export interface ClothProps {
  width: number;
  height: number;
  cols?: number;
  rows?: number;
  /** Koliko je šipka uža od tkanine (prirodni nabori). */
  gather?: number;
  pinEvery?: number;
  folds?: number;
  /** Gornja sredina tkanine u svijetu i rotacija oko y. */
  position: [number, number, number];
  rotationY?: number;
  front: { map: THREE.Texture; normal: THREE.Texture };
  back: { map: THREE.Texture; normal: THREE.Texture };
  roughness?: number;
  normalScale?: number;
  bend?: number;
  breeze?: number;
  /** Simulira se samo kad je kamera bliže od ovoga (m). */
  activeRadius?: number;
  rodColor?: string;
  hang?: "cables" | "rings";
  ceiling?: number;
  onClick?: () => void;
  onHover?: (over: boolean) => void;
}

/**
 * Tkanina koja visi sa šipke: verlet simulacija. Kursor je ruka,
 * a naginjanje telefona je vjetar.
 */
export function Cloth({
  width,
  height,
  cols = 30,
  rows = 40,
  gather = 0.84,
  pinEvery = 3,
  folds = 7,
  position,
  rotationY = 0,
  front,
  back,
  roughness = 0.88,
  normalScale = 1.6,
  bend = 0.35,
  breeze = 0.55,
  activeRadius = 9,
  rodColor = "#1d1d1c",
  hang = "cables",
  ceiling = 3.6,
  onClick,
  onHover,
}: ClothProps) {
  const { camera } = useThree();
  const N = cols * rows;

  const sim = useMemo(() => {
    const geo = new THREE.PlaneGeometry(width, height, cols - 1, rows - 1);
    const pos = geo.attributes.position.array as Float32Array;
    const rest = new Float32Array(pos);
    const pinned = new Uint8Array(N);
    for (let i = 0; i < cols; i++) if (i % pinEvery === 0 || i === cols - 1) pinned[i] = 1;
    const cons: number[] = [];
    const len: number[] = [];
    const stiff: number[] = [];
    const add = (a: number, b: number, s: number) => {
      cons.push(a, b);
      len.push(Math.hypot(rest[a * 3] - rest[b * 3], rest[a * 3 + 1] - rest[b * 3 + 1]));
      stiff.push(s);
    };
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        const id = j * cols + i;
        if (i < cols - 1) add(id, id + 1, 1);
        if (j < rows - 1) add(id, id + cols, 1);
        if (i < cols - 1 && j < rows - 1) {
          add(id, id + cols + 1, 0.6);
          add(id + 1, id + cols, 0.6);
        }
        if (i < cols - 2) add(id, id + 2, bend);
        if (j < rows - 2) add(id, id + cols * 2, bend);
      }
    }
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        const id = (j * cols + i) * 3;
        const u = i / (cols - 1);
        pos[id] = (u - 0.5) * width * gather;
        pos[id + 2] = Math.sin(u * Math.PI * folds) * 0.045 * (1 - (j / rows) * 0.4);
        if (j === 0 && !pinned[i]) pos[id + 1] -= 0.012;
      }
    }
    const prev = new Float32Array(pos);
    return {
      geo,
      pos,
      prev,
      pinned,
      cons: new Int32Array(cons),
      len: new Float32Array(len),
      stiff: new Float32Array(stiff),
      acc: 0,
      time: 0,
      hand: new THREE.Vector3(),
      lastHand: new THREE.Vector3(),
      hasHand: false,
      settled: 0,
    };
  }, [width, height, cols, rows, gather, pinEvery, folds, bend, N]);

  const group = useRef<THREE.Group>(null);
  const ray = useMemo(() => new THREE.Raycaster(), []);
  const plane = useMemo(() => new THREE.Plane(), []);
  const ndc = useMemo(() => new THREE.Vector2(), []);
  const tmp = useMemo(() => new THREE.Vector3(), []);
  const nrm = useMemo(() => new THREE.Vector3(), []);
  const wp = useMemo(() => new THREE.Vector3(), []);

  useEffect(() => () => sim.geo.dispose(), [sim]);

  useFrame((_, delta) => {
    const g = group.current;
    if (!g) return;
    g.getWorldPosition(wp);
    // simuliramo samo kad je tkanina blizu kamere (i prvih par sekundi da se slegne)
    const near = rig.mode === "home" && camera.position.distanceTo(wp) < activeRadius;
    if (!near && sim.settled > 2) return;
    const dt = Math.min(delta, 1 / 30);
    sim.settled += dt;
    sim.acc += dt;

    const p = live.pointer;
    let handActive = false;
    if (near && p.inside && performance.now() - p.t < 400) {
      ndc.set(p.nx, p.ny);
      ray.setFromCamera(ndc, camera);
      nrm.set(0, 0, 1).applyQuaternion(g.getWorldQuaternion(new THREE.Quaternion()));
      plane.setFromNormalAndCoplanarPoint(nrm, wp);
      if (ray.ray.intersectPlane(plane, tmp)) {
        g.worldToLocal(tmp);
        handActive = Math.abs(tmp.x) < width && Math.abs(tmp.y) < height;
        if (handActive) {
          if (!sim.hasHand) sim.lastHand.copy(tmp);
          sim.hand.copy(tmp);
        }
      }
    }
    sim.hasHand = handActive;

    const { pos, prev, pinned, cons, len, stiff } = sim;
    let steps = 0;
    while (sim.acc >= STEP && steps < 6) {
      steps++;
      sim.acc -= STEP;
      sim.time += STEP;
      const t = sim.time;
      const tiltX = live.tilt.x;
      const tiltZ = live.tilt.y;
      const gy = -9.8 * STEP * STEP;
      for (let i = 0; i < N; i++) {
        if (pinned[i]) continue;
        const ix = i * 3;
        const x = pos[ix];
        const y = pos[ix + 1];
        const z = pos[ix + 2];
        const wind = (Math.sin(t * 0.9 + x * 2.1 + y * 0.7) * 0.6 + Math.sin(t * 2.3 + y * 3.1) * 0.25) * breeze + tiltZ * 3;
        const vx = (x - prev[ix]) * 0.985;
        const vy = (y - prev[ix + 1]) * 0.985;
        const vz = (z - prev[ix + 2]) * 0.985;
        prev[ix] = x;
        prev[ix + 1] = y;
        prev[ix + 2] = z;
        pos[ix] = x + vx + tiltX * 2 * STEP * STEP;
        pos[ix + 1] = y + vy + gy;
        pos[ix + 2] = z + vz + wind * STEP * STEP;
      }
      if (sim.hasHand) {
        const hx = sim.hand.x;
        const hy = sim.hand.y;
        const mvx = (sim.hand.x - sim.lastHand.x) * 0.5;
        const mvy = (sim.hand.y - sim.lastHand.y) * 0.5;
        const speed = Math.min(1, Math.hypot(mvx, mvy) * 40);
        const R = 0.28;
        for (let i = 0; i < N; i++) {
          if (pinned[i]) continue;
          const ix = i * 3;
          const dx = pos[ix] - hx;
          const dy = pos[ix + 1] - hy;
          const d2 = dx * dx + dy * dy;
          if (d2 > R * R) continue;
          const f = 1 - Math.sqrt(d2) / R;
          const ff = f * f;
          pos[ix] += mvx * ff * 0.9;
          pos[ix + 1] += mvy * ff * 0.6;
          pos[ix + 2] -= ff * (0.004 + speed * 0.012);
        }
        sim.lastHand.lerp(sim.hand, 0.5);
      }
      for (let it = 0; it < 4; it++) {
        for (let c = 0; c < len.length; c++) {
          const a = cons[c * 2] * 3;
          const b = cons[c * 2 + 1] * 3;
          const pa = pinned[a / 3];
          const pb = pinned[b / 3];
          if (pa && pb) continue;
          const dx = pos[b] - pos[a];
          const dy = pos[b + 1] - pos[a + 1];
          const dz = pos[b + 2] - pos[a + 2];
          const d = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1e-6;
          const diff = ((d - len[c]) / d) * 0.5 * stiff[c];
          const wa = pa ? 0 : pb ? 2 : 1;
          const wb = pb ? 0 : pa ? 2 : 1;
          pos[a] += dx * diff * wa;
          pos[a + 1] += dy * diff * wa;
          pos[a + 2] += dz * diff * wa;
          pos[b] -= dx * diff * wb;
          pos[b + 1] -= dy * diff * wb;
          pos[b + 2] -= dz * diff * wb;
        }
      }
      for (let i = 0; i < N; i++) {
        const iz = i * 3 + 2;
        if (pos[iz] < -0.3) pos[iz] = -0.3;
      }
    }
    sim.geo.attributes.position.needsUpdate = true;
    sim.geo.computeVertexNormals();
  });

  const rodW = width * gather + 0.24;
  const clips = useMemo(() => {
    const out: number[] = [];
    for (let i = 0; i < cols; i++) if (i % pinEvery === 0 || i === cols - 1) out.push((i / (cols - 1) - 0.5) * width * gather);
    return out;
  }, [cols, pinEvery, width, gather]);

  const [px, top, pz] = position;
  const rodY = height / 2 + 0.035;
  const rodMat = useMemo(() => new THREE.MeshStandardMaterial({ color: rodColor, metalness: 0.7, roughness: 0.4 }), [rodColor]);

  return (
    <group position={[px, top - height / 2, pz]} rotation={[0, rotationY, 0]} ref={group}>
      <mesh
        geometry={sim.geo}
        castShadow
        receiveShadow
        frustumCulled={false}
        onClick={onClick ? (e) => (e.stopPropagation(), onClick()) : undefined}
        onPointerOver={onHover ? () => onHover(true) : undefined}
        onPointerOut={onHover ? () => onHover(false) : undefined}
      >
        <meshStandardMaterial
          map={front.map}
          normalMap={front.normal}
          normalScale={new THREE.Vector2(normalScale, normalScale)}
          roughness={roughness}
          metalness={0}
          side={THREE.FrontSide}
        />
      </mesh>
      <mesh geometry={sim.geo} frustumCulled={false} castShadow>
        <meshStandardMaterial map={back.map} normalMap={back.normal} roughness={roughness + 0.04} side={THREE.BackSide} />
      </mesh>
      <mesh position={[0, rodY, 0]} rotation={[0, 0, Math.PI / 2]} material={rodMat} castShadow>
        <cylinderGeometry args={[0.014, 0.014, rodW, 20]} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[(s * rodW) / 2, rodY, 0]} material={rodMat}>
          <sphereGeometry args={[0.02, 16, 12]} />
        </mesh>
      ))}
      {hang === "cables" &&
        [-1, 1].map((s) => {
          const cableH = ceiling - (top + 0.035);
          return (
            <mesh key={`c${s}`} position={[(s * (rodW - 0.12)) / 2, rodY + cableH / 2, 0]}>
              <cylinderGeometry args={[0.0018, 0.0018, cableH, 6]} />
              <meshStandardMaterial color="#888" metalness={1} roughness={0.3} />
            </mesh>
          );
        })}
      {clips.map((x) => (
        <group key={x} position={[x, height / 2 + 0.012, 0]}>
          <mesh position={[0, 0.022, 0]} material={rodMat}>
            <torusGeometry args={[0.019, 0.003, 8, 24]} />
          </mesh>
          {hang === "cables" && (
            <mesh position={[0, -0.006, 0.004]} castShadow material={rodMat}>
              <boxGeometry args={[0.026, 0.03, 0.008]} />
            </mesh>
          )}
        </group>
      ))}
    </group>
  );
}
