import { lakeRadius } from "@/content/masterplan";

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
export const smoothstep = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a || 1e-6));
  return t * t * (3 - 2 * t);
};
export const mix = (a: number, b: number, t: number) => a + (b - a) * t;

function hash2(x: number, y: number) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
  return s - Math.floor(s);
}

function valueNoise(x: number, y: number) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const a = hash2(xi, yi);
  const b = hash2(xi + 1, yi);
  const c = hash2(xi, yi + 1);
  const d = hash2(xi + 1, yi + 1);
  return mix(mix(a, b, u), mix(c, d, u), v) * 2 - 1;
}

function fbm(x: number, y: number, octaves = 4) {
  let amp = 1;
  let freq = 1;
  let sum = 0;
  let norm = 0;
  for (let i = 0; i < octaves; i++) {
    sum += valueNoise(x * freq, y * freq) * amp;
    norm += amp;
    amp *= 0.5;
    freq *= 2.03;
  }
  return sum / norm;
}

export const WATER_LEVEL = 0;

/** Altura do terreno em coordenadas de plano (metros). */
export function heightAt(px: number, py: number) {
  const r = Math.hypot(px, py);
  const th = Math.atan2(py, px);
  const lr = lakeRadius(th);

  const base = fbm(px * 0.0032, py * 0.0032) * 30 + fbm(px * 0.012, py * 0.012) * 6;
  // colina do mirante, a noroeste
  const ridge = 34 * Math.exp(-((px + 200) ** 2 + (py - 170) ** 2) / (2 * 130 ** 2));
  let h = base + ridge + 4;

  // platô urbanizado: suaviza o relevo onde ficam as quadras
  const dev = smoothstep(lr + 200, lr + 10, r);
  h = mix(h, h * 0.22 + 5.5, dev);

  // escavação do lago
  const shore = smoothstep(lr - 10, lr + 20, r);
  h = mix(-8, h, shore);

  return h;
}
