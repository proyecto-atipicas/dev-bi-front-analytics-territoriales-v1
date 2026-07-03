'use client';

import { useResolvedTheme } from '@/shared/application/hooks/use-resolved-theme';

const fmtCompacto = new Intl.NumberFormat('es-CO', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

export interface LeyendaCalorProps {
  /** Valores del choropleth (código → total) de donde se derivan min y máx. */
  valores: Map<string, number>;
  /** Etiqueta de la magnitud representada (por defecto "Votos"). */
  etiqueta?: string;
}

/**
 * Convenciones del mapa de calor electoral. La barra reproduce exactamente los
 * extremos del gradiente que `MapaBaseInner` pinta en los polígonos (light
 * gris-azul → navy brand; dark navy profundo → sky brand). Como el relleno se
 * reparte por percentil, la barra comunica "menos → más" entre territorios;
 * los números en los extremos son el mínimo y el máximo reales.
 *
 * Se posiciona `absolute` respecto al `.map-wrapper` contenedor (esquina
 * inferior izquierda, sin chocar con el botón "Volver" que va arriba a la
 * derecha).
 */
export function LeyendaCalor({ valores, etiqueta = 'Votos' }: LeyendaCalorProps) {
  const isDark = useResolvedTheme() === 'dark';

  if (valores.size === 0) return null;
  let min = Number.POSITIVE_INFINITY;
  let max = 0;
  for (const v of valores.values()) {
    if (v < min) min = v;
    if (v > max) max = v;
  }
  if (!Number.isFinite(min)) min = 0;
  // Sin variación (un solo territorio o todos iguales) la barra no aporta.
  if (max === min) return null;

  const gradiente = isDark
    ? 'linear-gradient(to right, rgb(56,68,102), rgb(129,183,230))'
    : 'linear-gradient(to right, rgb(226,230,240), rgb(49,63,105))';

  return (
    <div className="absolute bottom-3 left-3 z-[400] flex items-center gap-2 rounded-lg border border-border bg-surface/95 px-2.5 py-1.5 text-[11px] shadow-soft backdrop-blur">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground-muted">
        {etiqueta}
      </span>
      <span className="num-tabular text-foreground-muted">{fmtCompacto.format(min)}</span>
      <span
        className="h-2 w-24 rounded-full border border-border sm:w-32"
        style={{ background: gradiente }}
        aria-hidden
      />
      <span className="num-tabular text-foreground-muted">{fmtCompacto.format(max)}</span>
    </div>
  );
}
