'use client';

import { EmptyState } from '@/shared/ui/components/empty-state';
import { Skeleton } from '@/shared/ui/components/skeleton';
import { cn } from '@/shared/ui/utils/cn';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useSeriePoblacional } from '../../application/hooks';
import { FiltroPoblacional, SeriePoblacionalPunto } from '../../domain/entities';

export interface TablaDatosPoblacionalProps {
  filtro: FiltroPoblacional;
}

const fmt = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 });
const REGISTROS_POR_PAGINA = 20;

function formatPeriodo(anio: number, mes: number | null): string {
  if (!mes) return String(anio);
  return `${anio}-${String(mes).padStart(2, '0')}`;
}

export function TablaDatosPoblacional({ filtro }: TablaDatosPoblacionalProps) {
  const activo = !!filtro.referencia;

  const { data, isLoading } = useSeriePoblacional(filtro, { enabled: activo });

  const filas = useMemo(() => ordenar(data ?? []), [data]);

  const [pagina, setPagina] = useState(1);

  const totalPaginas = Math.max(1, Math.ceil(filas.length / REGISTROS_POR_PAGINA));

  useEffect(() => {
    setPagina(1);
  }, [filtro.dimension, filtro.fuente, filtro.referencia, filtro.criterios]);

  useEffect(() => {
    if (pagina > totalPaginas) setPagina(totalPaginas);
  }, [pagina, totalPaginas]);

  const filasPagina = useMemo(() => {
    const inicio = (pagina - 1) * REGISTROS_POR_PAGINA;
    return filas.slice(inicio, inicio + REGISTROS_POR_PAGINA);
  }, [filas, pagina]);

  if (!activo) {
    return (
      <div className="p-4">
        <EmptyState
          size="sm"
          description="Seleccione una referencia para visualizar los datos."
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-4">
        <Skeleton className="h-[420px] w-full" />
      </div>
    );
  }

  if (filas.length === 0) {
    return (
      <div className="p-4">
        <EmptyState size="sm" description="Sin datos para la combinación seleccionada." />
      </div>
    );
  }

  const desde = (pagina - 1) * REGISTROS_POR_PAGINA + 1;
  const hasta = Math.min(pagina * REGISTROS_POR_PAGINA, filas.length);

  return (
    <div className="flex flex-col">
      <div className="overflow-auto">
        <table className="w-full text-xs">
          <thead className="border-b border-border bg-surface-elevated/95">
            <tr className="text-left label-eyebrow">
              <th className="px-3 py-2.5">Período</th>
              <th className="px-3 py-2.5">Criterio</th>
              <th className="px-3 py-2.5 text-right">Valor</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filasPagina.map((p, i) => (
              <tr
                key={`${p.anio}-${p.mes ?? '_'}-${p.criterio ?? '_'}-${i}`}
                className="transition-colors hover:bg-surface-elevated/60"
              >
                <td className="whitespace-nowrap px-3 py-2 num-tabular text-foreground">
                  {formatPeriodo(p.anio, p.mes)}
                </td>
                <td className="w-full max-w-0 px-3 py-2 text-foreground">
                  {p.criterio ? (
                    <span className="line-clamp-2 break-words" title={p.criterio}>
                      {p.criterio}
                    </span>
                  ) : (
                    <span className="text-foreground-subtle">—</span>
                  )}
                </td>
                <td className="px-3 py-2 text-right num-tabular text-foreground">
                  {fmt.format(p.valor)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-3 py-2 text-[11px] text-foreground-muted">
        <span>
          Mostrando{' '}
          <span className="font-semibold text-foreground">
            {desde}–{hasta}
          </span>{' '}
          de <span className="font-semibold text-foreground">{filas.length}</span>{' '}
          registros
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setPagina((p) => Math.max(1, p - 1))}
            disabled={pagina === 1}
            aria-label="Página anterior"
            className={cn(
              'inline-flex h-7 w-7 items-center justify-center rounded-md border border-border bg-surface text-foreground transition-colors',
              'hover:border-brand/40 hover:text-brand',
              'disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-border disabled:hover:text-foreground',
            )}
          >
            <ChevronLeft size={14} />
          </button>
          <span className="px-2 num-tabular">
            <span className="font-semibold text-foreground">{pagina}</span>
            <span className="text-foreground-subtle"> / {totalPaginas}</span>
          </span>
          <button
            type="button"
            onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
            disabled={pagina === totalPaginas}
            aria-label="Página siguiente"
            className={cn(
              'inline-flex h-7 w-7 items-center justify-center rounded-md border border-border bg-surface text-foreground transition-colors',
              'hover:border-brand/40 hover:text-brand',
              'disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-border disabled:hover:text-foreground',
            )}
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

function ordenar(serie: SeriePoblacionalPunto[]): SeriePoblacionalPunto[] {
  return [...serie].sort((a, b) => {
    if (b.anio !== a.anio) return b.anio - a.anio;
    const mb = b.mes ?? -1;
    const ma = a.mes ?? -1;
    if (mb !== ma) return mb - ma;
    // Dentro de cada medición, de mayor a menor valor (como las barras).
    return b.valor - a.valor || (a.criterio ?? '').localeCompare(b.criterio ?? '');
  });
}
