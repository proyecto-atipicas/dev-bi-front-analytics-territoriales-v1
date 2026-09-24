'use client';

import { BarChart } from '@/shared/ui/components/bar-chart';
import { EmptyState } from '@/shared/ui/components/empty-state';
import { Skeleton } from '@/shared/ui/components/skeleton';
import { cn } from '@/shared/ui/utils/cn';
import { formatearValor } from '@/shared/ui/utils/formatear-valor';
import {
  ActivitySquare,
  ArrowDownCircle,
  ArrowLeftRight,
  ArrowUpCircle,
  BarChart3,
  Globe2,
  Info,
  type LucideIcon,
  Sigma,
} from 'lucide-react';
import { useCallback, useMemo } from 'react';
import { useIndicadoresPorDepartamentoSocioeconomico } from '../../application/hooks';
import { FiltroSocioeconomico } from '../../domain/entities';
import { badgeNivelRiesgoClass, configNivelRiesgo } from './calificacion-utils';
import { formatearPorcentaje } from '@/shared/ui/utils/formatear-porcentaje';

export interface PanelNacionalSocioProps {
  /**
   * Filtro completo. Debe traer `nivelGeografico` distinto a "Departamental".
   * `seriesEstadisticas` (opcional) filtra series en el cliente.
   */
  filtro: FiltroSocioeconomico;
  /**
   * Cuando se renderiza dentro del dashboard Home conviene ocultar la grilla
   * de tarjetas por serie para no saturar el panel resumen. Por defecto
   * (`true`) se muestra la sección completa, como en /socioeconomico.
   */
  mostrarDetalleCriterios?: boolean;
  /**
   * Si `true`, el panel asume que el contenedor (Card padre) ya muestra el
   * título e icono del indicador y omite su propio header. Evita duplicar
   * dimensión/nivel/referencia cuando se monta dentro de una Card temática.
   */
  embebido?: boolean;
}

/**
 * Vista alternativa al mapa cuando el indicador es nacional. La visualización
 * se adapta a la cantidad de criterios:
 *   1 criterio:   KPIs grandes (sin barra aislada) + observación destacada.
 *   2–7:           KPIs comparativos + barras horizontales ordenadas.
 *   ≥ 8:           Tabla analítica densa para evitar saturación visual.
 *
 * En todos los casos se respeta `seriesEstadisticas` (filtro cliente) para
 * mostrar sólo el subconjunto de criterios seleccionado en la barra superior.
 */
export function PanelNacionalSocio({
  filtro,
  mostrarDetalleCriterios = true,
  embebido = false,
}: PanelNacionalSocioProps) {
  const { data: registros, isLoading } =
    useIndicadoresPorDepartamentoSocioeconomico(filtro);

  // Para nacional, cada fila representa típicamente un criterio
  // (`serie_estadistica`) asociado a la referencia.
  const seleccion = useMemo(() => new Set(filtro.seriesEstadisticas ?? []), [filtro.seriesEstadisticas]);
  const criterios = useMemo(() => {
    if (!registros || registros.length === 0) return [] as CriterioVista[];
    const filas = registros.map((r, idx) => ({
      key: r.serieEstadistica ?? r.departamento ?? `criterio-${idx}`,
      etiqueta: r.serieEstadistica ?? r.departamento ?? 'Sin nombre',
      valor: r.valor,
      nivelRiesgo: r.nivelRiesgo,
      observacion: r.observacion,
      periodo: r.periodo,
      unidad: r.unidadMedida ?? null,
    } satisfies CriterioVista));
    return seleccion.size > 0
      ? filas.filter((c) => seleccion.has(c.etiqueta))
      : filas;
  }, [registros, seleccion]);

  const unidad = criterios[0]?.unidad ?? null;
  const fmt = useCallback((v: number) => formatearValor(v, unidad), [unidad]);
  const fmtPct = useCallback(
    (v: number) => formatearValor(v, 'porcentaje'),
    [],
  );

  const destacados = useMemo(() => calcularDestacados(criterios), [criterios]);
  const principal = registros?.[0] ?? null;
  const nivelRiesgoPredominante = useMemo(
    () => calcularNivelPredominante(criterios),
    [criterios],
  );

  if (!filtro.dimension) {
    return (
      <EmptyState
        size="md"
        description="Seleccione una dimensión para visualizar el indicador nacional."
      />
    );
  }

  if (isLoading) {
    return <Skeleton className="h-[420px] w-full" />;
  }

  if (!principal || criterios.length === 0) {
    return (
      <EmptyState
        size="md"
        description="Sin datos disponibles para esta combinación."
      />
    );
  }

  // ============== Visualización adaptativa por densidad ==============
  const n = criterios.length;
  const modo: ModoVisualizacion =
    n === 1 ? 'unico'
    : n <= 7 ? 'barras'
    : 'tabla';

  return (
    <div className="space-y-5">
      {/* Header — identidad nacional.
          Cuando el panel va embebido en una Card temática el contenedor ya
          comunica título y nivel, por lo que omitimos este bloque para no
          duplicar dimensión/referencia. Conservamos un resumen compacto
          (período + nivel de riesgo predominante) que aporta contexto extra. */}
      {!embebido ? (
        <header className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-info/30 bg-info-muted/40 px-3 py-3 sm:px-4">
          <div className="flex min-w-0 flex-1 items-start gap-2.5 sm:gap-3">
            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-info-muted text-info-foreground sm:h-8 sm:w-8">
              <Globe2 size={14} className="sm:hidden" />
              <Globe2 size={16} className="hidden sm:block" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="label-eyebrow text-info-foreground">
                Nivel {principal.nivelGeografico ?? 'agregado'}
              </p>
              <h3 className="mt-0.5 break-words text-sm font-semibold leading-snug text-foreground sm:truncate sm:text-base">
                {principal.dimension ?? filtro.dimension}
              </h3>
              <p className="mt-0.5 line-clamp-2 break-words text-[11px] text-foreground-muted sm:line-clamp-none sm:truncate">
                Período <span className="font-semibold text-foreground">{principal.periodo}</span>
                {principal.referencia ? <> · {principal.referencia}</> : null}
                {seleccion.size > 0 && (
                  <> · <span className="font-semibold text-info-foreground">{n} {n === 1 ? 'serie' : 'series'} filtradas</span></>
                )}
              </p>
            </div>
          </div>
          {nivelRiesgoPredominante && modo !== 'unico' && (
            <span className={badgeNivelRiesgoClass(nivelRiesgoPredominante)}>
              {configNivelRiesgo(nivelRiesgoPredominante).label}
            </span>
          )}
        </header>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-foreground-muted">
          <span>
            Período <span className="font-semibold text-foreground">{principal.periodo}</span>
            {' · '}
            {n} {n === 1 ? 'serie estadística' : 'series estadísticas'}
            {seleccion.size > 0 && <> filtradas</>}
          </span>
          {nivelRiesgoPredominante && modo !== 'unico' && (
            <span className={badgeNivelRiesgoClass(nivelRiesgoPredominante)}>
              {configNivelRiesgo(nivelRiesgoPredominante).label}
            </span>
          )}
        </div>
      )}

      {/* Modo 1: criterio único — KPI grande + observación destacada (sin barra aislada). */}
      {modo === 'unico' && (
        <SingleCriterioCard criterio={criterios[0]} fmt={fmt} />
      )}

      {/* Modos 2-3: KPIs comparativos (visible siempre que haya >1 serie). */}
      {modo !== 'unico' && (
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          {/* La cantidad de series ya aparece en el encabezado; la brecha
              dice algo que las demás cifras no: cuánto se separan los
              extremos. */}
          <KpiDestacado
            icon={ArrowLeftRight}
            label="Brecha entre series"
            value={
              destacados.maximo && destacados.minimo
                ? fmt(destacados.maximo.valor - destacados.minimo.valor)
                : '—'
            }
            caption={
              destacados.maximo && destacados.minimo && destacados.minimo.valor > 0
                ? `El más alto supera en ${formatearPorcentaje(
                    ((destacados.maximo.valor - destacados.minimo.valor) /
                      destacados.minimo.valor) *
                      100,
                    1,
                  )} al más bajo`
                : undefined
            }
          />
          <KpiDestacado
            icon={Sigma}
            label="Promedio"
            value={fmt(destacados.promedio)}
          />
          <KpiDestacado
            icon={ArrowUpCircle}
            tone="danger"
            label="Valor más alto"
            value={destacados.maximo ? fmt(destacados.maximo.valor) : '—'}
            caption={destacados.maximo?.etiqueta}
          />
          <KpiDestacado
            icon={ArrowDownCircle}
            tone="success"
            label="Valor más bajo"
            value={destacados.minimo ? fmt(destacados.minimo.valor) : '—'}
            caption={destacados.minimo?.etiqueta}
          />
        </div>
      )}

      {/* Modo barras (2–7): ranking ordenado. Con 2–4 series antes se usaba
          un radar, pero con tres ejes era un triángulo difícil de leer. */}
      {modo === 'barras' && (
        <div className="rounded-xl border border-border bg-surface p-3 shadow-soft sm:p-4">
          <header className="mb-3 flex flex-wrap items-start justify-between gap-2">
            <div className="flex min-w-0 items-start gap-2">
              <BarChart3 size={16} className="mt-0.5 shrink-0 text-brand" />
              <div className="min-w-0">
                <p className="label-eyebrow">Comparativa por serie estadística</p>
                <p className="text-xs text-foreground-muted">
                  Valores asociados a la referencia seleccionada
                </p>
              </div>
            </div>
            <span className="shrink-0 text-[11px] text-foreground-subtle">
              {n} series
            </span>
          </header>
          <div className={n <= 4 ? 'h-48 sm:h-52' : 'h-64 sm:h-72'}>
            {(() => {
              const ordenados = [...criterios].sort((a, b) => b.valor - a.valor);
              return (
                <BarChart
                  labels={ordenados.map((c) => c.etiqueta)}
                  data={ordenados.map((c) => c.valor)}
                  observaciones={ordenados.map((c) => c.observacion)}
                  label={filtro.dimension ?? 'Valor'}
                  formatearValor={fmt}
                  horizontal
                />
              );
            })()}
          </div>
        </div>
      )}

      {/* Modo tabla (≥8): vista densa escalable. */}
      {modo === 'tabla' && (
        <TablaAnalitica
          criterios={criterios}
          fmt={fmt}
          fmtPct={fmtPct}
          promedio={destacados.promedio}
          maximo={destacados.maximo?.valor ?? 0}
        />
      )}

      {/* Detalle por serie estadística — sólo cuando hay varias y se pide mostrar.
          En modo "unico" ya se ve toda la info en SingleCriterioCard. */}
      {mostrarDetalleCriterios && modo !== 'unico' && modo !== 'tabla' && (
        <div className="rounded-xl border border-border bg-surface p-3 shadow-soft sm:p-4">
          <header className="mb-3 flex items-start gap-2">
            <ActivitySquare size={16} className="mt-0.5 shrink-0 text-brand" />
            <div className="min-w-0">
              <p className="label-eyebrow">Detalle por serie estadística</p>
              <p className="text-xs text-foreground-muted">
                Nivel de riesgo y observación asociados a cada serie
              </p>
            </div>
          </header>
          <div className="grid gap-3 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
            {criterios.map((c) => {
              const cfg = configNivelRiesgo(c.nivelRiesgo);
              return (
                <article
                  key={c.key}
                  className="flex min-w-0 flex-col gap-2 rounded-xl border border-border bg-surface-elevated/40 p-3"
                >
                  <header className="flex flex-wrap items-start justify-between gap-2">
                    <p
                      className="min-w-0 flex-1 break-words text-xs font-semibold text-foreground"
                      title={c.etiqueta}
                    >
                      {c.etiqueta}
                    </p>
                    {c.nivelRiesgo && (
                      <span className={cn('shrink-0', badgeNivelRiesgoClass(c.nivelRiesgo))}>
                        {cfg.label}
                      </span>
                    )}
                  </header>
                  <p className="break-words text-xl font-bold tracking-tight text-foreground num-tabular sm:text-2xl">
                    {fmt(c.valor)}
                  </p>
                  {c.observacion && (
                    <div className="flex items-start gap-2 rounded-lg bg-surface px-2.5 py-2 text-[11px] leading-snug text-foreground-muted">
                      <Info size={12} className="mt-0.5 shrink-0 text-info-foreground" />
                      <span className="break-words">{c.observacion}</span>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ====================================================================== */
/*  Helpers internos                                                       */
/* ====================================================================== */

type ModoVisualizacion = 'unico' | 'barras' | 'tabla';

interface CriterioVista {
  key: string;
  etiqueta: string;
  valor: number;
  nivelRiesgo: string | null;
  observacion: string | null;
  periodo: number;
  unidad: string | null;
}

interface DestacadoExtremo {
  valor: number;
  etiqueta: string;
}

interface Destacados {
  cantidad: number;
  promedio: number;
  maximo: DestacadoExtremo | null;
  minimo: DestacadoExtremo | null;
}

function calcularDestacados(criterios: CriterioVista[]): Destacados {
  if (criterios.length === 0) {
    return { cantidad: 0, promedio: 0, maximo: null, minimo: null };
  }
  let max = criterios[0];
  let min = criterios[0];
  let suma = 0;
  for (const c of criterios) {
    if (c.valor > max.valor) max = c;
    if (c.valor < min.valor) min = c;
    suma += c.valor;
  }
  return {
    cantidad: criterios.length,
    promedio: suma / criterios.length,
    maximo: { valor: max.valor, etiqueta: max.etiqueta },
    minimo: { valor: min.valor, etiqueta: min.etiqueta },
  };
}

function calcularNivelPredominante(rows: { nivelRiesgo: string | null }[]): string | null {
  const conteo = new Map<string, number>();
  for (const r of rows) {
    if (!r.nivelRiesgo) continue;
    const k = r.nivelRiesgo.toLowerCase().trim();
    conteo.set(k, (conteo.get(k) ?? 0) + 1);
  }
  if (conteo.size === 0) return null;
  let mejor: { clave: string; valor: number } | null = null;
  for (const [clave, valor] of conteo.entries()) {
    if (!mejor || valor > mejor.valor) mejor = { clave, valor };
  }
  return mejor?.clave ?? null;
}

/* ---------- Tarjeta de criterio único ---------- */

function SingleCriterioCard({
  criterio,
  fmt,
}: {
  criterio: CriterioVista;
  fmt: (v: number) => string;
}) {
  const cfg = configNivelRiesgo(criterio.nivelRiesgo);
  return (
    <article className="rounded-xl border border-border bg-surface p-4 shadow-soft sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="label-eyebrow">Serie estadística analizada</p>
          <h4 className="mt-0.5 break-words text-base font-semibold text-foreground sm:text-lg">
            {criterio.etiqueta}
          </h4>
          <p className="mt-0.5 text-[11px] text-foreground-muted">
            Período <span className="font-semibold text-foreground">{criterio.periodo}</span>
          </p>
        </div>
        {criterio.nivelRiesgo && (
          <span className={cn('shrink-0', badgeNivelRiesgoClass(criterio.nivelRiesgo))}>
            {cfg.label}
          </span>
        )}
      </div>
      <p className="mt-3 break-words text-3xl font-bold tracking-tight text-foreground num-tabular sm:text-4xl">
        {fmt(criterio.valor)}
      </p>
      {criterio.observacion && (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-info/20 bg-info-muted/30 px-3 py-2 text-xs leading-snug text-foreground-muted">
          <Info size={13} className="mt-0.5 shrink-0 text-info-foreground" />
          <span className="break-words">{criterio.observacion}</span>
        </div>
      )}
    </article>
  );
}

/* ---------- Tabla analítica densa ---------- */

function TablaAnalitica({
  criterios,
  fmt,
  fmtPct,
  promedio,
  maximo,
}: {
  criterios: CriterioVista[];
  fmt: (v: number) => string;
  fmtPct: (v: number) => string;
  promedio: number;
  maximo: number;
}) {
  const ordenados = useMemo(
    () => [...criterios].sort((a, b) => b.valor - a.valor),
    [criterios],
  );
  return (
    <div className="rounded-xl border border-border bg-surface shadow-soft">
      <header className="flex items-center justify-between border-b border-border px-3 py-2.5">
        <div className="flex items-start gap-2">
          <BarChart3 size={15} className="mt-0.5 shrink-0 text-brand" />
          <div>
            <p className="label-eyebrow">Tabla analítica</p>
            <p className="text-[11px] text-foreground-muted">
              {ordenados.length} series estadísticas · ordenadas por valor descendente
            </p>
          </div>
        </div>
      </header>
      <div className="max-h-[460px] overflow-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0 z-10 border-b border-border bg-surface-elevated/95 backdrop-blur">
            <tr className="text-left label-eyebrow">
              <th className="w-12 px-3 py-2 text-right">Rank</th>
              <th className="px-3 py-2">Serie estadística</th>
              <th className="px-3 py-2 text-right">Valor</th>
              <th className="px-3 py-2 text-right">Heatmap</th>
              <th className="px-3 py-2 text-right">vs Prom.</th>
              <th className="px-3 py-2">Nivel</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {ordenados.map((c, i) => {
              const cfg = configNivelRiesgo(c.nivelRiesgo);
              const pctMax = maximo > 0 ? (c.valor / maximo) * 100 : 0;
              const vsPromedio =
                promedio > 0 ? ((c.valor - promedio) / promedio) * 100 : 0;
              return (
                <tr
                  key={c.key}
                  className="transition-colors hover:bg-surface-elevated/60"
                  title={c.observacion ?? undefined}
                >
                  <td className="px-3 py-2 text-right num-tabular text-foreground-subtle">
                    {i + 1}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className="block max-w-[16rem] truncate font-medium text-foreground"
                      title={c.etiqueta}
                    >
                      {c.etiqueta}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right num-tabular font-semibold text-foreground">
                    {fmt(c.valor)}
                  </td>
                  <td className="px-3 py-2">
                    <div className="ml-auto h-1.5 w-24 overflow-hidden rounded-full bg-surface-elevated">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(100, Math.max(2, pctMax))}%`,
                          backgroundColor: cfg.color,
                        }}
                      />
                    </div>
                  </td>
                  <td
                    className={cn(
                      'px-3 py-2 text-right num-tabular',
                      vsPromedio > 5
                        ? 'text-danger-foreground'
                        : vsPromedio < -5
                          ? 'text-success-foreground'
                          : 'text-foreground-muted',
                    )}
                  >
                    {vsPromedio >= 0 ? '+' : ''}
                    {fmtPct(vsPromedio)}
                  </td>
                  <td className="px-3 py-2">
                    {c.nivelRiesgo ? (
                      <span className={badgeNivelRiesgoClass(c.nivelRiesgo)}>
                        {cfg.label}
                      </span>
                    ) : (
                      <span className="text-foreground-subtle">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------- KPI destacado ---------- */

interface KpiDestacadoProps {
  icon: LucideIcon;
  label: string;
  value: string;
  caption?: string;
  tone?: 'neutral' | 'success' | 'danger';
}

function KpiDestacado({ icon: Icon, label, value, caption, tone = 'neutral' }: KpiDestacadoProps) {
  return (
    <div className="min-w-0 rounded-xl border border-border bg-surface p-2.5 shadow-soft sm:p-3">
      <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
        <span
          className={cn(
            'flex h-6 w-6 shrink-0 items-center justify-center rounded-lg sm:h-7 sm:w-7',
            tone === 'danger' && 'bg-danger-muted text-danger-foreground',
            tone === 'success' && 'bg-success-muted text-success-foreground',
            tone === 'neutral' && 'bg-info-muted text-info-foreground',
          )}
        >
          <Icon size={13} className="sm:hidden" />
          <Icon size={14} className="hidden sm:block" />
        </span>
        <p className="label-eyebrow truncate">{label}</p>
      </div>
      <p className="mt-1.5 truncate text-xl font-bold tracking-tight text-foreground num-tabular sm:mt-2 sm:text-2xl">
        {value}
      </p>
      {caption && (
        <p
          className="mt-0.5 line-clamp-2 break-words text-[11px] leading-snug text-foreground-muted"
          title={caption}
        >
          {caption}
        </p>
      )}
    </div>
  );
}

