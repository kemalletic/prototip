/**
 * Znak NIT: geometrijska slova kroz koja je provučena indigo nit
 * (preko N, ispod I, preko T).
 */
export function Wordmark({ className, title = "NIT" }: { className?: string; title?: string }) {
  const thread = "M-8 23 C 6 15, 14 15, 24 19 S 40 27, 50 21 S 70 9, 82 15 S 100 24, 108 17";
  return (
    <svg className={className} viewBox="-10 -4 122 44" role="img" aria-label={title}>
      <g className="wm__letters">
        <path d="M0 0 H8.6 L23 21.4 V0 H31.6 V32 H23 L8.6 10.6 V32 H0 Z" />
        <rect x="40" y="0" width="8.6" height="32" />
        <path d="M57 0 H92 V8 H78.8 V32 H70.2 V8 H57 Z" />
      </g>
      <path className="wm__thread" d={thread} />
      {/* I ide preko niti: nit prolazi ispod */}
      <rect className="wm__over" x="40" y="0" width="8.6" height="32" />
      <circle className="wm__knot" cx="108" cy="17" r="2.2" />
    </svg>
  );
}

/** Selvedge ivica: bijela traka s indigo linijom, kao unutrašnji šav sirovog denima. */
export function Selvedge({ className = "" }: { className?: string }) {
  return <div className={`selvedge ${className}`} aria-hidden />;
}

/** Bakarna zakovica, marker za aktivno stanje. */
export function Rivet({ className = "" }: { className?: string }) {
  return <span className={`rivet ${className}`} aria-hidden />;
}

/** Kožna zakrpa, kao na leđima farmerki. */
export function Patch({ children }: { children: React.ReactNode }) {
  return <span className="patch">{children}</span>;
}
