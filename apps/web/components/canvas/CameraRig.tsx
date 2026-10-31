"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo } from "react";
import * as THREE from "three";
import { live } from "@/lib/store";
import { FOCUS_Z, FOV, GH, HERO_X, HOOK_DROP, ROD_Y } from "@/lib/world";
import { rig } from "./rig";

const tanHalf = Math.tan(THREE.MathUtils.degToRad(FOV / 2));
const smooth = (t: number) => t * t * (3 - 2 * t);

/** Kamera: hero → šina (scroll) → komad (stranica proizvoda). */
export function CameraRig() {
  const pos = useMemo(() => new THREE.Vector3(), []);
  const look = useMemo(() => new THREE.Vector3(), []);
  const a = useMemo(() => new THREE.Vector3(), []);
  const b = useMemo(() => new THREE.Vector3(), []);
  const la = useMemo(() => new THREE.Vector3(), []);
  const lb = useMemo(() => new THREE.Vector3(), []);
  const curLook = useMemo(() => new THREE.Vector3(HERO_X, 1.9, 0), []);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 1 / 30);
    const cam = state.camera as THREE.PerspectiveCamera;
    const aspect = state.size.width / state.size.height;
    const portrait = aspect < 0.9;
    const distFor = (w: number, h: number) => Math.max(h / (2 * tanHalf), w / aspect / (2 * tanHalf));

    if (rig.mode === "product" && rig.focus) {
      const gx = rig.xs.get(rig.focus) ?? 0;
      const cy = ROD_Y - 0.04 - HOOK_DROP - GH / 2 + 0.06;
      if (portrait) {
        const d = distFor(1.05, 1.6);
        const visH = 2 * d * tanHalf;
        look.set(gx, cy - visH * 0.2, FOCUS_Z);
        pos.set(gx, cy - visH * 0.17, FOCUS_Z + d);
      } else {
        const d = distFor(2.6, 1.42);
        const visW = 2 * d * tanHalf * aspect;
        const off = visW * 0.16;
        look.set(gx + off, cy, FOCUS_Z);
        pos.set(gx + off, cy + 0.05, FOCUS_Z + d);
      }
    } else {
      // hero
      if (portrait) {
        // tkanina u gornjoj polovini, tekst ispod
        const visH = Math.max(4.9, 1.9 / aspect);
        const d = visH / (2 * tanHalf);
        const top = 3.05 + 0.08 * visH;
        la.set(HERO_X, top - visH / 2, 0);
        a.set(HERO_X, top - visH / 2 + 0.05, d);
      } else {
        const d = distFor(4.6, 2.75);
        const visW = 2 * d * tanHalf * aspect;
        const off = -Math.min(1.15, visW * 0.22);
        la.set(HERO_X + off, 1.92, 0);
        a.set(HERO_X + off, 1.98, d);
      }
      // šina
      const railH = portrait ? Math.max(2.75, 1.2 / aspect) : 2.3;
      const d = portrait ? railH / (2 * tanHalf) : distFor(3.0, 2.05);
      const x0 = rig.first - (portrait ? 0 : 0.55);
      const x1 = rig.last;
      const rx = x0 + (x1 - x0) * live.railP;
      // na telefonu šipka ide ispod zaglavlja kolekcije (oko 27% visine)
      const ly = portrait ? 2.32 + 0.27 * railH - railH / 2 : 1.76;
      lb.set(rx, ly, 0);
      b.set(rx, ly + 0.06, d);
      const t = smooth(Math.min(1, live.heroP));
      look.lerpVectors(la, lb, t);
      pos.lerpVectors(a, b, t);
      if (!portrait) {
        pos.x += live.pointer.nx * 0.06;
        pos.y += live.pointer.ny * 0.035;
      }
    }

    const lam = rig.mode === "product" ? 2.6 : 5;
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
