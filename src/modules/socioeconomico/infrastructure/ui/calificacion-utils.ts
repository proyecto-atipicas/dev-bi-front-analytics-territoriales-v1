import { cn } from '@/shared/ui/utils/cn';

/**
 * Mapea el campo `nivel_riesgo` (medio | alto | extremo | …) — antes
 * `calificacion` — a colores RGB para el mapa de calor y a clases de tono
 * para badges en la UI.
 *
 * El archivo conserva el nombre `calificacion-utils.ts` por compatibilidad
 * de paths; los identificadores expuestos siguen la nueva nomenclatura
 * (`nivelRiesgo`).
 */
export interface ConfigNivelRiesgo {
  /** Color RGB para el polígono del mapa (light) */
  color: string;
  /** Color RGB para el polígono del mapa (dark) */
  colorDark: string;
  /** Clases Tailwind para badges (bg + text) */
  badgeClass: string;
  /** Etiqueta normalizada (capitalizada) */
  label: string;
}

const NEUTRO: ConfigNivelRiesgo = {
  color: 'rgb(226 230 240)',   // border claro
  colorDark: 'rgb(56 68 102)', // border (dark)
  badgeClass: 'bg-surface-elevated text-foreground-muted',
  label: 'Sin clasificar',
};

// Paleta alineada con el brandbook: red/yellow para alarma; navy/sky para info; teal para ok.
const TABLA: Record<string, Omit<ConfigNivelRiesgo, 'label'>> = {
  // Cada nivel necesita un badge distinguible: antes "alto" y "medio"
  // compartían el mismo amarillo y sólo el texto los separaba.
  extremo: {
    color: 'rgb(179 33 24)',     // brandbook red #b32118
    colorDark: 'rgb(232 95 84)', // versión cálida para oscuro
    badgeClass: 'bg-danger text-brand-foreground',
  },
  alto: {
    color: 'rgb(217 102 30)',    // naranja terracota coordinado con la marca
    colorDark: 'rgb(245 158 70)',
    badgeClass: 'bg-danger-muted text-danger-foreground',
  },
  medio: {
    color: 'rgb(239 199 47)',    // brandbook yellow #efc72f
    colorDark: 'rgb(252 211 77)',
    badgeClass: 'bg-warning-muted text-warning-foreground',
  },
  bajo: {
    color: 'rgb(20 160 133)',    // teal complementario
    colorDark: 'rgb(52 211 153)',
    badgeClass: 'bg-success-muted text-success-foreground',
  },
  normal: {
    color: 'rgb(129 183 230)',   // brandbook sky #81b7e6
    colorDark: 'rgb(129 183 230)',
    badgeClass: 'bg-info-muted text-info-foreground',
  },
};

export function configNivelRiesgo(nivelRiesgo: string | null): ConfigNivelRiesgo {
  if (!nivelRiesgo) return NEUTRO;
  const k = nivelRiesgo.toLowerCase().trim();
  for (const [needle, cfg] of Object.entries(TABLA)) {
    if (k.includes(needle)) {
      return {
        ...cfg,
        label: capitalize(nivelRiesgo.trim()),
      };
    }
  }
  return { ...NEUTRO, label: capitalize(nivelRiesgo.trim()) };
}

export function colorParaNivelRiesgo(
  nivelRiesgo: string | null,
  isDark: boolean,
): string {
  const cfg = configNivelRiesgo(nivelRiesgo);
  return isDark ? cfg.colorDark : cfg.color;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

/** Clases para un badge de nivel de riesgo con la paleta del sistema. */
export function badgeNivelRiesgoClass(nivelRiesgo: string | null): string {
  return cn(
    'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold',
    configNivelRiesgo(nivelRiesgo).badgeClass,
  );
}
