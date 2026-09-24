/** Partículas que van en minúscula dentro de un nombre propio. */
const MENORES = new Set(['de', 'del', 'la', 'las', 'los', 'el', 'y', 'e']);

/**
 * Nombres que el catálogo DIVIPOLA trae abreviados o sin tilde y que no se
 * pueden reconstruir con reglas: departamentos y capitales. La clave es el
 * nombre en mayúsculas tal como llega.
 */
const NOMBRES_OFICIALES: Record<string, string> = {
  'NORTE DE SAN': 'Norte de Santander',
  VALLE: 'Valle del Cauca',
  'BOGOTA D.C.': 'Bogotá D.C.',
  'BOGOTA. D.C.': 'Bogotá D.C.',
  'BOGOTA, D.C.': 'Bogotá D.C.',
  ATLANTICO: 'Atlántico',
  BOLIVAR: 'Bolívar',
  BOYACA: 'Boyacá',
  CAQUETA: 'Caquetá',
  CHOCO: 'Chocó',
  CORDOBA: 'Córdoba',
  GUAINIA: 'Guainía',
  QUINDIO: 'Quindío',
  VAUPES: 'Vaupés',
  'SAN ANDRES': 'San Andrés',
  MEDELLIN: 'Medellín',
  CUCUTA: 'Cúcuta',
  IBAGUE: 'Ibagué',
  POPAYAN: 'Popayán',
  MONTERIA: 'Montería',
  QUIBDO: 'Quibdó',
  INIRIDA: 'Inírida',
  MITU: 'Mitú',
  'SAN JOSE DEL GUAVIARE': 'San José del Guaviare',
};

function formatoTitulo(nombre: string): string {
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

/**
 * Los catálogos DIVIPOLA llegan en mayúsculas ("NORTE DE SANTANDER").
 * Para lectura en la interfaz se pasan a formato título respetando
 * partículas y abreviaturas: "Norte de Santander", "Bogotá D.C.".
 */
export function formatearTerritorio(nombre: string): string {
  const clave = nombre.trim().replace(/\s+/g, ' ').toUpperCase();
  return NOMBRES_OFICIALES[clave] ?? formatoTitulo(nombre.trim());
}

/**
 * Nombres de candidatos ("GUSTAVO PETRO" → "Gustavo Petro"). Las filas
 * técnicas del escrutinio ("VOTOS EN BLANCO .") se leen como frase:
 * "Votos en blanco".
 */
export function formatearNombrePersona(nombre: string): string {
  const limpio = nombre.trim().replace(/\s*\.+$/, '').replace(/\s+/g, ' ');
  if (/^votos\s/i.test(limpio)) {
    const bajo = limpio.toLowerCase();
    return bajo.charAt(0).toUpperCase() + bajo.slice(1);
  }
  return formatoTitulo(limpio);
}
