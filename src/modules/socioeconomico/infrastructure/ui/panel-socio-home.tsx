'use client';

import {
  useDimensionesSocioeconomicas,
  useFuentesPublicaciones,
  useIndicadoresPorDepartamentoSocioeconomico,
  useNivelesGeograficosSocioeconomicos,
  useReferenciasSocioeconomicas,
} from '../../application/hooks';
import { IndicadorPorDepartamento } from '../../domain/entities';
import { useFiltrosGlobales } from '@/shared/application/stores/filtros-globales.store';
import { EmptyState } from '@/shared/ui/components/empty-state';
import { Skeleton } from '@/shared/ui/components/skeleton';
import { SelectFiltro } from '@/shared/ui/components/select-filtro';
import { cn } from '@/shared/ui/utils/cn';
import { formatearValor } from '@/shared/ui/utils/formatear-valor';
import {
  badgeNivelRiesgoClass,
  configNivelRiesgo,
} from './calificacion-utils';
import { PanelNacionalSocio } from './panel-nacional-socio';
import {
  Activity,
  BookOpen,
  ChevronDown,
  Filter,
  Map as MapIcon,
  TrendingUp,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

const fmtPct = new Intl.NumberFormat('es-CO', {
  maximumFractionDigits: 1,
  minimumFractionDigits: 1,
});

function makeFmtValor(unidad: string | null | undefined) {
  return (v: number) => formatearValor(v, unidad);
}

const NIVEL_DEPARTAMENTAL = 'Departamental';

/**
 * Panel socioeconómico del Home: el usuario elige (1) fuente publicación,
 * (2) dimensión y (3) referencia. La visualización se adapta automáticamente
 * según el nivel geográfico asociado a la referencia:
 *  - Departamental → top departamentos / detalle del depto seleccionado.
 *  - Nacional u otro agregado → panel nacional con KPI y tendencia.
 */
export function PanelSocioHome() {
  const codigoDepartamento = useFiltrosGlobales((s) => s.codigoDepartamento);
  const [fuentePublicacion, setFuentePublicacion] = useState<string | null>(null);
  const [dimension, setDimension] = useState<string | null>(null);
  const [referencia, setReferencia] = useState<string | null>(null);

  const { data: fuentesPub, isLoading: loadingFuentes } = useFuentesPublicaciones();

  // Auto-selección de la primera fuente publicación al cargar.
  useEffect(() => {
    if (!fuentesPub || fuentesPub.length === 0) return;
    if (!fuentePublicacion || !fuentesPub.includes(fuentePublicacion)) {
      setFuentePublicacion(fuentesPub[0]);
      setDimension(null);
      setReferencia(null);
    }
  }, [fuentesPub, fuentePublicacion]);

  const { data: dimensiones, isLoading: loadingDims } =
    useDimensionesSocioeconomicas(fuentePublicacion);

  // Auto-selección de la primera dimensión disponible al cambiar fuente.
  useEffect(() => {
    if (!dimensiones || dimensiones.length === 0) return;
    if (!dimension || !dimensiones.includes(dimension)) {
      setDimension(dimensiones[0]);
      setReferencia(null);
    }
  }, [dimensiones, dimension]);

  // Referencias dependientes.
  const filtroRefs = useMemo(
    () => ({
      fuentePublicacion,
      dimension,
      codigoDepartamento: null,
      periodo: null,
      referencia: null,
      nivelGeografico: null,
    }),
    [fuentePublicacion, dimension],
  );
  const { data: referencias, isLoading: loadingRefs } = useReferenciasSocioeconomicas(
    filtroRefs,
    { enabled: !!dimension },
  );

  // Auto-selección de la primera referencia disponible.
  useEffect(() => {
    if (!referencias || referencias.length === 0) return;
    if (!referencia || !referencias.includes(referencia)) {
      setReferencia(referencias[0]);
    }
  }, [referencias, referencia]);

  // Niveles geográficos para inferir el tipo de vista (departamental vs nacional).
  const filtroNiv = useMemo(
    () => ({
      fuentePublicacion,
      dimension,
      codigoDepartamento: null,
      periodo: null,
      referencia,
      nivelGeografico: null,
    }),
    [fuentePublicacion, dimension, referencia],
  );
  const { data: niveles } = useNivelesGeograficosSocioeconomicos(filtroNiv, {
    enabled: !!dimension && !!referencia,
  });

  const nivelInferido: string | null =
    niveles && niveles.length > 0 ? niveles[0] : null;
  const usarVistaDepartamental = nivelInferido === NIVEL_DEPARTAMENTAL;

  const filtroDatos = useMemo(
    () => ({
      fuentePublicacion,
      dimension,
      codigoDepartamento: null,
      periodo: null,
      referencia,
      nivelGeografico: nivelInferido,
    }),
    [fuentePublicacion, dimension, referencia, nivelInferido],
  );

  const { data: indicadores, isLoading: loadingInd } =
    useIndicadoresPorDepartamentoSocioeconomico(filtroDatos);

  const periodo = indicadores?.[0]?.periodo ?? null;
  const departamentoActual = useMemo(
    () =>
      codigoDepartamento && indicadores
        ? indicadores.find(
            (i) =>
              i.codigoDepartamento.padStart(2, '0') ===
              codigoDepartamento.padStart(2, '0'),
          ) ?? null
        : null,
    [codigoDepartamento, indicadores],
  );

  const tituloFuente = fuentePublicacion ?? 'Publicaciones';

  const mostrandoNacional = !!referencia && !usarVistaDepartamental;
  const cargando = loadingInd && usarVistaDepartamental;

  return (
    <div className="space-y-4">
      {/* Selector de fuente + dimensión + referencia */}
      <div className="grid gap-2 rounded-xl border border-border bg-surface-elevated/40 p-3 sm:grid-cols-2 sm:gap-3 xl:grid-cols-[1fr_1fr_1fr_auto]">
        <Selector
          label="Fuente"
          value={fuentePublicacion}
          onChange={(v) => {
            setFuentePublicacion(v);
            setDimension(null);
            setReferencia(null);
          }}
          loading={loadingFuentes}
          options={(fuentesPub ?? []).map((f) => ({
            value: f,
            label: f,
          }))}
          icon={Filter}
          placeholder="Seleccione…"
        />
        <Selector
          label="Dimensión / Indicador"
          value={dimension}
          onChange={(v) => {
            setDimension(v);
            setReferencia(null);
          }}
          loading={loadingDims}
          disabled={!dimensiones || dimensiones.length === 0}
          options={(dimensiones ?? []).map((c) => ({ value: c, label: c }))}
          placeholder="Seleccione…"
          icon={Activity}
        />
        <Selector
          label="Referencia"
          value={referencia}
          onChange={setReferencia}
          loading={loadingRefs}
          disabled={!dimension || !referencias || referencias.length === 0}
          options={(referencias ?? []).map((r) => ({ value: r, label: r }))}
          placeholder={dimension ? 'Seleccione…' : 'Elija una dimensión'}
          icon={BookOpen}
        />
        {periodo !== null && usarVistaDepartamental && (
          <span className="self-end rounded-md bg-brand-muted px-2.5 py-1 text-[11px] font-semibold text-brand">
            Período {periodo}
          </span>
        )}
      </div>

      {/* Cuerpo */}
      {mostrandoNacional ? (
        <PanelNacionalSocio filtro={filtroDatos} mostrarDetalleCriterios={false} />
      ) : cargando ? (
        <Skeleton className="h-64 w-full" />
      ) : !dimension || !indicadores || indicadores.length === 0 ? (
        <EmptyState
          size="md"
          description={
            !dimension
              ? 'Seleccione una dimensión para visualizar la información.'
              : !referencia
                ? 'Seleccione una referencia para visualizar la información.'
                : 'Sin datos para esta combinación.'
          }
        />
      ) : departamentoActual ? (
        <DetalleDepartamento
          actual={departamentoActual}
          todos={indicadores}
          tituloFuente={tituloFuente}
          dimension={dimension}
        />
      ) : (
        <ResumenNacional
          indicadores={indicadores}
          tituloFuente={tituloFuente}
          dimension={dimension}
        />
      )}
    </div>
  );
}

/* ====================================================================== */
/*  Vista nacional: top departamentos + distribución de niveles de riesgo */
/* ====================================================================== */

function ResumenNacional({
  indicadores,
  tituloFuente,
  dimension,
}: {
  indicadores: IndicadorPorDepartamento[];
  tituloFuente: string;
  dimension: string;
}) {
  const fmtValor = makeFmtValor(indicadores[0]?.unidadMedida);
  const ordenados = useMemo(
    () => [...indicadores].sort((a, b) => b.valor - a.valor),
    [indicadores],
  );
  const totalDep = indicadores.length;
  const promedio =
    indicadores.reduce((s, i) => s + i.valor, 0) / Math.max(1, indicadores.length);
  const top5 = ordenados.slice(0, 5);
  const ranking = top5[0];
  const max = ranking?.valor ?? 1;

  // Distribución de niveles de riesgo
  const distribucion = useMemo(() => {
    const m = new Map<string, number>();
    indicadores.forEach((i) => {
      const k = (i.nivelRiesgo ?? 'Sin clasificar').toLowerCase();
      m.set(k, (m.get(k) ?? 0) + 1);
    });
    return Array.from(m.entries())
      .map(([nivel, n]) => ({ nivel, n, pct: (n / totalDep) * 100 }))
      .sort((a, b) => b.n - a.n);
  }, [indicadores, totalDep]);

  return (
    <div className="grid gap-4 lg:grid-cols-5">
      {/* Tarjeta promedio + top 1 */}
      <div className="lg:col-span-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
        <div className="rounded-xl border border-border bg-surface p-4 shadow-soft">
          <p className="text-xs font-medium text-foreground-muted">
            Promedio nacional
          </p>
          <p className="mt-1 text-3xl font-semibold tracking-tight text-foreground">
            {fmtValor(promedio)}
          </p>
          <p className="mt-1 text-xs text-foreground-muted">
            {totalDep} departamentos · {tituloFuente}
          </p>
        </div>

        {ranking && (
          <div className="rounded-xl border border-border bg-surface p-4 shadow-soft">
            <p className="text-xs font-medium text-foreground-muted">
              Departamento crítico
            </p>
            <p className="mt-1 truncate text-lg font-semibold text-foreground">
              {ranking.departamento}
            </p>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-2xl font-semibold tracking-tight text-foreground">
                {fmtValor(ranking.valor)}
              </span>
              {ranking.nivelRiesgo && (
                <span className={badgeNivelRiesgoClass(ranking.nivelRiesgo)}>
                  {configNivelRiesgo(ranking.nivelRiesgo).label}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Top 5 con barras */}
      <div className="lg:col-span-3 rounded-xl border border-border bg-surface p-4 shadow-soft">
        <header className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-foreground">
            <TrendingUp size={14} className="text-brand" />
            <h4 className="text-sm font-semibold">
              Top 5 departamentos · {dimension}
            </h4>
          </div>
        </header>
        <ul className="space-y-2">
          {top5.map((d) => {
            const pct = (d.valor / Math.max(1, max)) * 100;
            const cfg = configNivelRiesgo(d.nivelRiesgo);
            return (
              <li key={d.codigoDepartamento}>
                <div className="flex items-center justify-between text-xs">
                  <span className="truncate font-medium text-foreground">
                    {d.departamento}
                  </span>
                  <span className="ml-2 shrink-0 tabular-nums text-foreground-muted">
                    {fmtValor(d.valor)}
                  </span>
                </div>
                <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-surface-elevated">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: cfg.color,
                    }}
                  />
                </div>
              </li>
            );
          })}
        </ul>

        {/* Distribución por nivel de riesgo */}
        <div className="mt-4 border-t border-border pt-3">
          <p className="mb-2 text-xs font-medium text-foreground-muted">
            Distribución por nivel de riesgo
          </p>
          <div className="flex flex-wrap gap-1.5">
            {distribucion.map(({ nivel, n, pct }) => (
              <span key={nivel} className={badgeNivelRiesgoClass(nivel)}>
                {configNivelRiesgo(nivel).label} · {n} ({fmtPct.format(pct)}%)
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ====================================================================== */
/*  Vista de detalle cuando hay un departamento seleccionado              */
/* ====================================================================== */

function DetalleDepartamento({
  actual,
  todos,
  tituloFuente,
  dimension,
}: {
  actual: IndicadorPorDepartamento;
  todos: IndicadorPorDepartamento[];
  tituloFuente: string;
  dimension: string;
}) {
  const fmtValor = makeFmtValor(actual.unidadMedida);
  const ordenados = useMemo(
    () => [...todos].sort((a, b) => b.valor - a.valor),
    [todos],
  );
  const totalDep = todos.length;
  const total = todos.reduce((s, i) => s + i.valor, 0);
  const promedio = total / Math.max(1, totalDep);
  const promedioOtros = (total - actual.valor) / Math.max(1, totalDep - 1);

  const posicion = ordenados.findIndex(
    (d) => d.codigoDepartamento === actual.codigoDepartamento,
  );

  const participacion = total > 0 ? (actual.valor / total) * 100 : 0;
  const vsPromedio =
    promedioOtros > 0
      ? ((actual.valor - promedioOtros) / promedioOtros) * 100
      : 0;
  const cfg = configNivelRiesgo(actual.nivelRiesgo);

  return (
    <div className="space-y-3">
      <header className="flex items-center justify-between rounded-xl border border-brand/30 bg-brand-muted/40 px-4 py-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-brand">
            Detalle por departamento
          </p>
          <h4 className="truncate text-base font-semibold text-foreground">
            {actual.departamento}
          </h4>
        </div>
        {actual.nivelRiesgo && (
          <span className={badgeNivelRiesgoClass(actual.nivelRiesgo)}>
            {cfg.label}
          </span>
        )}
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiBlock
          label="Valor"
          value={fmtValor(actual.valor)}
          hint={`${dimension} · ${tituloFuente}`}
        />
        <KpiBlock
          label="Posición nacional"
          value={posicion >= 0 ? `#${posicion + 1}` : '—'}
          hint={`de ${totalDep} departamentos`}
        />
        <KpiBlock
          label="Participación"
          value={`${fmtPct.format(participacion)}%`}
          hint="frente al total nacional"
        />
        <KpiBlock
          label="vs promedio"
          value={`${vsPromedio >= 0 ? '+' : ''}${fmtPct.format(vsPromedio)}%`}
          hint={`promedio otros: ${fmtValor(promedioOtros)}`}
          tone={vsPromedio > 10 ? 'danger' : vsPromedio < -10 ? 'success' : 'neutral'}
        />
      </div>

      <div className="rounded-xl border border-border bg-surface p-4 shadow-soft">
        <p className="mb-3 text-xs font-medium text-foreground-muted">
          Comparativo con referentes nacionales
        </p>
        <BarrasComparativo
          actual={actual}
          ordenados={ordenados}
          promedio={promedio}
        />
      </div>
    </div>
  );
}

function BarrasComparativo({
  actual,
  ordenados,
  promedio,
}: {
  actual: IndicadorPorDepartamento;
  ordenados: IndicadorPorDepartamento[];
  promedio: number;
}) {
  const fmtValor = makeFmtValor(actual.unidadMedida);
  const top3 = ordenados
    .filter((d) => d.codigoDepartamento !== actual.codigoDepartamento)
    .slice(0, 3);
  const filas: { label: string; valor: number; tono: 'actual' | 'top' | 'avg' }[] = [
    { label: actual.departamento, valor: actual.valor, tono: 'actual' },
    { label: 'Promedio nacional', valor: promedio, tono: 'avg' },
    ...top3.map((d) => ({
      label: d.departamento,
      valor: d.valor,
      tono: 'top' as const,
    })),
  ];
  const max = Math.max(...filas.map((f) => f.valor), 1);

  return (
    <ul className="space-y-2.5">
      {filas.map((f) => {
        const pct = (f.valor / max) * 100;
        const color =
          f.tono === 'actual'
            ? 'rgb(49 63 105)' // brand · navy #313f69
            : f.tono === 'avg'
              ? 'rgb(200 209 226)' // border-strong (cool gray)
              : 'rgb(129 183 230)'; // info · sky #81b7e6
        return (
          <li key={`${f.label}-${f.tono}`}>
            <div className="flex items-center justify-between text-xs">
              <span
                className={cn(
                  'truncate',
                  f.tono === 'actual'
                    ? 'font-semibold text-foreground'
                    : 'text-foreground-muted',
                )}
              >
                {f.label}
              </span>
              <span className="ml-2 shrink-0 tabular-nums text-foreground">
                {fmtValor(f.valor)}
              </span>
            </div>
            <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-surface-elevated">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, backgroundColor: color }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/* ====================================================================== */
/*  Helpers                                                                */
/* ====================================================================== */

function KpiBlock({
  label,
  value,
  hint,
  tone = 'neutral',
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: 'neutral' | 'danger' | 'success';
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-3 shadow-soft">
      <p className="text-xs font-medium text-foreground-muted">
        {label}
      </p>
      <p
        className={cn(
          'mt-1 text-xl font-semibold tracking-tight',
          tone === 'danger' && 'text-danger-foreground',
          tone === 'success' && 'text-success-foreground',
          tone === 'neutral' && 'text-foreground',
        )}
      >
        {value}
      </p>
      {hint && (
        <p className="mt-1 truncate text-[11px] text-foreground-muted">{hint}</p>
      )}
    </div>
  );
}

function Selector({
  label,
  value,
  onChange,
  options,
  loading,
  disabled,
  placeholder = 'Seleccione…',
}: {
  label: string;
  value: string | null;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  loading?: boolean;
  disabled?: boolean;
  placeholder?: string;
  /** Conservado por compatibilidad; el control ya no muestra icono. */
  icon?: typeof MapIcon;
}) {
  return (
    <SelectFiltro
      label={label}
      value={value}
      onChange={(v) => onChange(v ?? '')}
      options={options}
      loading={loading}
      disabled={disabled}
      placeholder={placeholder}
      className="flex-1"
    />
  );
}
