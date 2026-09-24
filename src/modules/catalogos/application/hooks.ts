'use client';

import { useQuery } from '@tanstack/react-query';
import { catalogosUseCases } from '../index';

export function useCorporaciones() {
  return useQuery({
    queryKey: ['catalogos', 'corporaciones'],
    queryFn: () => catalogosUseCases.listarCorporaciones.execute(),
    staleTime: 30 * 60 * 1000,
  });
}

/**
 * Partidos de una corporación. Sin corporación no se consulta: el catálogo
 * completo repite códigos entre elecciones y, al cambiar de lista, React
 * dejaba opciones de otras elecciones mezcladas en el selector.
 */
export function usePartidos(codigoCorporacion: string | null) {
  return useQuery({
    queryKey: ['catalogos', 'partidos', codigoCorporacion],
    queryFn: () => catalogosUseCases.listarPartidos.execute(codigoCorporacion),
    enabled: !!codigoCorporacion,
    staleTime: 30 * 60 * 1000,
  });
}

export function useCandidatos(params: {
  codigoCorporacion?: string | null;
  codigoPartido?: string | null;
  limite?: number;
}) {
  return useQuery({
    queryKey: [
      'catalogos',
      'candidatos',
      params.codigoCorporacion,
      params.codigoPartido,
      params.limite,
    ],
    queryFn: () => catalogosUseCases.listarCandidatos.execute(params),
    // `limite: 0` es la forma en que los llamadores piden "no consultar": la
    // API rechaza ese valor (400), así que la consulta queda desactivada.
    enabled: params.limite === undefined || params.limite > 0,
    staleTime: 5 * 60 * 1000,
  });
}
