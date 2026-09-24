/**
 * Presentación de nombres de corporación. El catálogo los entrega en
 * mayúsculas y con guiones ("PRESIDENCIA - PRIMERA VUELTA - 2022"); en la
 * interfaz se muestran en sentence case y separados en sus partes para poder
 * agrupar por tipo de elección y ordenar por año.
 */

export interface NombreCorporacion {
  /** Tipo de elección: "Presidencia", "Territoriales", "Gran consultas"… */
  familia: string;
  /** Cargo o ronda: "Primera vuelta", "Alcalde"… (vacío si no aplica). */
  detalle: string;
  /** Año de la elección, si el nombre lo incluye. */
  anio: number | null;
  /** Nombre completo legible: "Presidencia, primera vuelta 2022". */
  etiqueta: string;
}

/** Siglas que deben conservarse en mayúsculas. */
const SIGLAS = new Set(['JAL', 'JAC', 'CNE', 'DANE', 'MOE']);

function sentenceCase(texto: string): string {
  const palabras = texto.trim().toLowerCase().split(/\s+/);
  return palabras
    .map((p, i) => {
      if (SIGLAS.has(p.toUpperCase())) return p.toUpperCase();
      return i === 0 ? p.charAt(0).toUpperCase() + p.slice(1) : p;
    })
    .join(' ');
}

export function formatearCorporacion(nombre: string): NombreCorporacion {
  const anioMatch = nombre.match(/\b(19|20)\d{2}\b/);
  const anio = anioMatch ? Number(anioMatch[0]) : null;

  const partes = nombre
    .split(/\s+-\s+/)
    .map((p) => p.replace(/\b(19|20)\d{2}\b/, '').trim())
    .filter(Boolean);

  const familia = sentenceCase(partes[0] ?? nombre);
  const detalle = partes.length > 1 ? sentenceCase(partes.slice(1).join(' ')) : '';
  // Dentro de la frase el detalle va en minúscula, salvo que empiece por sigla.
  const detalleEnFrase = SIGLAS.has(detalle.split(' ')[0])
    ? detalle
    : detalle.charAt(0).toLowerCase() + detalle.slice(1);
  const cuerpo = detalle ? `${familia}, ${detalleEnFrase}` : familia;
  const etiqueta = anio ? `${cuerpo} ${anio}` : cuerpo;

  return { familia, detalle, anio, etiqueta };
}
