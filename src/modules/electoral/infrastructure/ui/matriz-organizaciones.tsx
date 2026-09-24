'use client';

import {
  useRankingCandidatosFiltro,
  useRankingPartidos,
  useResumenElectoral,
} from '@/modules/electoral/application/hooks';
import { useFiltrosGlobales } from '@/shared/application/stores/filtros-globales.store';
import { EmptyState } from '@/shared/ui/components/empty-state';
import { Skeleton } from '@/shared/ui/components/skeleton';
import { cn } from '@/shared/ui/utils/cn';
import { ChevronLeft, ChevronRight, UserCheck } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { formatearNombrePersona } from '@/shared/ui/utils/formatear-territorio';
import { formatearPorcentaje } from '@/shared/ui/utils/formatear-porcentaje';

const fmt = new Intl.NumberFormat('es-CO');
const PAGE_SIZE = 10;
// Si las filas apenas superan una página (p. ej. 11 de 10), se muestran
// todas: una segunda página con una o dos filas sólo obliga a hacer clic.
const porPaginaPara = (total: number) =>
  total <= Math.ceil(PAGE_SIZE * 1.5) ? Math.max(total, 1) : PAGE_SIZE;

export interface MatrizOrganizacionesProps {
  /** Cantidad de partidos a listar. Default 25. */
  limitePartidos?: number;
  /** Cantidad de candidatos por partido. Default 100. */
  limiteCandidatosPorPartido?: number;
}

/**
 * Matriz de información agrupada por organización (partido) con drill-down a
 * los candidatos asociados. Muestra total de votos y % de participación al
 * nivel correspondiente:
 *   - Partido     → % del total electoral filtrado
 *   - Candidato   → % del total del partido al que pertenece
 */
export function MatrizOrganizaciones({
  limitePartidos = 25,
  limiteCandidatosPorPartido = 100,
}: MatrizOrganizacionesProps) {
  const { data: partidos, isLoading, isError } = useRankingPartidos(limitePartidos);
  const { data: resumen } = useResumenElectoral();
  const totalVotos = resumen?.totalVotos ?? 0;

  const [expandidos, setExpandidos] = useState<Set<string>>(new Set());

  const toggle = (codigo: string) => {
    setExpandidos((prev) => {
      const next = new Set(prev);
      if (next.has(codigo)) next.delete(codigo);
      else next.add(codigo);
      return next;
    });
  };

  const filas = useMemo(
    () =>
      [...(partidos ?? [])].sort((a, b) => b.totalVotos - a.totalVotos),
    [partidos],
  );

  const porPagina = porPaginaPara(filas.length);
  const totalPaginas = Math.max(1, Math.ceil(filas.length / porPagina));
  const [pagina, setPagina] = useState(1);

  // Si cambian los filtros (cambia la lista), volvemos a la pág. 1.
  useEffect(() => {
    setPagina(1);
  }, [filas]);

  const paginaActual = Math.min(pagina, totalPaginas);
  const inicio = (paginaActual - 1) * porPagina;
  const fin = Math.min(inicio + porPagina, filas.length);
  const filasVisibles = useMemo(() => filas.slice(inicio, fin), [filas, inicio, fin]);

  if (isLoading) {
    return (
      <div className="p-4">
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4">
        <EmptyState
          tone="danger"
          size="sm"
          description="Error al cargar la matriz de organizaciones."
        />
      </div>
    );
  }

  if (filas.length === 0) {
    return (
      <div className="p-4">
        <EmptyState size="sm" description="Sin organizaciones para los filtros aplicados." />
      </div>
    );
  }

  return (
    <div>
      {/* Sin alto máximo: la paginación ya limita las filas y un scroll
          interno escondía la última fila bajo el pie de la tabla. */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 border-b border-border bg-surface-elevated/95 backdrop-blur text-left label-eyebrow">
            <tr>
              <th className="w-9 px-3 py-2.5"></th>
              <th className="px-3 py-2.5">Organización / Candidato</th>
              <th className="px-3 py-2.5 text-right">Votos</th>
              <th className="px-3 py-2.5 text-right">%</th>
              <th className="hidden px-3 py-2.5 min-w-[8rem] sm:table-cell">Participación</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filasVisibles.map((p) => {
              const pct = totalVotos > 0 ? (p.totalVotos / totalVotos) * 100 : 0;
              const expanded = expandidos.has(p.codigoPartido);
              return (
                <FilaPartido
                  key={p.codigoPartido}
                  codigoPartido={p.codigoPartido}
                  nombrePartido={p.nombrePartido}
                  votosPartido={p.totalVotos}
                  totalCandidatos={p.totalCandidatos}
                  pct={pct}
                  expanded={expanded}
                  onToggle={() => toggle(p.codigoPartido)}
                  limiteCandidatos={limiteCandidatosPorPartido}
                />
              );
            })}
          </tbody>
        </table>
      </div>

      <Paginacion
        pagina={paginaActual}
        totalPaginas={totalPaginas}
        inicio={inicio + 1}
        fin={fin}
        total={filas.length}
        onCambiarPagina={setPagina}
      />
    </div>
  );
}

interface PaginacionProps {
  pagina: number;
  totalPaginas: number;
  inicio: number;
  fin: number;
  total: number;
  onCambiarPagina: (pagina: number) => void;
}

function Paginacion({
  pagina,
  totalPaginas,
  inicio,
  fin,
  total,
  onCambiarPagina,
}: PaginacionProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border bg-surface-elevated/40 px-4 py-2.5 text-xs text-foreground-muted">
      <span className="num-tabular">
        Mostrando <span className="font-semibold text-foreground">{inicio}</span>–
        <span className="font-semibold text-foreground">{fin}</span> de{' '}
        <span className="font-semibold text-foreground">{total}</span>
      </span>
      <div className="flex items-center gap-1.5">
        <BotonPagina
          disabled={pagina <= 1}
          onClick={() => onCambiarPagina(pagina - 1)}
          aria-label="Página anterior"
        >
          <ChevronLeft size={14} />
        </BotonPagina>
        <span className="px-1.5 num-tabular">
          <span className="font-semibold text-foreground">{pagina}</span> /{' '}
          {totalPaginas}
        </span>
        <BotonPagina
          disabled={pagina >= totalPaginas}
          onClick={() => onCambiarPagina(pagina + 1)}
          aria-label="Página siguiente"
        >
          <ChevronRight size={14} />
        </BotonPagina>
      </div>
    </div>
  );
}

function BotonPagina({
  children,
  disabled,
  onClick,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex h-7 w-7 items-center justify-center rounded-md border border-border bg-surface text-foreground-muted transition-colors',
        'hover:border-brand/40 hover:bg-brand-muted/30 hover:text-brand',
        'disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-border disabled:hover:bg-surface disabled:hover:text-foreground-muted',
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Fila partido + drill-down candidatos
// ─────────────────────────────────────────────────────────────────────

interface FilaPartidoProps {
  codigoPartido: string;
  nombrePartido: string;
  votosPartido: number;
  totalCandidatos: number;
  pct: number;
  expanded: boolean;
  onToggle: () => void;
  limiteCandidatos: number;
}

function FilaPartido({
  codigoPartido,
  nombrePartido,
  votosPartido,
  totalCandidatos,
  pct,
  expanded,
  onToggle,
  limiteCandidatos,
}: FilaPartidoProps) {
  return (
    <>
      <tr
        className={cn(
          'cursor-pointer transition-colors hover:bg-surface-elevated/60',
          expanded && 'bg-brand-muted/30',
        )}
        onClick={onToggle}
      >
        <td className="px-3 py-2.5">
          <button
            type="button"
            aria-label={expanded ? 'Colapsar' : 'Expandir'}
            aria-expanded={expanded}
            className="flex h-6 w-6 items-center justify-center rounded-md text-foreground-muted transition-colors hover:bg-surface-elevated hover:text-foreground"
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
          >
            <ChevronRight
              size={14}
              className={cn('transition-transform duration-200', expanded && 'rotate-90')}
            />
          </button>
        </td>
        <td className="w-full max-w-0 px-3 py-2.5">
          {/* En móvil el conteo de candidatos baja bajo el nombre para no
              robarle ancho y partir las palabras. */}
          <div className="flex min-w-0 flex-col items-start gap-1 sm:flex-row sm:items-center sm:gap-2">
            <span className="line-clamp-2 font-medium text-foreground" title={nombrePartido}>
              {nombrePartido}
            </span>
            <span className="num-tabular shrink-0 rounded-full bg-surface-elevated px-1.5 py-0.5 text-[10px] font-semibold text-foreground-muted">
              {fmt.format(totalCandidatos)} cand.
            </span>
          </div>
        </td>
        <td className="px-3 py-2.5 text-right num-tabular font-semibold text-foreground">
          {fmt.format(votosPartido)}
        </td>
        <td className="px-3 py-2.5 text-right num-tabular text-foreground-muted">
          {formatearPorcentaje(pct, 2)}
        </td>
        <td className="hidden px-3 py-2.5 sm:table-cell">
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
      {expanded && (
        <CandidatosDePartido
          codigoPartido={codigoPartido}
          votosPartido={votosPartido}
          limite={limiteCandidatos}
        />
      )}
    </>
  );
}

interface CandidatosDePartidoProps {
  codigoPartido: string;
  votosPartido: number;
  limite: number;
}

function CandidatosDePartido({
  codigoPartido,
  votosPartido,
  limite,
}: CandidatosDePartidoProps) {
  const codigoCorporacion = useFiltrosGlobales((s) => s.codigoCorporacion);
  const codigoDepartamento = useFiltrosGlobales((s) => s.codigoDepartamento);
  const codigoMunicipio = useFiltrosGlobales((s) => s.codigoMunicipio);

  const { data, isLoading, isError } = useRankingCandidatosFiltro(
    {
      codigoCorporacion,
      codigoDepartamento,
      codigoMunicipio,
      codigoPartido,
    },
    limite,
  );

  if (isLoading) {
    return (
      <tr>
        <td colSpan={5} className="bg-surface-sunken/40 px-12 py-3">
          <Skeleton className="h-6 w-full" />
        </td>
      </tr>
    );
  }

  if (isError) {
    return (
      <tr>
        <td colSpan={5} className="bg-surface-sunken/40 px-12 py-3 text-xs text-danger-foreground">
          Error al cargar candidatos del partido.
        </td>
      </tr>
    );
  }

  const candidatos = data ?? [];
  if (candidatos.length === 0) {
    return (
      <tr>
        <td
          colSpan={5}
          className="bg-surface-sunken/40 px-12 py-3 text-xs text-foreground-muted"
        >
          Sin candidatos registrados para este partido en los filtros activos.
        </td>
      </tr>
    );
  }

  return (
    <>
      {candidatos.map((c, idx) => {
        const pct = votosPartido > 0 ? (c.totalVotos / votosPartido) * 100 : 0;
        return (
          <tr
            key={c.codigoCandidato}
            className="bg-surface-sunken/40 text-xs transition-colors hover:bg-surface-elevated/40"
          >
            <td className="px-3 py-2 text-right num-tabular text-foreground-subtle">
              {idx + 1}
            </td>
            <td className="px-3 py-2 pl-8 sm:pl-12">
              <div className="flex min-w-0 items-center gap-2">
                <UserCheck size={12} className="shrink-0 text-foreground-subtle" aria-hidden />
                <span
                  className="block max-w-[9rem] truncate text-foreground sm:max-w-[14rem] md:max-w-[20rem] lg:max-w-[22rem] xl:max-w-[26rem]"
                  title={formatearNombrePersona(c.nombreCandidato)}
                >
                  {formatearNombrePersona(c.nombreCandidato)}
                </span>
              </div>
            </td>
            <td className="px-3 py-2 text-right num-tabular text-foreground">
              {fmt.format(c.totalVotos)}
            </td>
            <td className="px-3 py-2 text-right num-tabular text-foreground-muted">
              {formatearPorcentaje(pct, 2)}
            </td>
            <td className="hidden px-3 py-2 sm:table-cell">
              <div
                className="h-1 w-full overflow-hidden rounded-full bg-surface-elevated"
                role="progressbar"
                aria-valuenow={Number(pct.toFixed(2))}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className="h-full rounded-full bg-info transition-all duration-500"
                  style={{ width: `${Math.min(100, pct)}%` }}
                />
              </div>
            </td>
          </tr>
        );
      })}
    </>
  );
}
