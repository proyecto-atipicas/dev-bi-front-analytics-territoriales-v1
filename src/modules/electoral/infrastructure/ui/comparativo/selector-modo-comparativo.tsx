'use client';

import { cn } from '@/shared/ui/utils/cn';
import { BarChart3, Building2, UserCheck } from 'lucide-react';

/**
 * Opción activa del selector de tipos de comparación. Las dos primeras son
 * dimensiones del comparativo pairwise (A vs B); la tercera activa el
 * comparativo estadístico multi-candidato.
 */
export type ModoComparativo = 'candidato' | 'partido' | 'estadistico';

export interface SelectorModoComparativoProps {
  activo: ModoComparativo;
  onSelect: (modo: ModoComparativo) => void;
}

export function SelectorModoComparativo({ activo, onSelect }: SelectorModoComparativoProps) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium text-foreground-muted">
        Tipo de comparación
      </span>
      <div className="inline-flex w-fit max-w-full flex-wrap gap-1 rounded-xl border border-border bg-background p-1">
        <Boton
          activo={activo === 'candidato'}
          onClick={() => onSelect('candidato')}
          icon={<UserCheck size={15} />}
          label="Por candidato"
        />
        <Boton
          activo={activo === 'partido'}
          onClick={() => onSelect('partido')}
          icon={<Building2 size={15} />}
          label="Por partido"
        />
        <Boton
          activo={activo === 'estadistico'}
          onClick={() => onSelect('estadistico')}
          icon={<BarChart3 size={15} />}
          label="Estadístico"
        />
      </div>
    </div>
  );
}

function Boton({
  activo,
  onClick,
  icon,
  label,
}: {
  activo: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={activo}
      className={cn(
        'inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm transition-colors',
        activo
          ? 'bg-surface font-semibold text-foreground shadow-soft ring-1 ring-border/80 [&>svg]:text-brand'
          : 'font-medium text-foreground-muted hover:text-foreground',
      )}
    >
      {icon}
      {label}
    </button>
  );
}
