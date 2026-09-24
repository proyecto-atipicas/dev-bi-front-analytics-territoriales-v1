'use client';

import { EmptyState } from '@/shared/ui/components/empty-state';
import { RadarChart } from '@/shared/ui/components/radar-chart';
import { Skeleton } from '@/shared/ui/components/skeleton';
import { useMemo } from 'react';
import { useRadarPoblacional } from '../../application/hooks';
import { FiltroPoblacional, RadarPoblacionalPunto } from '../../domain/entities';

export interface GraficaRadarPoblacionalProps {
  filtro: FiltroPoblacional;
}

function formatPeriodoCorto(anio: number | null, mes: number | null): string | null {
  if (anio == null) return null;
  return mes ? `${anio}-${String(mes).padStart(2, '0')}` : String(anio);
}


function compararPeriodoDesc(
  a: { anio: number | null; mes: number | null },
  b: { anio: number | null; mes: number | null },
): number {
  // Orden: año DESC, luego mes DESC. Los nulls quedan al final.
  const aA = a.anio ?? Number.NEGATIVE_INFINITY;
  const bA = b.anio ?? Number.NEGATIVE_INFINITY;
  if (aA !== bA) return bA - aA;
  const aM = a.mes ?? Number.NEGATIVE_INFINITY;
  const bM = b.mes ?? Number.NEGATIVE_INFINITY;
  return bM - aM;
}

export function GraficaRadarPoblacional({ filtro }: GraficaRadarPoblacionalProps) {
  const activo = !!filtro.referencia;

  const { data: radar, isLoading } = useRadarPoblacional(filtro, { enabled: activo });

  // Defensa adicional contra mezcla de periodos: aunque el backend ya filtra
  // al último (anio, mes), se vuelve a ordenar por año y mes en el cliente,
  // se identifica el último periodo válido y sólo se conservan los puntos
  // de ese mismo periodo. Luego se ordenan alfabéticamente por criterio
  // para que el polígono sea estable entre renders.
  const { puntos, periodo } = useMemo<{
    puntos: RadarPoblacionalPunto[];
    periodo: string | null;
  }>(() => {
    if (!radar || radar.length === 0) return { puntos: [], periodo: null };

    const validos = radar.filter(
      (r) => r && r.criterio != null && Number.isFinite(r.valor),
    );
    if (validos.length === 0) return { puntos: [], periodo: null };

    const ordenadosPorPeriodo = [...validos].sort(compararPeriodoDesc);
    const ultimoPeriodo = {
      anio: ordenadosPorPeriodo[0].anio,
      mes: ordenadosPorPeriodo[0].mes,
    };

    const enUltimoPeriodo = ordenadosPorPeriodo.filter(
      (r) => r.anio === ultimoPeriodo.anio && r.mes === ultimoPeriodo.mes,
    );

    const ordenadosPorCriterio = [...enUltimoPeriodo].sort((a, b) =>
      a.criterio.localeCompare(b.criterio),
    );

    return {
      puntos: ordenadosPorCriterio,
      periodo: formatPeriodoCorto(ultimoPeriodo.anio, ultimoPeriodo.mes),
    };
  }, [radar]);

  if (!activo) {
    return (
      <EmptyState
        size="md"
        description="Seleccione una referencia para ver la composición por criterio."
      />
    );
  }

  if (isLoading) return <Skeleton className="h-72 w-full" />;

  if (puntos.length === 0) {
    return <EmptyState size="md" description="No hay datos para el último período." />;
  }

  if (puntos.length < 2) {
    return (
      <EmptyState
        size="md"
        description={`Solo hay 1 criterio con datos en el último período; seleccione al menos 2 criterios para construir el radar.`}
      />
    );
  }

  // El radar reparte las etiquetas largas en varias líneas.
  const labels = puntos.map((r) => r.criterio);
  const datasets = [
    {
      label: filtro.referencia ?? 'Referencia',
      data: puntos.map((r) => r.valor),
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-foreground-muted">
        {periodo ? (
          <span>
            Último período disponible:{' '}
            <span className="font-semibold text-foreground">{periodo}</span>
          </span>
        ) : (
          <span />
        )}
        <span>
          {puntos.length} criterio{puntos.length === 1 ? '' : 's'} graficado
          {puntos.length === 1 ? '' : 's'}
        </span>
      </div>
      <div className="h-72 sm:h-80">
        <RadarChart labels={labels} datasets={datasets} />
      </div>
    </div>
  );
}
