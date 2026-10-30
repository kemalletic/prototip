import * as THREE from "three";

/** Zajedničko stanje 3D scene koje se mijenja svaki frame. */
export const rig = {
  look: new THREE.Vector3(-3.7, 1.9, 0),
  mode: "home" as "home" | "product",
  focus: null as string | null,
  xs: new Map<string, number>(),
  first: 0,
  last: 0,
};
