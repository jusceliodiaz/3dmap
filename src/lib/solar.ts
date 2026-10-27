/** Posição do sol (azimute/altura) para uma latitude, mês e hora solar. */
export function sunPosition(latitude: number, month: number, hour: number) {
  const dayOfYear = Math.round((month + 0.5) * 30.44);
  const decl = 23.44 * Math.sin(((2 * Math.PI) / 365) * (dayOfYear - 81));
  const rad = Math.PI / 180;
  const H = (hour - 12) * 15 * rad;
  const lat = latitude * rad;
  const d = decl * rad;

  const sinAlt = Math.sin(lat) * Math.sin(d) + Math.cos(lat) * Math.cos(d) * Math.cos(H);
  const alt = Math.asin(Math.max(-1, Math.min(1, sinAlt)));

  const cosAz = (Math.sin(d) - Math.sin(alt) * Math.sin(lat)) / (Math.cos(alt) * Math.cos(lat) || 1e-6);
  let az = Math.acos(Math.max(-1, Math.min(1, cosAz))) / rad;
  if (H > 0) az = 360 - az;

  return { azimuth: az, altitude: alt / rad };
}

/** Trajetória completa do dia, para desenhar o arco solar. */
export function sunPath(latitude: number, month: number, step = 0.25) {
  const pts: { hour: number; azimuth: number; altitude: number }[] = [];
  for (let h = 0; h <= 24; h += step) {
    const p = sunPosition(latitude, month, h);
    pts.push({ hour: h, ...p });
  }
  return pts;
}

export const MONTHS = {
  pt: ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"],
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
};

export const OCTANT_LABELS = {
  pt: ["N", "NE", "L", "SE", "S", "SO", "O", "NO"],
  en: ["N", "NE", "E", "SE", "S", "SW", "W", "NW"],
};
