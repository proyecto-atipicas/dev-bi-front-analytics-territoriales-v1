'use client';

import { useResolvedTheme } from '@/shared/application/hooks/use-resolved-theme';
import {
  aDivipolaDepto,
  aDivipolaDeptoFlexible,
  aRegistraduriaDepto,
  DIVIPOLAS_DEPTO_VALIDOS,
} from '@/shared/domain/divipola';
import { EmptyState } from '@/shared/ui/components/empty-state';
import { Skeleton } from '@/shared/ui/components/skeleton';
import {
  formatearValor,
  sufijoUnidad,
} from '@/shared/ui/utils/formatear-valor';
import dynamic from 'next/dynamic';
import { useCallback, useMemo } from 'react';
import { useIndicadoresPorDepartamentoSocioeconomico } from '../../application/hooks';
import { FiltroSocioeconomico } from '../../domain/entities';
import {
  badgeNivelRiesgoClass,
  colorParaNivelRiesgo,
  configNivelRiesgo,
} from './calificacion-utils';

const MapaBaseInner = dynamic(
  () =>
    import(
      '@/modules/electoral/infrastructure/ui/mapa-colombia/mapa-base.inner'
    ).then((m) => m.MapaBaseInner),
  { ssr: false, loading: () => <Skeleton className="h-full min-h-[280px] w-full" /> },
);

const fmtCount = new Intl.NumberFormat('es-CO');

export interface MapaCalorSocioeconomicoProps {
  /**
   * Filtro para la data del coroplético. NO debe traer codigoDepartamento —
   * el mapa siempre necesita los 33 deptos para colorearse. El depto
   * seleccionado se pasa por `codigoDepartamentoSeleccionado` y se usa
   * únicamente para resaltado/zoom.
   */
  filtro: FiltroSocioeconomico;
  /** Código del depto seleccionado en el store global. */
  codigoDepartamentoSeleccionado?: string | null;
  /** Callback al seleccionar un departamento desde el mapa. */
  onSeleccionarDepartamento?: (codigoRegistraduria: string | null) => void;
}

export function MapaCalorSocioeconomico({
  filtro,
  codigoDepartamentoSeleccionado = null,
  onSeleccionarDepartamento,
}: MapaCalorSocioeconomicoProps) {
  const isDark = useResolvedTheme() === 'dark';
  const { data, isLoading, isError } =
    useIndicadoresPorDepartamentoSocioeconomico(filtro);

  // Unidad del primer registro (constante para una referencia dada).
  const unidad = data?.[0]?.unidadMedida ?? null;

  // Si ningún registro trae nivel_riesgo (caso típico tras la migración
  // 2026-05 con DNP TerriData, Externado, etc.), la coloración categórica
  // produce un mapa todo gris. En ese caso usamos gradiente por valor.
  const usarGradiente = useMemo(
    () => !(data ?? []).some((d) => d.nivelRiesgo),
    [data],
  );

  // El campo `codigo_departamento` en data_socioeconómica puede venir como
  // Registraduría, DIVIPOLA directo o incluso el nombre como texto según la
  // fuente publicación. Resolvemos preferentemente por nombre normalizado
  // (campo `departamento` siempre llega poblado) y caemos al código sólo
  // como fallback — así el mapa se pinta sin importar el esquema.
  const valoresPorCodigo = useMemo(
    () =>
      new Map(
        (data ?? []).flatMap((d) => {
          const divipola = aDivipolaDeptoFlexible(d.codigoDepartamento, d.departamento);
          return divipola ? [[divipola, d.valor] as const] : [];
        }),
      ),
    [data],
  );
  // Sólo construimos `coloresPorCodigo` cuando la data trae nivel_riesgo;
  // de lo contrario delegamos el coloreo al gradiente automático de
  // MapaBaseInner (colorScale sobre valoresPorCodigo).
  const coloresPorCodigo = useMemo(
    () =>
      usarGradiente
        ? undefined
        : new Map(
            (data ?? []).flatMap((d) => {
              const divipola = aDivipolaDeptoFlexible(d.codigoDepartamento, d.departamento);
              return divipola
                ? [[divipola, colorParaNivelRiesgo(d.nivelRiesgo, isDark)] as const]
                : [];
            }),
          ),
    [data, isDark, usarGradiente],
  );
  const etiquetasPorCodigo = useMemo(
    () =>
      new Map(
        (data ?? []).flatMap((d) => {
          const divipola = aDivipolaDeptoFlexible(d.codigoDepartamento, d.departamento);
          if (!divipola) return [];
          // Sin nivel_riesgo la línea de "Nivel de riesgo: Sin clasificar"
          // sólo añade ruido — la omitimos.
          if (!d.nivelRiesgo) return [];
          return [
            [
              divipola,
              `Nivel de riesgo: ${configNivelRiesgo(d.nivelRiesgo).label}`,
            ] as const,
          ];
        }),
      ),
    [data],
  );
  const detallesPorCodigo = useMemo(
    () =>
      new Map(
        (data ?? []).flatMap((d) => {
          const divipola = aDivipolaDeptoFlexible(d.codigoDepartamento, d.departamento);
          if (!divipola) return [];
          const lineas: string[] = [];
          if (d.observacion) {
            const obs = d.observacion.length > 140
              ? `${d.observacion.slice(0, 137)}…`
              : d.observacion;
            lineas.push(`Observación: ${escapeHtml(obs)}`);
          }
          return lineas.length > 0 ? [[divipola, lineas] as const] : [];
        }),
      ),
    [data],
  );

  // Niveles de riesgo únicos presentes (para la leyenda)
  const nivelesPresentes = useMemo(() => {
    const set = new Set<string>();
    (data ?? []).forEach((d) => {
      if (d.nivelRiesgo) set.add(d.nivelRiesgo);
    });
    return Array.from(set);
  }, [data]);

  const periodo = (data ?? [])[0]?.periodo ?? null;

  // Lookup DIVIPOLA → código tal como llegó del backend. Filtrar el
  // /por-departamento usando este valor garantiza que el backend encuentre
  // las filas (LPAD las normaliza), incluso si el esquema en
  // data_socioeconómica no es Registraduría sino DIVIPOLA o un alias.
  const codigoBackendPorDivipola = useMemo(() => {
    const m = new Map<string, string>();
    for (const d of data ?? []) {
      const divipola = aDivipolaDeptoFlexible(d.codigoDepartamento, d.departamento);
      if (divipola) m.set(divipola, d.codigoDepartamento);
    }
    return m;
  }, [data]);

  // Resaltado de la feature seleccionada — el store global puede guardar
  // tanto Registraduría como DIVIPOLA o el formato del backend. Probamos:
  //   1) match directo contra DIVIPOLA del GeoJSON,
  //   2) lookup en codigoBackendPorDivipola (data ya en pantalla),
  //   3) traducción Registraduría → DIVIPOLA.
  // Sólo aceptamos el resultado si pertenece a los 33 DIVIPOLA reales; de
  // lo contrario devolvemos null para no filtrar el mapa a un polígono
  // inexistente (lo que dejaría el viewport vacío).
  const codigoSeleccionadoDivipola = useMemo(() => {
    if (!codigoDepartamentoSeleccionado) return null;
    const norm = String(codigoDepartamentoSeleccionado).padStart(2, '0');
    if (DIVIPOLAS_DEPTO_VALIDOS.has(norm)) return norm;
    for (const k of codigoBackendPorDivipola.keys()) {
      if (k === norm) return k;
    }
    const traducido = aDivipolaDepto(codigoDepartamentoSeleccionado);
    if (traducido && DIVIPOLAS_DEPTO_VALIDOS.has(traducido)) return traducido;
    return null;
  }, [codigoDepartamentoSeleccionado, codigoBackendPorDivipola]);

  const onSeleccion = useCallback(
    (codigoDivipola: string) => {
      if (!onSeleccionarDepartamento) return;
      if (codigoSeleccionadoDivipola === codigoDivipola) {
        onSeleccionarDepartamento(null);
        return;
      }
      // Enviamos el código tal como vino del backend para ese departamento
      // (si está disponible). Esto asegura que el filtro /por-departamento
      // matchee con la fila correspondiente sin depender del esquema.
      const codigoBackend = codigoBackendPorDivipola.get(codigoDivipola);
      if (codigoBackend) {
        onSeleccionarDepartamento(codigoBackend);
        return;
      }
      // Fallback: si no tenemos data para ese polígono, intentamos
      // traducir DIVIPOLA → Registraduría.
      const registraduria = aRegistraduriaDepto(codigoDivipola);
      onSeleccionarDepartamento(registraduria ?? codigoDivipola);
    },
    [onSeleccionarDepartamento, codigoSeleccionadoDivipola, codigoBackendPorDivipola],
  );

  // Zoom automático sobre el departamento seleccionado: filtramos las
  // features al único polígono escogido, lo que dispara `FitBoundsToData`
  // dentro de MapaBaseInner y ajusta el viewport. Si no hay selección
  // mostramos todo el país.
  const filtroFeature = useCallback(
    (props: { [key: string]: unknown }) => {
      if (!codigoSeleccionadoDivipola) return true;
      return String(props.DPTO_CCDGO ?? '').padStart(2, '0') === codigoSeleccionadoDivipola;
    },
    [codigoSeleccionadoDivipola],
  );

  const fmtValor = useCallback(
    (v: number) => formatearValor(v, unidad),
    [unidad],
  );

  if (!filtro.dimension) {
    return (
      <EmptyState
        size="lg"
        title="Sin dimensión seleccionada"
        description="Elija una dimensión para visualizar el mapa de calor por departamento."
      />
    );
  }

  if (isLoading) {
    return <Skeleton className="h-[380px] w-full sm:h-[420px] lg:h-[460px]" />;
  }

  if (isError) {
    return (
      <EmptyState tone="danger" size="sm" description="Error al cargar el mapa." />
    );
  }

  if (!data || data.length === 0) {
    return (
      <EmptyState
        size="lg"
        description={`Sin datos para esta dimensión en ${filtro.fuentePublicacion ?? 'data_socioeconómica'}.`}
      />
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        {periodo !== null && (
          <p className="text-xs text-foreground-muted">
            Período: <span className="font-semibold text-foreground">{periodo}</span>
          </p>
        )}
        <p className="text-[11px] text-foreground-subtle">
          {fmtCount.format(data.length)} {data.length === 1 ? 'departamento' : 'departamentos'}
        </p>
      </div>

      <div className="map-wrapper h-[380px] border border-border bg-surface sm:h-[420px] lg:h-[460px]">
        <MapaBaseInner
          geoJsonUrl="/colombia-departamentos.geojson"
          propiedadCodigo="DPTO_CCDGO"
          propiedadNombre="DPTO_CNMBR"
          valoresPorCodigo={valoresPorCodigo}
          coloresPorCodigo={coloresPorCodigo}
          etiquetasPorCodigo={etiquetasPorCodigo}
          detallesPorCodigo={detallesPorCodigo}
          formatearValor={fmtValor}
          onSeleccion={onSeleccion}
          codigoSeleccionado={codigoSeleccionadoDivipola}
          filtroFeature={filtroFeature}
          tooltipLabel="Valor"
        />
      </div>

      {/* Leyenda — categórica por nivel de riesgo cuando aplica;
          gradiente por valor cuando la data no clasifica riesgo. */}
      {usarGradiente ? (
        <LeyendaGradiente
          data={data}
          unidad={unidad}
          fmt={fmtValor}
          isDark={isDark}
        />
      ) : (
        nivelesPresentes.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-foreground-muted">
              Nivel de riesgo:
            </span>
            {nivelesPresentes.map((c) => (
              <span key={c} className={badgeNivelRiesgoClass(c)}>
                <span
                  className="mr-1.5 inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: colorParaNivelRiesgo(c, isDark) }}
                />
                {configNivelRiesgo(c).label}
              </span>
            ))}
          </div>
        )
      )}
    </div>
  );
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Leyenda compacta para coloreo gradiente por valor — refleja exactamente
 * la escala que `MapaBaseInner.colorScale` aplica a los polígonos.
 */
function LeyendaGradiente({
  data,
  unidad,
  fmt,
  isDark,
}: {
  data: { valor: number }[] | undefined;
  unidad: string | null;
  fmt: (v: number) => string;
  isDark: boolean;
}) {
  if (!data || data.length === 0) return null;
  let min = Number.POSITIVE_INFINITY;
  let max = 0;
  for (const d of data) {
    if (d.valor < min) min = d.valor;
    if (d.valor > max) max = d.valor;
  }
  if (!Number.isFinite(min)) min = 0;
  // El mismo gradiente que pinta los polígonos: light gris-azul → navy
  // brand; dark navy profundo → sky brand.
  const gradiente = isDark
    ? 'linear-gradient(to right, rgb(56,68,102), rgb(129,183,230))'
    : 'linear-gradient(to right, rgb(226,230,240), rgb(49,63,105))';
  const sufijo = sufijoUnidad(unidad);
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium text-foreground-muted">
        Escala{sufijo ? ` (${sufijo})` : unidad ? ` (${unidad})` : ''}:
      </span>
      <div className="flex items-center gap-1.5">
        <span className="text-[11px] num-tabular text-foreground-muted">
          {fmt(min)}
        </span>
        <span
          className="h-2 w-28 rounded-full border border-border sm:w-40"
          style={{ background: gradiente }}
          aria-hidden
        />
        <span className="text-[11px] num-tabular text-foreground-muted">
          {fmt(max)}
        </span>
      </div>
    </div>
  );
}
