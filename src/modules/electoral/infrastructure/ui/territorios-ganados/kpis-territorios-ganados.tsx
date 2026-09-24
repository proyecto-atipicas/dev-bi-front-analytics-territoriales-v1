'use client';

import type { TerritoriosGanadosResultado } from '@/modules/electoral/domain/entities';
import { Card, CardBody } from '@/shared/ui/components/card';
import { cn } from '@/shared/ui/utils/cn';
import {
  Activity,
  Award,
  MinusCircle,
  TrendingUp,
  Vote,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const fmt = new Intl.NumberFormat('es-CO');

export interface KpisTerritoriosGanadosProps {
  resultado: TerritoriosGanadosResultado;
}

export function KpisTerritoriosGanados({ resultado }: KpisTerritoriosGanadosProps) {
  const etiquetaTerritorios = resultado.nivel === 'departamento' ? 'Departamentos' : 'Municipios';

  // Brecha total = total votos elección − votos del seleccionado en el ámbito.
  const diferenciaTotal = Math.max(0, resultado.totalVotosEleccion - resultado.votosSeleccionado);

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      <KpiCard
        icon={Vote}
        etiqueta="Total votos elección"
        valor={fmt.format(resultado.totalVotosEleccion)}
        descripcion="Suma de la corporación analizada"
      />
      <KpiCard
        icon={TrendingUp}
        etiqueta="Votos del seleccionado"
        valor={fmt.format(resultado.votosSeleccionado)}
        descripcion={resultado.nombre}
        acento
      />
      <KpiCard
        icon={Activity}
        etiqueta="Participación"
        valor={`${resultado.participacionPct.toFixed(2)}%`}
        descripcion="Sobre el total de la elección"
      />
      <KpiCard
        icon={Award}
        etiqueta={`${etiquetaTerritorios} ganados`}
        valor={fmt.format(resultado.totalTerritoriosGanados)}
        descripcion="Donde fue el más votado"
      />
      <KpiCard
        icon={MinusCircle}
        etiqueta="Brecha total"
        valor={fmt.format(diferenciaTotal)}
        descripcion="Votos restantes en el ámbito"
      />
    </div>
  );
}

function KpiCard({
  icon: Icon,
  etiqueta,
  valor,
  descripcion,
  acento = false,
}: {
  icon: LucideIcon;
  etiqueta: string;
  valor: string;
  descripcion?: string;
  acento?: boolean;
}) {
  return (
    <Card className={cn(acento && 'border-brand/40 bg-brand-muted/30')}>
      <CardBody className="space-y-2" padding="sm">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg',
              acento ? 'bg-brand text-brand-foreground' : 'bg-brand-muted text-brand',
            )}
          >
            <Icon size={14} />
          </div>
          <div className="text-xs font-medium text-foreground-muted">
            {etiqueta}
          </div>
        </div>
        <div className="text-xl font-bold tracking-tight text-foreground num-tabular">{valor}</div>
        {descripcion && (
          <div className="line-clamp-2 text-[11px] text-foreground-muted">{descripcion}</div>
        )}
      </CardBody>
    </Card>
  );
}
