'use client';

import { useCorporaciones } from '@/modules/catalogos/application/hooks';
import { useRankingCandidatosFiltro } from '@/modules/electoral/application/hooks';
import type {
  CandidatoSeleccionEstadistico,
  RankingCandidato,
} from '@/modules/electoral/domain/entities';
import { Card, CardBody } from '@/shared/ui/components/card';
import { SelectFiltro } from '@/shared/ui/components/select-filtro';
import { Skeleton } from '@/shared/ui/components/skeleton';
import { cn } from '@/shared/ui/utils/cn';
import { Check, ChevronLeft, ChevronRight, Users } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
  keyCandidatoEstadistico,
  useFiltrosEstadistico,
} from './filtros-estadistico-store';
import { formatearNombrePersona } from '@/shared/ui/utils/formatear-territorio';
import { formatearCorporacion } from '../corporacion-utils';

const fmt = new Intl.NumberFormat('es-CO');
const CANDIDATOS_POR_PAGINA = 5;

export function PanelSeleccionEstadistico() {
  const { corpA, corpB, setCorpA, setCorpB } = useFiltrosEstadistico();
  const { data: corporaciones, isLoading: loadingCorp } = useCorporaciones();

  const opcionesCorp = useMemo(
    () =>
      (corporaciones ?? []).map((c) => ({
        value: c.codigo,
        label: formatearCorporacion(c.nombre).etiqueta,
      })),
    [corporaciones],
  );

  return (
    <Card>
      <CardBody className="space-y-4">
        <div className="flex items-center gap-1.5 text-xs font-medium text-foreground-muted">
          <Users size={12} />
          Selección de corporaciones y candidatos
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <LadoCorporacion
            etiqueta="Corporación 1"
            corp={corpA}
            opcionesCorp={opcionesCorp}
            loadingCorp={loadingCorp}
            onChangeCorp={setCorpA}
          />
          <LadoCorporacion
            etiqueta="Corporación 2"
            corp={corpB}
            opcionesCorp={opcionesCorp}
            loadingCorp={loadingCorp}
            onChangeCorp={setCorpB}
          />
        </div>
      </CardBody>
    </Card>
  );
}

interface LadoCorporacionProps {
  etiqueta: string;
  corp: string | null;
  opcionesCorp: Array<{ value: string; label: string }>;
  loadingCorp: boolean;
  onChangeCorp: (codigo: string | null) => void;
}

function LadoCorporacion({
  etiqueta,
  corp,
  opcionesCorp,
  loadingCorp,
  onChangeCorp,
}: LadoCorporacionProps) {
  return (
    <div className="rounded-xl border border-border bg-surface-elevated/40 p-4">
      <div className="text-[11px] font-medium text-foreground-muted">
        {etiqueta}
      </div>
      <div className="mt-3">
        <SelectFiltro
          label="Corporación"
          value={corp}
          loading={loadingCorp}
          options={opcionesCorp}
          onChange={onChangeCorp}
          placeholder="Seleccione…"
        />
      </div>
      {corp ? (
        <ListaCandidatos corp={corp} />
      ) : (
        <p className="mt-4 text-xs text-foreground-subtle">
          Seleccione una corporación para listar sus candidatos.
        </p>
      )}
    </div>
  );
}

function ListaCandidatos({ corp }: { corp: string }) {
  const { seleccionados, toggleCandidato } = useFiltrosEstadistico();
  const { data: candidatos, isLoading } = useRankingCandidatosFiltro(
    {
      codigoCorporacion: corp,
      codigoDepartamento: null,
      codigoMunicipio: null,
      codigoPartido: null,
    },
    500,
  );

  const [pagina, setPagina] = useState(1);
  const lista = candidatos ?? [];
  const totalPaginas = Math.max(1, Math.ceil(lista.length / CANDIDATOS_POR_PAGINA));

  // Si cambia la corporación (cambia la lista), volvemos a la página 1.
  useEffect(() => {
    setPagina(1);
  }, [corp]);

  const paginaActual = Math.min(pagina, totalPaginas);
  const inicio = (paginaActual - 1) * CANDIDATOS_POR_PAGINA;
  const visibles = lista.slice(inicio, inicio + CANDIDATOS_POR_PAGINA);

  const clavesSeleccionadas = useMemo(
    () => new Set(seleccionados.map(keyCandidatoEstadistico)),
    [seleccionados],
  );

  const seleccionDeEstaCorp = seleccionados.filter(
    (c) => c.codigoCorporacion === corp,
  ).length;

  if (isLoading) {
    return (
      <div className="mt-4 space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-11 w-full" />
        ))}
      </div>
    );
  }

  if (lista.length === 0) {
    return (
      <p className="mt-4 text-xs text-foreground-subtle">
        No hay candidatos para esta corporación.
      </p>
    );
  }

  return (
    <div className="mt-4 space-y-2">
      <div className="flex items-center justify-between text-xs font-medium text-foreground-muted">
        <span>Candidatos</span>
        <span>
          {seleccionDeEstaCorp} seleccionado{seleccionDeEstaCorp === 1 ? '' : 's'}
        </span>
      </div>

      <ul className="space-y-1.5">
        {visibles.map((c) => {
          const sel: CandidatoSeleccionEstadistico = {
            codigoCorporacion: corp,
            codigo: c.codigoCandidato,
            codigoPartido: c.codigoPartido,
          };
          const key = keyCandidatoEstadistico(sel);
          const checked = clavesSeleccionadas.has(key);
          return (
            <li key={key}>
              <FilaCandidato
                candidato={c}
                checked={checked}
                onToggle={() => toggleCandidato(sel)}
              />
            </li>
          );
        })}
      </ul>

      {totalPaginas > 1 && (
        <div className="flex items-center justify-between pt-1 text-xs text-foreground-muted">
          <span className="num-tabular">
            {inicio + 1}–{Math.min(inicio + CANDIDATOS_POR_PAGINA, lista.length)} de{' '}
            {lista.length}
          </span>
          <div className="flex items-center gap-1.5">
            <BotonNav
              disabled={paginaActual <= 1}
              onClick={() => setPagina(paginaActual - 1)}
              aria-label="Página anterior"
            >
              <ChevronLeft size={14} />
            </BotonNav>
            <span className="px-1 num-tabular">
              {paginaActual} / {totalPaginas}
            </span>
            <BotonNav
              disabled={paginaActual >= totalPaginas}
              onClick={() => setPagina(paginaActual + 1)}
              aria-label="Página siguiente"
            >
              <ChevronRight size={14} />
            </BotonNav>
          </div>
        </div>
      )}
    </div>
  );
}

function FilaCandidato({
  candidato,
  checked,
  onToggle,
}: {
  candidato: RankingCandidato;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={checked}
      className={cn(
        'flex w-full items-center gap-2.5 rounded-lg border px-3 py-2 text-left transition-colors',
        checked
          ? 'border-brand/40 bg-brand-muted/40'
          : 'border-border bg-surface hover:border-brand/30 hover:bg-surface-elevated/60',
      )}
    >
      <span
        className={cn(
          'flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors',
          checked ? 'border-brand bg-brand text-brand-foreground' : 'border-border bg-surface',
        )}
      >
        {checked && <Check size={11} />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-foreground" title={formatearNombrePersona(candidato.nombreCandidato)}>
          {formatearNombrePersona(candidato.nombreCandidato)}
        </span>
        {candidato.nombrePartido && (
          <span className="block truncate text-[11px] text-foreground-muted" title={candidato.nombrePartido}>
            {candidato.nombrePartido}
          </span>
        )}
      </span>
      <span className="shrink-0 num-tabular text-sm font-semibold text-foreground">
        {fmt.format(candidato.totalVotos)}
      </span>
    </button>
  );
}

function BotonNav({
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
