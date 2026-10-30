"use client";

import * as THREE from "three";
import type { Product } from "../catalog";
import { drawGarment, DH, DW } from "./draw";
import { drawDrape } from "./drape";
import { fabricTile } from "./fabrics";
import { alphaMask, downscale, heightToNormal, type AlphaMask } from "./normal";

export type Quality = "rail" | "hi";
export type Side = "front" | "back";

export interface GarmentTex {
  map: THREE.CanvasTexture;
  normalMap: THREE.CanvasTexture;
  displacementMap: THREE.CanvasTexture;
  color: HTMLCanvasElement;
  mask: AlphaMask;
}

const texCache = new Map<string, GarmentTex>();

function railWidth() {
  return window.innerWidth < 768 ? 420 : 600;
}

function tex(c: HTMLCanvasElement, srgb: boolean) {
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

export function garmentTextures(p: Product, side: Side, quality: Quality): GarmentTex {
  const key = `${p.slug}:${side}:${quality}`;
  const hit = texCache.get(key);
  if (hit) return hit;
  const width = quality === "hi" ? 1600 : railWidth();
  const { color, height } = drawGarment(p, side, width);
  const tile = fabricTile(p.fabric, p.color);
  const normal = heightToNormal(height!, tile, 0.045 * (width / 560));
  const disp = downscale(height!, 160);
  const out: GarmentTex = {
    map: tex(color, true),
    normalMap: tex(normal, false),
    displacementMap: tex(disp, false),
    color,
    mask: alphaMask(color),
  };
  texCache.set(key, out);
  return out;
}

export function peekTextures(p: Product, side: Side, quality: Quality) {
  return texCache.get(`${p.slug}:${side}:${quality}`) ?? null;
}

/** Izvor za lupu: hi-res ako postoji. */
export function lensSource(p: Product, side: Side): HTMLCanvasElement | null {
  return peekTextures(p, side, "hi")?.color ?? peekTextures(p, side, "rail")?.color ?? null;
}

// Teksture se prave jedna po jedna da stranica ostane glatka.
type Job = () => void;
const jobs: Job[] = [];
let running = false;

function pump() {
  if (running) return;
  running = true;
  const step = () => {
    const start = performance.now();
    while (jobs.length && performance.now() - start < 14) jobs.shift()!();
    if (jobs.length) requestAnimationFrame(step);
    else running = false;
  };
  requestAnimationFrame(step);
}

export function schedule<T>(fn: () => T, priority = false): Promise<T> {
  return new Promise((resolve, reject) => {
    const job = () => {
      try {
        resolve(fn());
      } catch (e) {
        reject(e);
      }
    };
    if (priority) jobs.unshift(job);
    else jobs.push(job);
    pump();
  });
}

export interface DrapeTex {
  front: THREE.CanvasTexture;
  frontNormal: THREE.CanvasTexture;
  back: THREE.CanvasTexture;
  backNormal: THREE.CanvasTexture;
}

let drapeCache: DrapeTex | null = null;

export function drapeTextures(): DrapeTex {
  if (drapeCache) return drapeCache;
  const width = window.innerWidth < 768 ? 768 : 1280;
  const f = drawDrape(false, width);
  const b = drawDrape(true, Math.round(width * 0.6));
  drapeCache = {
    front: tex(f.color, true),
    frontNormal: tex(f.normal, false),
    back: tex(b.color, true),
    backNormal: tex(b.normal, false),
  };
  return drapeCache;
}

export const GARMENT_ASPECT = DH / DW;
