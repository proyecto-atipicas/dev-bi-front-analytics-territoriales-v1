'use client';

import { useCorporaciones, usePartidos } from '@/modules/catalogos/application/hooks';
import { useDepartamentos, useMunicipios } from '@/modules/geo/application/hooks';
import { useFiltrosGlobales } from '@/shared/application/stores/filtros-globales.store';
import { Skeleton } from '@/shared/ui/components/skeleton';
import { cn } from '@/shared/ui/utils/cn';
import { formatearTerritorio } from '@/shared/ui/utils/formatear-territorio';
import { ArrowLeftRight, Flag, MapPin } from 'lucide-react';
import { useResumenElectoral } from '../../application/hooks';
import { formatearCorporacion } from './corporacion-utils';

const fmt = new Intl.NumberFormat('es-CO');

/**
 * Cabecera de contexto de las vistas electorales: qué elección se está
 * analizando, en qué ámbito territorial, y sus cifras principales en una sola
 * tira. Sustituye a la fila de KPIs sueltos para que el usuario lea primero
 * "qué estoy viendo" y después "cuánto".
 */
export function ResumenEleccion() {
  const filtros = useFiltrosGlobales();
  const { data: datos, isLoading: cargandoPrimera, isPlaceholderData } = useResumenElectoral();
  // Cifras de la combinación de filtros anterior: se muestran como carga.
  const resumen = isPlaceholderData ? undefined : datos;
  const isLoading = cargandoPrimera || isPlaceholderData;
  const { data: corporaciones } = useCorporaciones();
  const { data: departamentos } = useDepartamentos();
  const { data: municipios } = useMunicipios(filtros.codigoDepartamento);
  const { data: partidos } = usePartidos(filtros.codigoCorporacion);

  const corporacion = corporaciones?.find((c) => c.codigo === filtros.codigoCorporacion);
  const nombre = corporacion ? formatearCorporacion(corporacion.nombre) : null;

  const depto = departamentos?.find((d) => d.codigo === filtros.codigoDepartamento);
  const muni = municipios?.find((m) => m.codigo === filtros.codigoMunicipio);
  const partido = partidos?.find((p) => p.codigo === filtros.codigoPartido);

  const ambito = [
    'Colombia',
    depto ? formatearTerritorio(depto.nombre) : null,
    muni ? formatearTerritorio(muni.nombre) : null,
  ].filter(Boolean) as string[];

  const cifras: { label: string; valor: number | undefined }[] = [
    { label: 'Candidatos', valor: resumen?.totalCandidatos },
    { label: 'Partidos', valor: resumen?.totalPartidos },
    { label: 'Departamentos', valor: resumen?.totalDepartamentos },
    { label: 'Municipios', valor: resumen?.totalMunicipios },
    { label: 'Puestos', valor: resumen?.totalPuestos },
  ];

  return (
    <section
      aria-label="Elección analizada"
      className="overflow-hidden rounded-xl border border-border/80 bg-surface shadow-panel"
    >
      {/* Dos columnas sólo desde xl: en lg el bloque navy quedaba en ~260px
          y el total de votos se salía sobre las cifras vecinas. */}
      <div className="grid xl:grid-cols-[minmax(0,1.1fr)_minmax(0,2fr)]">
        {/* Identidad de la elección + total de votos */}
        <div className="relative flex flex-col justify-between gap-5 bg-chrome p-5 text-chrome-foreground sm:p-6">
          <div>
            <div className="flex items-start justify-between gap-3">
              <span className="flag-rule flag-rule-on-chrome block w-12" aria-hidden />
              <button
                type="button"
                onClick={() => filtros.setCorporacion(null)}
                className="-mr-2 -mt-2 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-chrome-muted transition-colors hover:bg-chrome-foreground/10 hover:text-chrome-foreground"
              >
                <ArrowLeftRight size={14} />
                Cambiar elección
              </button>
            </div>
            <p className="mt-4 text-sm text-chrome-muted">
              {nombre?.familia ?? 'Elección'}
            </p>
            <h2 className="font-display mt-0.5 text-xl font-bold leading-snug sm:text-2xl">
              {nombre
                ? [nombre.detalle, nombre.anio].filter(Boolean).join(' ') || nombre.familia
                : '—'}
            </h2>
          </div>

          <div>
            <p className="text-sm text-chrome-muted">Votos registrados</p>
            {isLoading || !resumen ? (
              <Skeleton className="mt-1 h-10 w-48 bg-chrome-foreground/10 dark:bg-chrome-foreground/10" />
            ) : (
              <p className="font-display mt-0.5 text-4xl font-extrabold tabular-nums leading-none sm:text-[44px] xl:text-[40px] 2xl:text-[44px]">
                {fmt.format(resumen.totalVotos)}
              </p>
            )}
          </div>
        </div>

        {/* Ámbito + cifras de apoyo */}
        <div className="flex flex-col">
          <div className="flex flex-wrap items-center gap-2 border-b border-border/70 px-5 py-3.5 sm:px-6">
            <span className="text-sm text-foreground-muted">Ámbito</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-muted/70 px-2.5 py-1 text-xs font-semibold text-brand">
              <MapPin size={13} aria-hidden />
              {ambito.join(' / ')}
            </span>
            {partido && (
              <span className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-warning-muted px-2.5 py-1 text-xs font-semibold text-foreground">
                <Flag size={13} className="shrink-0 text-warning" aria-hidden />
                <span className="truncate">{partido.nombre}</span>
              </span>
            )}
          </div>

          {/* gap-px sobre fondo de borde = divisores de 1px en cualquier
              breakpoint; la última cifra se estira para no dejar huecos. */}
          <dl className="grid flex-1 grid-cols-2 gap-px bg-border/70 sm:grid-cols-3 xl:grid-cols-5">
            {cifras.map((c, i) => (
              <div
                key={c.label}
                className={cn(
                  'flex flex-col justify-center gap-1 bg-surface px-5 py-4 sm:px-6',
                  i === cifras.length - 1 && 'col-span-2 xl:col-span-1',
                )}
              >
                <dt className="text-xs font-medium text-foreground-muted">{c.label}</dt>
                <dd className="font-display text-2xl font-bold tabular-nums text-foreground">
                  {isLoading || c.valor === undefined ? (
                    <Skeleton className="h-7 w-16" />
                  ) : (
                    fmt.format(c.valor)
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
