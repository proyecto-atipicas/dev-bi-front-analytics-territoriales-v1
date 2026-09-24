'use client';

import { useFiltrosGlobales } from '@/shared/application/stores/filtros-globales.store';
import { MapaDepartamentos } from './mapa-departamentos';
import { MapaMunicipios } from './mapa-municipios';
import { BotonVolverPais } from './boton-volver-pais';

/**
 * Mapa principal: muestra departamentos por defecto y hace drill-down a municipios
 * cuando hay un departamento seleccionado en el store global.
 */
export function MapaColombia() {
  const codigoDepartamento = useFiltrosGlobales((s) => s.codigoDepartamento);
  const setDepartamento = useFiltrosGlobales((s) => s.setDepartamento);
  const setMunicipio = useFiltrosGlobales((s) => s.setMunicipio);
  const enModoMunicipal = !!codigoDepartamento;

  return (
    <div className="map-wrapper border border-border bg-surface">
      {enModoMunicipal ? <MapaMunicipios /> : <MapaDepartamentos />}

      {enModoMunicipal && (
        <BotonVolverPais
          onClick={() => {
            // Restablece la vista territorial completa: sin depto y sin muni.
            setMunicipio(null);
            setDepartamento(null);
          }}
        />
      )}
    </div>
  );
}

/**
 * Instrucción del mapa según el nivel en que está: el mismo texto fijo
 * ("toque un departamento") no servía una vez dentro de un departamento.
 */
export function useDescripcionMapa(): string {
  const codigoDepartamento = useFiltrosGlobales((s) => s.codigoDepartamento);
  return codigoDepartamento
    ? 'Toque un municipio para ver sus puestos de votación'
    : 'Toque un departamento para ver sus municipios';
}
