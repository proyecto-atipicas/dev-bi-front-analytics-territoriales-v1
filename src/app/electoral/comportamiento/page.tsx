'use client';

import { MapaColombia } from '@/modules/electoral/infrastructure/ui/mapa-colombia/mapa-colombia';
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
  return (
    <div className="space-y-4 animate-fade-in">
      {/* Qué elección, en qué ámbito y sus cifras principales */}
      <ResumenEleccion />

      {/* Mapa + Panel territorial adaptativo */}
      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="flex flex-col">
          <CardHeader
            title="Mapa de votación"
            description="Toque un departamento para ver sus municipios"
            icon={MapIcon}
          />
          <CardBody padding="none" className="flex flex-1 flex-col">
            {/* En lg el mapa se estira hasta la altura del panel territorial. */}
            <div className="h-[360px] w-full p-3 sm:h-[440px] lg:h-auto lg:min-h-[500px] lg:flex-1">
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
