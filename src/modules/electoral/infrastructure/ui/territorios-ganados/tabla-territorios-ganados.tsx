'use client';

import { useDepartamentos } from '@/modules/geo/application/hooks';
import type {
  NivelAnalisisTerritoriosGanados,
  TerritorioGanado,
} from '@/modules/electoral/domain/entities';
import { cn } from '@/shared/ui/utils/cn';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { formatearTerritorio } from '@/shared/ui/utils/formatear-territorio';
import { formatearPorcentaje } from '@/shared/ui/utils/formatear-porcentaje';

const fmt = new Intl.NumberFormat('es-CO');
const PAGE_SIZE = 15;
// Si las filas apenas superan una página (p. ej. 11 de 10), se muestran
// todas: una segunda página con una o dos filas sólo obliga a hacer clic.
const porPaginaPara = (total: number) =>
  total <= Math.ceil(PAGE_SIZE * 1.5) ? Math.max(total, 1) : PAGE_SIZE;

export interface TablaTerritoriosGanadosProps {
  territorios: TerritorioGanado[];
  nivel: NivelAnalisisTerritoriosGanados;
}

export function TablaTerritoriosGanados({ territorios, nivel }: TablaTerritoriosGanadosProps) {
  const esMunicipal = nivel === 'municipio';
  const encabezadoTerritorio = esMunicipal ? 'Municipio' : 'Departamento';
  const porPagina = porPaginaPara(territorios.length);
  const totalPaginas = Math.max(1, Math.ceil(territorios.length / porPagina));
  const [pagina, setPagina] = useState(1);

  // Sólo consultamos el catálogo cuando la vista municipal lo necesita.
  const { data: departamentos } = useDepartamentos();
  const nombrePorCodigoDepto = useMemo(() => {
    if (!esMunicipal || !departamentos) return new Map<string, string>();
    return new Map(departamentos.map((d) => [d.codigo, d.nombre]));
  }, [esMunicipal, departamentos]);

  // En vista municipal reordenamos por departamento ASC y luego por
  // total de votos del territorio DESC. La respuesta del backend viene
  // ordenada por votos del seleccionado, así que esta agrupación es puramente
  // de presentación.
  const territoriosOrdenados = useMemo(() => {
    if (!esMunicipal) return territorios;
    const collator = new Intl.Collator('es', { sensitivity: 'base' });
    const nombreDeptoDe = (codigo: string) =>
      nombrePorCodigoDepto.get(codigo) ?? codigo;
    return [...territorios].sort((a, b) => {
      const deptoCmp = collator.compare(
        nombreDeptoDe(a.codigoDepartamento),
        nombreDeptoDe(b.codigoDepartamento),
      );
      if (deptoCmp !== 0) return deptoCmp;
      return b.totalVotosTerritorio - a.totalVotosTerritorio;
    });
  }, [esMunicipal, territorios, nombrePorCodigoDepto]);

  // Si cambia la lista (filtros / nivel / selección), volvemos a la pág. 1.
  useEffect(() => {
    setPagina(1);
  }, [territoriosOrdenados, nivel]);

  const paginaActual = Math.min(pagina, totalPaginas);
  const inicio = (paginaActual - 1) * porPagina;
  const fin = Math.min(inicio + porPagina, territoriosOrdenados.length);
  const filas = useMemo(
    () => territoriosOrdenados.slice(inicio, fin),
    [territoriosOrdenados, inicio, fin],
  );

  const colSpan = esMunicipal ? 6 : 5;

  return (
    <div className="rounded-lg border border-border">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-surface-elevated text-left label-eyebrow">
            <tr>
              <th className="px-4 py-2.5">{encabezadoTerritorio}</th>
              {esMunicipal && <th className="px-3 py-2.5">Departamento</th>}
              <th className="px-3 py-2.5 text-right">Total votos territorio</th>
              <th className="px-3 py-2.5 text-right">Votos del seleccionado</th>
              <th className="hidden px-3 py-2.5 text-right md:table-cell">Participación</th>
              <th className="px-3 py-2.5 text-right">Diferencia</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filas.map((t) => (
              <FilaTerritorio
                key={claveTerritorio(t)}
                t={t}
                esMunicipal={esMunicipal}
                nombreDepartamento={nombrePorCodigoDepto.get(t.codigoDepartamento)}
              />
            ))}
            {territorios.length === 0 && (
              <tr>
                <td
                  colSpan={colSpan}
                  className="px-4 py-8 text-center text-xs text-foreground-muted"
                >
                  Sin territorios ganados para los filtros aplicados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {territorios.length > 0 && (
        <Paginacion
          pagina={paginaActual}
          totalPaginas={totalPaginas}
          inicio={inicio + 1}
          fin={fin}
          total={territorios.length}
          onCambiarPagina={setPagina}
        />
      )}
    </div>
  );
}

function FilaTerritorio({
  t,
  esMunicipal,
  nombreDepartamento,
}: {
  t: TerritorioGanado;
  esMunicipal: boolean;
  nombreDepartamento: string | undefined;
}) {
  return (
    <tr className="hover:bg-surface-elevated/60">
      <td className="px-4 py-2.5 font-medium text-foreground">
        <span
          className="block max-w-[10rem] truncate sm:max-w-[14rem] lg:max-w-[18rem]"
          title={formatearTerritorio(t.nombre)}
        >
          {formatearTerritorio(t.nombre)}
        </span>
      </td>
      {esMunicipal && (
        <td className="px-3 py-2.5 text-foreground-muted">
          <span
            className="block max-w-[8rem] truncate sm:max-w-[12rem] lg:max-w-[16rem]"
            title={nombreDepartamento ? formatearTerritorio(nombreDepartamento) : t.codigoDepartamento}
          >
            {nombreDepartamento ? formatearTerritorio(nombreDepartamento) : t.codigoDepartamento}
          </span>
        </td>
      )}
      <td className="px-3 py-2.5 text-right text-foreground num-tabular">
        {fmt.format(t.totalVotosTerritorio)}
      </td>
      <td className="px-3 py-2.5 text-right font-semibold text-brand num-tabular">
        {fmt.format(t.votosSeleccionado)}
      </td>
      <td className="hidden px-3 py-2.5 text-right text-foreground-muted num-tabular md:table-cell">
        {formatearPorcentaje(t.participacionPct, 2)}
      </td>
      <td className="px-3 py-2.5 text-right text-foreground-muted num-tabular">
        {fmt.format(t.diferencia)}
      </td>
    </tr>
  );
}

function claveTerritorio(t: TerritorioGanado): string {
  return [t.codigoDepartamento, t.codigoMunicipio ?? ''].join('|');
}

interface PaginacionProps {
  pagina: number;
  totalPaginas: number;
  inicio: number;
  fin: number;
  total: number;
  onCambiarPagina: (pagina: number) => void;
}

function Paginacion({
  pagina,
  totalPaginas,
  inicio,
  fin,
  total,
  onCambiarPagina,
}: PaginacionProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border bg-surface-elevated/40 px-4 py-2.5 text-xs text-foreground-muted">
      <span className="num-tabular">
        Mostrando <span className="font-semibold text-foreground">{inicio}</span>–
        <span className="font-semibold text-foreground">{fin}</span> de{' '}
        <span className="font-semibold text-foreground">{total}</span>
      </span>
      <div className="flex items-center gap-1.5">
        <BotonPagina
          disabled={pagina <= 1}
          onClick={() => onCambiarPagina(pagina - 1)}
          aria-label="Página anterior"
        >
          <ChevronLeft size={14} />
        </BotonPagina>
        <span className="px-1.5 num-tabular">
          <span className="font-semibold text-foreground">{pagina}</span> /{' '}
          {totalPaginas}
        </span>
        <BotonPagina
          disabled={pagina >= totalPaginas}
          onClick={() => onCambiarPagina(pagina + 1)}
          aria-label="Página siguiente"
        >
          <ChevronRight size={14} />
        </BotonPagina>
      </div>
    </div>
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
        'disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-border disabled:hover:bg-surface disabled:hover:text-foreground-muted',
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
