'use client';

import { cn } from '@/shared/ui/utils/cn';
import { Check, ChevronDown, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

export interface MultiSelectOption {
  value: string;
  label: string;
}

export interface MultiSelectFiltroProps {
  label: string;
  values: string[];
  options: MultiSelectOption[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

/**
 * Selector múltiple desplegable/colapsable. Pensado para los criterios
 * (`serie_estadistica`) en indicadores nacionales: lista corta, sin necesidad
 * de búsqueda interna, con resumen compacto del estado seleccionado.
 */
export function MultiSelectFiltro({
  label,
  values,
  options,
  onChange,
  placeholder = 'Todos',
  disabled = false,
  loading = false,
  className,
}: MultiSelectFiltroProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Cerrar al hacer click fuera o presionar Escape.
  useEffect(() => {
    if (!open) return;
    function handle(ev: MouseEvent) {
      if (ref.current && !ref.current.contains(ev.target as Node)) {
        setOpen(false);
      }
    }
    function handleEsc(ev: KeyboardEvent) {
      if (ev.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', handle);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handle);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [open]);

  const seleccionados = useMemo(
    () => new Set(values),
    [values],
  );

  const todos = options.length > 0 && seleccionados.size === options.length;
  const ninguno = seleccionados.size === 0;

  const resumen = useMemo(() => {
    if (loading) return 'Cargando…';
    if (options.length === 0) return 'Sin criterios';
    if (todos || ninguno) return `Todos (${options.length})`;
    if (seleccionados.size === 1) {
      const v = values[0];
      const opt = options.find((o) => o.value === v);
      return opt?.label ?? v;
    }
    return `${seleccionados.size} seleccionados`;
  }, [loading, options, seleccionados, todos, ninguno, values]);

  const toggle = (value: string) => {
    if (seleccionados.has(value)) {
      onChange(values.filter((v) => v !== value));
    } else {
      onChange([...values, value]);
    }
  };

  const seleccionarTodo = () => onChange(options.map((o) => o.value));
  const limpiar = () => onChange([]);

  return (
    <div className={cn('relative min-w-0', className)} ref={ref as never}>
      <div className="relative">
        <button
          type="button"
          disabled={disabled || loading || options.length === 0}
          onClick={() => setOpen((o) => !o)}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label={label}
          className={cn(
            'flex h-12 w-full flex-col justify-center rounded-lg border bg-surface pl-3 pr-8 text-left transition-colors',
            'focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15',
            'disabled:cursor-not-allowed disabled:opacity-60',
            !ninguno && !todos
              ? 'border-brand/40 bg-brand-muted/40'
              : 'border-border hover:border-border-strong',
            open && 'border-brand ring-2 ring-brand/15',
          )}
        >
          <span
            className={cn(
              'truncate text-[11px] font-medium leading-none',
              !ninguno && !todos ? 'text-brand' : 'text-foreground-muted',
            )}
          >
            {label}
          </span>
          <span className="mt-1 w-full truncate text-sm font-medium leading-tight text-foreground">
            {ninguno && !todos ? placeholder : resumen}
          </span>
          <ChevronDown
            size={15}
            className={cn(
              'pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-foreground-subtle transition-transform',
              open && 'rotate-180',
            )}
          />
        </button>

        {open && (
          <div
            role="listbox"
            className="absolute z-30 mt-1 w-full max-h-72 overflow-auto rounded-lg border border-border bg-surface shadow-elevated"
          >
            {options.length > 1 && (
              <div className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-border bg-surface-elevated/95 px-3 py-1.5 backdrop-blur">
                <button
                  type="button"
                  onClick={seleccionarTodo}
                  className="text-[11px] font-medium text-brand hover:underline"
                >
                  Seleccionar todo
                </button>
                <button
                  type="button"
                  onClick={limpiar}
                  className="inline-flex items-center gap-0.5 text-[11px] font-medium text-foreground-muted hover:text-foreground"
                >
                  <X size={11} /> Limpiar
                </button>
              </div>
            )}
            <ul className="py-1">
              {options.map((opt) => {
                const checked = seleccionados.has(opt.value);
                return (
                  <li key={opt.value}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={checked}
                      onClick={() => toggle(opt.value)}
                      className={cn(
                        'flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs transition-colors',
                        checked
                          ? 'bg-brand-muted/40 text-foreground'
                          : 'text-foreground-muted hover:bg-surface-elevated/60',
                      )}
                    >
                      <span
                        className={cn(
                          'flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors',
                          checked
                            ? 'border-brand bg-brand text-brand-foreground'
                            : 'border-border bg-surface',
                        )}
                      >
                        {checked && <Check size={11} />}
                      </span>
                      <span className="truncate" title={opt.label}>
                        {opt.label}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
