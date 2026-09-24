'use client';

import { useDepartamentos } from '@/modules/geo/application/hooks';
import { useFiltrosGlobales } from '@/shared/application/stores/filtros-globales.store';
import { SelectFiltro } from '@/shared/ui/components/select-filtro';
import { formatearTerritorio } from '@/shared/ui/utils/formatear-territorio';
import { X } from 'lucide-react';

/**
 * Barra de filtros reducida para vistas que solo aceptan filtro por departamento
 * (ej: Socioeconómico). Sigue escribiendo en el mismo store global.
 */
export function BarraFiltrosDepartamento() {
  const { codigoDepartamento, setDepartamento } = useFiltrosGlobales();
  const { data: departamentos, isLoading } = useDepartamentos();

  const activo = !!codigoDepartamento;

  return (
    <div className="px-4 pb-3 sm:px-6 lg:px-8" role="search" aria-label="Filtros de la vista">
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
        <div className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <SelectFiltro
            label="Departamento"
            value={codigoDepartamento}
            loading={isLoading}
            options={(departamentos ?? []).map((d) => ({
              value: d.codigo,
              label: formatearTerritorio(d.nombre),
            }))}
            onChange={setDepartamento}
          />
        </div>
        {activo && (
          <button
            type="button"
            onClick={() => setDepartamento(null)}
            className="inline-flex h-12 shrink-0 items-center justify-center gap-1.5 self-start rounded-lg px-3 text-sm font-medium text-foreground-muted transition-colors hover:bg-danger-muted/50 hover:text-danger-foreground sm:self-auto"
            aria-label="Quitar filtro de departamento"
          >
            <X size={15} />
            Quitar filtro
          </button>
        )}
      </div>
    </div>
  );
}
