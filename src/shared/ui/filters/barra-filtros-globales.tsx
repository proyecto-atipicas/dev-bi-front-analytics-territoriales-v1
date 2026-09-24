'use client';

import { useCorporaciones, usePartidos } from '@/modules/catalogos/application/hooks';
import { useDepartamentos, useMunicipios } from '@/modules/geo/application/hooks';
import { useFiltrosGlobales } from '@/shared/application/stores/filtros-globales.store';
import { SelectFiltro } from '@/shared/ui/components/select-filtro';
import { formatearTerritorio } from '@/shared/ui/utils/formatear-territorio';
import { formatearCorporacion } from '@/modules/electoral/infrastructure/ui/corporacion-utils';
import { X } from 'lucide-react';

export interface BarraFiltrosGlobalesProps {
  /** Oculta el selector de partido (vista comparativo electoral). */
  ocultarPartido?: boolean;
  /**
   * Oculta los selectores de departamento y municipio. Se usa para vistas
   * donde el alcance territorial se decide en un panel interno (ej:
   * Territorios ganados). El selector de partido queda con la etiqueta
   * "Organización política".
   */
  ocultarTerritorio?: boolean;
  /**
   * Cuando `ocultarTerritorio` es true, fuerza mostrar el selector de
   * Departamento (sin Municipio). Útil para alcances que activan el
   * departamento condicionalmente desde un panel interno.
   */
  mostrarDepartamento?: boolean;
}

export function BarraFiltrosGlobales({
  ocultarPartido = false,
  ocultarTerritorio = false,
  mostrarDepartamento = false,
}: BarraFiltrosGlobalesProps = {}) {
  const filtros = useFiltrosGlobales();

  const mostrarDepto = !ocultarTerritorio || mostrarDepartamento;
  const mostrarMuni = !ocultarTerritorio;

  const { data: corporaciones, isLoading: loadingCorp } = useCorporaciones();
  const { data: partidos, isLoading: loadingPart } = usePartidos(
    ocultarPartido ? null : filtros.codigoCorporacion,
  );
  const { data: departamentos, isLoading: loadingDep } = useDepartamentos();
  const { data: municipios, isLoading: loadingMun } = useMunicipios(
    mostrarMuni ? filtros.codigoDepartamento : null,
  );

  const activos = [
    filtros.codigoCorporacion,
    mostrarDepto ? filtros.codigoDepartamento : null,
    mostrarMuni ? filtros.codigoMunicipio : null,
    !ocultarPartido ? filtros.codigoPartido : null,
  ].filter(Boolean).length;

  const limpiar = () => {
    if (ocultarTerritorio) {
      filtros.setCorporacion(null);
      filtros.setPartido(null);
      if (mostrarDepartamento) filtros.setDepartamento(null);
    } else {
      filtros.reset();
    }
  };

  const visibles =
    1 + (mostrarDepto ? 1 : 0) + (mostrarMuni ? 1 : 0) + (!ocultarPartido ? 1 : 0);
  const gridClass =
    visibles === 4
      ? 'grid flex-1 grid-cols-2 gap-2 lg:grid-cols-4'
      : visibles === 3
        ? 'grid flex-1 grid-cols-1 gap-2 sm:grid-cols-3'
        : 'grid flex-1 grid-cols-1 gap-2 sm:grid-cols-2 xl:max-w-3xl';

  return (
    <div className="px-4 pb-3 sm:px-6 lg:px-8" role="search" aria-label="Filtros de la vista">
      <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center">
        <div className={gridClass}>
          <SelectFiltro
            label="Corporación"
            value={filtros.codigoCorporacion}
            loading={loadingCorp}
            options={(corporaciones ?? []).map((c) => ({
              value: c.codigo,
              label: formatearCorporacion(c.nombre).etiqueta,
            }))}
            onChange={(v) => {
              filtros.setCorporacion(v);
              filtros.setPartido(null);
            }}
          />
          {mostrarDepto && (
            <SelectFiltro
              label="Departamento"
              value={filtros.codigoDepartamento}
              loading={loadingDep}
              options={(departamentos ?? []).map((d) => ({
                value: d.codigo,
                label: formatearTerritorio(d.nombre),
              }))}
              onChange={filtros.setDepartamento}
            />
          )}
          {mostrarMuni && (
            <SelectFiltro
              label="Municipio"
              value={filtros.codigoMunicipio}
              loading={loadingMun}
              disabled={!filtros.codigoDepartamento}
              placeholder={
                filtros.codigoDepartamento ? 'Todos' : 'Seleccione departamento'
              }
              options={(municipios ?? []).map((m) => ({
                value: m.codigo,
                label: formatearTerritorio(m.nombre),
              }))}
              onChange={filtros.setMunicipio}
            />
          )}
          {!ocultarPartido && (
            <SelectFiltro
              label={ocultarTerritorio ? 'Organización política' : 'Partido'}
              value={filtros.codigoPartido}
              loading={loadingPart}
              options={(partidos ?? []).map((p) => ({
                value: p.codigo,
                label: p.nombre,
              }))}
              onChange={filtros.setPartido}
            />
          )}
        </div>
        {activos > 0 && (
          <button
            type="button"
            onClick={limpiar}
            className="inline-flex h-12 shrink-0 items-center justify-center gap-1.5 self-end rounded-lg px-3 text-sm font-medium text-foreground-muted transition-colors hover:bg-danger-muted/50 hover:text-danger lg:self-auto"
            aria-label={`Quitar ${activos} ${activos === 1 ? 'filtro' : 'filtros'}`}
          >
            <X size={15} />
            Quitar filtros
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1.5 text-[11px] font-semibold text-brand-foreground">
              {activos}
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
