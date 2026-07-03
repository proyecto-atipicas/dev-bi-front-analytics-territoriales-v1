'use client';

import type { ComparativoTerritorialResultado } from '@/modules/electoral/domain/entities';
import { useMunicipios } from '@/modules/geo/application/hooks';
import { useFiltrosGlobales } from '@/shared/application/stores/filtros-globales.store';
import { useGeoJSON } from '@/shared/application/hooks/use-geojson';
import {
  aDivipolaDepto,
  claveMunicipioDivipola,
  esDepartamentoExteriorBd,
  normalizarNombre,
} from '@/shared/domain/divipola';
import { Skeleton } from '@/shared/ui/components/skeleton';
import dynamic from 'next/dynamic';
import { useMemo } from 'react';
import { BotonVolverPais } from '../mapa-colombia/boton-volver-pais';
import { COLOR_A, COLOR_B, COLOR_EMPATE, colorGanador } from './colores-comparativo';

const GEO_MUNI_URL = '/colombia-municipios.geojson';

const MapaBaseInner = dynamic(
  () => import('../mapa-colombia/mapa-base.inner').then((m) => m.MapaBaseInner),
  { ssr: false, loading: () => <Skeleton className="h-full min-h-[280px] w-full" /> },
);

const fmt = new Intl.NumberFormat('es-CO');

export interface MapaComparativoProps {
  resultado: ComparativoTerritorialResultado;
}

export function MapaComparativo({ resultado }: MapaComparativoProps) {
  if (resultado.nivel === 'puesto') {
    return <MapaPuestoComparativo resultado={resultado} />;
  }

  if (resultado.nivel === 'municipio') {
    return <MapaMunicipalComparativo resultado={resultado} />;
  }

  return <MapaDepartamentalComparativo resultado={resultado} />;
}

function MapaDepartamentalComparativo({
  resultado,
}: {
  resultado: ComparativoTerritorialResultado;
}) {
  const setDepartamento = useFiltrosGlobales((s) => s.setDepartamento);
  const codigoSeleccionadoBd = useFiltrosGlobales((s) => s.codigoDepartamento);

  // Normaliza territorio (depto) → maxDif para escalar la intensidad del color.
  const maxDif = useMemo(
    () => resultado.territorios.reduce((m, t) => Math.max(m, t.diferenciaPct), 0),
    [resultado.territorios],
  );

  const coloresPorCodigo = useMemo(() => {
    const m = new Map<string, string>();
    for (const t of resultado.territorios) {
      if (esDepartamentoExteriorBd(t.codigoDepartamento)) continue;
      const divipola = aDivipolaDepto(t.codigoDepartamento);
      if (!divipola) continue;
      const intensidad = maxDif > 0 ? t.diferenciaPct / maxDif : 1;
      m.set(divipola, colorGanador(t.ganador, intensidad));
    }
    return m;
  }, [resultado.territorios, maxDif]);

  const etiquetasPorCodigo = useMemo(() => {
    const m = new Map<string, string>();
    for (const t of resultado.territorios) {
      if (esDepartamentoExteriorBd(t.codigoDepartamento)) continue;
      const divipola = aDivipolaDepto(t.codigoDepartamento);
      if (!divipola) continue;
      const ganador =
        t.ganador === 'A'
          ? resultado.itemA.nombre
          : t.ganador === 'B'
            ? resultado.itemB.nombre
            : 'Empate';
      m.set(
        divipola,
        `Ganador: ${ganador}<br/>A: ${fmt.format(t.totalA)} · B: ${fmt.format(t.totalB)}<br/>Diferencia: ${t.diferenciaPct.toFixed(1)}%`,
      );
    }
    return m;
  }, [resultado.territorios, resultado.itemA.nombre, resultado.itemB.nombre]);

  const valoresPorCodigo = useMemo(() => {
    // Pasamos los votos del ganador para que el tooltip de MapaBaseInner muestre algo útil.
    const m = new Map<string, number>();
    for (const t of resultado.territorios) {
      if (esDepartamentoExteriorBd(t.codigoDepartamento)) continue;
      const divipola = aDivipolaDepto(t.codigoDepartamento);
      if (!divipola) continue;
      m.set(divipola, t.totalA + t.totalB);
    }
    return m;
  }, [resultado.territorios]);

  const codigoSeleccionadoDivipola = useMemo(
    () => aDivipolaDepto(codigoSeleccionadoBd),
    [codigoSeleccionadoBd],
  );

  return (
    <>
      <MapaBaseInner
        geoJsonUrl="/colombia-departamentos.geojson"
        propiedadCodigo="DPTO_CCDGO"
        propiedadNombre="DPTO_CNMBR"
        valoresPorCodigo={valoresPorCodigo}
        coloresPorCodigo={coloresPorCodigo}
        etiquetasPorCodigo={etiquetasPorCodigo}
        onSeleccion={(codigoDivipola) => {
          // Buscamos el código de la BD correspondiente recorriendo la respuesta
          // (más fiable que el reverso del helper, que puede caer al fallback).
          const t = resultado.territorios.find(
            (t) =>
              !esDepartamentoExteriorBd(t.codigoDepartamento) &&
              aDivipolaDepto(t.codigoDepartamento) === codigoDivipola,
          );
          const codigoBd = t?.codigoDepartamento ?? null;
          setDepartamento(codigoBd === codigoSeleccionadoBd ? null : codigoBd);
        }}
        codigoSeleccionado={codigoSeleccionadoDivipola}
        tooltipLabel="A + B"
      />
      <LeyendaComparativo resultado={resultado} />
    </>
  );
}

interface MunicipioGeoIndex {
  porNombre: Map<string, string>;
  porCcnct: Map<string, string>;
}

function MapaMunicipalComparativo({
  resultado,
}: {
  resultado: ComparativoTerritorialResultado;
}) {
  const codigoDepartamentoBd = useFiltrosGlobales((s) => s.codigoDepartamento);
  const codigoSeleccionadoBd = useFiltrosGlobales((s) => s.codigoMunicipio);
  const setMunicipio = useFiltrosGlobales((s) => s.setMunicipio);
  const setDepartamento = useFiltrosGlobales((s) => s.setDepartamento);

  const codigoDepartamentoDivipola = useMemo(
    () => aDivipolaDepto(codigoDepartamentoBd),
    [codigoDepartamentoBd],
  );

  // GeoJSON municipal compartido (cache module-level): no se re-fetchea ni
  // re-parsea cada vez que se pinta el mapa comparativo.
  const { data: geoMuni, error: geoError } = useGeoJSON(GEO_MUNI_URL);

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

  const maxDif = useMemo(
    () => resultado.territorios.reduce((m, t) => Math.max(m, t.diferenciaPct), 0),
    [resultado.territorios],
  );

  const coloresPorCodigo = useMemo(() => {
    const m = new Map<string, string>();
    if (!geoIndex || !codigoDepartamentoDivipola) return m;
    for (const t of resultado.territorios) {
      const ccnct = geoIndex.porNombre.get(
        claveMunicipioDivipola(codigoDepartamentoDivipola, t.nombre),
      );
      if (!ccnct) continue;
      const intensidad = maxDif > 0 ? t.diferenciaPct / maxDif : 1;
      m.set(ccnct, colorGanador(t.ganador, intensidad));
    }
    return m;
  }, [geoIndex, codigoDepartamentoDivipola, resultado.territorios, maxDif]);

  const valoresPorCodigo = useMemo(() => {
    const m = new Map<string, number>();
    if (!geoIndex || !codigoDepartamentoDivipola) return m;
    for (const t of resultado.territorios) {
      const ccnct = geoIndex.porNombre.get(
        claveMunicipioDivipola(codigoDepartamentoDivipola, t.nombre),
      );
      if (!ccnct) continue;
      m.set(ccnct, t.totalA + t.totalB);
    }
    return m;
  }, [geoIndex, codigoDepartamentoDivipola, resultado.territorios]);

  const etiquetasPorCodigo = useMemo(() => {
    const m = new Map<string, string>();
    if (!geoIndex || !codigoDepartamentoDivipola) return m;
    for (const t of resultado.territorios) {
      const ccnct = geoIndex.porNombre.get(
        claveMunicipioDivipola(codigoDepartamentoDivipola, t.nombre),
      );
      if (!ccnct) continue;
      const ganador =
        t.ganador === 'A'
          ? resultado.itemA.nombre
          : t.ganador === 'B'
            ? resultado.itemB.nombre
            : 'Empate';
      m.set(
        ccnct,
        `Ganador: ${ganador}<br/>A: ${fmt.format(t.totalA)} · B: ${fmt.format(t.totalB)}<br/>Diferencia: ${t.diferenciaPct.toFixed(1)}%`,
      );
    }
    return m;
  }, [
    geoIndex,
    codigoDepartamentoDivipola,
    resultado.territorios,
    resultado.itemA.nombre,
    resultado.itemB.nombre,
  ]);

  const codigoSeleccionadoDivipola = useMemo(() => {
    if (!codigoSeleccionadoBd || !geoIndex || !codigoDepartamentoDivipola) return null;
    const t = resultado.territorios.find(
      (x) => x.codigoMunicipio === codigoSeleccionadoBd,
    );
    if (!t) return null;
    return (
      geoIndex.porNombre.get(
        claveMunicipioDivipola(codigoDepartamentoDivipola, t.nombre),
      ) ?? null
    );
  }, [codigoSeleccionadoBd, geoIndex, codigoDepartamentoDivipola, resultado.territorios]);

  const filtroFeature = useMemo(
    () => (props: { [key: string]: unknown }) => {
      if (!codigoDepartamentoDivipola) return false;
      return String(props.DPTO_CCDGO ?? '').padStart(2, '0') === codigoDepartamentoDivipola;
    },
    [codigoDepartamentoDivipola],
  );

  if (geoError) {
    return (
      <div className="m-3 rounded-lg border border-warning/30 bg-warning-muted/40 p-3 text-xs font-medium text-warning">
        No se pudo cargar el mapa municipal: {geoError}
      </div>
    );
  }

  if (!geoIndex) return <Skeleton className="h-full min-h-[280px] w-full" />;

  return (
    <>
      <MapaBaseInner
        geoJsonUrl={GEO_MUNI_URL}
        propiedadCodigo="MPIO_CCNCT"
        propiedadNombre="MPIO_CNMBR"
        valoresPorCodigo={valoresPorCodigo}
        coloresPorCodigo={coloresPorCodigo}
        etiquetasPorCodigo={etiquetasPorCodigo}
        onSeleccion={(ccnctDivipola) => {
          const nombreNormalizado = geoIndex.porCcnct.get(ccnctDivipola);
          if (!nombreNormalizado || !codigoDepartamentoDivipola) return;
          const claveGeo = `${codigoDepartamentoDivipola}|${nombreNormalizado}`;
          const t = resultado.territorios.find(
            (x) =>
              claveMunicipioDivipola(codigoDepartamentoDivipola, x.nombre) === claveGeo,
          );
          if (!t || !t.codigoMunicipio) return;
          setMunicipio(
            t.codigoMunicipio === codigoSeleccionadoBd ? null : t.codigoMunicipio,
          );
        }}
        codigoSeleccionado={codigoSeleccionadoDivipola}
        filtroFeature={filtroFeature}
        tooltipLabel="A + B"
      />
      <BotonVolverPais
        onClick={() => {
          setMunicipio(null);
          setDepartamento(null);
        }}
      />
      <LeyendaComparativo resultado={resultado} />
    </>
  );
}

/**
 * Vista del mapa cuando la granularidad cae a nivel de puesto (depto + muni
 * seleccionados). En lugar de un empty state, renderizamos los municipios del
 * departamento padre en tono neutro y resaltamos el municipio seleccionado
 * con el color del ganador agregado del comparativo. El detalle por puesto
 * sigue viviendo en la tabla.
 */
function MapaPuestoComparativo({
  resultado,
}: {
  resultado: ComparativoTerritorialResultado;
}) {
  const codigoDepartamentoBd = useFiltrosGlobales((s) => s.codigoDepartamento);
  const codigoMunicipioBd = useFiltrosGlobales((s) => s.codigoMunicipio);
  const setMunicipio = useFiltrosGlobales((s) => s.setMunicipio);
  const setDepartamento = useFiltrosGlobales((s) => s.setDepartamento);

  const codigoDepartamentoDivipola = useMemo(
    () => aDivipolaDepto(codigoDepartamentoBd),
    [codigoDepartamentoBd],
  );

  const { data: geoMuni, error: geoError } = useGeoJSON(GEO_MUNI_URL);
  const { data: municipios } = useMunicipios(codigoDepartamentoBd);

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

  const ccnctSeleccionado = useMemo(() => {
    if (!geoIndex || !codigoDepartamentoDivipola || !codigoMunicipioBd || !municipios) {
      return null;
    }
    const muni = municipios.find((m) => m.codigo === codigoMunicipioBd);
    if (!muni) return null;
    return (
      geoIndex.porNombre.get(
        claveMunicipioDivipola(codigoDepartamentoDivipola, muni.nombre),
      ) ?? null
    );
  }, [geoIndex, codigoDepartamentoDivipola, codigoMunicipioBd, municipios]);

  // Agregado del municipio: el ganador y los totales ya vienen en resultado.itemA/B
  // (resultado.territorios al ser puestos suman el mismo total cuando se agregan).
  const ganadorMunicipio = useMemo<'A' | 'B' | 'EMPATE'>(() => {
    if (resultado.itemA.totalVotos > resultado.itemB.totalVotos) return 'A';
    if (resultado.itemA.totalVotos < resultado.itemB.totalVotos) return 'B';
    return 'EMPATE';
  }, [resultado.itemA.totalVotos, resultado.itemB.totalVotos]);

  const colorMunicipio = useMemo(() => {
    if (ganadorMunicipio === 'A') return COLOR_A.fill;
    if (ganadorMunicipio === 'B') return COLOR_B.fill;
    return COLOR_EMPATE.fill;
  }, [ganadorMunicipio]);

  const coloresPorCodigo = useMemo(() => {
    const m = new Map<string, string>();
    if (ccnctSeleccionado) m.set(ccnctSeleccionado, colorMunicipio);
    return m;
  }, [ccnctSeleccionado, colorMunicipio]);

  const valoresPorCodigo = useMemo(() => {
    const m = new Map<string, number>();
    if (ccnctSeleccionado) {
      m.set(
        ccnctSeleccionado,
        resultado.itemA.totalVotos + resultado.itemB.totalVotos,
      );
    }
    return m;
  }, [ccnctSeleccionado, resultado.itemA.totalVotos, resultado.itemB.totalVotos]);

  const etiquetasPorCodigo = useMemo(() => {
    const m = new Map<string, string>();
    if (ccnctSeleccionado) {
      const nombreGanador =
        ganadorMunicipio === 'A'
          ? resultado.itemA.nombre
          : ganadorMunicipio === 'B'
            ? resultado.itemB.nombre
            : 'Empate';
      m.set(
        ccnctSeleccionado,
        `Ganador en este municipio: ${nombreGanador}<br/>A: ${fmt.format(resultado.itemA.totalVotos)} · B: ${fmt.format(resultado.itemB.totalVotos)}<br/>Detalle por puesto en la tabla`,
      );
    }
    return m;
  }, [ccnctSeleccionado, ganadorMunicipio, resultado.itemA, resultado.itemB]);

  const filtroFeature = useMemo(
    () => (props: { [key: string]: unknown }) => {
      if (!codigoDepartamentoDivipola) return false;
      return String(props.DPTO_CCDGO ?? '').padStart(2, '0') === codigoDepartamentoDivipola;
    },
    [codigoDepartamentoDivipola],
  );

  if (geoError) {
    return (
      <div className="m-3 rounded-lg border border-warning/30 bg-warning-muted/40 p-3 text-xs font-medium text-warning">
        No se pudo cargar el mapa municipal: {geoError}
      </div>
    );
  }

  if (!geoIndex) return <Skeleton className="h-full min-h-[280px] w-full" />;

  return (
    <>
      <MapaBaseInner
        geoJsonUrl={GEO_MUNI_URL}
        propiedadCodigo="MPIO_CCNCT"
        propiedadNombre="MPIO_CNMBR"
        valoresPorCodigo={valoresPorCodigo}
        coloresPorCodigo={coloresPorCodigo}
        etiquetasPorCodigo={etiquetasPorCodigo}
        onSeleccion={(ccnctDivipola) => {
          // Click en el muni resaltado → deseleccionarlo y volver al nivel municipio.
          // Click en otro muni del depto → cambiar la selección a ese muni.
          if (!geoIndex || !municipios) return;
          if (ccnctDivipola === ccnctSeleccionado) {
            setMunicipio(null);
            return;
          }
          const nombreNormalizado = geoIndex.porCcnct.get(ccnctDivipola);
          if (!nombreNormalizado || !codigoDepartamentoDivipola) return;
          const claveGeo = `${codigoDepartamentoDivipola}|${nombreNormalizado}`;
          const muni = municipios.find(
            (m) =>
              claveMunicipioDivipola(codigoDepartamentoDivipola, m.nombre) === claveGeo,
          );
          if (!muni) return;
          setMunicipio(muni.codigo);
        }}
        codigoSeleccionado={ccnctSeleccionado}
        filtroFeature={filtroFeature}
        tooltipLabel="A + B"
      />
      <BotonVolverPais
        onClick={() => {
          setMunicipio(null);
          setDepartamento(null);
        }}
      />
      <NotaPuestoEnMapa />
      <LeyendaComparativo resultado={resultado} />
    </>
  );
}

function NotaPuestoEnMapa() {
  return (
    <div className="absolute right-3 top-14 z-[400] max-w-[260px] rounded-lg border border-border bg-surface/95 px-2.5 py-1.5 text-[11px] leading-snug text-foreground-muted shadow-soft backdrop-blur">
      Municipio resaltado con el ganador agregado. El detalle por puesto se
      consulta en la tabla.
    </div>
  );
}

function LeyendaComparativo({
  resultado,
}: {
  resultado: ComparativoTerritorialResultado;
}) {
  return (
    <div className="absolute bottom-3 left-3 z-[400] flex flex-wrap items-center gap-2 rounded-lg border border-border bg-surface/95 px-2.5 py-1.5 text-[11px] shadow-soft backdrop-blur">
      <Punto color={COLOR_A.fill} label={resultado.itemA.nombre} />
      <Punto color={COLOR_B.fill} label={resultado.itemB.nombre} />
      <Punto color={COLOR_EMPATE.fill} label="Empate" />
    </div>
  );
}

function Punto({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="inline-block h-2.5 w-2.5 rounded-full"
        style={{ backgroundColor: color }}
        aria-hidden
      />
      <span className="font-medium text-foreground">{label}</span>
    </span>
  );
}
