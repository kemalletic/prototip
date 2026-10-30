"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo } from "react";
import * as THREE from "three";
import { keyframes, type Key } from "@/lib/boutique";
import { live } from "@/lib/store";
import { FOCUS_Z, FOV, GH, HOOK_DROP } from "@/lib/world";
import { rig } from "./rig";

const tanHalf = Math.tan(THREE.MathUtils.degToRad(FOV / 2));

interface Path {
  pos: THREE.CatmullRomCurve3;
  look: THREE.CatmullRomCurve3;
  cum: number[];
  total: number;
  n: number;
}

function buildPath(keys: Key[]): Path {
  const v = (a: [number, number, number]) => new THREE.Vector3(...a);
  const cum = [0];
  for (let i = 0; i < keys.length - 1; i++) cum.push(cum[i] + keys[i].w);
  return {
    pos: new THREE.CatmullRomCurve3(keys.map((k) => v(k.pos)), false, "centripetal"),
    look: new THREE.CatmullRomCurve3(keys.map((k) => v(k.look)), false, "centripetal"),
    cum,
    total: cum[cum.length - 1],
    n: keys.length,
  };
}

/** scroll 0..1 → parametar krivulje (po tačkama, uz težine segmenata). */
function pathParam(path: Path, s: number) {
  const d = s * path.total;
  for (let i = 0; i < path.n - 1; i++) {
    if (d <= path.cum[i + 1] || i === path.n - 2) {
      const w = path.cum[i + 1] - path.cum[i] || 1;
      const t = THREE.MathUtils.clamp((d - path.cum[i]) / w, 0, 1);
      return (i + t) / (path.n - 1);
    }
  }
  return 1;
}

/** Kamera: šetnja kroz butik na scroll, a na stranici proizvoda kadar prema komadu. */
export function CameraRig() {
  const paths = useMemo(() => ({ wide: buildPath(keyframes(false)), tall: buildPath(keyframes(true)) }), []);
  const pos = useMemo(() => new THREE.Vector3(), []);
  const look = useMemo(() => new THREE.Vector3(), []);
  const curLook = useMemo(() => new THREE.Vector3(-4.9, 1.75, 3.4), []);
  const fwd = useMemo(() => new THREE.Vector3(), []);
  const right = useMemo(() => new THREE.Vector3(), []);
  const q = useMemo(() => new THREE.Quaternion(), []);
  const first = useMemo(() => ({ done: false }), []);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 1 / 30);
    const cam = state.camera as THREE.PerspectiveCamera;
    const aspect = state.size.width / state.size.height;
    const portrait = aspect < 0.9;
    const path = portrait ? paths.tall : paths.wide;

    const fixture = rig.focus ? rig.fixtures.get(rig.fixtureOf.get(rig.focus) ?? "") : undefined;
    if (rig.mode === "product" && rig.focus && fixture) {
      const x = rig.xs.get(rig.focus) ?? 0;
      const rodY = fixture.userData.rodY ?? 2.3;
      const cy = rodY - 0.04 - HOOK_DROP - GH / 2 + 0.06;
      const center = new THREE.Vector3(x, cy, FOCUS_Z);
      fixture.localToWorld(center);
      fixture.getWorldQuaternion(q);
      fwd.set(0, 0, 1).applyQuaternion(q);
      right.set(1, 0, 0).applyQuaternion(q);
      if (portrait) {
        const visH = Math.max(1.6, 1.05 / aspect);
        const d = visH / (2 * tanHalf);
        look.copy(center).addScaledVector(cam.up, -visH * 0.2);
        pos.copy(center).addScaledVector(fwd, d).addScaledVector(cam.up, -visH * 0.17);
      } else {
        const d = Math.max(1.42 / (2 * tanHalf), 2.6 / aspect / (2 * tanHalf));
        const visW = 2 * d * tanHalf * aspect;
        const off = visW * 0.16;
        look.copy(center).addScaledVector(right, off);
        pos.copy(center).addScaledVector(right, off).addScaledVector(fwd, d);
        pos.y += 0.05;
      }
    } else {
      const u = pathParam(path, THREE.MathUtils.clamp(live.tourP, 0, 1));
      path.pos.getPoint(u, pos);
      path.look.getPoint(u, look);
      if (!portrait) {
        pos.x += live.pointer.nx * 0.05;
        pos.y += live.pointer.ny * 0.03;
      }
    }

    if (rig.mode === "product") {
      // kamera ostaje u butiku, ne izlazi kroz zid ni izlog
      pos.x = THREE.MathUtils.clamp(pos.x, -6.6, 6.6);
      pos.z = THREE.MathUtils.clamp(pos.z, -3.2, 3.3);
    }
    if (!first.done) {
      cam.position.copy(pos);
      curLook.copy(look);
      first.done = true;
    }
    const lam = rig.mode === "product" ? 2.6 : 4.5;
    cam.position.x = THREE.MathUtils.damp(cam.position.x, pos.x, lam, dt);
    cam.position.y = THREE.MathUtils.damp(cam.position.y, pos.y, lam, dt);
    cam.position.z = THREE.MathUtils.damp(cam.position.z, pos.z, lam, dt);
    curLook.x = THREE.MathUtils.damp(curLook.x, look.x, lam, dt);
    curLook.y = THREE.MathUtils.damp(curLook.y, look.y, lam, dt);
    curLook.z = THREE.MathUtils.damp(curLook.z, look.z, lam, dt);
    cam.lookAt(curLook);
    rig.look.copy(curLook);
  });

  return null;
}
