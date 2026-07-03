'use client';

import dynamic from 'next/dynamic';
import { useMemo } from 'react';
import { useVotosPorDepartamento } from '../../../application/hooks';
import { useFiltrosGlobales } from '@/shared/application/stores/filtros-globales.store';
import {
  aRegistraduriaDepto,
  aDivipolaDepto,
  esDepartamentoExteriorBd,
} from '@/shared/domain/divipola';
import { Skeleton } from '@/shared/ui/components/skeleton';
import { LeyendaCalor } from './leyenda-calor';

const MapaBaseInner = dynamic(
  () => import('./mapa-base.inner').then((m) => m.MapaBaseInner),
  { ssr: false, loading: () => <Skeleton className="h-full min-h-[280px] w-full" /> },
);

export function MapaDepartamentos() {
  const { data, isLoading, isError } = useVotosPorDepartamento();
  const setDepartamento = useFiltrosGlobales((s) => s.setDepartamento);
  const codigoSeleccionado = useFiltrosGlobales((s) => s.codigoDepartamento);

  // La BD guarda códigos de la Registraduría y el GeoJSON usa DIVIPOLA;
  // traducimos al construir el lookup para que el choropleth pinte cada polígono.
  const valoresPorCodigo = useMemo(
    () =>
      new Map(
        (data ?? []).flatMap((v) => {
          // El voto exterior (dept BD '88' = CONSULADOS) colisiona con San Andrés
          // en DIVIPOLA 88; lo excluimos del choropleth para no fundirlos.
          if (esDepartamentoExteriorBd(v.codigoDepartamento)) return [];
          const divipola = aDivipolaDepto(v.codigoDepartamento);
          return divipola ? [[divipola, v.totalVotos] as const] : [];
        }),
      ),
    [data],
  );

  const codigoSeleccionadoDivipola = useMemo(
    () => aDivipolaDepto(codigoSeleccionado),
    [codigoSeleccionado],
  );

  if (isLoading) return <Skeleton className="h-full min-h-[280px] w-full" />;
  if (isError) {
    return (
      <div className="m-3 rounded-lg border border-danger/30 bg-danger-muted/40 p-3 text-xs font-medium text-danger">
        Error al cargar el mapa departamental.
      </div>
    );
  }

  return (
    <>
      <MapaBaseInner
        geoJsonUrl="/colombia-departamentos.geojson"
        propiedadCodigo="DPTO_CCDGO"
        propiedadNombre="DPTO_CNMBR"
        valoresPorCodigo={valoresPorCodigo}
        escalaColor="percentil"
        onSeleccion={(codigo) => {
          // El click viene en código DIVIPOLA — lo convertimos al código de la BD para el store.
          const codigoBd = aRegistraduriaDepto(codigo);
          setDepartamento(codigoBd === codigoSeleccionado ? null : codigoBd);
        }}
        codigoSeleccionado={codigoSeleccionadoDivipola}
      />
      <LeyendaCalor valores={valoresPorCodigo} etiqueta="Votos" />
    </>
  );
}
