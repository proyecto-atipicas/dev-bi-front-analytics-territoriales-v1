import type { RankingPartido } from '../../domain/entities';

/**
 * Filas del escrutinio que no son organizaciones políticas: votos en blanco,
 * nulos, no marcados y el agregado "CANDIDATOS TOTALES" que traen algunas
 * corporaciones territoriales. No compiten por el primer lugar.
 */
export function esFilaTecnica(nombre: string): boolean {
  return /^(votos\s|candidatos totales$)/i.test(nombre.trim());
}

export interface LecturaVotos {
  lider: RankingPartido | null;
  segundo: RankingPartido | null;
  /** Diferencia en votos entre el primero y el segundo. */
  ventajaVotos: number | null;
  /** Diferencia en puntos porcentuales sobre el total de votos. */
  ventajaPuntos: number | null;
  /** Votos en blanco (null si la corporación no los reporta). */
  blanco: number | null;
  /** Nulos + no marcados (null si la corporación no los reporta). */
  nulosNoMarcados: number | null;
}

/**
 * Deriva la lectura del resultado a partir del ranking de partidos. Los
 * porcentajes usan el mismo total que las tablas (todos los votos
 * registrados) para que las cifras cuadren entre sí.
 */
export function leerVotos(partidos: RankingPartido[], totalVotos: number): LecturaVotos {
  const competidores = partidos.filter((p) => !esFilaTecnica(p.nombrePartido));
  const [lider = null, segundo = null] = competidores;
  const buscar = (re: RegExp) =>
    partidos.find((p) => re.test(p.nombrePartido.trim()))?.totalVotos ?? null;

  const nulos = buscar(/^votos\s+nulos/i);
  const noMarcados = buscar(/^votos\s+no\s+marcados/i);
  const ventajaVotos = lider && segundo ? lider.totalVotos - segundo.totalVotos : null;

  return {
    lider,
    segundo,
    ventajaVotos,
    ventajaPuntos:
      ventajaVotos !== null && totalVotos > 0 ? (ventajaVotos / totalVotos) * 100 : null,
    blanco: buscar(/^votos\s+en\s+blanco/i),
    nulosNoMarcados: nulos === null && noMarcados === null ? null : (nulos ?? 0) + (noMarcados ?? 0),
  };
}

/**
 * Qué parte de los votos reúnen los `n` territorios con más votación.
 * Responde "¿la elección se decide en pocos lugares?".
 */
export function concentracion(votos: number[], n = 5): { n: number; pct: number } | null {
  const total = votos.reduce((a, v) => a + v, 0);
  if (total <= 0 || votos.length <= n) return null;
  const top = [...votos].sort((a, b) => b - a).slice(0, n).reduce((a, v) => a + v, 0);
  return { n, pct: (top / total) * 100 };
}
