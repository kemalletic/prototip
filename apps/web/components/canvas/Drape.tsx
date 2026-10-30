"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { DRAPE_H, DRAPE_W } from "@/lib/garments/drape";
import { drapeTextures } from "@/lib/garments/textures";
import { live } from "@/lib/store";
import { DRAPE_TOP, HERO_X, WALL_Z } from "@/lib/world";
import { rig } from "./rig";

const COLS = 30;
const ROWS = 40;
const N = COLS * ROWS;
const STEP = 1 / 120;
const GATHER = 0.84;

/**
 * Komad denima koji visi s šipke. Verlet simulacija: kursor je ruka,
 * a naginjanje telefona je vjetar.
 */
export function Drape() {
  const { camera } = useThree();
  const tex = useMemo(() => drapeTextures(), []);

  const sim = useMemo(() => {
    const geo = new THREE.PlaneGeometry(DRAPE_W, DRAPE_H, COLS - 1, ROWS - 1);
    const pos = geo.attributes.position.array as Float32Array;
    const prev = new Float32Array(pos);
    const rest = new Float32Array(pos);
    const pinned = new Uint8Array(N);
    for (let i = 0; i < COLS; i++) if (i % 3 === 0 || i === COLS - 1) pinned[i] = 1;
    const cons: number[] = [];
    const len: number[] = [];
    const stiff: number[] = [];
    const add = (a: number, b: number, s: number) => {
      cons.push(a, b);
      len.push(Math.hypot(rest[a * 3] - rest[b * 3], rest[a * 3 + 1] - rest[b * 3 + 1]));
      stiff.push(s);
    };
    for (let j = 0; j < ROWS; j++) {
      for (let i = 0; i < COLS; i++) {
        const id = j * COLS + i;
        if (i < COLS - 1) add(id, id + 1, 1);
        if (j < ROWS - 1) add(id, id + COLS, 1);
        if (i < COLS - 1 && j < ROWS - 1) {
          add(id, id + COLS + 1, 0.6);
          add(id + 1, id + COLS, 0.6);
        }
        // denim je krut: savijanje preko dvije tačke
        if (i < COLS - 2) add(id, id + 2, 0.35);
        if (j < ROWS - 2) add(id, id + COLS * 2, 0.35);
      }
    }
    // tkanina je šira od šipke: skupi se u prirodne nabore
    for (let j = 0; j < ROWS; j++) {
      for (let i = 0; i < COLS; i++) {
        const id = (j * COLS + i) * 3;
        const u = i / (COLS - 1);
        const x = (u - 0.5) * DRAPE_W * GATHER;
        const z = Math.sin(u * Math.PI * 7) * 0.045 * (1 - (j / ROWS) * 0.4);
        pos[id] = prev[id] = x;
        pos[id + 2] = prev[id + 2] = z;
        if (j === 0 && !pinned[i]) {
          pos[id + 1] -= 0.012;
          prev[id + 1] -= 0.012;
        }
      }
    }
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
    };
  }, []);

  const group = useRef<THREE.Group>(null);
  const ray = useMemo(() => new THREE.Raycaster(), []);
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), []);
  const ndc = useMemo(() => new THREE.Vector2(), []);
  const tmp = useMemo(() => new THREE.Vector3(), []);

  useEffect(() => () => sim.geo.dispose(), [sim]);

  useFrame((_, delta) => {
    // simuliramo samo kad je tkanina u kadru
    const near = rig.mode === "home" && live.heroP < 0.995;
    if (!near) return;
    const dt = Math.min(delta, 1 / 30);
    sim.acc += dt;

    // ruka: presjek zraka kursora i ravni tkanine
    const p = live.pointer;
    let handActive = false;
    if (p.inside && performance.now() - p.t < 400) {
      ndc.set(p.nx, p.ny);
      ray.setFromCamera(ndc, camera);
      if (ray.ray.intersectPlane(plane, tmp)) {
        tmp.x -= HERO_X;
        tmp.y -= DRAPE_TOP - DRAPE_H / 2;
        handActive = true;
        if (!sim.hasHand) sim.lastHand.copy(tmp);
        sim.hand.copy(tmp);
      }
    }
    sim.hasHand = handActive;

    const { pos, prev, pinned, cons, len, stiff } = sim;
    while (sim.acc >= STEP) {
      sim.acc -= STEP;
      sim.time += STEP;
      const t = sim.time;
      const tiltX = live.tilt.x;
      const tiltZ = live.tilt.y;
      const g = -9.8 * STEP * STEP;
      for (let i = 0; i < N; i++) {
        if (pinned[i]) continue;
        const ix = i * 3;
        const x = pos[ix];
        const y = pos[ix + 1];
        const z = pos[ix + 2];
        const breeze =
          (Math.sin(t * 0.9 + x * 2.1 + y * 0.7) * 0.6 + Math.sin(t * 2.3 + y * 3.1) * 0.25) * 0.55 + tiltZ * 3;
        const vx = (x - prev[ix]) * 0.985;
        const vy = (y - prev[ix + 1]) * 0.985;
        const vz = (z - prev[ix + 2]) * 0.985;
        prev[ix] = x;
        prev[ix + 1] = y;
        prev[ix + 2] = z;
        pos[ix] = x + vx + tiltX * 2 * STEP * STEP;
        pos[ix + 1] = y + vy + g;
        pos[ix + 2] = z + vz + breeze * STEP * STEP;
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
          const dx = pos[b] - pos[a];
          const dy = pos[b + 1] - pos[a + 1];
          const dz = pos[b + 2] - pos[a + 2];
          const d = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1e-6;
          const diff = ((d - len[c]) / d) * 0.5 * stiff[c];
          const pa = pinned[a / 3];
          const pb = pinned[b / 3];
          if (pa && pb) continue;
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
        if (pos[iz] < WALL_Z + 0.08) pos[iz] = WALL_Z + 0.08;
      }
    }
    sim.geo.attributes.position.needsUpdate = true;
    sim.geo.computeVertexNormals();
  });

  const clips = useMemo(() => {
    const out: number[] = [];
    for (let i = 0; i < COLS; i++) if (i % 3 === 0 || i === COLS - 1) out.push((i / (COLS - 1) - 0.5) * DRAPE_W * GATHER);
    return out;
  }, []);

  return (
    <group ref={group} position={[HERO_X, DRAPE_TOP - DRAPE_H / 2, 0]}>
      <mesh geometry={sim.geo} castShadow receiveShadow frustumCulled={false}>
        <meshStandardMaterial
          map={tex.front}
          normalMap={tex.frontNormal}
          normalScale={new THREE.Vector2(1.6, 1.6)}
          roughness={0.88}
          metalness={0}
          side={THREE.FrontSide}
        />
      </mesh>
      <mesh geometry={sim.geo} frustumCulled={false}>
        <meshStandardMaterial map={tex.back} normalMap={tex.backNormal} roughness={0.92} side={THREE.BackSide} />
      </mesh>
      {/* šipka i štipaljke */}
      <mesh position={[0, DRAPE_H / 2 + 0.035, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.011, 0.011, DRAPE_W * GATHER + 0.34, 20]} />
        <meshStandardMaterial color="#8b857c" metalness={1} roughness={0.32} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * ((DRAPE_W * GATHER) / 2 + 0.17), DRAPE_H / 2 + 0.035, 0]}>
          <sphereGeometry args={[0.018, 16, 16]} />
          <meshStandardMaterial color="#8b857c" metalness={1} roughness={0.3} />
        </mesh>
      ))}
      {[-1, 1].map((s) => (
        <mesh key={`b${s}`} position={[s * ((DRAPE_W * GATHER) / 2 + 0.1), DRAPE_H / 2 + 0.035, WALL_Z / 2]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.007, 0.007, -WALL_Z, 10]} />
          <meshStandardMaterial color="#5f5a53" metalness={1} roughness={0.4} />
        </mesh>
      ))}
      {clips.map((x) => (
        <group key={x} position={[x, DRAPE_H / 2 + 0.012, 0]}>
          <mesh position={[0, 0.02, 0]}>
            <torusGeometry args={[0.016, 0.0028, 8, 24]} />
            <meshStandardMaterial color="#9a948a" metalness={1} roughness={0.3} />
          </mesh>
          <mesh position={[0, -0.006, 0.004]} castShadow>
            <boxGeometry args={[0.026, 0.03, 0.008]} />
            <meshStandardMaterial color="#77726a" metalness={1} roughness={0.35} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
