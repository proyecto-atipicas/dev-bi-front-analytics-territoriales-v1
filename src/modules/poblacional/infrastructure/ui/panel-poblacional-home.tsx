'use client';

import {
  useReferenciasPoblacional,
  useResumenDimensionesPoblacional,
} from '../../application/hooks';
import { GraficaAdaptativaPoblacional } from './grafica-adaptativa';
import { EmptyState } from '@/shared/ui/components/empty-state';
import { Skeleton } from '@/shared/ui/components/skeleton';
import { SelectFiltro } from '@/shared/ui/components/select-filtro';
import { cn } from '@/shared/ui/utils/cn';
import {
  ChevronDown,
  Database,
  FileText,
  Layers,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

/**
 * Panel poblacional del Home: completamente independiente de los filtros
 * globales. Layout: dimensiones a la izquierda (lista), fuente + referencia
 * a la derecha (filtros), gráfica dinámica abajo. Auto-selecciona la primera
 * fuente y la primera referencia disponibles para que siempre haya datos.
 */
export function PanelPoblacionalHome() {
  const { data: resumen, isLoading: loadingResumen } =
    useResumenDimensionesPoblacional();

  const [dimension, setDimension] = useState<string | null>(null);
  const [fuente, setFuente] = useState<string | null>(null);
  const [referencia, setReferencia] = useState<string | null>(null);

  // 1) Auto-selecciona la primera dimensión.
  useEffect(() => {
    if (!resumen || resumen.length === 0) return;
    if (!dimension || !resumen.some((d) => d.dimension === dimension)) {
      setDimension(resumen[0].dimension);
    }
  }, [resumen, dimension]);

  const dimActual = useMemo(
    () => (resumen ?? []).find((d) => d.dimension === dimension) ?? null,
    [resumen, dimension],
  );

  // 2) Al cambiar dimensión, auto-selecciona la primera fuente disponible.
  useEffect(() => {
    if (!dimActual) return;
    if (
      !fuente ||
      !dimActual.fuentes.some((f) => f.fuente === fuente)
    ) {
      setFuente(dimActual.fuentes[0]?.fuente ?? null);
    }
  }, [dimActual, fuente]);

  const { data: referencias, isLoading: loadingRefs } =
    useReferenciasPoblacional(dimension, fuente);

  // 3) Al cambiar (dimensión, fuente), auto-selecciona la primera referencia.
  useEffect(() => {
    if (!referencias || referencias.length === 0) {
      setReferencia(null);
      return;
    }
    if (!referencia || !referencias.includes(referencia)) {
      setReferencia(referencias[0]);
    }
  }, [referencias, referencia]);

  return (
    <div className="grid gap-4 lg:grid-cols-[14rem_1fr]">
      {/* Panel izquierdo: dimensiones */}
      <aside className="lg:sticky lg:top-2 lg:max-h-[34rem] lg:self-start">
        <div className="rounded-xl border border-border bg-surface p-2 shadow-soft">
          <p className="px-2 pb-2 pt-1 text-xs font-medium text-foreground-muted">
            Dimensiones
          </p>
          {loadingResumen ? (
            <div className="space-y-1.5 px-1 pb-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-9 w-full" />
              ))}
            </div>
          ) : (
            <ul className="max-h-[28rem] space-y-1 overflow-y-auto">
              {(resumen ?? []).map((d) => {
                const activa = d.dimension === dimension;
                return (
                  <li key={d.dimension}>
                    <button
                      type="button"
                      onClick={() => setDimension(d.dimension)}
                      className={cn(
                        'group flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-xs transition-colors',
                        activa
                          ? 'bg-brand-muted text-brand'
                          : 'text-foreground-muted hover:bg-surface-elevated hover:text-foreground',
                      )}
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <Layers
                          size={13}
                          className={cn(
                            'shrink-0',
                            activa ? 'text-brand' : 'text-foreground-subtle',
                          )}
                        />
                        <span className="truncate font-medium">{d.dimension}</span>
                      </span>
                      <span
                        className={cn(
                          'shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold',
                          activa
                            ? 'bg-brand text-brand-foreground'
                            : 'bg-surface-elevated text-foreground-muted',
                        )}
                        title={`${d.fuentes.length} ${d.fuentes.length === 1 ? 'fuente' : 'fuentes'}`}
                      >
                        {d.fuentes.length}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </aside>

      {/* Panel derecho: filtros + gráfica */}
      <div className="space-y-3">
        <div className="grid grid-cols-1 gap-2 rounded-xl border border-border bg-surface-elevated/40 p-3 sm:grid-cols-3 sm:items-end sm:gap-3">
          <Selector
            className="sm:col-span-1"
            label="Fuente"
            value={fuente}
            onChange={setFuente}
            disabled={!dimActual || dimActual.fuentes.length === 0}
            loading={loadingResumen}
            options={(dimActual?.fuentes ?? []).map((f) => ({
              value: f.fuente,
              label: f.fuente,
            }))}
            icon={Database}
          />
          <Selector
            className="sm:col-span-2"
            label="Referencia"
            count={(referencias ?? []).length}
            value={referencia}
            onChange={setReferencia}
            disabled={!fuente || (referencias ?? []).length === 0}
            loading={loadingRefs}
            options={(referencias ?? []).map((r) => ({ value: r, label: r }))}
            icon={FileText}
          />
        </div>

        <div className="rounded-xl border border-border bg-surface p-4 shadow-soft">
          {!dimension || !fuente || !referencia ? (
            <EmptyState size="md" description="Cargando vista por defecto…" />
          ) : (
            <GraficaAdaptativaPoblacional
              dimension={dimension}
              fuente={fuente}
              referencia={referencia}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function Selector({
  label,
  value,
  onChange,
  options,
  loading,
  disabled,
  count,
  className,
}: {
  label: string;
  value: string | null;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  loading?: boolean;
  disabled?: boolean;
  /** Conservado por compatibilidad; el control ya no muestra icono. */
  icon?: typeof Database;
  /** Contador opcional que aparece junto al título (ej. nº de opciones disponibles) */
  count?: number;
  className?: string;
}) {
  return (
    <SelectFiltro
      label={typeof count === 'number' && count > 0 ? `${label} (${count})` : label}
      value={value}
      onChange={(v) => onChange(v ?? '')}
      options={options}
      loading={loading}
      disabled={disabled}
      placeholder="Seleccione…"
      className={className}
    />
  );
}
