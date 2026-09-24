'use client';

import { useDepartamentos } from '@/modules/geo/application/hooks';
import {
  useDimensionesSocioeconomicas,
  useFuentesPublicaciones,
  useIndicadoresPorDepartamentoSocioeconomico,
  useNivelesGeograficosSocioeconomicos,
  useReferenciasSocioeconomicas,
  useSerieHistoricaSocioeconomica,
} from '@/modules/socioeconomico/application/hooks';
import type { SerieHistoricaPunto } from '@/modules/socioeconomico/domain/entities';
import { DetalleDepartamentoSocio } from '@/modules/socioeconomico/infrastructure/ui/detalle-departamento-socio';
import { MapaCalorSocioeconomico } from '@/modules/socioeconomico/infrastructure/ui/mapa-calor-socioeconomico';
import { PanelNacionalSocio } from '@/modules/socioeconomico/infrastructure/ui/panel-nacional-socio';
import { TablaDepartamentosSocioeconomico } from '@/modules/socioeconomico/infrastructure/ui/tabla-departamentos-socioeconomico';
import { useFiltrosGlobales } from '@/shared/application/stores/filtros-globales.store';
import { Card, CardBody, CardHeader } from '@/shared/ui/components/card';
import { FiltrosCard } from '@/shared/ui/components/filtros-card';
import { LineChart } from '@/shared/ui/components/line-chart';
import { MultiSelectFiltro } from '@/shared/ui/components/multi-select-filtro';
import { SelectFiltro } from '@/shared/ui/components/select-filtro';
import { Skeleton } from '@/shared/ui/components/skeleton';
import { cn } from '@/shared/ui/utils/cn';
import { formatearValor, sufijoUnidad } from '@/shared/ui/utils/formatear-valor';
import {
  BookOpen,
  FileBarChart,
  LineChart as LineIcon,
  type LucideIcon,
  Map as MapIcon,
  ShieldAlert,
  Table as TableIcon,
  TrendingUp,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

const NIVEL_DEPARTAMENTAL = 'Departamental';

function iconoParaFuente(fuente: string): LucideIcon {
  const f = fuente.toLowerCase();
  if (f.includes('terridata') || f.includes('dnp')) return FileBarChart;
  if (f.includes('externado') || f.includes('indepaz') || f.includes('undp'))
    return BookOpen;
  if (f.includes('riesgo') || f.includes('seguridad')) return ShieldAlert;
  return TrendingUp;
}

interface OpcionFuente {
  value: string;
  label: string;
  icon: LucideIcon;
}

export default function SocioeconomicoPage() {
  const [fuentePublicacion, setFuentePublicacion] = useState<string | null>(null);
  const [dimension, setDimension] = useState<string | null>(null);
  const [referencia, setReferencia] = useState<string | null>(null);
  /** Sólo aplica para indicadores nacionales (selección múltiple de series). */
  const [seriesSeleccionadas, setSeriesSeleccionadas] = useState<string[]>([]);

  const codigoDepartamento = useFiltrosGlobales((s) => s.codigoDepartamento);
  const setDepartamento = useFiltrosGlobales((s) => s.setDepartamento);

  const { data: departamentos, isLoading: loadingDepartamentos } = useDepartamentos();
  const { data: fuentesPub, isLoading: loadingFuentes } = useFuentesPublicaciones();

  const opcionesFuente: OpcionFuente[] = useMemo(
    () =>
      (fuentesPub ?? []).map((f) => ({
        value: f,
        label: f,
        icon: iconoParaFuente(f),
      })),
    [fuentesPub],
  );

  useEffect(() => {
    if (opcionesFuente.length === 0) return;
    if (!fuentePublicacion || !opcionesFuente.some((o) => o.value === fuentePublicacion)) {
      setFuentePublicacion(opcionesFuente[0].value);
      setDimension(null);
      setReferencia(null);
    }
  }, [opcionesFuente, fuentePublicacion]);

  const { data: dimensiones, isLoading: loadingDims } =
    useDimensionesSocioeconomicas(fuentePublicacion);

  useEffect(() => {
    if (!dimensiones || dimensiones.length === 0) return;
    if (!dimension || !dimensiones.includes(dimension)) {
      setDimension(dimensiones[0]);
      setReferencia(null);
    }
  }, [dimensiones, dimension]);

  const filtroReferencias = useMemo(
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
  const { data: referencias, isLoading: loadingRefs } =
    useReferenciasSocioeconomicas(filtroReferencias, { enabled: !!dimension });

  useEffect(() => {
    if (!referencias || referencias.length === 0) return;
    if (!referencia || !referencias.includes(referencia)) {
      setReferencia(referencias[0]);
    }
  }, [referencias, referencia]);

  const filtroNiveles = useMemo(
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
  const { data: niveles } = useNivelesGeograficosSocioeconomicos(filtroNiveles, {
    enabled: !!dimension && !!referencia,
  });

  const nivelInferido: string | null =
    niveles && niveles.length > 0 ? niveles[0] : null;
  const usarVistaDepartamental = nivelInferido === NIVEL_DEPARTAMENTAL;

  // Resetear series seleccionadas cuando cambia la referencia o nivel.
  useEffect(() => {
    setSeriesSeleccionadas([]);
  }, [referencia, nivelInferido]);

  // Filtro base que se pasa a las visualizaciones que necesitan el depto
  // seleccionado (tabla detalle, KPIs comparativos).
  const filtroBase = useMemo(
    () => ({
      fuentePublicacion,
      codigoDepartamento: usarVistaDepartamental ? (codigoDepartamento ?? null) : null,
      dimension,
      periodo: null,
      referencia,
      nivelGeografico: nivelInferido,
    }),
    [
      fuentePublicacion,
      usarVistaDepartamental,
      codigoDepartamento,
      dimension,
      referencia,
      nivelInferido,
    ],
  );

  // Filtro que alimenta el coroplético: ignora el depto seleccionado para
  // que el mapa siempre coloree los 33 polígonos. La selección sólo
  // controla el zoom/resaltado dentro del componente del mapa.
  const filtroMapa = useMemo(
    () => ({
      fuentePublicacion,
      codigoDepartamento: null,
      dimension,
      periodo: null,
      referencia,
      nivelGeografico: nivelInferido,
    }),
    [fuentePublicacion, dimension, referencia, nivelInferido],
  );

  const filtroTendencia = useMemo(
    () => ({
      fuentePublicacion,
      // Para departamental respetamos el depto si está seleccionado; para
      // nacional la serie histórica es global por definición.
      codigoDepartamento: usarVistaDepartamental ? (codigoDepartamento ?? null) : null,
      dimension,
      periodo: null,
      referencia,
      nivelGeografico: nivelInferido,
      // Si el usuario filtró series en el panel nacional, propagamos al backend
      // para que la tendencia respete la misma selección y no muestre líneas
      // que el usuario ocultó.
      seriesEstadisticas:
        !usarVistaDepartamental && seriesSeleccionadas.length > 0
          ? seriesSeleccionadas
          : null,
    }),
    [
      fuentePublicacion,
      usarVistaDepartamental,
      codigoDepartamento,
      dimension,
      referencia,
      nivelInferido,
      seriesSeleccionadas,
    ],
  );

  const tendenciaActiva = !!dimension && !!referencia && opcionesFuente.length > 0;

  const { data: serie, isLoading: loadingSerie } = useSerieHistoricaSocioeconomica(
    filtroTendencia,
    { enabled: tendenciaActiva },
  );

  // Cargamos los registros del último período sólo para conocer las series
  // disponibles cuando el indicador es nacional (alimenta el MultiSelect).
  const { data: registrosNacional } = useIndicadoresPorDepartamentoSocioeconomico(
    filtroBase,
    { enabled: !usarVistaDepartamental && !!referencia },
  );

  const opcionesSerieEstadistica = useMemo(() => {
    const set = new Set<string>();
    (registrosNacional ?? []).forEach((r) => {
      if (r.serieEstadistica) set.add(r.serieEstadistica);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [registrosNacional]);

  // Unidad asociada a la combinación actual (constante por referencia).
  const unidad =
    (registrosNacional?.[0]?.unidadMedida ?? serie?.[0]?.unidadMedida) ?? null;

  const filtroBaseConSeries = useMemo(
    () => ({
      ...filtroBase,
      seriesEstadisticas: seriesSeleccionadas.length > 0 ? seriesSeleccionadas : null,
    }),
    [filtroBase, seriesSeleccionadas],
  );

  const serieAgrupada = useMemo(() => {
    if (!serie || serie.length === 0) {
      return { labels: [], datasets: [], agrupador: 'dimension' as const };
    }
    // Períodos ordenados numéricamente (no lexicográficos).
    const periodos = Array.from(new Set(serie.map((p) => p.periodo))).sort(
      (a, b) => a - b,
    );
    // Una referencia con múltiples series_estadistica debe trazar una línea
    // por serie; si la data sólo distingue por dimensión (o no trae serie),
    // usamos dimensión como agrupador.
    const usaSeries = serie.some(
      (p) => p.serieEstadistica && p.serieEstadistica.trim() !== '',
    );
    const claveDe = (p: SerieHistoricaPunto) =>
      usaSeries
        ? (p.serieEstadistica ?? p.dimension ?? 'Sin serie')
        : (p.dimension ?? 'Sin dimensión');
    const grupos = Array.from(new Set(serie.map(claveDe))).sort((a, b) =>
      a.localeCompare(b),
    );
    const mapaValor = new Map<string, Map<number, number>>();
    const mapaObs = new Map<string, Map<number, string | null>>();
    serie.forEach((p) => {
      const c = claveDe(p);
      if (!mapaValor.has(c)) mapaValor.set(c, new Map());
      if (!mapaObs.has(c)) mapaObs.set(c, new Map());
      mapaValor.get(c)!.set(p.periodo, p.valor);
      mapaObs.get(c)!.set(p.periodo, p.observacion ?? null);
    });
    return {
      labels: periodos.map(String),
      datasets: grupos.slice(0, 8).map((c) => ({
        label: c,
        data: periodos.map((a) => mapaValor.get(c)?.get(a) ?? 0),
        observaciones: periodos.map((a) => mapaObs.get(c)?.get(a) ?? null),
      })),
      agrupador: (usaSeries ? 'serie' : 'dimension') as 'serie' | 'dimension',
    };
  }, [serie]);

  // Regla: la tendencia sólo se muestra cuando hay ≥2 períodos.
  const periodosDistintos = serieAgrupada.labels.length;
  const mostrarTendencia = tendenciaActiva && periodosDistintos > 1;

  const fmtValorChart = useCallback(
    (v: number) => formatearValor(v, unidad),
    [unidad],
  );

  const filtrosActivos =
    (usarVistaDepartamental && codigoDepartamento ? 1 : 0) +
    (dimension ? 1 : 0) +
    (referencia ? 1 : 0) +
    (!usarVistaDepartamental && seriesSeleccionadas.length > 0 ? 1 : 0);

  // Columnas del grid de filtros:
  //   Departamental: Departamento + Dimensión + Referencia (3)
  //   Nacional:      Dimensión + Referencia + Series (3)
  const colsFiltros: 1 | 2 | 3 = 3;

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Barra de fuentes — control segmentado, mismo lenguaje que las pestañas. */}
      {loadingFuentes ? (
        <Skeleton className="h-11 w-80 rounded-xl" />
      ) : (
        <div
          role="group"
          aria-label="Fuente de información"
          className="flex w-fit max-w-full flex-wrap items-stretch gap-1 rounded-xl border border-border bg-background p-1"
        >
          {opcionesFuente.map((opt) => {
            const active = opt.value === fuentePublicacion;
            const Icon = opt.icon;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  if (opt.value !== fuentePublicacion) {
                    setFuentePublicacion(opt.value);
                    setDimension(null);
                    setReferencia(null);
                  }
                }}
                aria-pressed={active}
                className={cn(
                  'group relative inline-flex h-9 items-center gap-2 rounded-lg px-3.5 text-sm transition-colors',
                  active
                    ? 'bg-surface font-semibold text-foreground shadow-soft ring-1 ring-border/80'
                    : 'font-medium text-foreground-muted hover:text-foreground',
                )}
              >
                <Icon
                  size={15}
                  className={cn('shrink-0', active ? 'text-brand' : 'text-foreground-subtle')}
                />
                <span className="whitespace-nowrap tracking-tight">
                  {opt.label}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Filtros — Nivel geográfico se infiere automáticamente.
          Departamento: sólo en vista departamental.
          Series estadísticas (multi): sólo en vista nacional. */}
      <FiltrosCard
        cols={colsFiltros}
        filtrosActivos={filtrosActivos}
        onLimpiar={() => {
          setDepartamento(null);
          setDimension(dimensiones && dimensiones.length > 0 ? dimensiones[0] : null);
          setReferencia(null);
          setSeriesSeleccionadas([]);
        }}
      >
        {usarVistaDepartamental && (
          <SelectFiltro
            label="Departamento"
            value={codigoDepartamento}
            loading={loadingDepartamentos}
            options={(departamentos ?? []).map((d) => ({
              value: d.codigo,
              label: d.nombre,
            }))}
            onChange={setDepartamento}
            placeholder="Todos"
          />
        )}
        <SelectFiltro
          label="Dimensión"
          value={dimension}
          loading={loadingDims}
          options={(dimensiones ?? []).map((c) => ({ value: c, label: c }))}
          onChange={(v) => {
            setDimension(v);
            setReferencia(null);
          }}
          placeholder="Seleccione una dimensión"
        />
        <SelectFiltro
          label="Referencia"
          value={referencia}
          loading={loadingRefs}
          disabled={!dimension}
          options={(referencias ?? []).map((r) => ({ value: r, label: r }))}
          onChange={setReferencia}
          placeholder={dimension ? 'Seleccione una referencia' : 'Elija una dimensión'}
        />
        {!usarVistaDepartamental && referencia && (
          <MultiSelectFiltro
            label="Serie estadística / criterio"
            values={seriesSeleccionadas}
            options={opcionesSerieEstadistica.map((s) => ({ value: s, label: s }))}
            onChange={setSeriesSeleccionadas}
            placeholder="Todas las series"
          />
        )}
      </FiltrosCard>

      {/* Visualización principal — mapa coroplético para Departamental,
          panel adaptativo para Nacional (sin mapa). */}
      <section
        className={cn(
          'grid gap-4',
          usarVistaDepartamental ? 'lg:grid-cols-3' : 'lg:grid-cols-1',
        )}
      >
        <Card className={usarVistaDepartamental ? 'lg:col-span-2' : undefined}>
          <CardHeader
            title={referencia ?? (dimension ?? 'Indicador socioeconómico')}
            description={
              [
                usarVistaDepartamental
                  ? 'Distribución territorial por nivel de riesgo'
                  : `Vista ${nivelInferido?.toLowerCase() ?? 'agregada'}`,
                dimension,
                unidad ? `unidad: ${unidad}` : null,
              ]
                .filter(Boolean)
                .join(' · ') || undefined
            }
            icon={usarVistaDepartamental ? MapIcon : TrendingUp}
          />
          <CardBody>
            {usarVistaDepartamental ? (
              <MapaCalorSocioeconomico
                filtro={filtroMapa}
                codigoDepartamentoSeleccionado={codigoDepartamento}
                onSeleccionarDepartamento={setDepartamento}
              />
            ) : (
              <PanelNacionalSocio filtro={filtroBaseConSeries} embebido />
            )}
          </CardBody>
        </Card>

        {usarVistaDepartamental && (
          <Card>
            <CardHeader
              title="Detalle por departamento"
              description={
                codigoDepartamento
                  ? 'KPIs comparativos del departamento'
                  : 'Último período disponible'
              }
              icon={TableIcon}
            />
            <CardBody padding="none">
              {codigoDepartamento ? (
                <DetalleDepartamentoSocio
                  filtro={filtroBase}
                  dimensionActiva={dimension}
                />
              ) : (
                <TablaDepartamentosSocioeconomico filtro={filtroBase} />
              )}
            </CardBody>
          </Card>
        )}
      </section>

      {/* Tendencia — solo cuando hay más de un período disponible.
          Si la combinación filtrada tiene 0 o 1 período, la sección entera
          se omite (no aporta valor analítico). */}
      {mostrarTendencia && (
        <Card>
          <CardHeader
            title="Tendencia histórica"
            description={(() => {
              const partes = [
                referencia,
                serieAgrupada.agrupador === 'serie'
                  ? `${serieAgrupada.datasets.length} ${
                      serieAgrupada.datasets.length === 1 ? 'serie' : 'series'
                    } · ${periodosDistintos} períodos`
                  : `${periodosDistintos} períodos`,
                sufijoUnidad(unidad) || (unidad ? `unidad: ${unidad}` : null),
              ].filter(Boolean);
              return partes.join(' · ') || undefined;
            })()}
            icon={LineIcon}
          />
          <CardBody>
            {loadingSerie ? (
              <Skeleton className="h-72 w-full" />
            ) : (
              <div className="h-72 sm:h-80">
                <LineChart
                  labels={serieAgrupada.labels}
                  datasets={serieAgrupada.datasets}
                  formatearValor={fmtValorChart}
                />
              </div>
            )}
          </CardBody>
        </Card>
      )}
    </div>
  );
}
