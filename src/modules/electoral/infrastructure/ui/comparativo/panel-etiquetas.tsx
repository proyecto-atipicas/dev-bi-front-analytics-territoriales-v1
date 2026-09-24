'use client';

import type {
  ComparativoTerritorialResultado,
  TerritorioComparativo,
} from '@/modules/electoral/domain/entities';
import { cn } from '@/shared/ui/utils/cn';
import { Crown, TrendingUp } from 'lucide-react';
import { COLOR_A, COLOR_B } from './colores-comparativo';

const fmt = new Intl.NumberFormat('es-CO');

export interface PanelEtiquetasProps {
  resultado: ComparativoTerritorialResultado;
  encabezadoNivel: string;
}

export function PanelEtiquetasComparativo({
  resultado,
  encabezadoNivel,
}: PanelEtiquetasProps) {
  const territorios = resultado.territorios;
  const ganaA = territorios.filter((t) => t.ganador === 'A').length;
  const ganaB = territorios.filter((t) => t.ganador === 'B').length;
  const empates = territorios.filter((t) => t.ganador === 'EMPATE').length;

  const diferenciaTotal = Math.abs(
    resultado.itemA.totalVotos - resultado.itemB.totalVotos,
  );
  const ganadorGlobal: TerritorioComparativo['ganador'] =
    resultado.itemA.totalVotos > resultado.itemB.totalVotos
      ? 'A'
      : resultado.itemA.totalVotos < resultado.itemB.totalVotos
        ? 'B'
        : 'EMPATE';

  // Top territorios por margen para cada ítem.
  const topMargenA = [...territorios]
    .filter((t) => t.ganador === 'A')
    .sort((a, b) => b.diferencia - a.diferencia)
    .slice(0, 3);
  const topMargenB = [...territorios]
    .filter((t) => t.ganador === 'B')
    .sort((a, b) => b.diferencia - a.diferencia)
    .slice(0, 3);

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <BloqueResumen
          icono={<Crown size={14} />}
          titulo="Ganador global"
          valor={
            ganadorGlobal === 'EMPATE'
              ? 'Empate técnico'
              : ganadorGlobal === 'A'
                ? resultado.itemA.nombre
                : resultado.itemB.nombre
          }
          color={
            ganadorGlobal === 'A'
              ? COLOR_A
              : ganadorGlobal === 'B'
                ? COLOR_B
                : null
          }
        />
        <BloqueResumen
          icono={<TrendingUp size={14} />}
          titulo="Diferencia de votos"
          valor={`${fmt.format(diferenciaTotal)} votos`}
        />
      </div>

      <div className="space-y-2">
        <div className="label-eyebrow">
          {encabezadoNivel} ganados
        </div>
        <div className="grid grid-cols-3 gap-2">
          <ChipConteo cantidad={ganaA} etiqueta="A" color={COLOR_A} />
          <ChipConteo cantidad={ganaB} etiqueta="B" color={COLOR_B} />
          <ChipConteo cantidad={empates} etiqueta="Empate" />
        </div>
      </div>

      {topMargenA.length > 0 && (
        <ListaMargenes
          titulo={`Mayores brechas a favor de ${resultado.itemA.nombre}`}
          color={COLOR_A}
          items={topMargenA}
        />
      )}
      {topMargenB.length > 0 && (
        <ListaMargenes
          titulo={`Mayores brechas a favor de ${resultado.itemB.nombre}`}
          color={COLOR_B}
          items={topMargenB}
        />
      )}
    </div>
  );
}

function BloqueResumen({
  icono,
  titulo,
  valor,
  color,
}: {
  icono: React.ReactNode;
  titulo: string;
  valor: string;
  color?: typeof COLOR_A | null;
}) {
  return (
    <div
      className={cn(
        'rounded-lg border bg-surface px-3 py-2',
        color ? cn(color.border, color.bg) : 'border-border',
      )}
    >
      <div className="flex items-center gap-1.5 text-xs font-medium text-foreground-muted">
        {icono}
        {titulo}
      </div>
      <div
        className={cn(
          'mt-0.5 text-sm font-semibold',
          color ? color.text : 'text-foreground',
        )}
      >
        {valor}
      </div>
    </div>
  );
}

function ChipConteo({
  cantidad,
  etiqueta,
  color,
}: {
  cantidad: number;
  etiqueta: string;
  color?: typeof COLOR_A;
}) {
  return (
    <div
      className={cn(
        'rounded-lg border bg-surface px-2 py-2 text-center',
        color ? cn(color.border, color.bg) : 'border-border',
      )}
    >
      <div
        className={cn(
          'text-lg font-bold num-tabular',
          color ? color.text : 'text-foreground',
        )}
      >
        {cantidad}
      </div>
      <div className="text-[10px] font-medium text-foreground-muted">
        {etiqueta}
      </div>
    </div>
  );
}

function ListaMargenes({
  titulo,
  color,
  items,
}: {
  titulo: string;
  color: typeof COLOR_A;
  items: TerritorioComparativo[];
}) {
  return (
    <div className="space-y-1.5">
      <div className={cn('text-xs font-medium', color.text)}>
        {titulo}
      </div>
      <ul className="space-y-1">
        {items.map((t) => (
          <li
            key={[t.codigoDepartamento, t.codigoMunicipio ?? '', t.codigoPuesto ?? ''].join('|')}
            className="flex items-center justify-between gap-2 rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs"
          >
            <span className="min-w-0 truncate font-medium text-foreground">
              {t.nombre}
            </span>
            <span className={cn('shrink-0 font-semibold num-tabular', color.text)}>
              {t.diferenciaPct >= 0 ? '+' : ''}
              {t.diferenciaPct.toFixed(1)}%
              <span className="ml-1 text-[10px] text-foreground-subtle">
                ({fmt.format(t.diferencia)})
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
