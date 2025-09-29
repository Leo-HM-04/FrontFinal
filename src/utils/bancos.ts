// Utilidades para manejo de información bancaria

/**
 * Convierte un código de banco a su nombre completo
 * @param codigoBanco - Código numérico del banco (puede ser string o número)
 * @returns Nombre completo del banco o el código original si no se encuentra
 */
export function obtenerNombreBanco(codigoBanco: string | number): string {
  if (!codigoBanco) return '';
  
  const codigo = String(codigoBanco);
  
  const bancos: Record<string, string> = {
    '002': 'BANAMEX',
    '012': 'BBVA BANCOMER',
    '014': 'SANTANDER',
    '019': 'BANJERCITO',
    '021': 'HSBC',
    '030': 'BAJIO',
    '032': 'IXE',
    '036': 'INBURSA',
    '037': 'INTERACCIONES',
    '042': 'MIFEL',
    '044': 'SCOTIABANK',
    '058': 'BANREGIO',
    '059': 'INVEX',
    '060': 'BANSI',
    '062': 'AFIRME',
    '072': 'BANORTE',
    '102': 'THE ROYAL BANK',
    '103': 'AMERICAN EXPRESS',
    '106': 'BAMSA',
    '108': 'TOKYO',
    '110': 'JP MORGAN',
    '112': 'BMONEX',
    '113': 'VE POR MAS',
    '116': 'CREDIT SUISSE',
    '124': 'DEUTSCHE',
    '126': 'CREDIT AGRICOLE',
    '127': 'AZTECA',
    '128': 'AUTOFIN',
    '129': 'BARCLAYS',
    '130': 'COMPARTAMOS',
    '131': 'BANCO FAMSA',
    '132': 'BMULTIVA',
    '133': 'ACTINVER',
    '134': 'WAL-MART',
    '135': 'NAFIN',
    '136': 'INTERBANCO',
    '137': 'BANCOPPEL',
    '138': 'ABC CAPITAL',
    '139': 'UBS BANK',
    '140': 'CONSUBANCO',
    '141': 'VOLKSWAGEN',
    '143': 'CIBANCO',
    '145': 'BBASE',
    '147': 'BANKAOOL',
    '148': 'PAGATODO',
    '149': 'INMOBILIARIO',
    '150': 'DONDE',
    '151': 'BANCREA',
    '152': 'BANCO AHORRO FAMSA',
    '154': 'BANCO COVALTO',
    '155': 'ICBC',
    '156': 'SABADELL',
    '157': 'SHINHAN',
    '158': 'MIZUHO BANK',
    '159': 'BANCO S3',
    '160': 'BANK OF CHINA',
    '166': 'BANCO BICENTENARIO',
    '901': 'STP',
    '902': 'BANREGIO',
    '999': 'OTRO BANCO'
  };

  // Si es un código de 3 dígitos, buscar directamente
  if (bancos[codigo]) {
    return bancos[codigo];
  }

  // Si es un código de 1-2 dígitos, agregar ceros a la izquierda
  const codigoNormalizado = codigo.padStart(3, '0');
  if (bancos[codigoNormalizado]) {
    return bancos[codigoNormalizado];
  }

  // Si no se encuentra, devolver el código original
  return codigo;
}

/**
 * Verifica si un código de banco es válido
 * @param codigoBanco - Código numérico del banco
 * @returns true si el código existe en la lista de bancos
 */
export function esBancoValido(codigoBanco: string | number): boolean {
  if (!codigoBanco) return false;
  
  const codigo = String(codigoBanco);
  const bancos = ['002', '012', '014', '019', '021', '030', '032', '036', '037', '042', '044', '058', '059', '060', '062', '072', '102', '103', '106', '108', '110', '112', '113', '116', '124', '126', '127', '128', '129', '130', '131', '132', '133', '134', '135', '136', '137', '138', '139', '140', '141', '143', '145', '147', '148', '149', '150', '151', '152', '154', '155', '156', '157', '158', '159', '160', '166', '901', '902', '999'];
  
  return bancos.includes(codigo) || bancos.includes(codigo.padStart(3, '0'));
}

/**
 * Formatea información bancaria completa
 * @param banco - Código o nombre del banco
 * @param cuenta - Número de cuenta
 * @returns Información bancaria formateada
 */
export function formatearInfoBancaria(banco?: string, cuenta?: string): string {
  if (!banco && !cuenta) return 'No especificado';
  
  const nombreBanco = banco ? obtenerNombreBanco(banco) : '';
  const infoCuenta = cuenta ? ` - ${cuenta}` : '';
  
  return `${nombreBanco}${infoCuenta}`;
}