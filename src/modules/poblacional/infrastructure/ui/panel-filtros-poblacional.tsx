'use client';

import { Card } from '@/shared/ui/components/card';
import { SelectFiltro } from '@/shared/ui/components/select-filtro';
import { Skeleton } from '@/shared/ui/components/skeleton';
import { cn } from '@/shared/ui/utils/cn';
import { Check, ChevronDown, SlidersHorizontal, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  useCriteriosPoblacional,
  useReferenciasPoblacional,
  useResumenDimensionesPoblacional,
} from '../../application/hooks';

export interface FiltrosPoblacionalState {
  dimension: string | null;
  fuente: string | null;
  referencia: string | null;
  criterios: string[];
}

export interface PanelFiltrosPoblacionalProps {
  value: FiltrosPoblacionalState;
  onChange: (next: FiltrosPoblacionalState) => void;
}

export function PanelFiltrosPoblacional({
  value,
  onChange,
}: PanelFiltrosPoblacionalProps) {
  const { dimension, fuente, referencia, criterios } = value;

  const { data: resumen, isLoading: loadingResumen } =
    useResumenDimensionesPoblacional();

  const dimActual = useMemo(
    () => (resumen ?? []).find((d) => d.dimension === dimension) ?? null,
    [resumen, dimension],
  );

  const { data: referencias, isLoading: loadingRefs } = useReferenciasPoblacional(
    dimension,
    fuente,
  );

  const { data: criteriosDisponibles, isLoading: loadingCrits } =
    useCriteriosPoblacional({
      dimension,
      fuente,
      referencia,
    });

  const setDimension = (next: string | null) => {
    onChange({ dimension: next, fuente: null, referencia: null, criterios: [] });
  };

  const setFuente = (next: string | null) => {
    onChange({ ...value, fuente: next, referencia: null, criterios: [] });
  };

  const setReferencia = (next: string | null) => {
    onChange({ ...value, referencia: next, criterios: [] });
  };

  const toggleCriterio = (c: string) => {
    const set = new Set(criterios);
    if (set.has(c)) set.delete(c);
    else set.add(c);
    onChange({ ...value, criterios: Array.from(set) });
  };

  const limpiarCriterios = () => onChange({ ...value, criterios: [] });

  const seleccionarTodos = () => {
    onChange({ ...value, criterios: [...(criteriosDisponibles ?? [])] });
  };

  const [criteriosAbierto, setCriteriosAbierto] = useState(false);

  const cantidadReferencias = referencias?.length ?? 0;
  const totalCriterios = (criteriosDisponibles ?? []).length;

  // Auto-selección al cargar el módulo: toma la primera dimensión, fuente y
  // referencia disponibles. Cada nivel se dispara una sola vez (refs) para
  // que el usuario pueda limpiar posteriormente sin que se vuelva a auto-
  // seleccionar.
  const autoDimRef = useRef(false);
  const autoFuenteRef = useRef(false);
  const autoRefRef = useRef(false);

  useEffect(() => {
    if (autoDimRef.current) return;
    if (dimension != null) {
      autoDimRef.current = true;
      return;
    }
    const lista = resumen ?? [];
    const primera = lista.find((d) => (d.fuentes ?? []).length > 0) ?? lista[0];
    if (primera) {
      autoDimRef.current = true;
      onChange({
        dimension: primera.dimension,
        fuente: null,
        referencia: null,
        criterios: [],
      });
    }
  }, [resumen, dimension, onChange]);

  useEffect(() => {
    if (autoFuenteRef.current) return;
    if (!dimension) return;
    if (fuente != null) {
      autoFuenteRef.current = true;
      return;
    }
    const fuentes = dimActual?.fuentes ?? [];
    const primera = fuentes[0];
    if (primera) {
      autoFuenteRef.current = true;
      onChange({
        dimension,
        fuente: primera.fuente,
        referencia: null,
        criterios: [],
      });
    }
  }, [dimension, dimActual, fuente, onChange]);

  useEffect(() => {
    if (autoRefRef.current) return;
    if (!dimension || !fuente) return;
    if (referencia != null) {
      autoRefRef.current = true;
      return;
    }
    const lista = referencias ?? [];
    const primera = lista[0];
    if (primera) {
      autoRefRef.current = true;
      onChange({
        dimension,
        fuente,
        referencia: primera,
        criterios: [],
      });
    }
  }, [dimension, fuente, referencia, referencias, onChange]);

  return (
    <Card>
      <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
        <SlidersHorizontal size={14} className="text-brand" />
        <p className="text-[11px] font-medium text-foreground">
          Panel de filtros
        </p>
      </div>

      <div className="space-y-3 p-4">
        {/* Jerarquía obligatoria */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <SelectFiltro
            label="Dimensión"
            value={dimension}
            loading={loadingResumen}
            options={(resumen ?? []).map((d) => ({
              value: d.dimension,
              label: d.dimension,
            }))}
            onChange={setDimension}
            placeholder="Seleccione dimensión"
          />
          <SelectFiltro
            label="Fuente"
            value={fuente}
            loading={loadingResumen}
            disabled={!dimension}
            options={(dimActual?.fuentes ?? []).map((f) => ({
              value: f.fuente,
              label: f.fuente,
            }))}
            onChange={setFuente}
            placeholder={dimension ? 'Seleccione fuente' : 'Elija dimensión primero'}
          />
          <SelectFiltro
            label={
              cantidadReferencias > 0
                ? `Referencia (${cantidadReferencias})`
                : 'Referencia'
            }
            value={referencia}
            loading={loadingRefs}
            disabled={!fuente}
            options={(referencias ?? []).map((r) => ({ value: r, label: r }))}
            onChange={setReferencia}
            placeholder={fuente ? 'Seleccione referencia' : 'Elija fuente primero'}
          />
        </div>

        {/* Criterios propios — habilitados sólo después de elegir referencia */}
        <div className="rounded-lg border border-border bg-surface-elevated/40">
          <button
            type="button"
            onClick={() => setCriteriosAbierto((s) => !s)}
            disabled={!referencia}
            aria-expanded={criteriosAbierto}
            className={cn(
              'flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-left transition-colors',
              referencia
                ? 'hover:bg-surface-elevated/70'
                : 'cursor-not-allowed opacity-60',
            )}
          >
            <div className="flex items-center gap-2">
              <ChevronDown
                size={14}
                className={cn(
                  'text-foreground-muted transition-transform',
                  criteriosAbierto && 'rotate-180',
                )}
              />
              <span className="text-xs font-medium text-foreground-muted">
                Criterios de la referencia
              </span>
              {referencia && totalCriterios > 0 && (
                <span className="inline-flex items-center rounded-full border border-border bg-surface px-1.5 py-0.5 text-[10px] font-semibold text-foreground-muted">
                  {criterios.length}/{totalCriterios}
                </span>
              )}
            </div>
            {criterios.length > 0 && (
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  limpiarCriterios();
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    e.stopPropagation();
                    limpiarCriterios();
                  }
                }}
                className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-medium text-foreground-muted transition-colors hover:bg-danger-muted/40 hover:text-danger"
              >
                <X size={11} />
                Limpiar
              </span>
            )}
          </button>

          {criteriosAbierto && (
            <div className="border-t border-border px-3 py-3">
              {!referencia ? (
                <p className="text-xs text-foreground-subtle">
                  Seleccione una referencia para habilitar los criterios.
                </p>
              ) : loadingCrits ? (
                <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-7 w-full" />
                  ))}
                </div>
              ) : totalCriterios === 0 ? (
                <p className="text-xs text-foreground-subtle">
                  No hay criterios para esta referencia.
                </p>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[10px] text-foreground-muted">
                    <span>
                      {criterios.length} de {totalCriterios} seleccionado
                      {criterios.length === 1 ? '' : 's'}
                    </span>
                    <button
                      type="button"
                      onClick={
                        criterios.length === totalCriterios
                          ? limpiarCriterios
                          : seleccionarTodos
                      }
                      className="font-medium text-brand transition-colors hover:text-brand/80"
                    >
                      {criterios.length === totalCriterios
                        ? 'Deseleccionar todos'
                        : 'Seleccionar todos'}
                    </button>
                  </div>
                  <ul
                    role="listbox"
                    aria-multiselectable="true"
                    className="grid max-h-64 grid-cols-1 gap-1 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-3"
                  >
                    {(criteriosDisponibles ?? []).map((c) => {
                      const activo = criterios.includes(c);
                      return (
                        <li key={c}>
                          <label
                            className={cn(
                              'flex cursor-pointer items-center gap-2 rounded-md border px-2 py-1.5 text-[11px] transition-colors',
                              activo
                                ? 'border-brand/60 bg-brand/10 text-foreground'
                                : 'border-border bg-surface text-foreground-muted hover:border-brand/40 hover:text-foreground',
                            )}
                          >
                            <span
                              className={cn(
                                'flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors',
                                activo
                                  ? 'border-brand bg-brand text-brand-foreground'
                                  : 'border-border bg-surface',
                              )}
                              aria-hidden="true"
                            >
                              {activo && <Check size={11} strokeWidth={3} />}
                            </span>
                            <input
                              type="checkbox"
                              className="sr-only"
                              checked={activo}
                              onChange={() => toggleCriterio(c)}
                            />
                            <span
                              className="block truncate"
                              title={c}
                            >
                              {c}
                            </span>
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

