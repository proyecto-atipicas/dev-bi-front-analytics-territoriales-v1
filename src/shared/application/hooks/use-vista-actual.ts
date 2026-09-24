'use client';

import {
  Files,
  GitCompareArrows,
  Home,
  LucideIcon,
  TrendingUp,
  Trophy,
  Users,
  Vote,
} from 'lucide-react';
import { usePathname } from 'next/navigation';

export type AlcanceFiltros =
  | 'global'
  | 'global-sin-partido'
  | 'corporacion-partido'
  | 'departamento'
  | 'ninguno';

export interface VistaMeta {
  ruta: string;
  /** Grupo de navegación al que pertenece (se muestra sobre el título). */
  seccion: string;
  titulo: string;
  descripcion: string;
  icon: LucideIcon;
  /**
   * Determina qué filtros transversales aplican:
   * - 'global'              → corporación, departamento, municipio, partido
   * - 'global-sin-partido'  → corporación, departamento, municipio
   * - 'corporacion-partido' → corporación + organización política (Territorios ganados)
   * - 'departamento'        → solo departamento (ej: Socioeconómico)
   * - 'ninguno'             → la vista no usa DIVIPOLA (ej: Poblacional)
   */
  alcanceFiltros: AlcanceFiltros;
}

// Ordenadas de más específicas a más generales para que `startsWith` resuelva
// las sub-rutas antes que la ruta padre.
const VISTAS: VistaMeta[] = [
  {
    ruta: '/electoral/comparativo',
    seccion: 'Análisis electoral',
    titulo: 'Comparativo electoral',
    descripcion: 'Enfrente dos candidatos o partidos y vea dónde gana cada uno',
    icon: GitCompareArrows,
    // Sin barra global: todos los filtros (corporación por lado + ámbito
    // territorial) viven en el panel de selección de la propia vista.
    alcanceFiltros: 'ninguno',
  },
  {
    ruta: '/electoral/territorios-ganados',
    seccion: 'Análisis electoral',
    titulo: 'Territorios ganados',
    descripcion:
      'Territorios donde un candidato fue el más votado, a nivel departamental o municipal',
    icon: Trophy,
    alcanceFiltros: 'corporacion-partido',
  },
  {
    ruta: '/electoral/comportamiento',
    seccion: 'Análisis electoral',
    titulo: 'Comportamiento electoral',
    descripcion: 'Resultados, rankings y mapas territoriales',
    icon: Vote,
    alcanceFiltros: 'global',
  },
  {
    ruta: '/socioeconomico',
    seccion: 'Análisis social',
    titulo: 'Estadísticas socioeconómicas',
    descripcion: 'Indicadores territoriales por fuente de información',
    icon: TrendingUp,
    alcanceFiltros: 'ninguno',
  },
  {
    ruta: '/poblacional',
    seccion: 'Análisis social',
    titulo: 'Impacto poblacional',
    descripcion: 'Encuestas y mediciones por dimensión',
    icon: Users,
    alcanceFiltros: 'ninguno',
  },
  {
    ruta: '/fuentes',
    seccion: 'Transparencia',
    titulo: 'Fuentes documentales',
    descripcion: 'Trazabilidad de las publicaciones que respaldan los indicadores',
    icon: Files,
    alcanceFiltros: 'ninguno',
  },
  {
    ruta: '/',
    seccion: 'General',
    titulo: 'Resumen ejecutivo',
    descripcion: 'Vista consolidada electoral, socioeconómica y poblacional',
    icon: Home,
    alcanceFiltros: 'global',
  },
];

const FALLBACK: VistaMeta = VISTAS[VISTAS.length - 1];

export function useVistaActual(): VistaMeta {
  const pathname = usePathname();
  const match =
    VISTAS.find((v) => (v.ruta === '/' ? pathname === '/' : pathname.startsWith(v.ruta))) ??
    FALLBACK;
  return match;
}
