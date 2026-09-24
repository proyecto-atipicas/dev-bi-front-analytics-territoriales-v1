'use client';

import { useCandidatos } from '@/modules/catalogos/application/hooks';
import type { NivelAnalisisTerritoriosGanados } from '@/modules/electoral/domain/entities';
import { useFiltrosGlobales } from '@/shared/application/stores/filtros-globales.store';
import { Card, CardBody } from '@/shared/ui/components/card';
import { EmptyState } from '@/shared/ui/components/empty-state';
import { SelectFiltro } from '@/shared/ui/components/select-filtro';
import { cn } from '@/shared/ui/utils/cn';
import { MapPin, Map as MapIcon } from 'lucide-react';
import { useEffect, useRef } from 'react';
import {
  SeleccionTerritoriosGanados,
  useFiltrosTerritoriosGanados,
} from './filtros-territorios-ganados-store';

/**
 * Codificación del `<option value>` para candidatos: `codigo_candidato` se
 * reinicia por partido, así que empaquetamos `codigo|codigoPartido` y lo
 * desempaquetamos al cambiar.
 */
const SEP = '|';
const encodeCandidato = (codigo: string, codigoPartido: string | null): string =>
  `${codigo}${SEP}${codigoPartido ?? ''}`;
const decodeCandidato = (value: string): SeleccionTerritoriosGanados => {
  const [codigo, partido] = value.split(SEP);
  return { codigo, codigoPartido: partido && partido !== '' ? partido : null };
};

export function PanelSeleccionTerritorios() {
  const codigoCorporacion = useFiltrosGlobales((s) => s.codigoCorporacion);
  const codigoPartido = useFiltrosGlobales((s) => s.codigoPartido);
  const nivel = useFiltrosTerritoriosGanados((s) => s.nivel);
  const seleccion = useFiltrosTerritoriosGanados((s) => s.seleccion);
  const setNivel = useFiltrosTerritoriosGanados((s) => s.setNivel);
  const setSeleccion = useFiltrosTerritoriosGanados((s) => s.setSeleccion);

  if (!codigoCorporacion) {
    return (
      <Card>
        <CardBody>
          <EmptyState
            tone="info"
            title="Seleccione una corporación"
            description="El análisis de territorios ganados requiere acotar el contexto a una corporación desde los filtros generales."
          />
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardBody>
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:gap-6">
          <div className="flex shrink-0 flex-col gap-1">
            <span className="text-xs font-medium text-foreground-muted">
              Tipo de análisis
            </span>
            <div className="inline-flex w-fit rounded-lg border border-border bg-surface-elevated p-0.5">
              <BotonToggle
                activo={nivel === 'departamento'}
                onClick={() => setNivel('departamento')}
                icon={<MapIcon size={13} />}
                label="Departamental"
              />
              <BotonToggle
                activo={nivel === 'municipio'}
                onClick={() => setNivel('municipio')}
                icon={<MapPin size={13} />}
                label="Municipal"
              />
            </div>
          </div>

          <div className="flex-1">
            <SelectorCandidato
              codigoCorporacion={codigoCorporacion}
              codigoPartido={codigoPartido}
              value={seleccion}
              onChange={setSeleccion}
            />
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

function BotonToggle({
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
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
        activo
          ? 'bg-brand text-brand-foreground shadow-soft'
          : 'text-foreground-muted hover:bg-surface hover:text-foreground',
      )}
    >
      {icon}
      {label}
    </button>
  );
}

interface SelectorCandidatoProps {
  codigoCorporacion: string;
  codigoPartido: string | null;
  value: SeleccionTerritoriosGanados | null;
  onChange: (sel: SeleccionTerritoriosGanados | null) => void;
}

function SelectorCandidato({
  codigoCorporacion,
  codigoPartido,
  value,
  onChange,
}: SelectorCandidatoProps) {
  const { data: candidatos, isLoading } = useCandidatos({
    codigoCorporacion,
    codigoPartido,
    limite: 500,
  });

  // Al cambiar corporación u organización política la selección anterior puede
  // dejar de ser válida (otro contexto). Reseteamos sólo en transiciones reales
  // para no borrar la selección en el primer render.
  const prevCorpRef = useRef(codigoCorporacion);
  const prevPartidoRef = useRef(codigoPartido);
  useEffect(() => {
    if (
      prevCorpRef.current !== codigoCorporacion ||
      prevPartidoRef.current !== codigoPartido
    ) {
      onChange(null);
    }
    prevCorpRef.current = codigoCorporacion;
    prevPartidoRef.current = codigoPartido;
  }, [codigoCorporacion, codigoPartido, onChange]);

  const opciones = (candidatos ?? []).map((c) => ({
    value: encodeCandidato(c.codigo, c.codigoPartido),
    label: c.nombre,
  }));

  const valueEncoded = value ? encodeCandidato(value.codigo, value.codigoPartido) : null;

  const handleChange = (v: string | null) => {
    onChange(v === null ? null : decodeCandidato(v));
  };

  return (
    <SelectFiltro
      label="Candidato"
      value={valueEncoded}
      loading={isLoading}
      options={opciones}
      onChange={handleChange}
      placeholder="Seleccione un candidato…"
    />
  );
}
