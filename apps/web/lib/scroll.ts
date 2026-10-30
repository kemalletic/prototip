import type Lenis from "lenis";

export const scroller: { lenis: Lenis | null } = { lenis: null };

export function scrollToY(y: number, immediate = false) {
  const lenis = scroller.lenis;
  if (immediate) {
    // Lenis pamti visinu prethodne stranice: osvježi je prije skoka,
    // inače bi povratak sa stranice proizvoda bio odrezan na vrh.
    lenis?.resize();
    window.scrollTo(0, y);
    lenis?.scrollTo(y, { immediate: true, force: true });
    return;
  }
  if (lenis) lenis.scrollTo(y, { duration: 1.4 });
  else window.scrollTo({ top: y, behavior: "smooth" });
}
