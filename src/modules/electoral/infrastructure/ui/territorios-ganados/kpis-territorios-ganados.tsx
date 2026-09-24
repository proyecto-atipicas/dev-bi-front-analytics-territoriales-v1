'use client';

import type { TerritoriosGanadosResultado } from '@/modules/electoral/domain/entities';
import { Card, CardBody } from '@/shared/ui/components/card';
import { cn } from '@/shared/ui/utils/cn';
import {
  Activity,
  Award,
  MapPin,
  TrendingUp,
  Vote,
} from 'lucide-react';
import {
  formatearNombrePersona,
  formatearTerritorio,
} from '@/shared/ui/utils/formatear-territorio';
import type { LucideIcon } from 'lucide-react';
import { formatearPorcentaje } from '@/shared/ui/utils/formatear-porcentaje';

const fmt = new Intl.NumberFormat('es-CO');

export interface KpisTerritoriosGanadosProps {
  resultado: TerritoriosGanadosResultado;
}

export function KpisTerritoriosGanados({ resultado }: KpisTerritoriosGanadosProps) {
  const etiquetaTerritorios = resultado.nivel === 'departamento' ? 'Departamentos' : 'Municipios';

  // Territorio con mayor respaldo relativo: dice dónde es más fuerte el
  // candidato, algo que el total de votos por sí solo no muestra.
  const bastion = resultado.territorios.reduce<(typeof resultado.territorios)[number] | null>(
    (mejor, t) => (!mejor || t.participacionPct > mejor.participacionPct ? t : mejor),
    null,
  );

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
        descripcion={formatearNombrePersona(resultado.nombre)}
        acento
      />
      <KpiCard
        icon={Activity}
        etiqueta="Participación"
        valor={`${formatearPorcentaje(resultado.participacionPct, 2)}`}
        descripcion="Sobre el total de la elección"
      />
      <KpiCard
        icon={Award}
        etiqueta={`${etiquetaTerritorios} ganados`}
        valor={fmt.format(resultado.totalTerritoriosGanados)}
        descripcion="Donde fue el más votado"
      />
      <KpiCard
        icon={MapPin}
        etiqueta="Mayor respaldo"
        valor={bastion ? `${formatearPorcentaje(bastion.participacionPct, 2)}` : '—'}
        descripcion={
          bastion
            ? `${formatearTerritorio(bastion.nombre)}, donde obtuvo su mejor porcentaje`
            : 'No fue el más votado en ningún territorio'
        }
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
