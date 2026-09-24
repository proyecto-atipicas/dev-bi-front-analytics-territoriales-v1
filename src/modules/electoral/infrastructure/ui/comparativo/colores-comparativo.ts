import type { GanadorComparativo } from '@/modules/electoral/domain/entities';

/** Paleta del comparativo basada en el brandbook — A = navy, B = red, empate = warm beige. */
export const COLOR_A = {
  text: 'text-brand',
  textStrong: 'text-brand',
  bg: 'bg-brand-muted',
  border: 'border-brand/30',
  // Hex usados por Leaflet (no soporta tokens CSS). Navy brandbook + tinte cream.
  fill: '#313f69',
  fillSoft: '#c5cee0',
};

export const COLOR_B = {
  text: 'text-danger-foreground',
  textStrong: 'text-danger-foreground',
  bg: 'bg-danger-muted',
  border: 'border-danger/30',
  // Red brandbook (#b32118) + tinte rosado claro coordinado.
  fill: '#b32118',
  fillSoft: '#f4cac6',
};

export const COLOR_EMPATE = {
  // Tonos cálidos (yellow brandbook desaturado) para que el empate no compita con A/B.
  fill: '#b8a361',
  fillSoft: '#e8dca6',
};

export function colorGanador(g: GanadorComparativo, intensidad: number = 1): string {
  const t = Math.max(0.35, Math.min(1, intensidad));
  if (g === 'A') return mezclar(COLOR_A.fillSoft, COLOR_A.fill, t);
  if (g === 'B') return mezclar(COLOR_B.fillSoft, COLOR_B.fill, t);
  return COLOR_EMPATE.fill;
}

/** Interpola lineal entre dos colores hex (#rrggbb). */
function mezclar(c1: string, c2: string, t: number): string {
  const a = hexARgb(c1);
  const b = hexARgb(c2);
  const r = Math.round(a.r + (b.r - a.r) * t);
  const g = Math.round(a.g + (b.g - a.g) * t);
  const bb = Math.round(a.b + (b.b - a.b) * t);
  return `rgb(${r}, ${g}, ${bb})`;
}

function hexARgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}
