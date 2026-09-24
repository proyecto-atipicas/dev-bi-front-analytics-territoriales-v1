const formatos = new Map<number, Intl.NumberFormat>();

/**
 * Porcentaje con la convención colombiana: coma decimal y espacio fino antes
 * del símbolo ("39,84 %"). El espacio es no separable para que el número y
 * el signo nunca queden en líneas distintas.
 */
export function formatearPorcentaje(valor: number, decimales = 2): string {
  let f = formatos.get(decimales);
  if (!f) {
    f = new Intl.NumberFormat('es-CO', {
      minimumFractionDigits: decimales,
      maximumFractionDigits: decimales,
    });
    formatos.set(decimales, f);
  }
  return `${f.format(valor)} %`;
}
