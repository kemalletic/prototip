"use client";

import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import type { Fabric, Product } from "@/lib/catalog";
import { hitMask } from "@/lib/garments/normal";
import { garmentTextures, lensSource, schedule, type GarmentTex, type Side } from "@/lib/garments/textures";
import { live, useStore } from "@/lib/store";
import { DEPTH, designToLocal, FOCUS_Z, GH, GW, hangerFor, HOOK_DROP, ROD_Y } from "@/lib/world";
import { Hanger, type HangerStyle } from "./Hanger";
import { rig } from "./rig";

const ROUGH: Record<Fabric, number> = {
  denim: 0.88,
  jersey: 0.93,
  fleece: 0.96,
  nylon: 0.34,
  rib: 0.97,
  fineknit: 0.9,
  wool: 0.86,
  twill: 0.78,
  leather: 0.48,
  softshell: 0.72,
};

let sharedGeo: THREE.PlaneGeometry | null = null;
const geo = () => (sharedGeo ??= new THREE.PlaneGeometry(GW, GH, 64, 84));

type Pair = { front: GarmentTex; back: GarmentTex };
const railJobs = new Map<string, Promise<Pair>>();
const hiJobs = new Map<string, Promise<Pair>>();

export function loadRail(p: Product, first = false) {
  let job = railJobs.get(p.slug);
  if (!job) {
    job = schedule(() => garmentTextures(p, "front", "rail"), first).then(async (front) => ({
      front,
      back: await schedule(() => garmentTextures(p, "back", "rail"), first),
    }));
    railJobs.set(p.slug, job);
  }
  return job;
}

function loadHi(p: Product) {
  let job = hiJobs.get(p.slug);
  if (!job) {
    job = schedule(() => garmentTextures(p, "front", "hi"), true).then(async (front) => ({
      front,
      back: await schedule(() => garmentTextures(p, "back", "hi")),
    }));
    hiJobs.set(p.slug, job);
  }
  return job;
}

interface Props {
  p: Product;
  x: number;
  focused: boolean;
  fixtureId: string;
  rodY?: number;
  /** Komad se prikazuje samo kad je u fokusu (sto, police). */
  display?: boolean;
  hangerStyle?: HangerStyle;
}

export function Garment({ p, x, focused, fixtureId, rodY = ROD_Y, display = false, hangerStyle = "steel" }: Props) {
  const pivot = useRef<THREE.Group>(null);
  const spin = useRef<THREE.Group>(null);
  const [tex, setTex] = useState<Pair | null>(null);
  const [hi, setHi] = useState<Pair | null>(null);
  const hovered = useStore((s) => s.hovered === p.slug);

  useEffect(() => {
    let alive = true;
    loadRail(p, focused).then((t) => alive && setTex(t));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p]);

  useEffect(() => {
    if (!focused) return;
    useStore.getState().set({ lensSlug: p.slug, lensSource: (side) => lensSource(p, side) });
    let alive = true;
    const id = setTimeout(() => loadHi(p).then((t) => alive && setHi(t)), 350);
    return () => {
      alive = false;
      clearTimeout(id);
    };
  }, [focused, p]);

  const depth = DEPTH[p.kind];
  const mats = useMemo(() => {
    const mk = () =>
      new THREE.MeshStandardMaterial({
        roughness: ROUGH[p.fabric],
        metalness: 0,
        alphaTest: 0.5,
        alphaToCoverage: true,
        displacementScale: depth,
        normalScale: new THREE.Vector2(1, 1),
        envMapIntensity: p.fabric === "nylon" ? 2.4 : p.fabric === "leather" ? 1.2 : 0.45,
      });
    const dm = () =>
      new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, alphaTest: 0.5, displacementScale: depth });
    return { front: mk(), back: mk(), frontDepth: dm(), backDepth: dm() };
  }, [p, depth]);

  useEffect(() => {
    const t = hi ?? tex;
    if (!t) return;
    const apply = (m: THREE.MeshStandardMaterial, d: THREE.MeshDepthMaterial, g: GarmentTex) => {
      m.map = g.map;
      m.normalMap = g.normalMap;
      m.displacementMap = g.displacementMap;
      m.needsUpdate = true;
      d.map = g.map;
      d.displacementMap = g.displacementMap;
      d.needsUpdate = true;
    };
    apply(mats.front, mats.frontDepth, t.front);
    apply(mats.back, mats.backDepth, t.back);
  }, [tex, hi, mats]);

  useEffect(
    () => () => {
      for (const m of Object.values(mats)) m.dispose();
    },
    [mats],
  );

  const st = useRef({
    x,
    y: display ? rodY - 1.3 : rodY,
    z: 0,
    scale: display ? 0 : 1,
    vx: 0,
    swing: 0,
    swingV: 0,
    tilt: 0,
    rot: 0,
    seed: (p.no * 1.7) % 6.28,
    appear: 0,
  });

  const tmp = useMemo(() => new THREE.Vector3(), []);
  const anchors = useMemo(() => {
    const yo = p.kind === "belt" ? 0.107 : 0;
    const [tx, ty] = designToLocal(p.kind === "belt" ? 560 : 840, 980);
    return {
      tag: new THREE.Vector3(tx, ty + yo, 0.05),
      spots: p.hotspots.map((h) => {
        const [hx, hy] = designToLocal(h.x, h.y);
        return new THREE.Vector3(hx, hy + yo, DEPTH[p.kind] * 0.85 + 0.01);
      }),
    };
  }, [p]);

  useFrame((state, delta) => {
    const g = pivot.current;
    const sp = spin.current;
    if (!g || !sp) return;
    const s = st.current;
    const dt = Math.min(delta, 1 / 30);
    const isFocus = rig.mode === "product" && rig.focus === p.slug;
    let ty = rodY;
    let tz = 0;
    if (display && !isFocus) ty = rodY - 1.3;
    if (isFocus) {
      ty = rodY - 0.04;
      tz = FOCUS_Z;
    }
    const tScale = display && !isFocus ? 0 : 1;
    s.scale = THREE.MathUtils.damp(s.scale, tScale, isFocus ? 3 : 6, dt);
    g.visible = s.scale > 0.01;
    // na stranici proizvoda šina se razmakne oko komada u fokusu
    let tx = x;
    if (rig.mode === "product" && !isFocus && rig.focus && rig.fixtureOf.get(rig.focus) === fixtureId) {
      const fx = rig.xs.get(rig.focus) ?? 0;
      tx = x + (x >= fx ? 1.5 : -1.5);
    }
    const lam = isFocus ? 3.4 : 4.2;
    const nx = THREE.MathUtils.damp(s.x, tx, lam, dt);
    const vx = (nx - s.x) / dt;
    const ax = (vx - s.vx) / dt;
    s.vx = vx;
    s.x = nx;
    s.y = THREE.MathUtils.damp(s.y, ty, lam, dt);
    s.z = THREE.MathUtils.damp(s.z, tz, lam, dt);

    // klatno: komad se zanjiše kad ubrza po šipki ili kad kamera prođe pored
    const breeze = THREE.MathUtils.clamp(live.scrollVelocity, -40, 40) * 0.00035 * (0.6 + 0.4 * Math.cos(s.seed));
    s.swingV += (-THREE.MathUtils.clamp(ax, -30, 30) * 0.012 - s.swing * 22 - s.swingV * 3.2 + breeze * 22) * dt;
    s.swing += s.swingV * dt;
    s.swing = THREE.MathUtils.clamp(s.swing, -0.12, 0.12);
    const hoverTilt = hovered && rig.mode === "home" ? -0.07 : 0;
    s.tilt = THREE.MathUtils.damp(s.tilt, hoverTilt + Math.sin(state.clock.elapsedTime * 0.7 + s.seed) * 0.006, 4, dt);

    g.position.set(s.x, s.y, s.z);
    g.scale.setScalar(Math.max(0.001, s.scale));
    g.rotation.set(isFocus ? 0 : s.tilt, 0, isFocus ? s.swing * 0.3 : s.swing);

    const targetRot = isFocus ? live.rotate : 0;
    s.rot = THREE.MathUtils.damp(s.rot, targetRot, isFocus ? 7 : 3, dt);
    sp.rotation.y = s.rot + (isFocus && !live.dragging ? Math.sin(state.clock.elapsedTime * 0.45) * 0.05 : 0);

    // pozicije na ekranu za etiketu i tačke s detaljima (DOM sloj)
    const project = (v: THREE.Vector3) => {
      tmp.copy(v);
      sp.localToWorld(tmp);
      tmp.project(state.camera);
      return { x: ((tmp.x + 1) / 2) * state.size.width, y: ((1 - tmp.y) / 2) * state.size.height };
    };
    if (hovered && rig.mode === "home") {
      const q = project(anchors.tag);
      live.tag.x = q.x;
      live.tag.y = q.y;
    }
    if (isFocus) {
      const facing = Math.cos(sp.rotation.y);
      live.spotOpacity = facing > 0.5 ? Math.min(1, (facing - 0.5) * 4) : 0;
      anchors.spots.forEach((v, i) => {
        const q = project(v);
        live.spots[i] = q;
      });
    }
  });

  const handle = (side: Side) => ({
    onPointerMove: (e: ThreeEvent<PointerEvent>) => {
      const t = (hi ?? tex)?.[side];
      if (!t || !e.uv) return;
      const hit = hitMask(t.mask, e.uv.x, e.uv.y);
      const store = useStore.getState();
      if (rig.mode === "home") {
        if (hit) {
          e.stopPropagation();
          if (store.hovered !== p.slug) store.set({ hovered: p.slug });
          document.body.style.cursor = "pointer";
        } else if (store.hovered === p.slug) {
          store.set({ hovered: null });
          document.body.style.cursor = "";
        }
      } else if (rig.focus === p.slug) {
        e.stopPropagation();
        if (hit && !live.dragging) {
          store.set({ lens: { active: true, x: e.nativeEvent.clientX, y: e.nativeEvent.clientY, u: e.uv.x, v: e.uv.y, side } });
        } else if (store.lens.active) store.set({ lens: { ...store.lens, active: false } });
      }
    },
    onPointerOut: () => {
      const store = useStore.getState();
      if (store.hovered === p.slug) store.set({ hovered: null });
      if (store.lens.active && rig.focus === p.slug) store.set({ lens: { ...store.lens, active: false } });
      document.body.style.cursor = "";
    },
    onClick: (e: ThreeEvent<MouseEvent>) => {
      const t = (hi ?? tex)?.[side];
      if (!t || !e.uv || rig.mode !== "home" || display) return;
      if (!hitMask(t.mask, e.uv.x, e.uv.y)) return;
      e.stopPropagation();
      document.body.style.cursor = "";
      useStore.getState().set({ hovered: null });
      useStore.getState().navigate(`/proizvod/${p.slug}`);
    },
  });

  const yOff = p.kind === "belt" ? 0.107 : 0;
  const centerY = -HOOK_DROP - GH / 2 + yOff;

  return (
    <group ref={pivot} position={[x, display ? rodY - 1.3 : rodY, 0]}>
      <group ref={spin}>
        <Hanger kind={hangerFor(p.kind)} style={hangerStyle} />
        <group position={[0, centerY, 0]} visible={!!tex}>
          <mesh geometry={geo()} material={mats.front} customDepthMaterial={mats.frontDepth} castShadow receiveShadow {...handle("front")} />
          <mesh
            geometry={geo()}
            material={mats.back}
            customDepthMaterial={mats.backDepth}
            rotation={[0, Math.PI, 0]}
            castShadow
            receiveShadow
            {...handle("back")}
          />
        </group>
      </group>
    </group>
  );
}
