'use client';

import { DonutChart } from '@/shared/ui/components/donut-chart';
import { EmptyState } from '@/shared/ui/components/empty-state';
import { LineChart } from '@/shared/ui/components/line-chart';
import { Skeleton } from '@/shared/ui/components/skeleton';
import { cn } from '@/shared/ui/utils/cn';
import {
  BarChart3,
  LineChart as LineIcon,
  LucideIcon,
  PieChart,
} from 'lucide-react';
import { useMemo } from 'react';
import { useSeriePoblacional } from '../../application/hooks';
import { SeriePoblacionalPunto } from '../../domain/entities';
import { ListaBarrasCriterios } from './resultado-criterios';

export interface GraficaAdaptativaProps {
  dimension: string;
  fuente: string;
  referencia: string;
}

type TipoGrafica = 'line' | 'bar' | 'donut';

interface AnalisisSerie {
  tipo: TipoGrafica;
  icon: LucideIcon;
  motivo: string;
  periodos: number;
  criterios: number;
}

function formatPeriodo(anio: number, mes: number | null): string {
  if (!mes) return String(anio);
  return `${anio}-${String(mes).padStart(2, '0')}`;
}

/**
 * Heurística que elige el tipo de gráfica según la forma de los datos:
 *  - Múltiples períodos (mes/año)            → línea (serie temporal)
 *  - Período único + criterios suman ~100%   → donut (distribución)
 *  - Período único + pocos criterios         → barras (comparativo)
 *  - Default                                 → línea
 */
function analizarSerie(serie: SeriePoblacionalPunto[]): AnalisisSerie {
  const periodos = new Set(serie.map((p) => formatPeriodo(p.anio, p.mes)));
  const criterios = new Set(serie.map((p) => p.criterio ?? '_'));

  if (periodos.size > 1) {
    return {
      tipo: 'line',
      icon: LineIcon,
      motivo: `${periodos.size} mediciones en el tiempo`,
      periodos: periodos.size,
      criterios: criterios.size,
    };
  }

  if (criterios.size > 1 && criterios.size <= 10) {
    const total = serie.reduce((s, p) => s + p.valor, 0);
    const esDistribucion = total >= 95 && total <= 105;
    if (esDistribucion) {
      return {
        tipo: 'donut',
        icon: PieChart,
        motivo: 'Los valores suman cerca del 100 %',
        periodos: periodos.size,
        criterios: criterios.size,
      };
    }
  }

  // Una sola medición: una línea no tiene recorrido que mostrar, así que
  // se comparan los criterios entre sí, ordenados de mayor a menor.
  return {
    tipo: 'bar',
    icon: BarChart3,
    motivo: `Una medición, ${criterios.size} ${criterios.size === 1 ? 'criterio' : 'criterios'} ordenados de mayor a menor`,
    periodos: periodos.size,
    criterios: criterios.size,
  };
}

export function GraficaAdaptativaPoblacional({
  dimension,
  fuente,
  referencia,
}: GraficaAdaptativaProps) {
  const { data: serie, isLoading } = useSeriePoblacional({
    dimension,
    fuente,
    referencia,
  });

  const analisis = useMemo(
    () => (serie && serie.length > 0 ? analizarSerie(serie) : null),
    [serie],
  );

  if (isLoading) return <Skeleton className="h-80 w-full" />;
  if (!serie || serie.length === 0 || !analisis) {
    return (
      <EmptyState size="lg" description="Sin datos para la combinación seleccionada." />
    );
  }

  const Icon = analisis.icon;

  return (
    <div className="space-y-3">
      {/* Indicador del tipo de gráfica elegida */}
      <div className="flex items-center gap-2 text-xs text-foreground-muted">
        <span
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-semibold',
            analisis.tipo === 'line' && 'bg-info-muted text-info-foreground',
            analisis.tipo === 'bar' && 'bg-warning-muted text-warning-foreground',
            analisis.tipo === 'donut' && 'bg-brand-muted text-brand',
          )}
        >
          <Icon size={12} />
          {analisis.tipo === 'line' && 'Serie temporal'}
          {analisis.tipo === 'bar' && 'Comparación'}
          {analisis.tipo === 'donut' && 'Distribución'}
        </span>
        <span className="text-foreground-subtle">{analisis.motivo}</span>
      </div>

      {analisis.tipo === 'line' && <GraficaLinea serie={serie} />}
      {analisis.tipo === 'bar' && <GraficaBarras serie={serie} />}
      {analisis.tipo === 'donut' && (
        <div className="h-80">
          <GraficaDonut serie={serie} />
        </div>
      )}
    </div>
  );
}

/** Cada criterio es una serie de líneas. X = año-mes. */
function GraficaLinea({ serie }: { serie: SeriePoblacionalPunto[] }) {
  const labels = Array.from(
    new Set(serie.map((p) => formatPeriodo(p.anio, p.mes))),
  ).sort();
  const cats = Array.from(new Set(serie.map((p) => p.criterio ?? 'sin criterio')));
  const map = new Map<string, Map<string, number>>();
  serie.forEach((p) => {
    const c = p.criterio ?? 'sin criterio';
    const k = formatPeriodo(p.anio, p.mes);
    if (!map.has(c)) map.set(c, new Map());
    map.get(c)!.set(k, p.valor);
  });
  const datasets = cats.slice(0, 6).map((c) => ({
    label: c,
    data: labels.map((k) => map.get(c)?.get(k) ?? null),
  }));
  return <LineChart labels={labels} datasets={datasets} claseAlto="h-72" />;
}

/** Una barra por criterio (suma de valores), con el nombre completo. */
function GraficaBarras({ serie }: { serie: SeriePoblacionalPunto[] }) {
  const agg = new Map<string, number>();
  serie.forEach((p) => {
    const c = p.criterio ?? 'Sin criterio';
    agg.set(c, (agg.get(c) ?? 0) + p.valor);
  });
  const puntos = Array.from(agg, ([criterio, valor]) => ({ criterio, valor }));
  return <ListaBarrasCriterios puntos={puntos} />;
}

/** Donut: composición por criterio. */
function GraficaDonut({ serie }: { serie: SeriePoblacionalPunto[] }) {
  const agg = new Map<string, number>();
  serie.forEach((p) => {
    const c = p.criterio ?? 'sin criterio';
    agg.set(c, (agg.get(c) ?? 0) + p.valor);
  });
  const labels = Array.from(agg.keys());
  const data = labels.map((c) => agg.get(c) ?? 0);
  return <DonutChart labels={labels} data={data} />;
}
