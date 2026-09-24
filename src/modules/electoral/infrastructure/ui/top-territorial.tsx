'use client';

import {
  useResumenElectoralFiltro,
  useVotosPorDepartamento,
  useVotosPorMunicipio,
} from '@/modules/electoral/application/hooks';
import { useDepartamentos } from '@/modules/geo/application/hooks';
import { useFiltrosGlobales } from '@/shared/application/stores/filtros-globales.store';
import { Card, CardBody, CardHeader } from '@/shared/ui/components/card';
import { EmptyState } from '@/shared/ui/components/empty-state';
import { Skeleton } from '@/shared/ui/components/skeleton';
import { cn } from '@/shared/ui/utils/cn';
import { formatearTerritorio } from '@/shared/ui/utils/formatear-territorio';
import { Globe2, MapPin, PieChart, Target, Trophy } from 'lucide-react';
import { useLayoutEffect, useMemo, useRef, useState } from 'react';

const fmt = new Intl.NumberFormat('es-CO');

export interface TopTerritorialProps {
  /**
   * Filas visibles sin desplazarse. El listado incluye todos los territorios;
   * el resto se alcanza con scroll (barra oculta). Default 10.
   */
  filasVisibles?: number;
}

/**
 * Top territorial adaptativo.
 *
 * - Sin departamento: ranking de departamentos por votación nacional.
 * - Con departamento: ranking de municipios del departamento seleccionado.
 *   En ambos casos se ven las primeras N filas y el resto se desplaza.
 * - Con municipio: oculta el listado (la votación del municipio ya se muestra
 *   en el resumen superior) y en su lugar muestra el aporte del municipio
 *   frente a su departamento y al total nacional.
 */
export function TopTerritorial({ filasVisibles = 10 }: TopTerritorialProps) {
  const codigoCorporacion = useFiltrosGlobales((s) => s.codigoCorporacion);
  const codigoDepartamento = useFiltrosGlobales((s) => s.codigoDepartamento);
  const codigoMunicipio = useFiltrosGlobales((s) => s.codigoMunicipio);
  const codigoPartido = useFiltrosGlobales((s) => s.codigoPartido);
  const setDepartamento = useFiltrosGlobales((s) => s.setDepartamento);
  const setMunicipio = useFiltrosGlobales((s) => s.setMunicipio);

  const enModoMunicipioSeleccionado = !!codigoMunicipio;
  const enModoMunicipal = !enModoMunicipioSeleccionado && !!codigoDepartamento;

  if (enModoMunicipioSeleccionado) {
    return (
      <ParticipacionMunicipio
        codigoCorporacion={codigoCorporacion}
        codigoDepartamento={codigoDepartamento}
        codigoMunicipio={codigoMunicipio}
        codigoPartido={codigoPartido}
      />
    );
  }

  return (
    <ListadoTerritorial
      enModoMunicipal={enModoMunicipal}
      filasVisibles={filasVisibles}
      onSelectDepartamento={setDepartamento}
      onSelectMunicipio={setMunicipio}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────
// Listado top departamentos / municipios (comportamiento original)
// ─────────────────────────────────────────────────────────────────────

interface ListadoTerritorialProps {
  enModoMunicipal: boolean;
  filasVisibles: number;
  onSelectDepartamento: (codigo: string) => void;
  onSelectMunicipio: (codigo: string | null) => void;
}

function ListadoTerritorial({
  enModoMunicipal,
  filasVisibles,
  onSelectDepartamento,
  onSelectMunicipio,
}: ListadoTerritorialProps) {
  const codigoMunicipio = useFiltrosGlobales((s) => s.codigoMunicipio);

  const {
    data: departamentos,
    isLoading: loadingDep,
    isError: errorDep,
  } = useVotosPorDepartamento();
  const {
    data: municipios,
    isLoading: loadingMun,
    isError: errorMun,
  } = useVotosPorMunicipio();

  const filas = useMemo(() => {
    if (enModoMunicipal) {
      return [...(municipios ?? [])]
        .sort((a, b) => b.totalVotos - a.totalVotos)
        .map((m) => ({
          id: `${m.codigoDepartamento}-${m.codigoMunicipio}`,
          codigo: m.codigoMunicipio,
          nombre: formatearTerritorio(m.nombreMunicipio),
          votos: m.totalVotos,
          activo: codigoMunicipio === m.codigoMunicipio,
        }));
    }
    return [...(departamentos ?? [])]
      .sort((a, b) => b.totalVotos - a.totalVotos)
      .map((d) => ({
        id: d.codigoDepartamento,
        codigo: d.codigoDepartamento,
        nombre: formatearTerritorio(d.nombreDepartamento),
        votos: d.totalVotos,
        activo: false,
      }));
  }, [enModoMunicipal, departamentos, municipios, codigoMunicipio]);

  const max = filas[0]?.votos ?? 1;
  const isLoading = enModoMunicipal ? loadingMun : loadingDep;
  const isError = enModoMunicipal ? errorMun : errorDep;

  // Alto del área desplazable = alto real de las primeras `filasVisibles`
  // filas, medido tras pintar (las filas no tienen alto fijo en CSS).
  const listaRef = useRef<HTMLOListElement>(null);
  const [altoVisible, setAltoVisible] = useState<number | undefined>(undefined);
  const [hayMasAbajo, setHayMasAbajo] = useState(false);

  useLayoutEffect(() => {
    const lista = listaRef.current;
    if (!lista) return;
    const items = Array.from(lista.children).slice(0, filasVisibles) as HTMLElement[];
    const alto = items.reduce((acc, li) => acc + li.offsetHeight, 0);
    setAltoVisible(filas.length > filasVisibles ? alto : undefined);
    lista.scrollTop = 0;
    setHayMasAbajo(filas.length > filasVisibles);
  }, [filas, filasVisibles]);

  const onScroll = () => {
    const lista = listaRef.current;
    if (!lista) return;
    setHayMasAbajo(lista.scrollTop + lista.clientHeight < lista.scrollHeight - 2);
  };

  const ambito = enModoMunicipal
    ? 'por votación en el departamento'
    : 'por votación nacional';
  const descripcion =
    filas.length > 0
      ? `${fmt.format(filas.length)} ${enModoMunicipal ? 'municipios' : 'departamentos'}, ${ambito}`
      : ambito.charAt(0).toUpperCase() + ambito.slice(1);

  const handleClick = (codigo: string, activo: boolean) => {
    if (enModoMunicipal) {
      onSelectMunicipio(activo ? null : codigo);
    } else {
      onSelectDepartamento(codigo);
    }
  };

  return (
    <Card className="flex h-full flex-col">
      <CardHeader
        title={enModoMunicipal ? 'Ranking de municipios' : 'Ranking de departamentos'}
        description={descripcion}
        icon={Trophy}
        dense
      />
      <CardBody padding="none" className="flex-1">
        {isLoading ? (
          <div className="space-y-2 p-3">
            {Array.from({ length: filasVisibles }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-full" />
            ))}
          </div>
        ) : isError ? (
          <div className="p-3">
            <EmptyState tone="danger" size="sm" description="Error al cargar el ranking." />
          </div>
        ) : filas.length === 0 ? (
          <div className="p-3">
            <EmptyState
              size="sm"
              description={
                enModoMunicipal
                  ? 'Sin municipios con votación en este departamento.'
                  : 'Sin votación registrada.'
              }
            />
          </div>
        ) : (
          <div className="relative">
            <ol
              ref={listaRef}
              onScroll={onScroll}
              style={{ maxHeight: altoVisible }}
              className="scrollbar-oculto divide-y divide-border overflow-y-auto overscroll-contain"
              aria-label={enModoMunicipal ? 'Ranking de municipios' : 'Ranking de departamentos'}
            >
              {filas.map((f, idx) => {
                const pct = (f.votos / max) * 100;
                return (
                  <li key={f.id}>
                    <button
                      type="button"
                      onClick={() => handleClick(f.codigo, f.activo)}
                      className={
                        'group flex w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-surface-elevated/60 focus:outline-none focus-visible:bg-surface-elevated' +
                        (f.activo ? ' bg-brand-muted/40' : '')
                      }
                      title={enModoMunicipal ? 'Filtrar por municipio' : 'Filtrar por departamento'}
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-elevated text-[11px] font-bold text-foreground-muted group-hover:bg-brand group-hover:text-brand-foreground">
                        {idx + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <span className="truncate font-medium text-foreground" title={f.nombre}>
                            {f.nombre}
                          </span>
                          <span className="shrink-0 num-tabular font-semibold text-foreground">
                            {fmt.format(f.votos)}
                          </span>
                        </div>
                        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-surface-elevated">
                          <div
                            className="h-full rounded-full bg-brand transition-all duration-500"
                            style={{ width: `${Math.min(100, pct)}%` }}
                          />
                        </div>
                      </div>
                      <MapPin
                        size={13}
                        className="shrink-0 text-foreground-subtle transition-colors group-hover:text-brand"
                        aria-hidden
                      />
                    </button>
                  </li>
                );
              })}
            </ol>
            {/* Sin barra visible, el degradado indica que la lista continúa. */}
            <div
              className={cn(
                'pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-surface to-transparent transition-opacity duration-200',
                hayMasAbajo ? 'opacity-100' : 'opacity-0',
              )}
              aria-hidden
            />
          </div>
        )}
      </CardBody>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Vista de aporte territorial cuando hay un municipio seleccionado
// ─────────────────────────────────────────────────────────────────────

interface ParticipacionMunicipioProps {
  codigoCorporacion: string | null;
  codigoDepartamento: string | null;
  codigoMunicipio: string | null;
  codigoPartido: string | null;
}

function ParticipacionMunicipio({
  codigoCorporacion,
  codigoDepartamento,
  codigoMunicipio,
  codigoPartido,
}: ParticipacionMunicipioProps) {
  const filtroMunicipio = {
    codigoCorporacion,
    codigoDepartamento,
    codigoMunicipio,
    codigoPartido,
  };
  const filtroDepartamento = { ...filtroMunicipio, codigoMunicipio: null };
  const filtroNacional = {
    ...filtroMunicipio,
    codigoDepartamento: null,
    codigoMunicipio: null,
  };

  const { data: resumenMunicipio, isLoading: loadingMuni, isError: errorMuni } =
    useResumenElectoralFiltro(filtroMunicipio);
  const { data: resumenDepartamento, isLoading: loadingDept, isError: errorDept } =
    useResumenElectoralFiltro(filtroDepartamento);
  const { data: resumenNacional, isLoading: loadingNac, isError: errorNac } =
    useResumenElectoralFiltro(filtroNacional);

  const { data: departamentos } = useDepartamentos();

  const nombreDepartamento = useMemo(
    () => {
      const n = departamentos?.find((d) => d.codigo === codigoDepartamento)?.nombre;
      return n ? formatearTerritorio(n) : undefined;
    },
    [departamentos, codigoDepartamento],
  );

  const isLoading = loadingMuni || loadingDept || loadingNac;
  const isError = errorMuni || errorDept || errorNac;

  const votosMunicipio = resumenMunicipio?.totalVotos ?? 0;
  const votosDepartamento = resumenDepartamento?.totalVotos ?? 0;
  const votosNacionales = resumenNacional?.totalVotos ?? 0;

  const pctDepartamento =
    votosDepartamento > 0 ? (votosMunicipio / votosDepartamento) * 100 : 0;
  const pctNacional = votosNacionales > 0 ? (votosMunicipio / votosNacionales) * 100 : 0;

  return (
    <Card className="flex h-full flex-col">
      <CardHeader
        title="Aporte del municipio"
        description="Participación frente al departamento y al total nacional"
        icon={PieChart}
        dense
      />
      <CardBody padding="md" className="flex-1">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : isError ? (
          <EmptyState tone="danger" size="sm" description="Error al cargar el aporte del municipio." />
        ) : votosMunicipio === 0 ? (
          <EmptyState size="sm" description="Sin votación registrada para este municipio." />
        ) : (
          <div className="flex h-full flex-col gap-3">
            <ParticipacionFila
              tono="brand"
              icono={Target}
              etiqueta="Aporte departamental"
              ambito={nombreDepartamento ?? 'el departamento'}
              porcentaje={pctDepartamento}
              votosMunicipio={votosMunicipio}
              votosTotal={votosDepartamento}
            />

            <ParticipacionFila
              tono="info"
              icono={Globe2}
              etiqueta="Aporte nacional"
              ambito="el total nacional"
              porcentaje={pctNacional}
              votosMunicipio={votosMunicipio}
              votosTotal={votosNacionales}
            />
          </div>
        )}
      </CardBody>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Sub-componentes visuales
// ─────────────────────────────────────────────────────────────────────

type Tono = 'brand' | 'info';

const TONO_CLASSES: Record<Tono, { stroke: string; bg: string; pill: string }> = {
  brand: {
    stroke: 'text-brand',
    bg: 'bg-brand',
    pill: 'bg-brand-muted text-brand',
  },
  info: {
    stroke: 'text-info',
    bg: 'bg-info',
    pill: 'bg-info-muted text-info',
  },
};

interface ParticipacionFilaProps {
  tono: Tono;
  icono: typeof Target;
  etiqueta: string;
  ambito: string;
  porcentaje: number;
  votosMunicipio: number;
  votosTotal: number;
}

function ParticipacionFila({
  tono,
  icono: Icono,
  etiqueta,
  ambito,
  porcentaje,
  votosMunicipio,
  votosTotal,
}: ParticipacionFilaProps) {
  const cls = TONO_CLASSES[tono];
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-surface px-3 py-2.5">
      <RadialProgress value={porcentaje} tono={tono} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              'flex h-5 w-5 shrink-0 items-center justify-center rounded-md',
              cls.pill,
            )}
          >
            <Icono size={11} />
          </span>
          <p className="truncate text-[11px] font-medium text-foreground-muted">
            {etiqueta}
          </p>
        </div>
        <p className="mt-1 truncate text-[11px] text-foreground-muted">
          frente a <span className="text-foreground">{ambito}</span>
        </p>
        <p className="mt-1 num-tabular text-[11px] text-foreground-subtle">
          {fmt.format(votosMunicipio)}
          <span className="text-foreground-subtle"> / </span>
          {fmt.format(votosTotal)}
        </p>
      </div>
    </div>
  );
}

interface RadialProgressProps {
  value: number;
  tono: Tono;
  size?: number;
  stroke?: number;
}

function RadialProgress({ value, tono, size = 72, stroke = 8 }: RadialProgressProps) {
  const cls = TONO_CLASSES[tono];
  const pct = Math.max(0, Math.min(100, value));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - pct / 100);
  const display = pct >= 10 ? pct.toFixed(1) : pct.toFixed(2);

  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${pct.toFixed(2)} por ciento`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          strokeWidth={stroke}
          className="stroke-surface-elevated"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          className={cn(
            'transition-[stroke-dashoffset] duration-700 ease-out',
            cls.stroke,
          )}
          stroke="currentColor"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="num-tabular text-sm font-bold tracking-tight text-foreground">
          {display}%
        </span>
      </div>
    </div>
  );
}
