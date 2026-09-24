'use client';

import {
  useRankingCandidatos,
  useTerritoriosGanados,
} from '@/modules/electoral/application/hooks';
import { KpisTerritoriosGanados } from '@/modules/electoral/infrastructure/ui/territorios-ganados/kpis-territorios-ganados';
import { PanelSeleccionTerritorios } from '@/modules/electoral/infrastructure/ui/territorios-ganados/panel-seleccion-territorios';
import { TablaTerritoriosGanados } from '@/modules/electoral/infrastructure/ui/territorios-ganados/tabla-territorios-ganados';
import { useFiltrosTerritoriosGanados } from '@/modules/electoral/infrastructure/ui/territorios-ganados/filtros-territorios-ganados-store';
import { useFiltrosGlobales } from '@/shared/application/stores/filtros-globales.store';
import { Card, CardBody, CardHeader } from '@/shared/ui/components/card';
import { EmptyState } from '@/shared/ui/components/empty-state';
import { Skeleton } from '@/shared/ui/components/skeleton';
import { formatearNombrePersona } from '@/shared/ui/utils/formatear-territorio';
import { ChevronRight, Table as TableIcon, UserCheck } from 'lucide-react';

const fmt = new Intl.NumberFormat('es-CO');

export default function TerritoriosGanadosPage() {
  const codigoCorporacion = useFiltrosGlobales((s) => s.codigoCorporacion);
  const nivel = useFiltrosTerritoriosGanados((s) => s.nivel);
  const seleccion = useFiltrosTerritoriosGanados((s) => s.seleccion);

  const filtro = {
    tipo: 'candidato' as const,
    nivel,
    codigoCorporacion: codigoCorporacion ?? undefined,
    codigo: seleccion?.codigo ?? undefined,
    codigoPartido: seleccion?.codigoPartido ?? null,
  };

  const seleccionValida = !!seleccion?.codigo && !!seleccion.codigoPartido;
  const haySeleccionCompleta = !!(codigoCorporacion && seleccionValida);

  const { data: resultado, isLoading, isError } = useTerritoriosGanados(filtro);

  const etiquetaTerritorios = nivel === 'departamento' ? 'departamentos' : 'municipios';
  const encabezadoTabla = `Territorios donde fue el más votado (${etiquetaTerritorios})`;

  return (
    <div className="space-y-5 animate-fade-in">
      <PanelSeleccionTerritorios />

      {!haySeleccionCompleta ? (
        codigoCorporacion ? (
          <SugerenciasCandidato />
        ) : (
          <Card>
            <CardBody>
              <EmptyState
                tone="info"
                title="Elija una elección"
                description="Seleccione una corporación en los filtros generales para ver sus candidatos."
              />
            </CardBody>
          </Card>
        )
      ) : isLoading ? (
        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
          <Skeleton className="h-[420px] w-full" />
        </div>
      ) : isError ? (
        <Card>
          <CardBody>
            <EmptyState
              tone="danger"
              title="Error al cargar el análisis"
              description="Vuelva a intentarlo o ajuste los filtros."
            />
          </CardBody>
        </Card>
      ) : !resultado ? null : (
        <>
          <KpisTerritoriosGanados resultado={resultado} />

          <Card>
            <CardHeader
              title={encabezadoTabla}
              description={
                resultado.totalTerritoriosGanados > 0
                  ? `${resultado.totalTerritoriosGanados} ${
                      resultado.totalTerritoriosGanados === 1
                        ? nivel === 'departamento'
                          ? 'departamento'
                          : 'municipio'
                        : etiquetaTerritorios
                    } con mayor votación de ${formatearNombrePersona(resultado.nombre)}`
                  : `Sin ${etiquetaTerritorios} donde ${formatearNombrePersona(resultado.nombre)} haya sido el más votado`
              }
              icon={TableIcon}
              dense
            />
            <CardBody padding="none">
              <TablaTerritoriosGanados
                territorios={resultado.territorios}
                nivel={resultado.nivel}
              />
            </CardBody>
          </Card>
        </>
      )}
    </div>
  );
}

/**
 * Con la elección ya elegida, el único paso pendiente es el candidato: en
 * lugar de una caja vacía se ofrecen los más votados como accesos directos
 * (el selector de arriba sigue disponible para cualquier otro).
 */
function SugerenciasCandidato() {
  const setSeleccion = useFiltrosTerritoriosGanados((s) => s.setSeleccion);
  const { data: ranking, isLoading } = useRankingCandidatos(12);

  const candidatos = (ranking ?? [])
    .filter((c) => !/^votos\s/i.test(c.nombreCandidato.trim()))
    .slice(0, 6);

  return (
    <Card>
      <CardHeader
        title="Elija un candidato"
        description="Vea en qué territorios fue el más votado. Empiece por uno de los más votados o use el selector de arriba."
        icon={UserCheck}
      />
      <CardBody>
        {isLoading ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-[84px] w-full" />
            ))}
          </div>
        ) : candidatos.length === 0 ? (
          <EmptyState
            size="md"
            description="Elija un candidato en el selector de arriba para ver sus territorios ganados."
          />
        ) : (
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {candidatos.map((c) => (
              <li key={`${c.codigoCandidato}-${c.codigoPartido ?? ''}`}>
                <button
                  type="button"
                  onClick={() =>
                    setSeleccion({ codigo: c.codigoCandidato, codigoPartido: c.codigoPartido })
                  }
                  className="group flex w-full items-center gap-3 rounded-lg border border-border bg-surface px-4 py-3 text-left transition-colors hover:border-brand/40 hover:bg-brand-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-foreground">
                      {formatearNombrePersona(c.nombreCandidato)}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-foreground-muted" title={c.nombrePartido ?? undefined}>
                      {c.nombrePartido ?? 'Sin partido'}
                    </span>
                    <span className="block text-xs font-medium tabular-nums text-foreground">
                      {fmt.format(c.totalVotos)} votos
                    </span>
                  </span>
                  <ChevronRight
                    size={16}
                    className="shrink-0 text-foreground-subtle transition-colors group-hover:text-brand"
                    aria-hidden
                  />
                </button>
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}
