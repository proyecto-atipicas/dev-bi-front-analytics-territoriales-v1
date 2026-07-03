/**
 * Tabla de equivalencia entre los códigos de departamento usados por la
 * Registraduría Nacional (cómo viene la BD en `dim_divipole.codigo_departamento`)
 * y los códigos DIVIPOLA del DANE (lo que trae el GeoJSON `colombia-departamentos`).
 *
 * Origen verificado contra `dim_divipole` (33 entradas, mayo 2026) cruzando
 * por `nombre_departamento` con la matriz oficial DIVIPOLA del DANE.
 */
export const REGISTRADURIA_TO_DIVIPOLA_DEPTO: Readonly<Record<string, string>> = {
  '01': '05', // ANTIOQUIA
  '03': '08', // ATLÁNTICO
  '05': '13', // BOLÍVAR
  '07': '15', // BOYACÁ
  '09': '17', // CALDAS
  '11': '19', // CAUCA
  '12': '20', // CESAR
  '13': '23', // CÓRDOBA
  '15': '25', // CUNDINAMARCA
  '16': '11', // BOGOTÁ D.C.
  '17': '27', // CHOCÓ
  '19': '41', // HUILA
  '21': '47', // MAGDALENA
  '23': '52', // NARIÑO
  '24': '66', // RISARALDA
  '25': '54', // NORTE DE SANTANDER
  '26': '63', // QUINDÍO
  '27': '68', // SANTANDER
  '28': '70', // SUCRE
  '29': '73', // TOLIMA
  '31': '76', // VALLE DEL CAUCA
  '40': '81', // ARAUCA
  '44': '18', // CAQUETÁ
  '46': '85', // CASANARE
  '48': '44', // LA GUAJIRA
  '50': '94', // GUAINÍA
  '52': '50', // META
  '54': '95', // GUAVIARE
  '56': '88', // SAN ANDRÉS Y PROVIDENCIA
  '60': '91', // AMAZONAS
  '64': '86', // PUTUMAYO
  '68': '97', // VAUPÉS
  '72': '99', // VICHADA
};

export const DIVIPOLA_TO_REGISTRADURIA_DEPTO: Readonly<Record<string, string>> =
  Object.freeze(
    Object.fromEntries(
      Object.entries(REGISTRADURIA_TO_DIVIPOLA_DEPTO).map(([reg, divipola]) => [
        divipola,
        reg,
      ]),
    ),
  );

/** Convierte cualquier código (Registraduría o ya DIVIPOLA) a DIVIPOLA, conservando padding `LPAD(2,'0')`. */
export function aDivipolaDepto(codigo: string | null | undefined): string | null {
  if (!codigo) return null;
  const norm = String(codigo).padStart(2, '0');
  return REGISTRADURIA_TO_DIVIPOLA_DEPTO[norm] ?? norm;
}

/** Convierte un código DIVIPOLA a su equivalente de la Registraduría; si no hay match, devuelve el original. */
export function aRegistraduriaDepto(codigo: string | null | undefined): string | null {
  if (!codigo) return null;
  const norm = String(codigo).padStart(2, '0');
  return DIVIPOLA_TO_REGISTRADURIA_DEPTO[norm] ?? norm;
}

/**
 * Normaliza un nombre de municipio/departamento para hacer matching sin tildes,
 * mayúsculas ni espacios extra. Útil para joinear por nombre cuando los códigos
 * municipales de la Registraduría no coinciden con los DIVIPOLA del DANE
 * (~1100 municipios sin equivalencia 1:1).
 */
export function normalizarNombre(nombre: string | null | undefined): string {
  if (!nombre) return '';
  return nombre
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[.\-_,]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();
}

/**
 * Tabla nombre normalizado → código DIVIPOLA. Sirve como fallback cuando
 * `codigo_departamento` en la BD viene en un esquema desconocido (DIVIPOLA
 * directo, sin padding, o incluso el nombre como texto) y el matching por
 * código no encuentra polígono. Incluye sinónimos comunes (D.C., SAI, etc.).
 */
export const NOMBRE_TO_DIVIPOLA_DEPTO: Readonly<Record<string, string>> = {
  ANTIOQUIA: '05',
  ATLANTICO: '08',
  'BOGOTA D C': '11',
  'BOGOTA DC': '11',
  BOGOTA: '11',
  BOLIVAR: '13',
  BOYACA: '15',
  CALDAS: '17',
  CAQUETA: '18',
  CAUCA: '19',
  CESAR: '20',
  CORDOBA: '23',
  CUNDINAMARCA: '25',
  CHOCO: '27',
  HUILA: '41',
  'LA GUAJIRA': '44',
  GUAJIRA: '44',
  MAGDALENA: '47',
  META: '50',
  NARINO: '52',
  'NORTE DE SANTANDER': '54',
  QUINDIO: '63',
  RISARALDA: '66',
  'SAN ANDRES Y PROVIDENCIA': '88',
  'SAN ANDRES': '88',
  SANTANDER: '68',
  SUCRE: '70',
  TOLIMA: '73',
  'VALLE DEL CAUCA': '76',
  VALLE: '76',
  ARAUCA: '81',
  CASANARE: '85',
  PUTUMAYO: '86',
  AMAZONAS: '91',
  GUAINIA: '94',
  GUAVIARE: '95',
  VAUPES: '97',
  VICHADA: '99',
};

/**
 * Resuelve el código DIVIPOLA preferentemente por nombre normalizado. Es
 * a prueba de esquemas — Registraduría, DIVIPOLA o nombre crudo en el
 * campo `codigo_departamento`. Cae al lookup por código si el nombre no
 * está disponible o no matchea.
 */
export function aDivipolaDeptoFlexible(
  codigo: string | null | undefined,
  nombre: string | null | undefined,
): string | null {
  const porNombre = NOMBRE_TO_DIVIPOLA_DEPTO[normalizarNombre(nombre)];
  if (porNombre) return porNombre;
  return aDivipolaDepto(codigo);
}

/**
 * Conjunto de DIVIPOLA válidos (33 entradas) — los códigos efectivamente
 * presentes en `colombia-departamentos.geojson`. Sirve para validar que
 * una traducción de código se resolvió a un polígono real antes de
 * filtrar el mapa (evita dejar el viewport vacío por un código sin match).
 */
export const DIVIPOLAS_DEPTO_VALIDOS: ReadonlySet<string> = new Set(
  Object.values(REGISTRADURIA_TO_DIVIPOLA_DEPTO),
);

/**
 * Código de "departamento" que la Registraduría usa en `dim_divipole` para el
 * voto en el exterior / consulados (nombre `CONSULADOS`, 70 países). NO es un
 * departamento real: `aDivipolaDepto('88')` cae al fallback y devuelve `'88'`,
 * que colisiona con San Andrés (Registraduría `56` → DIVIPOLA `88`). Debe
 * excluirse de los choropleth departamentales para no fundir el exterior con
 * San Andrés. San Andrés siempre entra por el código Registraduría `56`.
 */
export const CODIGO_DEPARTAMENTO_EXTERIOR_BD = '88';

/** True si el código de departamento de la BD corresponde al voto exterior (consulados). */
export function esDepartamentoExteriorBd(codigo: string | null | undefined): boolean {
  if (!codigo) return false;
  return String(codigo).padStart(2, '0') === CODIGO_DEPARTAMENTO_EXTERIOR_BD;
}

/**
 * Alias de nombres municipales Registraduría (BD `dim_divipole.nombre_municipio`)
 * → nombre DANE del GeoJSON, ambos normalizados con `normalizarNombre`.
 *
 * Clave: `${codigoDeptoDIVIPOLA}|${normalizarNombre(nombreMunicipioBd)}`.
 * Valor: nombre DANE normalizado (el que existe en `colombia-municipios.geojson`).
 *
 * Cubre las divergencias reales donde el nombre de la Registraduría no coincide
 * con el del DANE (nombre oficial completo, alias histórico entre paréntesis,
 * ortografía/espaciado o artículo inicial faltante). Generado 2026-07-02 cruzando
 * `dim_divipole` contra el GeoJSON: resuelven a polígonos reales y distintos
 * (0 colisiones), llevando la cobertura municipal a 1122/1122. Incluye la
 * grafía duplicada `BARRANCO MINAS` que el `MAX(nombre_municipio)` del endpoint
 * puede devolver además de `BARRANCOMINAS`.
 */
export const MUNICIPIO_ALIAS_REGISTRADURIA: Readonly<Record<string, string>> = {
  '05|ANTIOQUIA': 'SANTA FE DE ANTIOQUIA', // ANTIOQUIA -> SANTA FÉ DE ANTIOQUIA [05042]
  '05|BOLIVAR': 'CIUDAD BOLIVAR', // BOLIVAR -> CIUDAD BOLÍVAR [05101]
  '05|CARMEN DE VIBORAL': 'EL CARMEN DE VIBORAL', // CARMEN DE VIBORAL -> EL CARMEN DE VIBORAL [05148]
  '05|DON MATIAS': 'DONMATIAS', // DON MATIAS -> DONMATÍAS [05237]
  '05|PUERTO NARE LA MAGDALENA': 'PUERTO NARE', // PUERTO NARE-LA MAGDALENA -> PUERTO NARE [05585]
  '05|SAN ANDRES': 'SAN ANDRES DE CUERQUIA', // SAN ANDRES -> SAN ANDRÉS DE CUERQUÍA [05647]
  '05|SAN PEDRO': 'SAN PEDRO DE LOS MILAGROS', // SAN PEDRO -> SAN PEDRO DE LOS MILAGROS [05664]
  '05|SAN VICENTE': 'SAN VICENTE FERRER', // SAN VICENTE -> SAN VICENTE FERRER [05674]
  '05|SANTUARIO': 'EL SANTUARIO', // SANTUARIO -> EL SANTUARIO [05697]
  '05|YONDO CASABE': 'YONDO', // YONDO-CASABE -> YONDÓ [05893]
  '13|ARROYO HONDO': 'ARROYOHONDO', // ARROYO HONDO -> ARROYOHONDO [13062]
  '13|CARTAGENA': 'CARTAGENA DE INDIAS', // CARTAGENA -> CARTAGENA DE INDIAS [13001]
  '13|RIOVIEJO': 'RIO VIEJO', // RIOVIEJO -> RÍO VIEJO [13600]
  '13|TIQUISIO (PTO RICO)': 'TIQUISIO', // TIQUISIO (PTO. RICO) -> TIQUISIO [13810]
  '15|AQUITANIA (PUEBLOVIEJO)': 'AQUITANIA', // AQUITANIA (PUEBLOVIEJO) -> AQUITANIA [15047]
  '15|GUICAN': 'GUICAN DE LA SIERRA', // GUICAN -> GÜICÁN DE LA SIERRA [15332]
  '15|VILLA DE LEIVA': 'VILLA DE LEYVA', // VILLA DE LEIVA -> VILLA DE LEYVA [15407]
  '19|LOPEZ (MICAY)': 'LOPEZ DE MICAY', // LOPEZ (MICAY) -> LÓPEZ DE MICAY [19418]
  '19|PAEZ (BELALCAZAR)': 'PAEZ', // PAEZ (BELALCAZAR) -> PÁEZ [19517]
  '19|PATIA (EL BORDO)': 'PATIA', // PATIA (EL BORDO) -> PATÍA [19532]
  '19|PIENDAMO': 'PIENDAMO TUNIA', // PIENDAMO -> PIENDAMÓ - TUNÍA [19548]
  '19|PURACE (COCONUCO)': 'PURACE', // PURACE (COCONUCO) -> PURACÉ [19585]
  '19|SOTARA (PAISPAMBA)': 'SOTARA PAISPAMBA', // SOTARA (PAISPAMBA) -> SOTARÁ - PAISPAMBA [19760]
  '20|MANAURE BALCON DEL CESAR (MANA': 'MANAURE BALCON DEL CESAR', // MANAURE BALCON DEL CESAR (MANA -> MANAURE BALCÓN DEL CESAR [20443]
  '23|COTORRA (BONGO)': 'COTORRA', // COTORRA (BONGO) -> COTORRA [23300]
  '23|LA APARTADA (FRONTERA)': 'LA APARTADA', // LA APARTADA (FRONTERA) -> LA APARTADA [23350]
  '23|PURISIMA': 'PURISIMA DE LA CONCEPCION', // PURISIMA -> PURÍSIMA DE LA CONCEPCIÓN [23586]
  '25|PARATEBUENO (LA NAGUAYA)': 'PARATEBUENO', // PARATEBUENO (LA NAGUAYA) -> PARATEBUENO [25530]
  '25|UBATE': 'VILLA DE SAN DIEGO DE UBATE', // UBATE -> VILLA DE SAN DIEGO DE UBATÉ [25843]
  '27|ALTO BAUDO (PIE DE PATO)': 'ALTO BAUDO', // ALTO BAUDO (PIE DE PATO) -> ALTO BAUDÓ [27025]
  '27|ATRATO (YUTO)': 'ATRATO', // ATRATO (YUTO) -> ATRATO [27050]
  '27|BAHIA SOLANO (MUTIS)': 'BAHIA SOLANO', // BAHIA SOLANO (MUTIS) -> BAHÍA SOLANO [27075]
  '27|BAJO BAUDO (PIZARRO)': 'BAJO BAUDO', // BAJO BAUDO (PIZARRO) -> BAJO BAUDÓ [27077]
  '27|BOJAYA (BELLAVISTA)': 'BOJAYA', // BOJAYA (BELLAVISTA) -> BOJAYÁ [27099]
  '27|EL CANTON DEL SAN PABLO (MAN': 'EL CANTON DEL SAN PABLO', // EL CANTON DEL SAN PABLO (MAN. -> EL CANTÓN DEL SAN PABLO [27135]
  '27|EL CARMEN': 'EL CARMEN DE ATRATO', // EL CARMEN -> EL CARMEN DE ATRATO [27245]
  '27|MEDIO ATRATO (BETE)': 'MEDIO ATRATO', // MEDIO ATRATO (BETE) -> MEDIO ATRATO [27425]
  '27|MEDIO BAUDO (PUERTO MELUK)': 'MEDIO BAUDO', // MEDIO BAUDO (PUERTO MELUK) -> MEDIO BAUDÓ [27430]
  '27|RIO QUITO (PAIMADO)': 'RIO QUITO', // RIO QUITO (PAIMADO) -> RÍO QUITO [27600]
  '27|UNION PANAMERICANA (LAS ANIMAS': 'UNION PANAMERICANA', // UNION PANAMERICANA (LAS ANIMAS -> UNIÓN PANAMERICANA [27810]
  '41|LA ARGENTINA (PLATA VIEJA)': 'LA ARGENTINA', // LA ARGENTINA (PLATA VIEJA) -> LA ARGENTINA [41378]
  '41|TESALIA (CARNICERIAS)': 'TESALIA', // TESALIA (CARNICERIAS) -> TESALIA [41797]
  '47|ARIGUANI (EL DIFICIL)': 'ARIGUANI', // ARIGUANI (EL DIFICIL) -> ARIGUANÍ [47058]
  '47|ZONA BANANERA (SEVILLA)': 'ZONA BANANERA', // ZONA BANANERA (SEVILLA) -> ZONA BANANERA [47980]
  '50|SAN MARTIN DE LOS LLANOS': 'SAN MARTIN', // SAN MARTIN DE LOS LLANOS -> SAN MARTÍN [50689]
  '50|VISTA HERMOSA': 'VISTAHERMOSA', // VISTA HERMOSA -> VISTAHERMOSA [50711]
  '52|ALBAN (SAN JOSE)': 'ALBAN', // ALBAN (SAN JOSE) -> ALBÁN [52019]
  '52|ARBOLEDA (BERRUECOS)': 'ARBOLEDA', // ARBOLEDA (BERRUECOS) -> ARBOLEDA [52051]
  '52|COLON (GENOVA)': 'COLON', // COLON (GENOVA) -> COLÓN [52203]
  '52|CUASPUD (CARLOSAMA)': 'CUASPUD CARLOSAMA', // CUASPUD (CARLOSAMA) -> CUASPUD CARLOSAMA [52224]
  '52|EL TABLON': 'EL TABLON DE GOMEZ', // EL TABLON -> EL TABLÓN DE GÓMEZ [52258]
  '52|FRANCISCO PIZARRO (SALAHONDA)': 'FRANCISCO PIZARRO', // FRANCISCO PIZARRO (SALAHONDA) -> FRANCISCO PIZARRO [52520]
  '52|LOS ANDES (SOTOMAYOR)': 'LOS ANDES', // LOS ANDES (SOTOMAYOR) -> LOS ANDES [52418]
  '52|MAGUI (PAYAN)': 'MAGUI', // MAGUI (PAYAN) -> MAGÜÍ [52427]
  '52|MALLAMA (PIEDRANCHA)': 'MALLAMA', // MALLAMA (PIEDRANCHA) -> MALLAMA [52435]
  '52|ROBERTO PAYAN (SAN JOSE)': 'ROBERTO PAYAN', // ROBERTO PAYAN (SAN JOSE) -> ROBERTO PAYÁN [52621]
  '52|SANTA BARBARA (ISCUANDE)': 'SANTA BARBARA', // SANTA BARBARA (ISCUANDE) -> SANTA BÁRBARA [52696]
  '52|SANTACRUZ (GUACHAVES)': 'SANTACRUZ', // SANTACRUZ (GUACHAVES) -> SANTACRUZ [52699]
  '52|TUMACO': 'SAN ANDRES DE TUMACO', // TUMACO -> SAN ANDRÉS DE TUMACO [52835]
  '54|CUCUTA': 'SAN JOSE DE CUCUTA', // CUCUTA -> SAN JOSÉ DE CÚCUTA [54001]
  '68|EL CARMEN': 'EL CARMEN DE CHUCURI', // EL CARMEN -> EL CARMEN DE CHUCURI [68235]
  '70|COLOSO (RICAURTE)': 'COLOSO', // COLOSO (RICAURTE) -> COLOSÓ [70204]
  '70|GALERAS (NUEVA GRANADA)': 'GALERAS', // GALERAS (NUEVA GRANADA) -> GALERAS [70235]
  '70|SAN JUAN DE BETULIA (BETULIA)': 'SAN JUAN DE BETULIA', // SAN JUAN DE BETULIA (BETULIA) -> SAN JUAN DE BETULIA [70702]
  '70|SINCE': 'SAN LUIS DE SINCE', // SINCE -> SAN LUIS DE SINCÉ [70742]
  '70|TOLU': 'SANTIAGO DE TOLU', // TOLU -> SANTIAGO DE TOLÚ [70820]
  '70|TOLUVIEJO': 'SAN JOSE DE TOLUVIEJO', // TOLUVIEJO -> SAN JOSÉ DE TOLUVIEJO [70823]
  '73|ARMERO (GUAYABAL)': 'ARMERO', // ARMERO (GUAYABAL) -> ARMERO [73055]
  '73|MARIQUITA': 'SAN SEBASTIAN DE MARIQUITA', // MARIQUITA -> SAN SEBASTIÁN DE MARIQUITA [73443]
  '76|BUGA': 'GUADALAJARA DE BUGA', // BUGA -> GUADALAJARA DE BUGA [76111]
  '76|CALIMA (DARIEN)': 'CALIMA', // CALIMA (DARIEN) -> CALIMA [76126]
  '85|PAZ DE ARIPORO (MORENO)': 'PAZ DE ARIPORO', // PAZ DE ARIPORO (MORENO) -> PAZ DE ARIPORO [85250]
  '86|SAN MIGUEL (LA DORADA)': 'SAN MIGUEL', // SAN MIGUEL (LA DORADA) -> SAN MIGUEL [86757]
  '86|VALLE DEL GUAMUEZ (LA HORMIGA)': 'VALLE DEL GUAMUEZ', // VALLE DEL GUAMUEZ (LA HORMIGA) -> VALLE DEL GUAMUEZ [86865]
  '94|MORICHAL (MORICHAL NUEVO)': 'MORICHAL', // MORICHAL (MORICHAL NUEVO) -> MORICHAL [94888]
  '94|PANA PANA (CAMPO ALEGRE)': 'PANA PANA', // PANA PANA (CAMPO ALEGRE) -> PANA PANA [94887]
  '94|BARRANCO MINAS': 'BARRANCOMINAS', // BARRANCO MINAS -> BARRANCOMINAS [94343] (grafía duplicada en dim_divipole; el MAX(nombre_municipio) del endpoint puede devolver esta variante con espacio)
  '97|BUENOS AIRES (PACOA)': 'PACOA', // BUENOS AIRES (PACOA) -> PACOA [97511]
  '97|MORICHAL (PAPUNAGUA)': 'PAPUNAHUA', // MORICHAL (PAPUNAGUA) -> PAPUNAHUA [97777]
};

/**
 * Construye la clave de lookup `${deptoDIVIPOLA}|${nombreNormalizado}` para
 * cruzar un municipio de la BD contra el índice `porNombre` del GeoJSON,
 * aplicando primero el alias Registraduría→DANE cuando exista. Es la forma
 * canónica de resolver el match municipal (ida) y de compararlo (vuelta):
 * usar la misma función en ambos sentidos garantiza simetría.
 */
export function claveMunicipioDivipola(
  codigoDeptoDivipola: string,
  nombreMunicipioBd: string | null | undefined,
): string {
  const nombre = normalizarNombre(nombreMunicipioBd);
  const alias = MUNICIPIO_ALIAS_REGISTRADURIA[`${codigoDeptoDivipola}|${nombre}`];
  return `${codigoDeptoDivipola}|${alias ?? nombre}`;
}
