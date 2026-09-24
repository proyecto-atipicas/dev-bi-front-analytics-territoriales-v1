'use client';

import { EmptyState } from '@/shared/ui/components/empty-state';
import { Skeleton } from '@/shared/ui/components/skeleton';
import { useRankingPartidos, useResumenElectoral } from '../../application/hooks';
import { formatearPorcentaje } from '@/shared/ui/utils/formatear-porcentaje';

const fmt = new Intl.NumberFormat('es-CO');

export interface TablaRankingPartidosProps {
  /** Cantidad máxima de filas a mostrar. Default 10. */
  limite?: number;
}

/**
 * Tabla compacta con ranking de partidos: votos, % sobre el total y
 * barra horizontal de participación. Pensada para usarse adentro de un Card.
 */
export function TablaRankingPartidos({ limite = 10 }: TablaRankingPartidosProps) {
  const { data: partidos, isLoading } = useRankingPartidos(limite);
  const { data: resumen } = useResumenElectoral();
  const totalVotos = resumen?.totalVotos ?? 0;

  if (isLoading) {
    return (
      <div className="p-4">
        <Skeleton className="h-56 w-full" />
      </div>
    );
  }

  if (!partidos || partidos.length === 0) {
    return (
      <div className="p-4">
        <EmptyState
          size="sm"
          description="Sin datos de partidos para los filtros aplicados."
        />
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead className="border-b border-border bg-surface-elevated/60">
          <tr className="text-left label-eyebrow">
            <th className="px-4 py-2.5">Partido</th>
            <th className="px-3 py-2.5 text-right">Votos</th>
            <th className="px-3 py-2.5 text-right">%</th>
            <th className="hidden px-4 py-2.5 min-w-[8rem] sm:table-cell">Participación</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {partidos.map((p) => {
            const pct =
              totalVotos > 0 ? (p.totalVotos / totalVotos) * 100 : 0;
            return (
              <tr
                key={p.codigoPartido}
                className="transition-colors hover:bg-surface-elevated/60"
              >
                {/* La columna del nombre toma el ancho sobrante y admite dos
                    líneas: los nombres oficiales son largos y cortarlos a una
                    sola línea escondía justo la parte que los distingue. */}
                <td className="w-full max-w-0 px-4 py-2.5 font-medium text-foreground">
                  <span className="line-clamp-2 break-words" title={p.nombrePartido}>
                    {p.nombrePartido}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-right num-tabular text-foreground">
                  {fmt.format(p.totalVotos)}
                </td>
                <td className="px-3 py-2.5 text-right num-tabular text-foreground-muted">
                  {formatearPorcentaje(pct, 2)}
                </td>
                <td className="hidden px-4 py-2.5 sm:table-cell">
                  <div
                    className="h-1.5 w-full overflow-hidden rounded-full bg-surface-elevated"
                    role="progressbar"
                    aria-valuenow={Number(pct.toFixed(2))}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <div
                      className="h-full rounded-full bg-brand transition-all duration-500"
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
