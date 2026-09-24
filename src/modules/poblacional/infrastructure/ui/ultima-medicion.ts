import { useMemo } from 'react';
import { useRadarPoblacional, useSeriePoblacional } from '../../application/hooks';
import { FiltroPoblacional, RadarPoblacionalPunto } from '../../domain/entities';

export function formatPeriodo(anio: number | null, mes: number | null): string | null {
  if (anio == null) return null;
  return mes ? `${anio}-${String(mes).padStart(2, '0')}` : String(anio);
}

function compararPeriodoDesc(
  a: { anio: number | null; mes: number | null },
  b: { anio: number | null; mes: number | null },
): number {
  const aA = a.anio ?? Number.NEGATIVE_INFINITY;
  const bA = b.anio ?? Number.NEGATIVE_INFINITY;
  if (aA !== bA) return bA - aA;
  return (b.mes ?? Number.NEGATIVE_INFINITY) - (a.mes ?? Number.NEGATIVE_INFINITY);
}

/**
 * Respuestas que no expresan una preferencia ("NS/NR", "Ninguno", "No sabe").
 * Se agrupan aparte porque su peso dice cuán definida está la opinión.
 */
export function esSinDefinir(criterio: string): boolean {
  return /^(ns\/?nr|ning[uú]n[oa]?|no sabe|no responde|no aplica)/i.test(criterio.trim());
}

export interface UltimaMedicion {
  /** Puntos del último periodo, ordenados de mayor a menor valor. */
  puntos: RadarPoblacionalPunto[];
  periodo: string | null;
  isLoading: boolean;
  activo: boolean;
}

/**
 * Puntos del último periodo disponible para la referencia. Aunque el backend
 * ya filtra al último (año, mes), se vuelve a comprobar en el cliente para no
 * mezclar mediciones de fechas distintas.
 */
export function useUltimaMedicion(filtro: FiltroPoblacional): UltimaMedicion {
  const activo = !!filtro.referencia;
  const { data: radar, isLoading } = useRadarPoblacional(filtro, { enabled: activo });

  const { puntos, periodo } = useMemo(() => {
    const validos = (radar ?? []).filter(
      (r) => r && r.criterio != null && Number.isFinite(r.valor),
    );
    if (validos.length === 0) return { puntos: [], periodo: null };
    const [ultimo] = [...validos].sort(compararPeriodoDesc);
    const delPeriodo = validos.filter((r) => r.anio === ultimo.anio && r.mes === ultimo.mes);
    return {
      puntos: [...delPeriodo].sort(
        (a, b) => b.valor - a.valor || a.criterio.localeCompare(b.criterio),
      ),
      periodo: formatPeriodo(ultimo.anio, ultimo.mes),
    };
  }, [radar]);

  return { puntos, periodo, isLoading: activo && isLoading, activo };
}

export interface HistoriaMedicion {
  /** Cantidad de mediciones distintas (año-mes) de la referencia. */
  periodos: number;
  /** Periodo inmediatamente anterior al último, si existe. */
  periodoAnterior: string | null;
  /** Valor de cada criterio en el periodo anterior. */
  anteriores: Map<string, number>;
  isLoading: boolean;
}

/**
 * Cuántas mediciones tiene la referencia y los valores de la penúltima: con
 * eso la vista decide si hay tendencia que mostrar y cuánto cambió cada
 * criterio. Comparte la consulta en caché con la gráfica de tendencia.
 */
export function useHistoriaMedicion(filtro: FiltroPoblacional): HistoriaMedicion {
  const activo = !!filtro.referencia;
  const { data: serie, isLoading } = useSeriePoblacional(filtro, { enabled: activo });

  return useMemo(() => {
    const claves = Array.from(
      new Set((serie ?? []).map((p) => formatPeriodo(p.anio, p.mes) ?? '')),
    )
      .filter(Boolean)
      .sort();
    const periodoAnterior = claves.length > 1 ? claves[claves.length - 2] : null;
    const anteriores = new Map<string, number>();
    if (periodoAnterior) {
      for (const p of serie ?? []) {
        if (p.criterio && formatPeriodo(p.anio, p.mes) === periodoAnterior) {
          anteriores.set(p.criterio, p.valor);
        }
      }
    }
    return { periodos: claves.length, periodoAnterior, anteriores, isLoading: activo && isLoading };
  }, [serie, activo, isLoading]);
}
