/* =============================================================================
   GERADOR DO MASTERPLAN — fonte única de geometria
   O mesmo dado alimenta o sobrevoo 3D e o mapa 2D dos lotes.
   Para usar o loteamento real: substitua `buildLots()` por um import de GeoJSON
   ou de um array de polígonos exportado do CAD (mesmo formato de saída).
   ============================================================================= */

export type LotStatus = "available" | "reserved" | "sold";

export type Lot = {
  id: string;
  block: string;
  number: number;
  ring: number;
  polygon: [number, number][]; // metros, no plano do masterplan (+Y = norte do plano)
  center: [number, number];
  area: number; // m²
  front: number; // testada em metros
  octant: number; // 0=N,1=NE,2=E,3=SE,4=S,5=SW,6=W,7=NW (norte verdadeiro)
  bearing: number; // graus, norte verdadeiro
  lakeView: boolean;
  status: LotStatus;
};

const NORTH_OFFSET = 18; // graus — mantenha igual a brand.site.northOffsetDeg

/* --------------------------------- utils ---------------------------------- */
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shoelace(p: [number, number][]) {
  let a = 0;
  for (let i = 0; i < p.length; i++) {
    const [x1, y1] = p[i];
    const [x2, y2] = p[(i + 1) % p.length];
    a += x1 * y2 - x2 * y1;
  }
  return Math.abs(a) / 2;
}

/** Raio do lago em função do ângulo — contorno orgânico. */
export function lakeRadius(theta: number) {
  return 88 + 20 * Math.sin(3 * theta + 0.7) + 11 * Math.cos(5 * theta - 1.2) + 6 * Math.sin(7 * theta);
}

export const lakePolygon: [number, number][] = Array.from({ length: 160 }, (_, i) => {
  const t = (i / 160) * Math.PI * 2;
  const r = lakeRadius(t);
  return [Math.cos(t) * r, Math.sin(t) * r] as [number, number];
});

/** Faixa (anel) de cada quadra: raio interno adicionado ao contorno do lago. */
const RINGS = [
  { offset: 30, depth: 34, lotWidth: 18, block: "A" },
  { offset: 76, depth: 32, lotWidth: 19, block: "B" },
  { offset: 120, depth: 30, lotWidth: 20, block: "C" },
];

/** Setores angulares reservados a amenidades / bosque (em graus). */
const RESERVED: { from: number; to: number; ring: number; key: string }[] = [
  { from: 8, to: 34, ring: 0, key: "deck" },
  { from: 96, to: 122, ring: 0, key: "mirante" },
  { from: 196, to: 226, ring: 0, key: "trilha" },
  { from: 286, to: 312, ring: 0, key: "pet" },
  { from: 148, to: 182, ring: 1, key: "clube" },
  { from: 330, to: 356, ring: 1, key: "quadras" },
];

function isReserved(ring: number, deg: number) {
  return RESERVED.some((r) => r.ring === ring && deg >= r.from && deg <= r.to);
}

export const OCTANTS = 8;
export function bearingOf(dx: number, dy: number) {
  const deg = (Math.atan2(dx, dy) * 180) / Math.PI;
  return (deg + NORTH_OFFSET + 360) % 360;
}
export function octantOf(bearing: number) {
  return Math.round(bearing / 45) % 8;
}

/* ------------------------------ geração dos lotes -------------------------- */
function buildLots(): Lot[] {
  const rnd = mulberry32(20260826);
  const lots: Lot[] = [];

  RINGS.forEach((ring, ri) => {
    const rMid = 100 + ring.offset + ring.depth / 2;
    const circumference = 2 * Math.PI * rMid;
    const count = Math.round(circumference / ring.lotWidth);
    let number = 1;

    for (let i = 0; i < count; i++) {
      const t0 = (i / count) * Math.PI * 2;
      const t1 = ((i + 1) / count) * Math.PI * 2;
      const midDeg = (((t0 + t1) / 2) * 180) / Math.PI;
      if (isReserved(ri, midDeg)) continue;

      const gap = ((t1 - t0) * 0.06) / 2; // recuo entre lotes
      const a0 = t0 + gap;
      const a1 = t1 - gap;

      const inner = (t: number) => lakeRadius(t) + ring.offset;
      const outer = (t: number) => lakeRadius(t) + ring.offset + ring.depth;

      const polygon: [number, number][] = [];
      const STEPS = 4;
      for (let s = 0; s <= STEPS; s++) {
        const t = a0 + ((a1 - a0) * s) / STEPS;
        const r = inner(t);
        polygon.push([Math.cos(t) * r, Math.sin(t) * r]);
      }
      for (let s = STEPS; s >= 0; s--) {
        const t = a0 + ((a1 - a0) * s) / STEPS;
        const r = outer(t);
        polygon.push([Math.cos(t) * r, Math.sin(t) * r]);
      }

      const tm = (a0 + a1) / 2;
      const rm = (inner(tm) + outer(tm)) / 2;
      const center: [number, number] = [Math.cos(tm) * rm, Math.sin(tm) * rm];
      const area = Math.round(shoelace(polygon));
      const front = Math.round((a1 - a0) * inner(tm) * 10) / 10;
      const bearing = bearingOf(center[0], center[1]);

      const roll = rnd();
      const status: LotStatus = roll < 0.5 ? "available" : roll < 0.72 ? "reserved" : "sold";

      lots.push({
        id: `${ring.block}${String(number).padStart(2, "0")}`,
        block: ring.block,
        number,
        ring: ri,
        polygon,
        center,
        area,
        front,
        bearing,
        octant: octantOf(bearing),
        lakeView: ri === 0,
        status,
      });
      number++;
    }
  });

  return lots;
}

export const lots: Lot[] = buildLots();

export const summary = {
  total: lots.length,
  available: lots.filter((l) => l.status === "available").length,
  reserved: lots.filter((l) => l.status === "reserved").length,
  sold: lots.filter((l) => l.status === "sold").length,
  avgArea: Math.round(lots.reduce((s, l) => s + l.area, 0) / lots.length),
  minArea: Math.min(...lots.map((l) => l.area)),
  maxArea: Math.max(...lots.map((l) => l.area)),
};

/** Posições das amenidades no plano (derivadas dos setores reservados). */
export const amenitySpots: Record<string, { x: number; y: number; r: number }> = Object.fromEntries(
  RESERVED.map((r) => {
    const t = (((r.from + r.to) / 2) * Math.PI) / 180;
    const ring = RINGS[r.ring];
    const rad = lakeRadius(t) + ring.offset + ring.depth / 2;
    return [r.key, { x: Math.cos(t) * rad, y: Math.sin(t) * rad, r: ((r.to - r.from) * Math.PI) / 180 }];
  })
);

/** Eixos viários: anéis concêntricos acompanhando o contorno do lago. */
export const roadRings = [
  { offset: 14, width: 9 },
  { offset: 68, width: 8 },
  { offset: 112, width: 8 },
  { offset: 156, width: 10 },
];

export function ringPolyline(offset: number, steps = 200): [number, number][] {
  return Array.from({ length: steps }, (_, i) => {
    const t = (i / steps) * Math.PI * 2;
    const r = lakeRadius(t) + offset;
    return [Math.cos(t) * r, Math.sin(t) * r] as [number, number];
  });
}

export const PLAN_EXTENT = 300; // meia-largura útil do plano, em metros
