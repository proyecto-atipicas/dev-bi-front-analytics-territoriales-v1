'use client';

import { ResumenCorporacion } from '@/modules/electoral/domain/entities';
import { useFiltrosGlobales } from '@/shared/application/stores/filtros-globales.store';
import { EmptyState } from '@/shared/ui/components/empty-state';
import { Skeleton } from '@/shared/ui/components/skeleton';
import { useMemo } from 'react';
import { useResumenPorCorporacion } from '../../application/hooks';
import { formatearCorporacion } from './corporacion-utils';
import { TarjetaCorporacion } from './tarjeta-corporacion';

export interface SelectorCorporacionProps {
  /**
   * Texto opcional que describe el contexto: "el resumen ejecutivo",
   * "el panel electoral", etc. Aparece en el subtítulo.
   */
  contextoVista?: string;
}

interface GrupoEleccion {
  familia: string;
  items: ResumenCorporacion[];
  /** Año más reciente del grupo: ordena los grupos de lo nuevo a lo viejo. */
  anioMax: number;
}

/**
 * Vista inicial que se muestra cuando aún no se ha seleccionado corporación.
 * Las corporaciones no se pueden mezclar — esta puerta de entrada fuerza al
 * usuario a elegir una para garantizar consistencia en los cruces de datos.
 * Se agrupan por tipo de elección y se ordenan por año para que encontrar
 * "la presidencial de 2022" no exija leer toda la lista.
 */
export function SelectorCorporacion({ contextoVista }: SelectorCorporacionProps) {
  const setCorporacion = useFiltrosGlobales((s) => s.setCorporacion);
  const { data, isLoading, isError } = useResumenPorCorporacion();

  const grupos = useMemo<GrupoEleccion[]>(() => {
    const porFamilia = new Map<string, GrupoEleccion>();
    for (const c of data ?? []) {
      const { familia, anio } = formatearCorporacion(c.nombreCorporacion);
      const g = porFamilia.get(familia) ?? { familia, items: [], anioMax: 0 };
      g.items.push(c);
      g.anioMax = Math.max(g.anioMax, anio ?? 0);
      porFamilia.set(familia, g);
    }
    const anioDe = (c: ResumenCorporacion) =>
      formatearCorporacion(c.nombreCorporacion).anio ?? 0;
    return Array.from(porFamilia.values())
      .map((g) => ({
        ...g,
        items: [...g.items].sort(
          (a, b) =>
            anioDe(b) - anioDe(a) || a.nombreCorporacion.localeCompare(b.nombreCorporacion),
        ),
      }))
      .sort(
        (a, b) =>
          b.anioMax - a.anioMax ||
          b.items.length - a.items.length ||
          a.familia.localeCompare(b.familia),
      );
  }, [data]);

  return (
    <div className="space-y-8 animate-fade-in">
      <header className="max-w-2xl">
        <span className="flag-rule block w-14" aria-hidden />
        <h2 className="font-display mt-4 text-2xl font-bold text-foreground sm:text-[28px]">
          Elija la elección que quiere analizar
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-foreground-muted sm:text-base">
          Cada elección se analiza por separado para que las cifras sean comparables.
          Al elegir una se abre {contextoVista ?? 'el análisis'}; puede cambiarla en
          cualquier momento desde el filtro de corporación.
        </p>
      </header>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      ) : isError ? (
        <EmptyState
          tone="danger"
          title="No se pudieron cargar las elecciones"
          description="Revise su conexión y recargue la página."
        />
      ) : grupos.length === 0 ? (
        <EmptyState
          title="Aún no hay elecciones con datos"
          description="Cuando se carguen resultados electorales aparecerán aquí."
        />
      ) : (
        grupos.map((g) => {
          const idGrupo = `grupo-${g.familia.toLowerCase().replace(/\s+/g, '-')}`;
          return (
            <section key={g.familia} aria-labelledby={idGrupo} className="space-y-3">
              <div className="flex items-baseline gap-3">
                <h3
                  id={idGrupo}
                  className="font-display text-lg font-bold text-foreground"
                >
                  {g.familia}
                </h3>
                <span className="text-sm text-foreground-muted">
                  {g.items.length} {g.items.length === 1 ? 'elección' : 'elecciones'}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {g.items.map((c) => (
                  <TarjetaCorporacion
                    key={c.codigoCorporacion}
                    resumen={c}
                    onClick={() => setCorporacion(c.codigoCorporacion)}
                  />
                ))}
              </div>
            </section>
          );
        })
      )}
    </div>
  );
}
