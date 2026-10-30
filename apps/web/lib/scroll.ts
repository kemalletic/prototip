import type Lenis from "lenis";

export const scroller: { lenis: Lenis | null } = { lenis: null };

export function scrollToY(y: number, immediate = false) {
  if (scroller.lenis) scroller.lenis.scrollTo(y, { immediate, duration: 1.4 });
  else window.scrollTo({ top: y, behavior: immediate ? "auto" : "smooth" });
}
