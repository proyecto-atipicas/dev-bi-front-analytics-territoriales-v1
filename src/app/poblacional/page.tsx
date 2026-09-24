'use client';

import { FiltroPoblacional } from '@/modules/poblacional';
import { GraficaRadarPoblacional } from '@/modules/poblacional/infrastructure/ui/grafica-radar-poblacional';
import { GraficaTendenciaPoblacional } from '@/modules/poblacional/infrastructure/ui/grafica-tendencia-poblacional';
import {
  FiltrosPoblacionalState,
  PanelFiltrosPoblacional,
} from '@/modules/poblacional/infrastructure/ui/panel-filtros-poblacional';
import { TablaDatosPoblacional } from '@/modules/poblacional/infrastructure/ui/tabla-datos-poblacional';
import { Card, CardBody, CardHeader } from '@/shared/ui/components/card';
import {
  BarChartHorizontal as BarsIcon,
  LineChart as LineIcon,
  Radar as RadarIcon,
  Table as TableIcon,
} from 'lucide-react';
import {
  BarrasCriterios,
  KpisPoblacional,
} from '@/modules/poblacional/infrastructure/ui/resultado-criterios';
import {
  useHistoriaMedicion,
  useUltimaMedicion,
} from '@/modules/poblacional/infrastructure/ui/ultima-medicion';
import { cn } from '@/shared/ui/utils/cn';
import { useMemo, useState } from 'react';

const ESTADO_INICIAL: FiltrosPoblacionalState = {
  dimension: null,
  fuente: null,
  referencia: null,
  criterios: [],
};

export default function PoblacionalPage() {
  const [filtros, setFiltros] = useState<FiltrosPoblacionalState>(ESTADO_INICIAL);

  const filtroDominio: FiltroPoblacional = useMemo(
    () => ({
      dimension: filtros.dimension,
      fuente: filtros.fuente,
      referencia: filtros.referencia,
      criterios: filtros.criterios.length > 0 ? filtros.criterios : null,
    }),
    [filtros],
  );

  const medicion = useUltimaMedicion(filtroDominio);
  const historia = useHistoriaMedicion(filtroDominio);
  // Con una sola medición no hay tendencia que dibujar: la vista se reordena
  // (barras junto a la tabla) en vez de mostrar una tarjeta vacía.
  const conTendencia = historia.periodos > 1;
  const [vistaCriterios, setVistaCriterios] = useState<'barras' | 'radar'>('barras');

  const tendenciaDescripcion = filtros.referencia
    ? `${filtros.referencia}${
        filtros.criterios.length > 0
          ? ` · ${filtros.criterios.length} criterio${filtros.criterios.length === 1 ? '' : 's'}`
          : ''
      }`
    : undefined;

  const descripcionResultado = !medicion.periodo
    ? 'Último periodo disponible'
    : conTendencia && historia.periodoAnterior
      ? `Medición de ${medicion.periodo} y cambio frente a ${historia.periodoAnterior}`
      : `Medición única de ${medicion.periodo}; la tendencia aparecerá con una segunda medición`;

  const tarjetaResultado = (
    <Card className={conTendencia ? 'xl:col-span-5' : 'xl:col-span-7'}>
      <CardHeader
        title="Resultado por criterio"
        description={descripcionResultado}
        icon={vistaCriterios === 'barras' ? BarsIcon : RadarIcon}
        action={
          filtros.referencia ? (
            <div
              className="inline-flex rounded-lg border border-border bg-background p-0.5"
              role="group"
              aria-label="Tipo de gráfica"
            >
              {(['barras', 'radar'] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setVistaCriterios(v)}
                  aria-pressed={vistaCriterios === v}
                  className={cn(
                    'rounded-md px-2.5 py-1 text-xs transition-colors',
                    vistaCriterios === v
                      ? 'bg-surface font-semibold text-foreground shadow-soft ring-1 ring-border/80'
                      : 'font-medium text-foreground-muted hover:text-foreground',
                  )}
                >
                  {v === 'barras' ? 'Barras' : 'Radar'}
                </button>
              ))}
            </div>
          ) : undefined
        }
      />
      <CardBody>
        {vistaCriterios === 'barras' ? (
          <BarrasCriterios
            medicion={medicion}
            anteriores={conTendencia ? historia.anteriores : undefined}
          />
        ) : (
          <GraficaRadarPoblacional filtro={filtroDominio} />
        )}
      </CardBody>
    </Card>
  );

  const tarjetaTabla = (className?: string) => (
    <Card className={className}>
      <CardHeader title="Tabla de datos" icon={TableIcon} />
      <CardBody padding="none">
        <TablaDatosPoblacional filtro={filtroDominio} />
      </CardBody>
    </Card>
  );

  return (
    <div className="space-y-5 animate-fade-in">
      <PanelFiltrosPoblacional value={filtros} onChange={setFiltros} />

      {/* Lectura rápida de la última medición */}
      <KpisPoblacional medicion={medicion} filtro={filtroDominio} />

      {conTendencia ? (
        <>
          <section className="grid gap-4 xl:grid-cols-12">
            <Card className="xl:col-span-7">
              <CardHeader
                title="Tendencia"
                description={tendenciaDescripcion}
                icon={LineIcon}
              />
              <CardBody>
                <GraficaTendenciaPoblacional filtro={filtroDominio} />
              </CardBody>
            </Card>
            {tarjetaResultado}
          </section>
          {tarjetaTabla()}
        </>
      ) : (
        <section className="grid items-start gap-4 xl:grid-cols-12">
          {tarjetaResultado}
          {tarjetaTabla('xl:col-span-5')}
        </section>
      )}
    </div>
  );
}
