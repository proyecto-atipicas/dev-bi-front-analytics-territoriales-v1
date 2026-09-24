'use client';

import { cn } from '@/shared/ui/utils/cn';
import { ChevronDown } from 'lucide-react';
import { ChangeEvent, useMemo } from 'react';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectFiltroProps {
  label: string;
  value: string | null;
  options: SelectOption[];
  onChange: (value: string | null) => void;
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

export function SelectFiltro({
  label,
  value,
  options,
  onChange,
  placeholder = 'Todos',
  disabled = false,
  loading = false,
  className,
}: SelectFiltroProps) {
  const handleChange = (e: ChangeEvent<HTMLSelectElement>) => {
    onChange(e.target.value === '' ? null : e.target.value);
  };

  const activo = value !== null && value !== '';
  const bloqueado = disabled || loading;
  // Las claves de React salen del value: si el catálogo trae valores
  // repetidos, React no puede reconciliar la lista y deja opciones viejas.
  const opciones = useMemo(() => {
    const vistos = new Set<string>();
    return options.filter((o) => !vistos.has(o.value) && vistos.add(o.value));
  }, [options]);

  return (
    <label
      className={cn(
        'group relative flex h-12 min-w-0 flex-col justify-center rounded-lg border bg-surface pl-3 pr-8 transition-colors',
        'focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/15',
        activo
          ? 'border-brand/40 bg-brand-muted/40'
          : 'border-border hover:border-border-strong',
        bloqueado && 'cursor-not-allowed opacity-60 hover:border-border',
        className,
      )}
    >
      <span
        className={cn(
          'truncate text-[11px] font-medium leading-none',
          activo ? 'text-brand' : 'text-foreground-muted',
        )}
      >
        {label}
      </span>
      <select
        value={value ?? ''}
        onChange={handleChange}
        disabled={bloqueado}
        className={cn(
          'mt-1 w-full min-w-0 cursor-pointer appearance-none truncate bg-transparent text-sm leading-tight text-foreground focus:outline-none',
          activo ? 'font-semibold' : 'font-medium',
          'disabled:cursor-not-allowed',
        )}
      >
        <option value="">{loading ? 'Cargando…' : placeholder}</option>
        {opciones.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={15}
        className={cn(
          'pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 transition-colors',
          activo ? 'text-brand' : 'text-foreground-subtle group-hover:text-foreground-muted',
        )}
      />
    </label>
  );
}
