'use client';

import type {
  ComparativoEstadisticoResultado,
  DepartamentoComparativoEstadistico,
} from '@/modules/electoral/domain/entities';
import { exportarCsv } from '@/shared/ui/utils/exportar-csv';
import { cn } from '@/shared/ui/utils/cn';
import {
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Crown,
  Download,
  Search,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { colorCandidato } from './colores-estadistico';
import { formatearPorcentaje } from '@/shared/ui/utils/formatear-porcentaje';

const fmt = new Intl.NumberFormat('es-CO');
const PAGE_SIZE = 10;

/** Quita acentos y normaliza para la búsqueda. */
function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

/** Columna ordenable: por nombre, por candidato (clave), o métricas. */
type ColumnaOrden =
  | { tipo: 'nombre' }
  | { tipo: 'total' }
  | { tipo: 'diferencia' }
  | { tipo: 'ventaja' }
  | { tipo: 'candidato'; key: string };

interface OrdenEstado {
  columna: ColumnaOrden;
  dir: 'asc' | 'desc';
}

function mismaColumna(a: ColumnaOrden, b: ColumnaOrden): boolean {
  if (a.tipo !== b.tipo) return false;
  if (a.tipo === 'candidato' && b.tipo === 'candidato') return a.key === b.key;
  return true;
}

export interface TablaEstadisticoProps {
  resultado: ComparativoEstadisticoResultado;
}

export function TablaEstadistico({ resultado }: TablaEstadisticoProps) {
  const { candidatos, departamentos } = resultado;

  const [busqueda, setBusqueda] = useState('');
  const [orden, setOrden] = useState<OrdenEstado>({
    columna: { tipo: 'total' },
    dir: 'desc',
  });
  const [pagina, setPagina] = useState(1);

  // Mapa key → votos por departamento para acceso O(1) en orden y render.
  const votosPorDepto = useMemo(() => {
    const m = new Map<string, Map<string, number>>();
    for (const d of departamentos) {
      const inner = new Map<string, number>();
      for (const v of d.valores) inner.set(v.key, v.votos);
      m.set(d.codigoDepartamento, inner);
    }
    return m;
  }, [departamentos]);

  const filtrados = useMemo(() => {
    const q = normalizar(busqueda);
    if (!q) return departamentos;
    return departamentos.filter((d) => normalizar(d.nombre).includes(q));
  }, [departamentos, busqueda]);

  const ordenados = useMemo(() => {
    const arr = [...filtrados];
    const factor = orden.dir === 'asc' ? 1 : -1;
    const valor = (d: DepartamentoComparativoEstadistico): number | string => {
      switch (orden.columna.tipo) {
        case 'nombre':
          return normalizar(d.nombre);
        case 'total':
          return d.totalSeleccionados;
        case 'diferencia':
          return d.diferencia;
        case 'ventaja':
          return d.ventajaPct;
        case 'candidato':
          return votosPorDepto.get(d.codigoDepartamento)?.get(orden.columna.key) ?? 0;
      }
    };
    arr.sort((a, b) => {
      const va = valor(a);
      const vb = valor(b);
      if (typeof va === 'string' || typeof vb === 'string') {
        return String(va).localeCompare(String(vb)) * factor;
      }
      return (va - vb) * factor;
    });
    return arr;
  }, [filtrados, orden, votosPorDepto]);

  const totalPaginas = Math.max(1, Math.ceil(ordenados.length / PAGE_SIZE));

  // Reset de página cuando cambian datos, búsqueda u orden.
  useEffect(() => {
    setPagina(1);
  }, [busqueda, orden, departamentos]);

  const paginaActual = Math.min(pagina, totalPaginas);
  const inicio = (paginaActual - 1) * PAGE_SIZE;
  const visibles = ordenados.slice(inicio, inicio + PAGE_SIZE);

  const cambiarOrden = (columna: ColumnaOrden) => {
    setOrden((prev) => {
      if (mismaColumna(prev.columna, columna)) {
        return { columna, dir: prev.dir === 'asc' ? 'desc' : 'asc' };
      }
      // Nombre arranca ascendente; las métricas numéricas, descendente.
      return { columna, dir: columna.tipo === 'nombre' ? 'asc' : 'desc' };
    });
  };

  const exportar = () => {
    const encabezados = [
      'Departamento',
      ...candidatos.flatMap((c) => [`${c.nombre} (votos)`, `${c.nombre} (%)`]),
      'Total seleccionados',
      'Diferencia',
      'Ventaja (%)',
    ];
    const filas = ordenados.map((d) => {
      const inner = votosPorDepto.get(d.codigoDepartamento);
      const valores = candidatos.flatMap((c) => {
        const votos = inner?.get(c.key) ?? 0;
        const pct = d.totalSeleccionados > 0 ? (votos / d.totalSeleccionados) * 100 : 0;
        return [votos, Number(pct.toFixed(2))];
      });
      return [d.nombre, ...valores, d.totalSeleccionados, d.diferencia, d.ventajaPct];
    });
    exportarCsv('comparativo-estadistico-departamentos', encabezados, filas);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="relative w-full max-w-xs">
          <Search
            size={14}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-foreground-subtle"
          />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar departamento…"
            className={cn(
              'h-9 w-full rounded-lg border border-border bg-surface pl-9 pr-3 text-sm text-foreground shadow-soft transition-colors',
              'focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20',
            )}
          />
        </div>
        <button
          type="button"
          onClick={exportar}
          className={cn(
            'inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-xs font-medium text-foreground-muted transition-colors',
            'hover:border-brand/40 hover:bg-brand-muted/30 hover:text-brand',
          )}
        >
          <Download size={14} />
          Exportar CSV
        </button>
      </div>

      <div className="rounded-lg border border-border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-surface-elevated text-left label-eyebrow">
              <tr>
                <Th
                  activa={orden.columna.tipo === 'nombre'}
                  dir={orden.dir}
                  onClick={() => cambiarOrden({ tipo: 'nombre' })}
                  className="sticky left-0 z-10 bg-surface-elevated"
                >
                  Departamento
                </Th>
                {candidatos.map((c, i) => (
                  <Th
                    key={c.key}
                    activa={orden.columna.tipo === 'candidato' && orden.columna.key === c.key}
                    dir={orden.dir}
                    onClick={() => cambiarOrden({ tipo: 'candidato', key: c.key })}
                    alinear="right"
                  >
                    <span className="inline-flex items-center justify-end gap-1.5" title={c.nombre}>
                      <span
                        className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: colorCandidato(i) }}
                      />
                      <span className="max-w-[9rem] truncate">{c.nombre}</span>
                    </span>
                  </Th>
                ))}
                <Th
                  activa={orden.columna.tipo === 'diferencia'}
                  dir={orden.dir}
                  onClick={() => cambiarOrden({ tipo: 'diferencia' })}
                  alinear="right"
                  className="hidden md:table-cell"
                >
                  Diferencia
                </Th>
                <Th
                  activa={orden.columna.tipo === 'ventaja'}
                  dir={orden.dir}
                  onClick={() => cambiarOrden({ tipo: 'ventaja' })}
                  alinear="right"
                >
                  Ventaja
                </Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {visibles.map((d) => (
                <FilaDepartamento
                  key={d.codigoDepartamento}
                  depto={d}
                  candidatos={candidatos}
                  votos={votosPorDepto.get(d.codigoDepartamento)}
                />
              ))}
              {ordenados.length === 0 && (
                <tr>
                  <td
                    colSpan={candidatos.length + 3}
                    className="px-4 py-8 text-center text-xs text-foreground-muted"
                  >
                    Sin departamentos para la búsqueda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {ordenados.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border bg-surface-elevated/40 px-4 py-2.5 text-xs text-foreground-muted">
            <span className="num-tabular">
              Mostrando <span className="font-semibold text-foreground">{inicio + 1}</span>–
              <span className="font-semibold text-foreground">
                {Math.min(inicio + PAGE_SIZE, ordenados.length)}
              </span>{' '}
              de <span className="font-semibold text-foreground">{ordenados.length}</span>
            </span>
            <div className="flex items-center gap-1.5">
              <BotonPagina
                disabled={paginaActual <= 1}
                onClick={() => setPagina(paginaActual - 1)}
                aria-label="Página anterior"
              >
                <ChevronLeft size={14} />
              </BotonPagina>
              <span className="px-1.5 num-tabular">
                <span className="font-semibold text-foreground">{paginaActual}</span> /{' '}
                {totalPaginas}
              </span>
              <BotonPagina
                disabled={paginaActual >= totalPaginas}
                onClick={() => setPagina(paginaActual + 1)}
                aria-label="Página siguiente"
              >
                <ChevronRight size={14} />
              </BotonPagina>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Th({
  children,
  activa,
  dir,
  onClick,
  alinear = 'left',
  className,
}: {
  children: React.ReactNode;
  activa: boolean;
  dir: 'asc' | 'desc';
  onClick: () => void;
  alinear?: 'left' | 'right';
  className?: string;
}) {
  return (
    <th className={cn('px-3 py-2.5', alinear === 'right' && 'text-right', className)}>
      <button
        type="button"
        onClick={onClick}
        className={cn(
          'inline-flex items-center gap-1 transition-colors hover:text-brand',
          alinear === 'right' && 'flex-row-reverse',
          activa && 'text-brand',
        )}
      >
        {children}
        {activa ? (
          dir === 'asc' ? (
            <ArrowUp size={12} />
          ) : (
            <ArrowDown size={12} />
          )
        ) : (
          <ChevronsUpDown size={12} className="text-foreground-subtle" />
        )}
      </button>
    </th>
  );
}

function FilaDepartamento({
  depto,
  candidatos,
  votos,
}: {
  depto: DepartamentoComparativoEstadistico;
  candidatos: ComparativoEstadisticoResultado['candidatos'];
  votos: Map<string, number> | undefined;
}) {
  return (
    <tr className="hover:bg-surface-elevated/60">
      <td className="sticky left-0 z-10 bg-surface px-4 py-2.5 font-medium text-foreground">
        <span className="block max-w-[10rem] truncate" title={depto.nombre}>
          {depto.nombre}
        </span>
      </td>
      {candidatos.map((c) => {
        const v = votos?.get(c.key) ?? 0;
        const pct =
          depto.totalSeleccionados > 0 ? (v / depto.totalSeleccionados) * 100 : 0;
        const esLider = depto.liderKey === c.key && depto.totalSeleccionados > 0;
        return (
          <td
            key={c.key}
            className={cn(
              'px-3 py-2.5 text-right num-tabular',
              esLider ? 'font-semibold text-foreground' : 'text-foreground-muted',
            )}
          >
            <span className="inline-flex items-center justify-end gap-1">
              {esLider && <Crown size={11} className="text-warning" />}
              {fmt.format(v)}
            </span>
            <span className="ml-1 text-[10px] text-foreground-subtle">
              ({formatearPorcentaje(pct, 1)})
            </span>
          </td>
        );
      })}
      <td className="hidden px-3 py-2.5 text-right text-foreground num-tabular md:table-cell">
        {fmt.format(depto.diferencia)}
      </td>
      <td className="px-3 py-2.5 text-right text-foreground num-tabular">
        {formatearPorcentaje(depto.ventajaPct, 1)}
      </td>
    </tr>
  );
}

function BotonPagina({
  children,
  disabled,
  onClick,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex h-7 w-7 items-center justify-center rounded-md border border-border bg-surface text-foreground-muted transition-colors',
        'hover:border-brand/40 hover:bg-brand-muted/30 hover:text-brand',
        'disabled:cursor-not-allowed disabled:opacity-40',
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
