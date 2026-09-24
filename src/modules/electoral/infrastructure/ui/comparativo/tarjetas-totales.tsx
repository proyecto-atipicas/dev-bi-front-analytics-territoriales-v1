'use client';

import { useCorporaciones } from '@/modules/catalogos/application/hooks';
import type {
  ComparativoTerritorialResultado,
  ItemComparativoTerritorial,
} from '@/modules/electoral/domain/entities';
import { Card, CardBody } from '@/shared/ui/components/card';
import { cn } from '@/shared/ui/utils/cn';
import { useMemo } from 'react';
import { COLOR_A, COLOR_B } from './colores-comparativo';
import { formatearCorporacion } from '../corporacion-utils';
import { formatearPorcentaje } from '@/shared/ui/utils/formatear-porcentaje';

const fmt = new Intl.NumberFormat('es-CO');

export interface TarjetasTotalesProps {
  resultado: ComparativoTerritorialResultado;
  /** Nombre del nivel territorial visible en la última KPI ("Departamentos"…). */
  etiquetaTerritorios: string;
}

export function TarjetasTotales({ resultado, etiquetaTerritorios }: TarjetasTotalesProps) {
  const { data: corporaciones } = useCorporaciones();
  const nombrePorCodigo = useMemo(() => {
    const m = new Map<string, string>();
    for (const c of corporaciones ?? []) m.set(c.codigo, formatearCorporacion(c.nombre).etiqueta);
    return m;
  }, [corporaciones]);

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <TarjetaItem
        item={resultado.itemA}
        color={COLOR_A}
        rotulo="Ítem A"
        nombreCorporacion={nombrePorCodigo.get(resultado.itemA.codigoCorporacion)}
        etiquetaTerritorios={etiquetaTerritorios}
      />
      <TarjetaItem
        item={resultado.itemB}
        color={COLOR_B}
        rotulo="Ítem B"
        nombreCorporacion={nombrePorCodigo.get(resultado.itemB.codigoCorporacion)}
        etiquetaTerritorios={etiquetaTerritorios}
      />
    </div>
  );
}

function TarjetaItem({
  item,
  color,
  rotulo,
  nombreCorporacion,
  etiquetaTerritorios,
}: {
  item: ItemComparativoTerritorial;
  color: typeof COLOR_A;
  rotulo: string;
  nombreCorporacion?: string;
  etiquetaTerritorios: string;
}) {
  return (
    <Card className={cn('border-2', color.border)}>
      <CardBody className="space-y-4">
        <div>
          <div className={cn('text-[11px] font-medium', color.text)}>
            {rotulo}
          </div>
          <div className="mt-1 text-base font-semibold text-foreground">
            {item.nombre}
          </div>
          {item.nombrePartido && (
            <div className="text-xs text-foreground-muted">
              {item.nombrePartido}
            </div>
          )}
          {nombreCorporacion && (
            <div className="mt-1 inline-flex rounded-full border border-border bg-surface-elevated px-2 py-0.5 text-[10px] font-medium text-foreground-muted">
              {nombreCorporacion}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Kpi etiqueta="Total votos" valor={fmt.format(item.totalVotos)} acentoColor={color.text} />
          <Kpi
            etiqueta="% elección"
            valor={`${formatearPorcentaje(item.participacionPct, 2)}`}
            acentoColor={color.text}
          />
          <Kpi etiqueta={etiquetaTerritorios} valor={fmt.format(item.totalTerritorios)} />
          <Kpi etiqueta="Total elección" valor={`${fmt.format(item.totalEleccion)} votos`} chico />
        </div>
      </CardBody>
    </Card>
  );
}

function Kpi({
  etiqueta,
  valor,
  acentoColor,
  chico = false,
}: {
  etiqueta: string;
  valor: string;
  acentoColor?: string;
  chico?: boolean;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface-elevated/50 p-3">
      <div className="text-xs font-medium text-foreground-muted">
        {etiqueta}
      </div>
      <div
        className={cn(
          chico ? 'text-sm font-semibold' : 'text-xl font-bold',
          'mt-1 num-tabular',
          acentoColor ?? 'text-foreground',
        )}
      >
        {valor}
      </div>
    </div>
  );
}
