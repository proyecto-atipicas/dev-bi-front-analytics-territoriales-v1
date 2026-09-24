'use client';

import {
  useCompararEstadistico,
  useCompararTerritorial,
} from '@/modules/electoral/application/hooks';
import type { ComparativoEstadisticoResultado } from '@/modules/electoral/domain/entities';
import { colorCandidato } from '@/modules/electoral/infrastructure/ui/comparativo/colores-estadistico';
import { GraficaComparativoEstadistico } from '@/modules/electoral/infrastructure/ui/comparativo/grafica-comparativo-estadistico';
import { MapaComparativo } from '@/modules/electoral/infrastructure/ui/comparativo/mapa-comparativo';
import { PanelEtiquetasComparativo } from '@/modules/electoral/infrastructure/ui/comparativo/panel-etiquetas';
import { PanelSeleccionComparativo } from '@/modules/electoral/infrastructure/ui/comparativo/panel-seleccion';
import { PanelSeleccionEstadistico } from '@/modules/electoral/infrastructure/ui/comparativo/panel-seleccion-estadistico';
import {
  ModoComparativo,
  SelectorModoComparativo,
} from '@/modules/electoral/infrastructure/ui/comparativo/selector-modo-comparativo';
import { TablaEstadistico } from '@/modules/electoral/infrastructure/ui/comparativo/tabla-estadistico';
import { TablaResultadosTerritorial } from '@/modules/electoral/infrastructure/ui/comparativo/tabla-resultados-territorial';
import { TarjetasTotales } from '@/modules/electoral/infrastructure/ui/comparativo/tarjetas-totales';
import { useFiltrosComparativo } from '@/modules/electoral/infrastructure/ui/comparativo/filtros-comparativo-store';
import { useFiltrosEstadistico } from '@/modules/electoral/infrastructure/ui/comparativo/filtros-estadistico-store';
import { useFiltrosGlobales } from '@/shared/application/stores/filtros-globales.store';
import { Card, CardBody, CardHeader } from '@/shared/ui/components/card';
import { EmptyState } from '@/shared/ui/components/empty-state';
import { Skeleton } from '@/shared/ui/components/skeleton';
import {
  formatearNombrePersona,
  formatearTerritorio,
} from '@/shared/ui/utils/formatear-territorio';
import {
  BarChart3,
  ListChecks,
  Map as MapIcon,
  Table as TableIcon,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { formatearPorcentaje } from '@/shared/ui/utils/formatear-porcentaje';

const fmt = new Intl.NumberFormat('es-CO');

export default function ComparativoPage() {
  const [modoVista, setModoVista] = useState<'directo' | 'estadistico'>('directo');
  const tipo = useFiltrosComparativo((s) => s.tipo);
  const setTipo = useFiltrosComparativo((s) => s.setTipo);

  const activo: ModoComparativo = modoVista === 'estadistico' ? 'estadistico' : tipo;

  // Quien llega con una elección elegida en los filtros generales casi
  // siempre quiere comparar dentro de ella: se precarga en ambos lados
  // (sólo si están vacíos, para no pisar una selección previa).
  const corporacionGlobal = useFiltrosGlobales((s) => s.codigoCorporacion);
  useEffect(() => {
    if (!corporacionGlobal) return;
    const directo = useFiltrosComparativo.getState();
    if (!directo.corpA && !directo.corpB) {
      directo.setCorpA(corporacionGlobal);
      directo.setCorpB(corporacionGlobal);
    }
    const estadistico = useFiltrosEstadistico.getState();
    if (!estadistico.corpA && !estadistico.corpB) {
      estadistico.setCorpA(corporacionGlobal);
      estadistico.setCorpB(corporacionGlobal);
    }
  }, [corporacionGlobal]);

  const onSelect = (modo: ModoComparativo) => {
    if (modo === 'estadistico') {
      setModoVista('estadistico');
    } else {
      setModoVista('directo');
      setTipo(modo);
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <Card>
        <CardBody>
          <SelectorModoComparativo activo={activo} onSelect={onSelect} />
        </CardBody>
      </Card>

      {modoVista === 'estadistico' ? <VistaEstadistico /> : <VistaDirecta />}
    </div>
  );
}

// ─── Comparativo pairwise (A vs B) ────────────────────────────────────────────

function VistaDirecta() {
  const codigoDepartamento = useFiltrosGlobales((s) => s.codigoDepartamento);
  const codigoMunicipio = useFiltrosGlobales((s) => s.codigoMunicipio);
  const { tipo, corpA, corpB, selA, selB } = useFiltrosComparativo();

  const filtro = {
    tipo,
    codigoA: selA?.codigo ?? undefined,
    codigoB: selB?.codigo ?? undefined,
    codigoCorporacionA: corpA ?? undefined,
    codigoCorporacionB: corpB ?? undefined,
    codigoDepartamento: codigoDepartamento ?? null,
    codigoMunicipio: codigoMunicipio ?? null,
    codigoPartidoA: selA?.codigoPartido ?? null,
    codigoPartidoB: selB?.codigoPartido ?? null,
  };

  // Con corporaciones distintas, el mismo código/partido es una comparación
  // válida (mismo candidato en dos procesos). Sólo exigimos diferencia de ítem
  // cuando ambos lados comparten corporación.
  const distintaCorporacion = !!(corpA && corpB && corpA !== corpB);
  const sonDistintos = !!(
    selA &&
    selB &&
    (distintaCorporacion ||
      (tipo === 'candidato'
        ? selA.codigo !== selB.codigo || selA.codigoPartido !== selB.codigoPartido
        : selA.codigo !== selB.codigo))
  );
  // Para candidatos exigimos también codigoPartido en ambos lados.
  const seleccionValida =
    tipo === 'partido'
      ? sonDistintos
      : sonDistintos && !!selA?.codigoPartido && !!selB?.codigoPartido;
  const haySeleccionCompleta = !!(corpA && corpB && seleccionValida);

  const { data: datos, isLoading, isError } = useCompararTerritorial(filtro);
  // Los candidatos llegan en mayúsculas; se muestran como nombre propio.
  // Los partidos conservan su nombre oficial.
  const resultado = useMemo(() => {
    if (!datos || tipo !== 'candidato') return datos;
    return {
      ...datos,
      itemA: { ...datos.itemA, nombre: formatearNombrePersona(datos.itemA.nombre) },
      itemB: { ...datos.itemB, nombre: formatearNombrePersona(datos.itemB.nombre) },
    };
  }, [datos, tipo]);

  const etiquetaTerritorios =
    resultado?.nivel === 'puesto'
      ? 'Puestos'
      : resultado?.nivel === 'municipio'
        ? 'Municipios'
        : 'Departamentos';

  const encabezadoNivel = etiquetaTerritorios;

  const encabezadoTerritorio =
    resultado?.nivel === 'puesto'
      ? 'Puesto'
      : resultado?.nivel === 'municipio'
        ? 'Municipio'
        : 'Departamento';

  return (
    <div className="space-y-5">
      <PanelSeleccionComparativo />

      {!haySeleccionCompleta ? (
        <Card>
          <CardBody>
            {corpA && corpB ? (
              <EmptyState
                tone="info"
                title={`Elija los dos ${tipo === 'candidato' ? 'candidatos' : 'partidos'}`}
                description="Seleccione uno en cada lado para ver dónde gana cada uno. Puede cambiar la corporación de un lado para comparar entre elecciones."
              />
            ) : (
              <EmptyState
                tone="info"
                title="Configure el comparativo"
                description="Seleccione la corporación y el ítem de cada lado. Puede combinar corporaciones distintas para comparar entre elecciones."
              />
            )}
          </CardBody>
        </Card>
      ) : isLoading ? (
        <div className="space-y-5">
          <Skeleton className="h-40 w-full" />
          <div className="grid gap-4 lg:grid-cols-3">
            <Skeleton className="h-[320px] w-full sm:h-[400px] md:h-[440px] lg:col-span-2 lg:h-[480px]" />
            <Skeleton className="h-[320px] w-full sm:h-[400px] md:h-[440px] lg:h-[480px]" />
          </div>
        </div>
      ) : isError ? (
        <Card>
          <CardBody>
            <EmptyState
              tone="danger"
              title="Error al cargar el comparativo"
              description="Vuelva a intentarlo o ajuste los filtros."
            />
          </CardBody>
        </Card>
      ) : !resultado || resultado.territorios.length === 0 ? (
        <Card>
          <CardBody>
            <EmptyState
              title="Sin datos para los filtros aplicados"
              description="No hay territorios donde ambos ítems hayan obtenido votos."
            />
          </CardBody>
        </Card>
      ) : (
        <>
          <TarjetasTotales
            resultado={resultado}
            etiquetaTerritorios={etiquetaTerritorios}
          />

          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader
                title={
                  resultado.nivel === 'puesto'
                    ? 'Mapa del municipio seleccionado'
                    : `Mapa por ${encabezadoTerritorio.toLowerCase()}`
                }
                description={
                  resultado.nivel === 'puesto'
                    ? 'Resaltado = ganador agregado · detalle por puesto en la tabla'
                    : 'Color = ganador · intensidad = brecha'
                }
                icon={MapIcon}
                dense
              />
              <CardBody padding="none">
                <div className="map-wrapper h-[320px] sm:h-[400px] md:h-[440px] lg:h-[480px]">
                  <MapaComparativo resultado={resultado} />
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="Brechas y participación" icon={ListChecks} dense />
              <CardBody>
                <PanelEtiquetasComparativo
                  resultado={resultado}
                  encabezadoNivel={encabezadoNivel}
                />
              </CardBody>
            </Card>
          </div>

          <Card>
            <CardHeader
              title={`Detalle por ${encabezadoTerritorio.toLowerCase()}`}
              description={`${resultado.territorios.length} ${resultado.territorios.length === 1 ? encabezadoTerritorio.toLowerCase() : encabezadoNivel.toLowerCase()}`}
              icon={TableIcon}
              dense
            />
            <CardBody padding="none">
              <TablaResultadosTerritorial
                resultado={resultado}
                encabezadoTerritorio={encabezadoTerritorio}
              />
            </CardBody>
          </Card>
        </>
      )}
    </div>
  );
}

// ─── Comparativo estadístico (multi-candidato) ────────────────────────────────

function VistaEstadistico() {
  const corpA = useFiltrosEstadistico((s) => s.corpA);
  const corpB = useFiltrosEstadistico((s) => s.corpB);
  const seleccionados = useFiltrosEstadistico((s) => s.seleccionados);

  const filtro = useMemo(() => ({ candidatos: seleccionados }), [seleccionados]);
  const { data: datos, isLoading, isError } = useCompararEstadistico(filtro);
  const resultado = useMemo(
    () =>
      datos && {
        ...datos,
        candidatos: datos.candidatos.map((c) => ({
          ...c,
          nombre: formatearNombrePersona(c.nombre),
        })),
        departamentos: datos.departamentos.map((d) => ({
          ...d,
          nombre: formatearTerritorio(d.nombre),
        })),
      },
    [datos],
  );

  const ambasCorporaciones = !!(corpA && corpB);
  const suficientesCandidatos = seleccionados.length >= 2;

  return (
    <div className="space-y-5">
      <PanelSeleccionEstadistico />

      {!ambasCorporaciones ? (
        <Card>
          <CardBody>
            <EmptyState
              tone="info"
              title="Seleccione ambas corporaciones"
              description="El comparativo estadístico requiere las dos corporaciones para habilitar el análisis."
            />
          </CardBody>
        </Card>
      ) : !suficientesCandidatos ? (
        <Card>
          <CardBody>
            <EmptyState
              tone="info"
              title="Seleccione al menos 2 candidatos"
              description="Marque uno o varios candidatos por corporación (mínimo 2 en total) para comparar sus resultados por departamento."
            />
          </CardBody>
        </Card>
      ) : isLoading ? (
        <div className="space-y-5">
          <Skeleton className="h-[360px] w-full" />
          <Skeleton className="h-80 w-full" />
        </div>
      ) : isError ? (
        <Card>
          <CardBody>
            <EmptyState
              tone="danger"
              title="Error al cargar el comparativo"
              description="Vuelva a intentarlo o ajuste la selección de candidatos."
            />
          </CardBody>
        </Card>
      ) : !resultado || resultado.departamentos.length === 0 ? (
        <Card>
          <CardBody>
            <EmptyState
              title="Sin datos para la selección"
              description="Los candidatos seleccionados no registran votos por departamento."
            />
          </CardBody>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader
              title="Visualización comparativa"
              description="Tipo de gráfica adaptado a la cantidad de candidatos seleccionados"
              icon={BarChart3}
              dense
            />
            <CardBody className="space-y-4">
              <ResumenCandidatos resultado={resultado} />
              <GraficaComparativoEstadistico resultado={resultado} />
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Resultados por departamento"
              description={`${resultado.departamentos.length} departamento${resultado.departamentos.length === 1 ? '' : 's'} · ${resultado.candidatos.length} candidatos`}
              icon={TableIcon}
              dense
            />
            <CardBody>
              <TablaEstadistico resultado={resultado} />
            </CardBody>
          </Card>
        </>
      )}
    </div>
  );
}

/** Tira-resumen de los candidatos seleccionados con su color, total y participación. */
function ResumenCandidatos({ resultado }: { resultado: ComparativoEstadisticoResultado }) {
  return (
    <div className="flex flex-wrap gap-2">
      {resultado.candidatos.map((c, i) => (
        <div
          key={c.key}
          className="flex items-center gap-2 rounded-lg border border-border bg-surface-elevated/50 px-3 py-1.5"
        >
          <span
            className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: colorCandidato(i) }}
          />
          <span className="max-w-[12rem] truncate text-sm font-medium text-foreground" title={c.nombre}>
            {c.nombre}
          </span>
          <span className="num-tabular text-xs text-foreground-muted">
            {fmt.format(c.totalVotos)}
            <span className="ml-1 text-foreground-subtle">({formatearPorcentaje(c.participacionPct, 1)})</span>
          </span>
        </div>
      ))}
    </div>
  );
}
