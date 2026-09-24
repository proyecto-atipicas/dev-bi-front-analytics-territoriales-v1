'use client';

import { useCorporaciones } from '@/modules/catalogos/application/hooks';
import { useFiltrosGlobales } from '@/shared/application/stores/filtros-globales.store';
import { Skeleton } from '@/shared/ui/components/skeleton';
import { ArrowLeftRight, Award, UserCheck } from 'lucide-react';
import { useResumenElectoral } from '../../application/hooks';
import { formatearCorporacion } from './corporacion-utils';
import { visualParaCorporacion } from './tarjeta-corporacion';

const fmt = new Intl.NumberFormat('es-CO');

/**
 * Tarjeta compacta de la elección seleccionada para la columna lateral del
 * Home: nombre de la corporación, total de votos y el desglose mínimo
 * (candidatos y partidos). El Home es un resumen; el detalle territorial
 * completo vive en Comportamiento electoral.
 */
export function TarjetaEleccionActiva() {
  const codigoCorporacion = useFiltrosGlobales((s) => s.codigoCorporacion);
  const setCorporacion = useFiltrosGlobales((s) => s.setCorporacion);
  const { data: datos, isLoading, isPlaceholderData } = useResumenElectoral();
  // Con keepPreviousData la consulta devuelve las cifras de la elección o el
  // ámbito anterior mientras llega la nueva (hasta varios segundos en las
  // territoriales): mostrarlas bajo el nombre nuevo sería engañoso.
  const resumen = isPlaceholderData ? undefined : datos;
  const { data: corporaciones } = useCorporaciones();

  const corporacion = corporaciones?.find((c) => c.codigo === codigoCorporacion);
  const etiqueta = corporacion ? formatearCorporacion(corporacion.nombre).etiqueta : 'Elección';
  const { icon: Icon } = visualParaCorporacion(corporacion?.nombre ?? '');

  return (
    <section
      aria-label="Elección seleccionada"
      className="overflow-hidden rounded-xl border border-border/80 bg-surface shadow-panel"
    >
      {/* Encabezado: nombre de la corporación sobre el navy de marca */}
      <header className="relative flex items-center justify-center gap-2 bg-chrome px-12 py-3 text-chrome-foreground">
        <Icon size={15} className="shrink-0 text-flag-yellow" aria-hidden />
        <h2 className="truncate text-sm font-semibold" title={etiqueta}>
          {etiqueta}
        </h2>
        <button
          type="button"
          onClick={() => setCorporacion(null)}
          className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-chrome-muted transition-colors hover:bg-chrome-foreground/10 hover:text-chrome-foreground"
          aria-label="Cambiar elección"
          title="Cambiar elección"
        >
          <ArrowLeftRight size={15} />
        </button>
      </header>
      <span className="flag-rule block h-[3px] rounded-none" aria-hidden />

      {/* Total de votos */}
      <div className="px-4 py-5 text-center">
        {isLoading || !resumen ? (
          <Skeleton className="mx-auto h-10 w-48" />
        ) : (
          <p className="font-display text-[34px] font-extrabold leading-none tabular-nums text-foreground">
            {fmt.format(resumen.totalVotos)}
          </p>
        )}
        <p className="mt-2 text-xs font-medium text-foreground-muted">Total de votos</p>
      </div>

      {/* Desglose: candidatos y partidos */}
      <div className="grid grid-cols-2 divide-x divide-border/70 border-t border-border/70 bg-background/50">
        {[
          { label: 'Candidatos', valor: resumen?.totalCandidatos, icon: UserCheck },
          { label: 'Partidos', valor: resumen?.totalPartidos, icon: Award },
        ].map(({ label, valor, icon: IconoCifra }) => (
          <div key={label} className="flex items-center justify-center gap-2.5 px-3 py-3">
            <IconoCifra size={17} className="shrink-0 text-brand" aria-hidden />
            <div className="leading-tight">
              <div className="font-display text-lg font-bold tabular-nums text-foreground">
                {valor === undefined ? <Skeleton className="my-1 h-5 w-8" /> : fmt.format(valor)}
              </div>
              <p className="text-xs text-foreground-muted">{label}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
