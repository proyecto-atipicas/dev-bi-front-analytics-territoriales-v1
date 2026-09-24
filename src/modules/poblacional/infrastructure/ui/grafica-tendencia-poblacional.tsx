'use client';

import { EmptyState } from '@/shared/ui/components/empty-state';
import { LineChart } from '@/shared/ui/components/line-chart';
import { Skeleton } from '@/shared/ui/components/skeleton';
import { useMemo } from 'react';
import { useSeriePoblacional } from '../../application/hooks';
import { FiltroPoblacional, SeriePoblacionalPunto } from '../../domain/entities';

export interface GraficaTendenciaPoblacionalProps {
  filtro: FiltroPoblacional;
}

function formatPeriodo(anio: number, mes: number | null): string {
  if (!mes) return String(anio);
  return `${anio}-${String(mes).padStart(2, '0')}`;
}

export function GraficaTendenciaPoblacional({
  filtro,
}: GraficaTendenciaPoblacionalProps) {
  const tendenciaActiva = !!filtro.referencia;

  const { data: serie, isLoading } = useSeriePoblacional(filtro, {
    enabled: tendenciaActiva,
  });

  const datos = useMemo(() => agruparPorCriterio(serie ?? []), [serie]);

  if (!tendenciaActiva) {
    return (
      <EmptyState
        size="md"
        description="Seleccione una referencia para visualizar la tendencia."
      />
    );
  }

  if (isLoading) return <Skeleton className="h-72 w-full" />;

  if (datos.labels.length === 0) {
    return <EmptyState size="md" description="Sin datos históricos para esta combinación." />;
  }

  // Con una sola medición una línea no tiene recorrido: se explica en lugar
  // de pintar puntos apilados sobre el eje.
  if (datos.labels.length === 1) {
    return (
      <EmptyState
        size="md"
        tone="info"
        title="Una sola medición"
        description={`Esta referencia sólo tiene datos de ${datos.labels[0]}. La tendencia aparecerá cuando haya dos o más mediciones; el resultado por criterio muestra la actual.`}
      />
    );
  }

  return (
    <div className="space-y-2">
      {datos.ocultos > 0 && (
        <p className="text-xs text-foreground-muted">
          Se muestran los {datos.datasets.length} criterios con mayor valor en la última
          medición; los {datos.ocultos} restantes están en la tabla de datos.
        </p>
      )}
      <LineChart labels={datos.labels} datasets={datos.datasets} claseAlto="h-72 sm:h-80" />
    </div>
  );
}

/** Más de ocho líneas dejan de distinguirse entre sí. */
const MAX_LINEAS = 8;

function agruparPorCriterio(serie: SeriePoblacionalPunto[]): {
  labels: string[];
  datasets: { label: string; data: (number | null)[] }[];
  ocultos: number;
} {
  if (serie.length === 0) return { labels: [], datasets: [], ocultos: 0 };

  const labels = Array.from(
    new Set(serie.map((p) => formatPeriodo(p.anio, p.mes))),
  ).sort();
  const map = new Map<string, Map<string, number>>();
  serie.forEach((p) => {
    const c = p.criterio ?? 'Sin criterio';
    const k = formatPeriodo(p.anio, p.mes);
    if (!map.has(c)) map.set(c, new Map());
    map.get(c)!.set(k, p.valor);
  });
  // Se priorizan los criterios con mayor valor en la última medición (antes
  // se tomaban los 8 primeros en orden de llegada, que era arbitrario).
  const ultimo = labels[labels.length - 1];
  const cats = Array.from(map.keys()).sort(
    (a, b) => (map.get(b)?.get(ultimo) ?? -Infinity) - (map.get(a)?.get(ultimo) ?? -Infinity),
  );
  return {
    labels,
    datasets: cats.slice(0, MAX_LINEAS).map((c) => ({
      label: c,
      data: labels.map((k) => map.get(c)?.get(k) ?? null),
    })),
    ocultos: Math.max(0, cats.length - MAX_LINEAS),
  };
}
