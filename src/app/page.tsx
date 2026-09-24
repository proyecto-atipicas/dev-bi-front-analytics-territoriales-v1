'use client';

import {
  useRankingPartidos,
  useResumenElectoral,
  useResumenElectoralFiltro,
} from '@/modules/electoral/application/hooks';
import { leerVotos } from '@/modules/electoral/infrastructure/ui/lectura-votos';
import {
  MapaColombia,
  useDescripcionMapa,
} from '@/modules/electoral/infrastructure/ui/mapa-colombia/mapa-colombia';
import { SelectorCorporacion } from '@/modules/electoral/infrastructure/ui/selector-corporacion';
import { TablaRankingPartidos } from '@/modules/electoral/infrastructure/ui/tabla-ranking-partidos';
import { TarjetaEleccionActiva } from '@/modules/electoral/infrastructure/ui/tarjeta-eleccion-activa';
import { TopTerritorial } from '@/modules/electoral/infrastructure/ui/top-territorial';
import { PanelPoblacionalHome } from '@/modules/poblacional/infrastructure/ui/panel-poblacional-home';
import { PanelSocioHome } from '@/modules/socioeconomico/infrastructure/ui/panel-socio-home';
import { useFiltrosGlobales } from '@/shared/application/stores/filtros-globales.store';
import { Card, CardBody, CardHeader } from '@/shared/ui/components/card';
import { InsightsPanel, type Insight } from '@/shared/ui/components/insights-panel';
import { SectionHeading } from '@/shared/ui/components/section-heading';
import { Map as MapIcon, TrendingUp, Trophy, Users } from 'lucide-react';
import { useMemo } from 'react';
import { formatearPorcentaje } from '@/shared/ui/utils/formatear-porcentaje';

const fmt = new Intl.NumberFormat('es-CO');
const fmtPct = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 1 });

/** Filas del ranking de partidos: la misma consulta alimenta tabla e insight. */
const LIMITE_PARTIDOS = 7;

export default function HomePage() {
  // Selector específico: el guard sólo necesita la corporación, así no
  // re-renderiza cuando cambian otros filtros sin razón.
  const codigoCorporacion = useFiltrosGlobales((s) => s.codigoCorporacion);

  // Filtro previo obligatorio: las corporaciones no pueden mezclarse.
  if (!codigoCorporacion) {
    return <SelectorCorporacion contextoVista="el resumen ejecutivo" />;
  }

  return <HomeContent />;
}

function HomeContent() {
  const descripcionMapa = useDescripcionMapa();
  const { data: resumen, isPlaceholderData: resumenPrevio } = useResumenElectoral();
  const { data: partidos, isPlaceholderData: partidosPrevios } =
    useRankingPartidos(LIMITE_PARTIDOS);
  const codigoCorporacion = useFiltrosGlobales((s) => s.codigoCorporacion);
  const codigoDepartamento = useFiltrosGlobales((s) => s.codigoDepartamento);
  const codigoMunicipio = useFiltrosGlobales((s) => s.codigoMunicipio);
  const codigoPartido = useFiltrosGlobales((s) => s.codigoPartido);
  // Total del ámbito sin el filtro de partido: da el peso del partido filtrado.
  const { data: totalAmbito } = useResumenElectoralFiltro(
    { codigoCorporacion, codigoDepartamento, codigoMunicipio, codigoPartido: null },
    { enabled: !!codigoPartido },
  );

  const insights = useMemo<Insight[]>(() => {
    if (!resumen) return [];
    const plural = (n: number, uno: string, varios: string) =>
      `${fmt.format(n)} ${n === 1 ? uno : varios}`;
    const list: Insight[] = [];
    list.push({
      id: 'cobertura',
      tone: 'info',
      title: 'Cobertura territorial',
      description: `Datos disponibles para ${plural(resumen.totalDepartamentos, 'departamento', 'departamentos')} y ${plural(resumen.totalMunicipios, 'municipio', 'municipios')}.`,
    });

    if (codigoPartido) {
      // Con un partido filtrado su "participación" en la tabla sería siempre
      // 100 %: se compara contra el total del ámbito sin ese filtro.
      if (totalAmbito && totalAmbito.totalVotos > 0) {
        list.push({
          id: 'peso-partido',
          tone: 'info',
          title: 'Peso en la elección',
          description: `El partido reúne el ${formatearPorcentaje((resumen.totalVotos / totalAmbito.totalVotos) * 100, 1)} de los votos del ámbito: ${fmt.format(resumen.totalVotos)} de ${fmt.format(totalAmbito.totalVotos)}.`,
        });
      }
      if (resumen.totalPuestos > 0) {
        list.push({
          id: 'votos-puesto',
          tone: 'info',
          title: 'Votos por puesto de votación',
          description: `Cada puesto registra en promedio ${fmt.format(Math.round(resumen.totalVotos / resumen.totalPuestos))} votos en ${plural(resumen.totalPuestos, 'puesto', 'puestos')}.`,
        });
      }
      return list;
    }

    const lectura = partidos ? leerVotos(partidos, resumen.totalVotos) : null;
    if (lectura?.lider && resumen.totalVotos > 0) {
      list.push({
        id: 'partido-lider',
        tone: 'info',
        title: 'Partido con más votos',
        description: `${lectura.lider.nombrePartido} concentra el ${formatearPorcentaje((lectura.lider.totalVotos / resumen.totalVotos) * 100, 1)} de la votación, con ${fmt.format(lectura.lider.totalVotos)} votos.`,
      });
    }
    if (lectura?.segundo && lectura.ventajaPuntos !== null && lectura.ventajaVotos !== null) {
      list.push({
        id: 'ventaja',
        tone: 'positive',
        title: 'Ventaja sobre el segundo',
        description: `Supera a ${lectura.segundo.nombrePartido} por ${fmtPct.format(lectura.ventajaPuntos)} puntos: ${fmt.format(lectura.ventajaVotos)} votos de diferencia.`,
      });
    }
    return list;
  }, [resumen, partidos, codigoPartido, totalAmbito]);

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="space-y-4">
        <section className="grid gap-4 xl:grid-cols-12">
          <Card className="flex flex-col xl:col-span-8">
            <CardHeader
              title="Mapa de votación"
              description={descripcionMapa}
              icon={MapIcon}
            />
            <CardBody padding="none" className="flex flex-1 flex-col">
              {/* En xl el mapa se estira hasta la altura de la columna lateral. */}
              <div className="h-[360px] w-full p-3 sm:h-[440px] lg:h-[520px] xl:h-auto xl:min-h-[520px] xl:flex-1">
                <MapaColombia />
              </div>
            </CardBody>
          </Card>

          {/* Columna lateral: elección seleccionada + ranking territorial */}
          <div className="flex flex-col gap-4 xl:col-span-4">
            <TarjetaEleccionActiva />
            <div className="flex-1">
              <TopTerritorial filasVisibles={10} />
            </div>
          </div>
        </section>

        {/* Ranking de partidos + lectura rápida */}
        <section className="grid gap-4 xl:grid-cols-12">
          <Card className="xl:col-span-8">
            <CardHeader
              title="Votación por partido"
              description="Los partidos con más votos en el ámbito seleccionado"
              icon={Trophy}
            />
            <CardBody padding="none">
              <TablaRankingPartidos limite={LIMITE_PARTIDOS} />
            </CardBody>
          </Card>
          <div className="xl:col-span-4">
            <InsightsPanel
              insights={insights}
              cargando={resumenPrevio || partidosPrevios}
              className="h-full"
            />
          </div>
        </section>
      </div>

      {/* Sección socioeconómica — afectada sólo por filtro de Departamento */}
      <section className="space-y-3">
        <SectionHeading
          title="Indicadores socioeconómicos"
          description="Condiciones de vida por fuente oficial. Responde solo al filtro de departamento."
          icon={TrendingUp}
        />
        <Card>
          <CardBody>
            <PanelSocioHome />
          </CardBody>
        </Card>
      </section>

      {/* Sección poblacional — independiente de los filtros del Home */}
      <section className="space-y-3">
        <SectionHeading
          title="Impacto poblacional"
          description="Encuestas de opinión por dimensión. No depende de los filtros superiores."
          icon={Users}
        />
        <Card>
          <CardBody>
            <PanelPoblacionalHome />
          </CardBody>
        </Card>
      </section>
    </div>
  );
}
