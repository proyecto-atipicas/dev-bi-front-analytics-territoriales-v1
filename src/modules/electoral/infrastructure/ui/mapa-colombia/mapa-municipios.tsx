'use client';

import dynamic from 'next/dynamic';
import { useCallback, useMemo } from 'react';
import { useVotosPorMunicipio } from '../../../application/hooks';
import { useFiltrosGlobales } from '@/shared/application/stores/filtros-globales.store';
import { useGeoJSON } from '@/shared/application/hooks/use-geojson';
import {
  aDivipolaDepto,
  claveMunicipioDivipola,
  normalizarNombre,
} from '@/shared/domain/divipola';
import { Skeleton } from '@/shared/ui/components/skeleton';
import { LeyendaCalor } from './leyenda-calor';

const MapaBaseInner = dynamic(
  () => import('./mapa-base.inner').then((m) => m.MapaBaseInner),
  { ssr: false, loading: () => <Skeleton className="h-full min-h-[280px] w-full" /> },
);

interface MunicipioGeoIndex {
  /** `${DPTO_CCDGO}|${nombre normalizado}` → MPIO_CCNCT (5 dígitos DIVIPOLA). */
  porNombre: Map<string, string>;
  /** MPIO_CCNCT → nombre normalizado del municipio. */
  porCcnct: Map<string, string>;
}

const GEO_MUNI_URL = '/colombia-municipios.geojson';

/**
 * Mapa municipal con drill-down. Los códigos municipales de la BD
 * (`codigo_municipio` de 3 dígitos) NO coinciden con los DIVIPOLA del DANE;
 * por eso hacemos un match por nombre normalizado dentro del departamento
 * (también traducido a DIVIPOLA).
 */
export function MapaMunicipios() {
  const codigoDepartamentoBd = useFiltrosGlobales((s) => s.codigoDepartamento);
  const codigoSeleccionadoBd = useFiltrosGlobales((s) => s.codigoMunicipio);
  const setMunicipio = useFiltrosGlobales((s) => s.setMunicipio);

  const codigoDepartamentoDivipola = useMemo(
    () => aDivipolaDepto(codigoDepartamentoBd),
    [codigoDepartamentoBd],
  );

  const { data, isLoading, isError } = useVotosPorMunicipio();
  const { data: geoMuni, error: geoError } = useGeoJSON(GEO_MUNI_URL);

  // El índice depende sólo del GeoJSON cacheado: cuando volvemos a la vista
  // tras una primera carga, este useMemo cae al hit y reutiliza la misma
  // estructura entre re-renders.
  const geoIndex = useMemo<MunicipioGeoIndex | null>(() => {
    if (!geoMuni) return null;
    const porNombre = new Map<string, string>();
    const porCcnct = new Map<string, string>();
    for (const f of geoMuni.features) {
      const props = (f.properties ?? {}) as Record<string, unknown>;
      const dpto = String(props.DPTO_CCDGO ?? '').padStart(2, '0');
      const ccnct = String(props.MPIO_CCNCT ?? '');
      const nombre = normalizarNombre(String(props.MPIO_CNMBR ?? ''));
      if (!dpto || !ccnct || !nombre) continue;
      porNombre.set(`${dpto}|${nombre}`, ccnct);
      porCcnct.set(ccnct, nombre);
    }
    return { porNombre, porCcnct };
  }, [geoMuni]);

  const valoresPorCodigo = useMemo(() => {
    if (!data || !geoIndex || !codigoDepartamentoDivipola) return new Map<string, number>();
    const m = new Map<string, number>();
    for (const v of data) {
      const ccnct = geoIndex.porNombre.get(
        claveMunicipioDivipola(codigoDepartamentoDivipola, v.nombreMunicipio),
      );
      if (ccnct) m.set(ccnct, v.totalVotos);
    }
    return m;
  }, [data, geoIndex, codigoDepartamentoDivipola]);

  const codigoSeleccionadoDivipola = useMemo(() => {
    if (!codigoSeleccionadoBd || !data || !geoIndex || !codigoDepartamentoDivipola) return null;
    const muni = data.find((v) => v.codigoMunicipio === codigoSeleccionadoBd);
    if (!muni) return null;
    return (
      geoIndex.porNombre.get(
        claveMunicipioDivipola(codigoDepartamentoDivipola, muni.nombreMunicipio),
      ) ?? null
    );
  }, [codigoSeleccionadoBd, data, geoIndex, codigoDepartamentoDivipola]);

  const filtroFeature = useCallback(
    (props: { [key: string]: unknown }) => {
      if (!codigoDepartamentoDivipola) return false;
      return String(props.DPTO_CCDGO ?? '').padStart(2, '0') === codigoDepartamentoDivipola;
    },
    [codigoDepartamentoDivipola],
  );

  const onSeleccion = useCallback(
    (ccnctDivipola: string) => {
      if (!data || !geoIndex || !codigoDepartamentoDivipola) return;
      const nombreNormalizado = geoIndex.porCcnct.get(ccnctDivipola);
      if (!nombreNormalizado) return;
      // Reverso simétrico a la ida: comparamos la clave con alias aplicado para
      // que un click en un polígono con nombre DANE distinto (ej. Cúcuta →
      // "SAN JOSE DE CUCUTA") encuentre su municipio en la respuesta de la BD.
      const claveGeo = `${codigoDepartamentoDivipola}|${nombreNormalizado}`;
      const muni = data.find(
        (m) =>
          claveMunicipioDivipola(codigoDepartamentoDivipola, m.nombreMunicipio) ===
          claveGeo,
      );
      if (!muni) return;
      setMunicipio(muni.codigoMunicipio === codigoSeleccionadoBd ? null : muni.codigoMunicipio);
    },
    [data, geoIndex, codigoDepartamentoDivipola, codigoSeleccionadoBd, setMunicipio],
  );

  if (!codigoDepartamentoBd) {
    return (
      <div className="flex h-full min-h-[240px] items-center justify-center rounded-lg border border-dashed border-border bg-surface-sunken/60 p-4 text-center text-sm text-foreground-muted">
        Seleccione un departamento para ver el desglose municipal.
      </div>
    );
  }

  if (geoError) {
    return (
      <div className="m-3 rounded-lg border border-warning/30 bg-warning-muted/40 p-3 text-xs font-medium text-warning">
        No se pudo cargar el mapa municipal: {geoError}
      </div>
    );
  }

  if (isLoading || !geoIndex) return <Skeleton className="h-full min-h-[280px] w-full" />;

  if (isError) {
    return (
      <div className="m-3 rounded-lg border border-danger/30 bg-danger-muted/40 p-3 text-xs font-medium text-danger">
        Error al cargar el mapa municipal.
      </div>
    );
  }

  return (
    <>
      <MapaBaseInner
        geoJsonUrl={GEO_MUNI_URL}
        propiedadCodigo="MPIO_CCNCT"
        propiedadNombre="MPIO_CNMBR"
        valoresPorCodigo={valoresPorCodigo}
        escalaColor="percentil"
        onSeleccion={onSeleccion}
        codigoSeleccionado={codigoSeleccionadoDivipola}
        filtroFeature={filtroFeature}
      />
      <LeyendaCalor valores={valoresPorCodigo} etiqueta="Votos" />
    </>
  );
}
