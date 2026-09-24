'use client';

import {
  useCandidatos,
  useCorporaciones,
  usePartidos,
} from '@/modules/catalogos/application/hooks';
import type { TipoComparacionTerritorial } from '@/modules/electoral/domain/entities';
import { useDepartamentos, useMunicipios } from '@/modules/geo/application/hooks';
import { useFiltrosGlobales } from '@/shared/application/stores/filtros-globales.store';
import { Card, CardBody } from '@/shared/ui/components/card';
import { SelectFiltro } from '@/shared/ui/components/select-filtro';
import { cn } from '@/shared/ui/utils/cn';
import { ArrowLeftRight, MapPin } from 'lucide-react';
import {
  mismaSeleccion,
  SeleccionComparativo,
  useFiltrosComparativo,
} from './filtros-comparativo-store';
import { COLOR_A, COLOR_B } from './colores-comparativo';

/**
 * Codificación del `<option value>` de un candidato. Como `codigo_candidato`
 * se reinicia por partido, NO podemos usar sólo el código: dos candidatos
 * homónimos con el mismo código en partidos distintos colisionarían en el
 * <select>. Empaquetamos `codigo|codigoPartido` y lo desempaquetamos al cambiar.
 */
const SEP = '|';
const encodeCandidato = (codigo: string, codigoPartido: string | null): string =>
  `${codigo}${SEP}${codigoPartido ?? ''}`;
const decodeCandidato = (value: string): SeleccionComparativo => {
  const [codigo, partido] = value.split(SEP);
  return { codigo, codigoPartido: partido && partido !== '' ? partido : null };
};

export function PanelSeleccionComparativo() {
  const {
    tipo,
    corpA,
    corpB,
    selA,
    selB,
    setCorpA,
    setCorpB,
    setSelA,
    setSelB,
    swap,
  } = useFiltrosComparativo();

  return (
    <Card>
      <CardBody className="space-y-4">
        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={swap}
            disabled={!selA || !selB}
            className={cn(
              'inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-xs font-medium text-foreground-muted transition-colors',
              'hover:border-brand/40 hover:bg-brand-muted/30 hover:text-brand',
              'disabled:cursor-not-allowed disabled:opacity-50',
            )}
            aria-label="Intercambiar A y B"
          >
            <ArrowLeftRight size={13} />
            Intercambiar
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <TarjetaSelector
            etiqueta={tipo === 'candidato' ? 'Candidato 1' : 'Partido 1'}
            color={COLOR_A}
            tipo={tipo}
            corp={corpA}
            otherCorp={corpB}
            onChangeCorp={setCorpA}
            value={selA}
            otherValue={selB}
            onChange={setSelA}
          />
          <TarjetaSelector
            etiqueta={tipo === 'candidato' ? 'Candidato 2' : 'Partido 2'}
            color={COLOR_B}
            tipo={tipo}
            corp={corpB}
            otherCorp={corpA}
            onChangeCorp={setCorpB}
            value={selB}
            otherValue={selA}
            onChange={setSelB}
          />
        </div>

        <AmbitoTerritorial />
      </CardBody>
    </Card>
  );
}

/**
 * Ámbito territorial compartido por el comparativo. Define la granularidad del
 * desglose (departamento → municipio → puesto). Vive en el store global porque
 * los mapas lo usan para el drill-down por clic; aquí sólo exponemos los
 * selectores para centralizar todos los filtros en este panel.
 */
function AmbitoTerritorial() {
  const codigoDepartamento = useFiltrosGlobales((s) => s.codigoDepartamento);
  const codigoMunicipio = useFiltrosGlobales((s) => s.codigoMunicipio);
  const setDepartamento = useFiltrosGlobales((s) => s.setDepartamento);
  const setMunicipio = useFiltrosGlobales((s) => s.setMunicipio);

  const { data: departamentos, isLoading: loadingDep } = useDepartamentos();
  const { data: municipios, isLoading: loadingMun } = useMunicipios(codigoDepartamento);

  return (
    <div className="rounded-xl border border-border bg-surface-elevated/40 p-4">
      <div className="flex items-center gap-1.5 text-xs font-medium text-foreground-muted">
        <MapPin size={12} />
        Ámbito territorial
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <SelectFiltro
          label="Departamento"
          value={codigoDepartamento}
          loading={loadingDep}
          options={(departamentos ?? []).map((d) => ({
            value: d.codigo,
            label: d.nombre,
          }))}
          onChange={setDepartamento}
        />
        <SelectFiltro
          label="Municipio"
          value={codigoMunicipio}
          loading={loadingMun}
          disabled={!codigoDepartamento}
          placeholder={codigoDepartamento ? 'Todos' : 'Seleccione departamento'}
          options={(municipios ?? []).map((m) => ({
            value: m.codigo,
            label: m.nombre,
          }))}
          onChange={setMunicipio}
        />
      </div>
    </div>
  );
}

interface TarjetaSelectorProps {
  etiqueta: string;
  color: typeof COLOR_A;
  tipo: TipoComparacionTerritorial;
  /** Corporación seleccionada para este lado. */
  corp: string | null;
  /** Corporación del otro lado (para excluir el mismo ítem sólo si coinciden). */
  otherCorp: string | null;
  onChangeCorp: (codigo: string | null) => void;
  value: SeleccionComparativo | null;
  otherValue: SeleccionComparativo | null;
  onChange: (sel: SeleccionComparativo | null) => void;
}

function TarjetaSelector({
  etiqueta,
  color,
  tipo,
  corp,
  otherCorp,
  onChangeCorp,
  value,
  otherValue,
  onChange,
}: TarjetaSelectorProps) {
  const { data: corporaciones, isLoading: loadingCorp } = useCorporaciones();
  const { data: partidos, isLoading: loadingPart } = usePartidos(
    tipo === 'partido' ? corp : null,
  );
  const { data: candidatos, isLoading: loadingCand } = useCandidatos(
    tipo === 'candidato' && corp
      ? { codigoCorporacion: corp, limite: 500 }
      : { codigoCorporacion: null, limite: 0 },
  );

  // Para candidatos el value del <option> codifica (codigo, codigoPartido) para
  // distinguir candidatos homónimos en partidos distintos. Para partidos, basta
  // con el código.
  const opciones =
    tipo === 'partido'
      ? (partidos ?? []).map((p) => ({
          value: p.codigo,
          label: p.nombre,
        }))
      : (candidatos ?? []).map((c) => ({
          // El value codifica (codigo, codigoPartido) para enviar la tupla al backend;
          // el label sólo muestra el nombre del candidato — el partido se infiere del valor.
          value: encodeCandidato(c.codigo, c.codigoPartido),
          label: c.nombre,
        }));

  // Excluir la selección del otro lado SÓLO cuando ambos lados comparten
  // corporación: con corporaciones distintas, el mismo ítem es una comparación
  // válida (mismo candidato/partido en dos procesos).
  const mismaCorp = !!corp && corp === otherCorp;
  const valueOther =
    mismaCorp && otherValue
      ? tipo === 'candidato'
        ? encodeCandidato(otherValue.codigo, otherValue.codigoPartido)
        : otherValue.codigo
      : null;
  const opcionesFiltradas = opciones.filter(
    (o) => !valueOther || o.value !== valueOther,
  );

  const valueEncoded = value
    ? tipo === 'candidato'
      ? encodeCandidato(value.codigo, value.codigoPartido)
      : value.codigo
    : null;

  const handleChange = (v: string | null) => {
    if (v === null) {
      onChange(null);
      return;
    }
    if (tipo === 'partido') {
      // Defensa: dentro de la misma corporación no permitir A == B.
      if (mismaCorp && otherValue && otherValue.codigo === v) return;
      onChange({ codigo: v, codigoPartido: null });
    } else {
      const sel = decodeCandidato(v);
      // Defensa: dentro de la misma corporación no permitir el mismo candidato.
      if (mismaCorp && mismaSeleccion(sel, otherValue)) return;
      onChange(sel);
    }
  };

  const loadingItem = tipo === 'partido' ? loadingPart : loadingCand;

  return (
    <div className={cn('rounded-xl border bg-surface p-4', color.border, color.bg)}>
      <div className={cn('text-[11px] font-medium', color.text)}>
        {etiqueta}
      </div>
      <div className="mt-3 space-y-3">
        <SelectFiltro
          label="Corporación"
          value={corp}
          loading={loadingCorp}
          options={(corporaciones ?? []).map((c) => ({
            value: c.codigo,
            label: c.nombre,
          }))}
          onChange={onChangeCorp}
          placeholder="Seleccione…"
        />
        <SelectFiltro
          label={tipo === 'candidato' ? 'Candidato' : 'Partido'}
          value={valueEncoded}
          loading={loadingItem}
          disabled={!corp}
          options={opcionesFiltradas}
          onChange={handleChange}
          placeholder={corp ? 'Seleccione…' : 'Seleccione corporación'}
        />
      </div>
    </div>
  );
}
