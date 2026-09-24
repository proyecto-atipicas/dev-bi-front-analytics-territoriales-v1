'use client';

import { EmptyState } from '@/shared/ui/components/empty-state';
import { Skeleton } from '@/shared/ui/components/skeleton';
import { cn } from '@/shared/ui/utils/cn';
import { formatearValor } from '@/shared/ui/utils/formatear-valor';
import {
  ArrowDownRight,
  ArrowUpRight,
  Award,
  Info,
  Minus,
  TrendingUp,
} from 'lucide-react';
import { useMemo } from 'react';
import { useResumenDepartamentoSocioeconomico } from '../../application/hooks';
import {
  FiltroSocioeconomico,
  ResumenDepartamentoDimension,
} from '../../domain/entities';
import { badgeNivelRiesgoClass, configNivelRiesgo } from './calificacion-utils';

const fmtPct = new Intl.NumberFormat('es-CO', {
  maximumFractionDigits: 1,
  minimumFractionDigits: 1,
});

export interface DetalleDepartamentoSocioProps {
  /** Filtro completo. Debe traer codigoDepartamento. */
  filtro: FiltroSocioeconomico;
  /** Dimensión actualmente activa (para resaltarla y construir KPIs). */
  dimensionActiva: string | null;
}

export function DetalleDepartamentoSocio({
  filtro,
  dimensionActiva,
}: DetalleDepartamentoSocioProps) {
  // Para la tabla de "otros indicadores" pedimos el resumen completo (todas
  // las dimensiones de la fuente, en una sola query con window functions).
  // Filtro sin `dimension` para no acotar el snapshot.
  const filtroResumen: FiltroSocioeconomico = {
    ...filtro,
    dimension: null,
  };
  const { data, isLoading, isError } = useResumenDepartamentoSocioeconomico(
    filtroResumen,
    { enabled: !!filtro.codigoDepartamento },
  );

  const principal = useMemo<ResumenDepartamentoDimension | null>(() => {
    if (!data || data.length === 0) return null;
    if (dimensionActiva) {
      const m = data.find((d) => d.dimension === dimensionActiva);
      if (m) return m;
    }
    return data[0];
  }, [data, dimensionActiva]);

  const otrasDimensiones = useMemo(() => {
    if (!data) return [];
    return data.filter((d) => !principal || d.dimension !== principal.dimension);
  }, [data, principal]);

  if (!filtro.codigoDepartamento) {
    return (
      <div className="p-4">
        <EmptyState
          size="sm"
          description="Seleccione un departamento para ver el detalle."
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-3 p-4">
        <Skeleton className="h-16 w-full" />
        <div className="grid grid-cols-2 gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4">
        <EmptyState
          tone="danger"
          size="sm"
          description="Error al cargar el detalle del departamento."
        />
      </div>
    );
  }

  if (!data || data.length === 0 || !principal) {
    return (
      <div className="p-4">
        <EmptyState
          size="sm"
          description="Sin datos disponibles para este departamento."
        />
      </div>
    );
  }

  const cfg = configNivelRiesgo(principal.nivelRiesgo);
  const unidad = principal.unidadMedida ?? null;
  const fmt = (v: number) => formatearValor(v, unidad);

  // KPIs comparativos derivados.
  const vsPromedio =
    principal.promedioNacional > 0
      ? ((principal.valor - principal.promedioNacional) /
          principal.promedioNacional) *
        100
      : 0;
  const vsPeriodoAnterior =
    principal.valorPeriodoAnterior != null && principal.valorPeriodoAnterior > 0
      ? ((principal.valor - principal.valorPeriodoAnterior) /
          principal.valorPeriodoAnterior) *
        100
      : null;
  const percentil =
    principal.totalDepartamentos > 0
      ? ((principal.totalDepartamentos - principal.posicion + 1) /
          principal.totalDepartamentos) *
        100
      : 0;

  return (
    <div className="space-y-4 p-4">
      {/* Header — depto + dimensión activa + período + nivel de riesgo */}
      <header
        className={cn(
          'flex flex-wrap items-start justify-between gap-2.5 rounded-xl border px-3 py-3 sm:gap-3 sm:px-4',
          'border-brand/30 bg-brand-muted/40',
        )}
      >
        <div className="min-w-0 flex-1">
          <p className="label-eyebrow text-brand">Detalle por departamento</p>
          <h3 className="mt-0.5 break-words text-sm font-semibold leading-snug text-foreground sm:truncate sm:text-base">
            {principal.departamento}
          </h3>
          <p className="mt-0.5 line-clamp-2 break-words text-[11px] text-foreground-muted sm:line-clamp-none sm:truncate">
            {principal.dimension} · período{' '}
            <span className="font-semibold text-foreground">{principal.periodo}</span>
          </p>
        </div>
        {principal.nivelRiesgo && (
          <span className={cn('shrink-0', badgeNivelRiesgoClass(principal.nivelRiesgo))}>
            {cfg.label}
          </span>
        )}
      </header>

      {/* KPIs comparativos */}
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        <KpiBlock
          label="Valor"
          value={fmt(principal.valor)}
          hint={principal.dimension}
        />
        <KpiBlock
          label="Posición nacional"
          value={`#${principal.posicion}`}
          hint={`de ${principal.totalDepartamentos} · top ${fmtPct.format(percentil)}%`}
          icon={Award}
          tone={
            percentil >= 75 ? 'success' : percentil <= 25 ? 'danger' : 'neutral'
          }
        />
        <KpiBlock
          label="vs Promedio nacional"
          value={`${vsPromedio >= 0 ? '+' : ''}${fmtPct.format(vsPromedio)}%`}
          hint={`Promedio: ${fmt(principal.promedioNacional)}`}
          icon={TrendingUp}
          tone={vsPromedio > 5 ? 'danger' : vsPromedio < -5 ? 'success' : 'neutral'}
        />
        <KpiBlock
          label={
            principal.periodoAnterior
              ? `vs Período ${principal.periodoAnterior}`
              : 'vs Período anterior'
          }
          value={
            vsPeriodoAnterior != null
              ? `${vsPeriodoAnterior >= 0 ? '+' : ''}${fmtPct.format(vsPeriodoAnterior)}%`
              : '—'
          }
          hint={
            principal.valorPeriodoAnterior != null
              ? `Antes: ${fmt(principal.valorPeriodoAnterior)}`
              : 'Sin dato anterior'
          }
          tendencia={
            vsPeriodoAnterior == null
              ? 'flat'
              : vsPeriodoAnterior > 0
                ? 'up'
                : vsPeriodoAnterior < 0
                  ? 'down'
                  : 'flat'
          }
          tone="neutral"
        />
      </div>

      {/* Observación del último reporte del departamento. */}
      {principal.observacion && (
        <div className="flex items-start gap-2 rounded-lg border border-info/20 bg-info-muted/30 px-3 py-2.5 text-xs leading-snug text-foreground-muted">
          <Info size={13} className="mt-0.5 shrink-0 text-info" />
          <div className="min-w-0 break-words">
            <p className="mb-0.5 text-xs font-medium text-info">
              Observación · período {principal.periodo}
            </p>
            <p>{principal.observacion}</p>
          </div>
        </div>
      )}

      {/* Otros indicadores (resto de dimensiones de la fuente) */}
      {otrasDimensiones.length > 0 && (
        <div className="rounded-xl border border-border">
          <div className="flex items-center justify-between border-b border-border bg-surface-elevated/40 px-3 py-2">
            <p className="label-eyebrow">Otros indicadores</p>
            <p className="text-[11px] text-foreground-subtle">
              {otrasDimensiones.length}{' '}
              {otrasDimensiones.length === 1 ? 'dimensión' : 'dimensiones'}
            </p>
          </div>
          <div className="max-h-[18rem] overflow-y-auto">
            <ul className="divide-y divide-border">
              {otrasDimensiones.map((c) => (
                <FilaIndicador key={c.dimension} indicador={c} />
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

interface KpiBlockProps {
  label: string;
  value: string;
  hint?: string;
  icon?: typeof Award;
  tone?: 'neutral' | 'success' | 'danger';
  tendencia?: 'up' | 'down' | 'flat';
}

function KpiBlock({
  label,
  value,
  hint,
  icon: Icon,
  tone = 'neutral',
  tendencia,
}: KpiBlockProps) {
  const TendenciaIcon =
    tendencia === 'up'
      ? ArrowUpRight
      : tendencia === 'down'
        ? ArrowDownRight
        : tendencia === 'flat'
          ? Minus
          : null;

  return (
    <div className="flex min-w-0 flex-col rounded-lg border border-border bg-surface px-3 py-2.5">
      <div className="flex items-center gap-1.5">
        {Icon && <Icon size={12} className="shrink-0 text-foreground-subtle" />}
        <p className="truncate text-xs font-medium text-foreground-muted">
          {label}
        </p>
      </div>
      <p
        className={cn(
          'mt-1 truncate text-lg font-semibold tracking-tight num-tabular',
          tone === 'success' && 'text-success',
          tone === 'danger' && 'text-danger',
          tone === 'neutral' && 'text-foreground',
        )}
      >
        <span className="inline-flex items-center gap-1">
          {value}
          {TendenciaIcon && (
            <TendenciaIcon
              size={14}
              className={cn(
                tendencia === 'up' && 'text-danger',
                tendencia === 'down' && 'text-success',
                tendencia === 'flat' && 'text-foreground-subtle',
              )}
            />
          )}
        </span>
      </p>
      {hint && (
        <p className="mt-0.5 truncate text-[11px] text-foreground-muted">
          {hint}
        </p>
      )}
    </div>
  );
}

function FilaIndicador({ indicador }: { indicador: ResumenDepartamentoDimension }) {
  const cfg = configNivelRiesgo(indicador.nivelRiesgo);
  const valorFmt = formatearValor(indicador.valor, indicador.unidadMedida ?? null);
  const percentil =
    indicador.totalDepartamentos > 0
      ? ((indicador.totalDepartamentos - indicador.posicion + 1) /
          indicador.totalDepartamentos) *
        100
      : 0;
  const cotaVisual = Math.max(indicador.promedioNacional * 2, indicador.valor);
  const ratioBar = cotaVisual > 0 ? (indicador.valor / cotaVisual) * 100 : 0;

  return (
    <li className="flex items-center gap-3 px-3 py-2 transition-colors hover:bg-surface-elevated/40">
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span
            className="block min-w-0 flex-1 truncate text-xs font-medium text-foreground"
            title={indicador.dimension}
          >
            {indicador.dimension}
          </span>
          <span className="shrink-0 num-tabular text-xs font-semibold text-foreground">
            {valorFmt}
          </span>
        </div>
        <div className="mt-1 flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-elevated">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, Math.max(2, ratioBar))}%`,
                backgroundColor: cfg.color,
              }}
            />
          </div>
          <span className="shrink-0 text-[10px] font-medium num-tabular text-foreground-subtle">
            #{indicador.posicion}/{indicador.totalDepartamentos}
          </span>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          {indicador.nivelRiesgo && (
            <span className={badgeNivelRiesgoClass(indicador.nivelRiesgo)}>
              {cfg.label}
            </span>
          )}
          <span className="text-[10px] text-foreground-subtle">
            top {fmtPct.format(percentil)}% · período {indicador.periodo}
          </span>
        </div>
      </div>
    </li>
  );
}
