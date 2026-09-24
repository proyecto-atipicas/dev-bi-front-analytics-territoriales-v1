/** Partículas que van en minúscula dentro de un nombre propio. */
const MENORES = new Set(['de', 'del', 'la', 'las', 'los', 'el', 'y', 'e']);

/**
 * Los catálogos DIVIPOLA llegan en mayúsculas ("NORTE DE SANTANDER").
 * Para lectura en la interfaz se pasan a formato título respetando
 * partículas y abreviaturas: "Norte de Santander", "Bogotá D.C.".
 */
export function formatearTerritorio(nombre: string): string {
  return nombre
    .toLowerCase()
    .split(/(\s+|-|\()/)
    .map((p, i) => {
      if (!p.trim() || p === '-' || p === '(') return p;
      if (/^([a-z]\.)+$/.test(p)) return p.toUpperCase();
      if (i > 0 && MENORES.has(p)) return p;
      return p.charAt(0).toUpperCase() + p.slice(1);
    })
    .join('');
}
