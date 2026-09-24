'use client';

import { LecturaResultado } from '@/modules/electoral/infrastructure/ui/lectura-resultado';
import {
  MapaColombia,
  useDescripcionMapa,
} from '@/modules/electoral/infrastructure/ui/mapa-colombia/mapa-colombia';
import { MatrizOrganizaciones } from '@/modules/electoral/infrastructure/ui/matriz-organizaciones';
import { PanelTerritorialComportamiento } from '@/modules/electoral/infrastructure/ui/panel-territorial-comportamiento';
import { ResumenEleccion } from '@/modules/electoral/infrastructure/ui/resumen-eleccion';
import { SelectorCorporacion } from '@/modules/electoral/infrastructure/ui/selector-corporacion';
import { useFiltrosGlobales } from '@/shared/application/stores/filtros-globales.store';
import { Card, CardBody, CardHeader } from '@/shared/ui/components/card';
import { LayoutGrid, Map as MapIcon } from 'lucide-react';

export default function ComportamientoElectoralPage() {
  // Selector granular: el guard sólo depende de la corporación, no de los
  // demás filtros. Suscribirse a todo el store re-renderiza la página entera
  // (incluido el mapa) con cada cambio de depto/municipio/partido.
  const codigoCorporacion = useFiltrosGlobales((s) => s.codigoCorporacion);

  if (!codigoCorporacion) {
    return <SelectorCorporacion contextoVista="el panel electoral" />;
  }

  return <ComportamientoContent />;
}

function ComportamientoContent() {
  const descripcionMapa = useDescripcionMapa();
  return (
    <div className="space-y-4 animate-fade-in">
      {/* Qué elección, en qué ámbito y sus cifras principales */}
      <ResumenEleccion />

      {/* Quién ganó, por cuánto y dónde se concentra el voto */}
      <LecturaResultado />

      {/* Mapa + Panel territorial adaptativo */}
      {/* Lado a lado sólo desde xl: en lg la tabla territorial quedaba en
          ~330px y los nombres se cortaban ("Bogo…", "Antio…"). */}
      <section className="grid gap-4 xl:grid-cols-2">
        <Card className="flex flex-col">
          <CardHeader
            title="Mapa de votación"
            description={descripcionMapa}
            icon={MapIcon}
          />
          <CardBody padding="none" className="flex flex-1 flex-col">
            {/* En xl el mapa se estira hasta la altura del panel territorial. */}
            <div className="h-[360px] w-full p-3 sm:h-[440px] xl:h-auto xl:min-h-[500px] xl:flex-1">
              <MapaColombia />
            </div>
          </CardBody>
        </Card>

        <Card className="flex flex-col">
          <PanelTerritorialComportamiento />
        </Card>
      </section>

      {/* Matriz de organizaciones con drill-down a candidatos */}
      <section>
        <Card>
          <CardHeader
            title="Matriz de organizaciones"
            description="Agrupado por partido. Expanda una fila para ver sus candidatos."
            icon={LayoutGrid}
          />
          <CardBody padding="none">
            <MatrizOrganizaciones />
          </CardBody>
        </Card>
      </section>
    </div>
  );
}
