'use client';

import { useCorporaciones } from '@/modules/catalogos/application/hooks';
import { useFiltrosGlobales } from '@/shared/application/stores/filtros-globales.store';
import { Skeleton } from '@/shared/ui/components/skeleton';
import { cn } from '@/shared/ui/utils/cn';
import { formatearNombrePersona } from '@/shared/ui/utils/formatear-territorio';
import { useMemo } from 'react';
import {
  useRankingCandidatos,
  useRankingPartidos,
  useResumenElectoral,
  useResumenElectoralFiltro,
  useVotosPorDepartamento,
  useVotosPorMunicipio,
  useVotosPorPuesto,
} from '../../application/hooks';
import { formatearCorporacion } from './corporacion-utils';
import { concentracion, esFilaTecnica, leerVotos } from './lectura-votos';
import { formatearPorcentaje } from '@/shared/ui/utils/formatear-porcentaje';

const fmt = new Intl.NumberFormat('es-CO');

/** Mismo límite que la matriz de organizaciones: comparten la consulta en caché. */
const LIMITE_RANKING = 25;

interface Indicador {
  id: string;
  etiqueta: string;
  valor: string;
  detalle: string;
  /** Proporción 0–100 para la barra de apoyo (opcional). */
  proporcion?: number;
}

const COLUMNAS: Record<number, string> = {
  1: 'sm:grid-cols-1',
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-3',
  4: 'sm:grid-cols-2 xl:grid-cols-4',
  5: 'sm:grid-cols-2 xl:grid-cols-5',
};

/**
 * Lectura del resultado: convierte los conteos en respuestas a las preguntas
 * que se hace quien analiza una elección (quién ganó y por cuánto, cuánto
 * voto no fue para nadie, si la votación se concentra en pocos territorios).
 * Todo se deriva de consultas que la vista ya hace.
 */
export function LecturaResultado() {
  const codigoCorporacion = useFiltrosGlobales((s) => s.codigoCorporacion);
  const codigoDepartamento = useFiltrosGlobales((s) => s.codigoDepartamento);
  const codigoMunicipio = useFiltrosGlobales((s) => s.codigoMunicipio);
  const codigoPartido = useFiltrosGlobales((s) => s.codigoPartido);

  const { data: corporaciones } = useCorporaciones();
  const familia = formatearCorporacion(
    corporaciones?.find((c) => c.codigo === codigoCorporacion)?.nombre ?? '',
  ).familia;
  // En elecciones uninominales el nombre que importa es el del candidato.
  const uninominal = /^(presidencia|gran consulta)/i.test(familia);

  const resumen = useResumenElectoral();
  const partidos = useRankingPartidos(LIMITE_RANKING);
  const candidatos = useRankingCandidatos(3, { enabled: uninominal || !!codigoPartido });
  const totalAmbito = useResumenElectoralFiltro(
    { codigoCorporacion, codigoDepartamento, codigoMunicipio, codigoPartido: null },
    { enabled: !!codigoPartido },
  );
  const deptos = useVotosPorDepartamento();
  const munis = useVotosPorMunicipio();
  const puestos = useVotosPorPuesto();

  // Nivel territorial que se está mirando: la concentración se mide un
  // escalón por debajo del ámbito elegido.
  const territorial = useMemo(
    () =>
      codigoMunicipio
        ? { votos: puestos.data?.map((p) => p.totalVotos), plural: 'puestos' }
        : codigoDepartamento
          ? { votos: munis.data?.map((m) => m.totalVotos), plural: 'municipios' }
          : { votos: deptos.data?.map((d) => d.totalVotos), plural: 'departamentos' },
    [codigoMunicipio, codigoDepartamento, puestos.data, munis.data, deptos.data],
  );

  // Datos de otra combinación de filtros (placeholder) no se muestran: la
  // cifra correspondería a la elección o el ámbito anterior.
  const cargando =
    !resumen.data ||
    resumen.isPlaceholderData ||
    !partidos.data ||
    partidos.isPlaceholderData ||
    (!!codigoPartido && (!totalAmbito.data || totalAmbito.isPlaceholderData));

  const indicadores = useMemo<Indicador[]>(() => {
    if (cargando || !resumen.data || !partidos.data) return [];
    const total = resumen.data.totalVotos;
    const lista: Indicador[] = [];
    const topCandidato = candidatos.data?.find((c) => !esFilaTecnica(c.nombreCandidato));

    if (codigoPartido) {
      const base = totalAmbito.data?.totalVotos ?? 0;
      if (base > 0) {
        const pct = (total / base) * 100;
        lista.push({
          id: 'peso',
          etiqueta: 'Peso en la elección',
          valor: formatearPorcentaje(pct, 1),
          detalle: `${fmt.format(total)} de ${fmt.format(base)} votos del ámbito`,
          proporcion: pct,
        });
      }
      if (topCandidato) {
        lista.push({
          id: 'candidato',
          etiqueta: 'Candidato más votado del partido',
          valor: fmt.format(topCandidato.totalVotos),
          detalle: formatearNombrePersona(topCandidato.nombreCandidato),
        });
      }
    } else {
      const lectura = leerVotos(partidos.data, total);
      if (lectura.lider && total > 0) {
        const pct = (lectura.lider.totalVotos / total) * 100;
        const candidato =
          uninominal && topCandidato?.codigoPartido === lectura.lider.codigoPartido
            ? formatearNombrePersona(topCandidato.nombreCandidato)
            : null;
        lista.push({
          id: 'lider',
          etiqueta: 'Más votado',
          valor: formatearPorcentaje(pct, 1),
          detalle: candidato
            ? `${candidato}, ${lectura.lider.nombrePartido}`
            : lectura.lider.nombrePartido,
          proporcion: pct,
        });
      }
      if (lectura.ventajaPuntos !== null && lectura.segundo && lectura.ventajaVotos !== null) {
        lista.push({
          id: 'ventaja',
          etiqueta: 'Ventaja sobre el segundo',
          valor: formatearPorcentaje(lectura.ventajaPuntos, 1).replace('%', 'pts'),
          detalle: `${fmt.format(lectura.ventajaVotos)} votos más que ${lectura.segundo.nombrePartido}`,
        });
      }
      if (lectura.blanco !== null && total > 0) {
        const pct = (lectura.blanco / total) * 100;
        lista.push({
          id: 'blanco',
          etiqueta: 'Voto en blanco',
          valor: formatearPorcentaje(pct, 1),
          detalle: `${fmt.format(lectura.blanco)} votos`,
          proporcion: pct,
        });
      }
      if (lectura.nulosNoMarcados !== null && total > 0) {
        const pct = (lectura.nulosNoMarcados / total) * 100;
        lista.push({
          id: 'nulos',
          etiqueta: 'Nulos y no marcados',
          valor: formatearPorcentaje(pct, 1),
          detalle: `${fmt.format(lectura.nulosNoMarcados)} votos sin candidato válido`,
          proporcion: pct,
        });
      }
    }

    const conc = territorial.votos ? concentracion(territorial.votos) : null;
    if (conc) {
      lista.push({
        id: 'concentracion',
        etiqueta: 'Concentración territorial',
        valor: formatearPorcentaje(conc.pct, 1),
        detalle: `de los votos está en ${conc.n} ${territorial.plural}`,
        proporcion: conc.pct,
      });
    }
    return lista;
  }, [
    cargando,
    resumen.data,
    partidos.data,
    candidatos.data,
    totalAmbito.data,
    codigoPartido,
    uninominal,
    territorial,
  ]);

  if (!cargando && indicadores.length === 0) return null;

  return (
    <section
      aria-label="Lectura del resultado"
      aria-busy={cargando}
      className="overflow-hidden rounded-xl border border-border/80 bg-surface shadow-panel"
    >
      <h2 className="border-b border-border/70 px-5 py-3 text-sm font-semibold text-foreground sm:px-6">
        Lectura del resultado
      </h2>
      {cargando ? (
        <div className="grid grid-cols-1 gap-px bg-border/70 sm:grid-cols-2 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-2 bg-surface px-5 py-4 sm:px-6">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-7 w-20" />
              <Skeleton className="h-3 w-32" />
            </div>
          ))}
        </div>
      ) : (
        <div
          className={cn(
            'grid grid-cols-1 gap-px bg-border/70',
            COLUMNAS[Math.min(indicadores.length, 5)],
          )}
        >
          {indicadores.map((ind, i) => (
            <div
              key={ind.id}
              className={cn(
                'flex flex-col gap-1 bg-surface px-5 py-4 sm:px-6',
                // Con un número impar en la rejilla de 2 columnas, el último
                // ocupa la fila completa en lugar de dejar una celda vacía.
                indicadores.length % 2 === 1 &&
                  indicadores.length > 3 &&
                  i === indicadores.length - 1 &&
                  'sm:col-span-2 xl:col-span-1',
              )}
            >
              <p className="text-xs font-medium text-foreground-muted">{ind.etiqueta}</p>
              <p className="font-display text-2xl font-bold tabular-nums text-foreground">
                {ind.valor}
              </p>
              {ind.proporcion !== undefined && (
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-brand-muted" aria-hidden>
                  <div
                    className="h-full rounded-full bg-brand"
                    style={{ width: `${Math.min(100, Math.max(1.5, ind.proporcion))}%` }}
                  />
                </div>
              )}
              <p className="text-xs leading-snug text-foreground-muted">{ind.detalle}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
