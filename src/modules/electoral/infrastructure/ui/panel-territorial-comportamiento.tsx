'use client';

import {
  useResumenElectoralFiltro,
  useVotosPorDepartamento,
  useVotosPorMunicipio,
  useVotosPorPuesto,
} from '@/modules/electoral/application/hooks';
import { useDepartamentos, useMunicipios } from '@/modules/geo/application/hooks';
import { useFiltrosGlobales } from '@/shared/application/stores/filtros-globales.store';
import { CardBody, CardHeader } from '@/shared/ui/components/card';
import { EmptyState } from '@/shared/ui/components/empty-state';
import { Skeleton } from '@/shared/ui/components/skeleton';
import { cn } from '@/shared/ui/utils/cn';
import { formatearTerritorio } from '@/shared/ui/utils/formatear-territorio';
import { Building, Globe2, MapPin, Target, Trophy } from 'lucide-react';
import { useMemo } from 'react';

const fmt = new Intl.NumberFormat('es-CO');

/**
 * Filas de cada top (departamentos, municipios, puestos). Se muestran
 * completas, sin contenedor con scroll, para que el ranking se lea de un
 * vistazo.
 */
const TOP = 13;

/**
 * Panel territorial adaptativo (vista Comportamiento Electoral).
 *
 * - Sin departamento     → Top 13 departamentos por votos + % de participación.
 * - Con departamento     → Top 13 municipios del departamento + % vs el total del depto.
 * - Con municipio        → Top 13 puestos de votación + radiales con la
 *                          participación del municipio frente al departamento
 *                          y al total nacional.
 */
export function PanelTerritorialComportamiento() {
  // Selectores granulares: este switch sólo depende de los códigos geo,
  // así que no debe re-renderizarse al cambiar partido o corporación.
  const codigoDepartamento = useFiltrosGlobales((s) => s.codigoDepartamento);
  const codigoMunicipio = useFiltrosGlobales((s) => s.codigoMunicipio);

  if (codigoMunicipio) return <PanelDetalleMunicipio />;
  if (codigoDepartamento) return <PanelMunicipios />;
  return <PanelDepartamentos />;
}

// ─────────────────────────────────────────────────────────────────────
// Top departamentos
// ─────────────────────────────────────────────────────────────────────

function PanelDepartamentos() {
  const { data, isLoading, isError } = useVotosPorDepartamento();

  const filas = useMemo(() => {
    const total = (data ?? []).reduce((acc, d) => acc + d.totalVotos, 0);
    return [...(data ?? [])]
      .sort((a, b) => b.totalVotos - a.totalVotos)
      .slice(0, TOP)
      .map((d) => ({
        id: d.codigoDepartamento,
        nombre: formatearTerritorio(d.nombreDepartamento),
        votos: d.totalVotos,
        pct: total > 0 ? (d.totalVotos / total) * 100 : 0,
      }));
  }, [data]);

  return (
    <>
      <CardHeader
        title={`Top ${TOP} departamentos`}
        description="Total de votos y % de participación"
        icon={Trophy}
      />
      <CardBody padding="none" className="flex-1">
        <ListaParticipacion
          filas={filas}
          isLoading={isLoading}
          isError={isError}
          emptyText="Sin votación registrada para los filtros activos."
        />
      </CardBody>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Top municipios del departamento
// ─────────────────────────────────────────────────────────────────────

function PanelMunicipios() {
  const codigoDepartamento = useFiltrosGlobales((s) => s.codigoDepartamento);
  const { data, isLoading, isError } = useVotosPorMunicipio();
  const { data: departamentos } = useDepartamentos();

  const nombreDepartamento = useMemo(() => {
    const n = departamentos?.find((d) => d.codigo === codigoDepartamento)?.nombre;
    return n ? formatearTerritorio(n) : undefined;
  }, [departamentos, codigoDepartamento]);

  const filas = useMemo(() => {
    const total = (data ?? []).reduce((acc, m) => acc + m.totalVotos, 0);
    return [...(data ?? [])]
      .sort((a, b) => b.totalVotos - a.totalVotos)
      .slice(0, TOP)
      .map((m) => ({
        id: `${m.codigoDepartamento}-${m.codigoMunicipio}`,
        nombre: formatearTerritorio(m.nombreMunicipio),
        votos: m.totalVotos,
        pct: total > 0 ? (m.totalVotos / total) * 100 : 0,
      }));
  }, [data]);

  return (
    <>
      <CardHeader
        title={`Top ${TOP} municipios`}
        description={
          nombreDepartamento
            ? `Distribución dentro de ${nombreDepartamento}`
            : 'Distribución dentro del departamento'
        }
        icon={Building}
      />
      <CardBody padding="none" className="flex-1">
        <ListaParticipacion
          filas={filas}
          isLoading={isLoading}
          isError={isError}
          emptyText="Sin votación municipal registrada."
        />
      </CardBody>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Detalle de un municipio: puestos + comparativos
// ─────────────────────────────────────────────────────────────────────

function PanelDetalleMunicipio() {
  const codigoCorporacion = useFiltrosGlobales((s) => s.codigoCorporacion);
  const codigoDepartamento = useFiltrosGlobales((s) => s.codigoDepartamento);
  const codigoMunicipio = useFiltrosGlobales((s) => s.codigoMunicipio);
  const codigoPartido = useFiltrosGlobales((s) => s.codigoPartido);

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

  const { data: puestos, isLoading: loadingPuestos, isError: errorPuestos } =
    useVotosPorPuesto();
  const { data: resumenMunicipio } = useResumenElectoralFiltro(filtroMunicipio);
  const { data: resumenDepartamento } = useResumenElectoralFiltro(filtroDepartamento);
  const { data: resumenNacional } = useResumenElectoralFiltro(filtroNacional);
  const { data: departamentos } = useDepartamentos();
  const { data: municipios } = useMunicipios(codigoDepartamento);

  const nombreDepartamento = useMemo(() => {
    const n = departamentos?.find((d) => d.codigo === codigoDepartamento)?.nombre;
    return n ? formatearTerritorio(n) : undefined;
  }, [departamentos, codigoDepartamento]);
  const nombreMunicipio = useMemo(() => {
    const n = municipios?.find((m) => m.codigo === codigoMunicipio)?.nombre;
    return n ? formatearTerritorio(n) : undefined;
  }, [municipios, codigoMunicipio]);

  const votosMunicipio = resumenMunicipio?.totalVotos ?? 0;
  const votosDepartamento = resumenDepartamento?.totalVotos ?? 0;
  const votosNacionales = resumenNacional?.totalVotos ?? 0;
  const pctDepartamento =
    votosDepartamento > 0 ? (votosMunicipio / votosDepartamento) * 100 : 0;
  const pctNacional = votosNacionales > 0 ? (votosMunicipio / votosNacionales) * 100 : 0;

  const totalPuestos = puestos?.length ?? 0;
  const filasPuestos = useMemo(() => {
    return [...(puestos ?? [])]
      .sort((a, b) => b.totalVotos - a.totalVotos)
      .slice(0, TOP)
      .map((p) => ({
        id: `${p.codigoDepartamento}-${p.codigoMunicipio}-${p.codigoPuesto}`,
        nombre: p.nombrePuesto,
        votos: p.totalVotos,
        pct: votosMunicipio > 0 ? (p.totalVotos / votosMunicipio) * 100 : 0,
      }));
  }, [puestos, votosMunicipio]);

  return (
    <>
      <CardHeader
        title={nombreMunicipio ? `Puestos de votación en ${nombreMunicipio}` : 'Puestos de votación'}
        description={
          nombreDepartamento ? `Detalle dentro de ${nombreDepartamento}` : 'Detalle del municipio'
        }
        icon={MapPin}
      />
      <CardBody className="flex-1 space-y-3">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <ParticipacionRadial
            tono="brand"
            icono={Target}
            etiqueta="vs Departamento"
            porcentaje={pctDepartamento}
            votosMunicipio={votosMunicipio}
            votosTotal={votosDepartamento}
          />
          <ParticipacionRadial
            tono="info"
            icono={Globe2}
            etiqueta="vs Total nacional"
            porcentaje={pctNacional}
            votosMunicipio={votosMunicipio}
            votosTotal={votosNacionales}
          />
        </div>

        <div className="rounded-lg border border-border">
          <div className="flex items-center justify-between border-b border-border px-3 py-2">
            <p className="text-[11px] font-medium text-foreground-muted">
              Top {TOP} puestos de votación
            </p>
            <p className="num-tabular text-[11px] text-foreground-subtle">
              {totalPuestos > filasPuestos.length
                ? `${filasPuestos.length} de ${fmt.format(totalPuestos)} puestos`
                : `${totalPuestos} ${totalPuestos === 1 ? 'puesto' : 'puestos'}`}
            </p>
          </div>
          <ListaParticipacion
            filas={filasPuestos}
            isLoading={loadingPuestos}
            isError={errorPuestos}
            emptyText="Sin información de puestos para este municipio."
          />
        </div>
      </CardBody>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Sub-componentes
// ─────────────────────────────────────────────────────────────────────

interface FilaParticipacion {
  id: string;
  nombre: string;
  votos: number;
  pct: number;
}

interface ListaParticipacionProps {
  filas: FilaParticipacion[];
  isLoading: boolean;
  isError: boolean;
  emptyText: string;
}

function ListaParticipacion({
  filas,
  isLoading,
  isError,
  emptyText,
}: ListaParticipacionProps) {
  if (isLoading) {
    return (
      <div className="space-y-2 p-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-full" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-3">
        <EmptyState tone="danger" size="sm" description="Error al cargar la información." />
      </div>
    );
  }

  if (filas.length === 0) {
    return (
      <div className="p-3">
        <EmptyState size="sm" description={emptyText} />
      </div>
    );
  }

  const max = filas[0]?.pct ?? 0;

  return (
    <div>
      <table className="w-full text-xs">
        <thead className="border-b border-border bg-surface-elevated/90 text-left label-eyebrow">
          <tr>
            <th className="w-9 px-3 py-2">#</th>
            <th className="px-3 py-2">Nombre</th>
            <th className="px-3 py-2 text-right">Votos</th>
            <th className="px-3 py-2 text-right">%</th>
            <th className="hidden w-24 px-3 py-2 sm:table-cell xl:w-28">Participación</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {filas.map((f, idx) => {
            const barPct = max > 0 ? (f.pct / max) * 100 : 0;
            return (
              <tr key={f.id} className="transition-colors hover:bg-surface-elevated/50">
                <td className="px-3 py-2 num-tabular text-foreground-subtle">{idx + 1}</td>
                {/* max-w-0 + w-full: la columna toma el ancho sobrante y el
                    nombre se trunca, sin desbordar la tarjeta. */}
                <td className="w-full max-w-0 px-3 py-2 font-medium text-foreground">
                  <span className="block truncate" title={f.nombre}>
                    {f.nombre}
                  </span>
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-right num-tabular text-foreground">
                  {fmt.format(f.votos)}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-right num-tabular text-foreground-muted">
                  {f.pct.toFixed(2)}%
                </td>
                <td className="hidden px-3 py-2 sm:table-cell">
                  <div
                    className="h-1.5 w-full overflow-hidden rounded-full bg-surface-elevated"
                    role="progressbar"
                    aria-valuenow={Number(f.pct.toFixed(2))}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <div
                      className="h-full rounded-full bg-brand transition-all duration-500"
                      style={{ width: `${Math.min(100, barPct)}%` }}
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

type Tono = 'brand' | 'info';

const TONO_CLASSES: Record<Tono, { stroke: string; pill: string }> = {
  brand: { stroke: 'text-brand', pill: 'bg-brand-muted text-brand' },
  info: { stroke: 'text-info', pill: 'bg-info-muted text-info' },
};

interface ParticipacionRadialProps {
  tono: Tono;
  icono: typeof Target;
  etiqueta: string;
  porcentaje: number;
  votosMunicipio: number;
  votosTotal: number;
}

function ParticipacionRadial({
  tono,
  icono: Icono,
  etiqueta,
  porcentaje,
  votosMunicipio,
  votosTotal,
}: ParticipacionRadialProps) {
  const cls = TONO_CLASSES[tono];
  const pct = Math.max(0, Math.min(100, porcentaje));
  const size = 64;
  const stroke = 7;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - pct / 100);

  return (
    <div className="flex items-center gap-2.5 rounded-lg border border-border bg-surface px-3 py-2.5">
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
            stroke="currentColor"
            className={cn('transition-[stroke-dashoffset] duration-700 ease-out', cls.stroke)}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="num-tabular text-[11px] font-bold tracking-tight text-foreground">
            {pct >= 10 ? pct.toFixed(1) : pct.toFixed(2)}%
          </span>
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              'flex h-4 w-4 shrink-0 items-center justify-center rounded',
              cls.pill,
            )}
          >
            <Icono size={10} />
          </span>
          <p className="truncate text-xs font-medium text-foreground-muted">
            {etiqueta}
          </p>
        </div>
        <p className="mt-0.5 num-tabular text-[11px] text-foreground-subtle">
          {fmt.format(votosMunicipio)}
          <span className="text-foreground-subtle"> / </span>
          {fmt.format(votosTotal)}
        </p>
      </div>
    </div>
  );
}
