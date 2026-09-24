'use client';

import { useQuery } from '@tanstack/react-query';
import { useFiltrosGlobales } from '@/shared/application/stores/filtros-globales.store';
import { useMemo } from 'react';
import { electoralUseCases } from '../index';
import {
  FiltroComparativoEstadistico,
  FiltroComparativoTerritorial,
  FiltroElectoral,
  FiltroTerritoriosGanados,
} from '../domain/entities';

/**
 * Lee SOLO los códigos de filtro del store global (no acciones), para que
 * los componentes que consumen estos hooks no se re-rendericen cuando cambia
 * un setter no relacionado. Memoiza el DTO para que la queryKey de React
 * Query sea estable mientras los valores no cambien.
 */
function useFiltroElectoralDto(): FiltroElectoral {
  const codigoCorporacion = useFiltrosGlobales((s) => s.codigoCorporacion);
  const codigoDepartamento = useFiltrosGlobales((s) => s.codigoDepartamento);
  const codigoMunicipio = useFiltrosGlobales((s) => s.codigoMunicipio);
  const codigoPartido = useFiltrosGlobales((s) => s.codigoPartido);
  return useMemo<FiltroElectoral>(
    () => ({ codigoCorporacion, codigoDepartamento, codigoMunicipio, codigoPartido }),
    [codigoCorporacion, codigoDepartamento, codigoMunicipio, codigoPartido],
  );
}

export function useResumenElectoral() {
  const dto = useFiltroElectoralDto();
  return useQuery({
    queryKey: ['electoral', 'resumen', dto],
    queryFn: () => electoralUseCases.obtenerResumen.execute(dto),
  });
}

/**
 * Variante de useResumenElectoral que acepta un filtro arbitrario.
 * Útil cuando se necesitan totales con un alcance distinto al filtro global
 * activo (p. ej. total departamental ignorando el municipio seleccionado).
 */
export function useResumenElectoralFiltro(
  filtro: FiltroElectoral,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: ['electoral', 'resumen', filtro],
    queryFn: () => electoralUseCases.obtenerResumen.execute(filtro),
    enabled: options?.enabled ?? true,
  });
}

export function useVotosPorDepartamento() {
  const dto = useFiltroElectoralDto();
  return useQuery({
    queryKey: ['electoral', 'por-departamento', dto],
    queryFn: () => electoralUseCases.obtenerVotosPorDepartamento.execute(dto),
  });
}

export function useVotosPorMunicipio() {
  const dto = useFiltroElectoralDto();
  return useQuery({
    queryKey: ['electoral', 'por-municipio', dto],
    queryFn: () => electoralUseCases.obtenerVotosPorMunicipio.execute(dto),
    enabled: !!dto.codigoDepartamento,
  });
}

export function useVotosPorPuesto() {
  const dto = useFiltroElectoralDto();
  return useQuery({
    queryKey: ['electoral', 'por-puesto', dto],
    queryFn: () => electoralUseCases.obtenerVotosPorPuesto.execute(dto),
    enabled: !!dto.codigoDepartamento && !!dto.codigoMunicipio,
  });
}

export function useRankingPartidos(limite = 20) {
  const dto = useFiltroElectoralDto();
  return useQuery({
    queryKey: ['electoral', 'ranking-partidos', dto, limite],
    queryFn: () => electoralUseCases.obtenerRankingPartidos.execute(dto, limite),
  });
}

export function useRankingCandidatos(limite = 50, options?: { enabled?: boolean }) {
  const dto = useFiltroElectoralDto();
  return useQuery({
    queryKey: ['electoral', 'ranking-candidatos', dto, limite],
    queryFn: () => electoralUseCases.obtenerRankingCandidatos.execute(dto, limite),
    enabled: options?.enabled ?? true,
  });
}

/**
 * Variante de useRankingCandidatos que acepta un filtro arbitrario.
 * Útil para drill-down de partido → candidatos sin tocar el filtro global.
 */
export function useRankingCandidatosFiltro(
  filtro: FiltroElectoral,
  limite = 50,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: ['electoral', 'ranking-candidatos', filtro, limite],
    queryFn: () => electoralUseCases.obtenerRankingCandidatos.execute(filtro, limite),
    enabled: options?.enabled ?? true,
  });
}

export function useResumenPorCorporacion() {
  const dto = useFiltroElectoralDto();
  return useQuery({
    queryKey: ['electoral', 'resumen-corporaciones', dto],
    queryFn: () => electoralUseCases.obtenerResumenPorCorporacion.execute(dto),
  });
}

export function useTerritoriosGanados(filtro: Partial<FiltroTerritoriosGanados>) {
  const esCandidato = filtro.tipo === 'candidato';
  const enabled = !!(
    filtro.tipo &&
    filtro.nivel &&
    filtro.codigoCorporacion &&
    filtro.codigo &&
    (!esCandidato || !!filtro.codigoPartido)
  );

  return useQuery({
    queryKey: [
      'electoral',
      'territorios-ganados',
      filtro.tipo,
      filtro.nivel,
      filtro.codigoCorporacion,
      filtro.codigo,
      filtro.codigoPartido ?? null,
    ],
    queryFn: () =>
      electoralUseCases.obtenerTerritoriosGanados.execute(filtro as FiltroTerritoriosGanados),
    enabled,
  });
}

export function useCompararEstadistico(filtro: FiltroComparativoEstadistico) {
  // Se necesita al menos 2 candidatos para que la comparación tenga sentido.
  const enabled = filtro.candidatos.length >= 2;
  // Clave estable e insensible al orden de selección: dos selecciones con los
  // mismos candidatos en distinto orden comparten caché.
  const claves = filtro.candidatos
    .map((c) => `${c.codigoCorporacion}~${c.codigo}~${c.codigoPartido ?? ''}`)
    .sort()
    .join('|');
  return useQuery({
    queryKey: ['electoral', 'comparativo', 'estadistico', claves],
    queryFn: () => electoralUseCases.compararEstadistico.execute(filtro),
    enabled,
  });
}

export function useCompararTerritorial(
  filtro: Partial<FiltroComparativoTerritorial>,
) {
  // Para candidato la identidad real es (codigo, codigoPartido). Sin partido
  // no podemos desambiguar candidatos homónimos en partidos distintos, así
  // que la query queda deshabilitada hasta que llegue. Cada lado lleva su
  // propia corporación; cuando difieren, incluso un mismo código/partido es
  // una comparación válida (mismo candidato en dos procesos).
  const esCandidato = filtro.tipo === 'candidato';
  const ladoValido = (codigo?: string, partido?: string | null): boolean =>
    !!codigo && (!esCandidato || !!partido);
  const distintaCorporacion = filtro.codigoCorporacionA !== filtro.codigoCorporacionB;
  const distintos =
    distintaCorporacion ||
    (esCandidato
      ? filtro.codigoA !== filtro.codigoB ||
        filtro.codigoPartidoA !== filtro.codigoPartidoB
      : filtro.codigoA !== filtro.codigoB);

  const enabled = !!(
    filtro.tipo &&
    filtro.codigoCorporacionA &&
    filtro.codigoCorporacionB &&
    ladoValido(filtro.codigoA, filtro.codigoPartidoA) &&
    ladoValido(filtro.codigoB, filtro.codigoPartidoB) &&
    distintos
  );

  // Clave estable A/B (incluye corporación y, para candidatos, partido) — A vs
  // B y B vs A comparten caché.
  const ladoKey = (
    corp?: string,
    codigo?: string,
    partido?: string | null,
  ): string => `${corp ?? ''}@${codigo ?? ''}#${esCandidato ? partido ?? '' : ''}`;
  const parKey = enabled
    ? [
        ladoKey(filtro.codigoCorporacionA, filtro.codigoA, filtro.codigoPartidoA),
        ladoKey(filtro.codigoCorporacionB, filtro.codigoB, filtro.codigoPartidoB),
      ]
        .sort()
        .join('|')
    : '';
  return useQuery({
    queryKey: [
      'electoral',
      'comparativo',
      'territorial',
      filtro.tipo,
      parKey,
      // Mantenemos la dirección original (A vs B) en la queryKey para diferenciar
      // qué item es A y cuál B en la respuesta.
      filtro.codigoCorporacionA,
      filtro.codigoCorporacionB,
      filtro.codigoA,
      filtro.codigoB,
      filtro.codigoPartidoA ?? null,
      filtro.codigoPartidoB ?? null,
      filtro.codigoDepartamento ?? null,
      filtro.codigoMunicipio ?? null,
    ],
    queryFn: () =>
      electoralUseCases.compararTerritorial.execute(
        filtro as FiltroComparativoTerritorial,
      ),
    enabled,
  });
}
