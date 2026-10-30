// Zvuk rajsferšlusa, sintetizovan u pregledniku (bez audio fajlova).

let ctx: AudioContext | null = null;

function audio() {
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new AC();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

export function playZip(duration = 0.42) {
  const a = audio();
  const t0 = a.currentTime;
  const len = Math.floor(a.sampleRate * duration);
  const buf = a.createBuffer(1, len, a.sampleRate);
  const d = buf.getChannelData(0);
  // Šum moduliran brzim "zubima" koji se ubrzavaju.
  let phase = 0;
  for (let i = 0; i < len; i++) {
    const t = i / len;
    const rate = 60 + t * 160;
    phase += rate / a.sampleRate;
    const tooth = Math.pow(Math.max(0, Math.sin(phase * Math.PI * 2)), 8);
    d[i] = (Math.random() * 2 - 1) * (0.25 + tooth * 0.9) * Math.sin(Math.PI * t);
  }
  const src = a.createBufferSource();
  src.buffer = buf;
  const bp = a.createBiquadFilter();
  bp.type = "bandpass";
  bp.Q.value = 1.4;
  bp.frequency.setValueAtTime(2200, t0);
  bp.frequency.linearRampToValueAtTime(4200, t0 + duration);
  const g = a.createGain();
  g.gain.value = 0.22;
  src.connect(bp).connect(g).connect(a.destination);
  src.start(t0);
}

export function haptic(pattern: number | number[]) {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    /* nije podržano */
  }
}
