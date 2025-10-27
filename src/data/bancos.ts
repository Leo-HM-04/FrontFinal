// Lista de bancos de México según Banxico
export interface Banco {
  codigo: string;
  nombre: string;
  nombreCorto: string;
}

export const bancosMexico: Banco[] = [
  { codigo: '002', nombre: 'Banco Nacional de México S.A.', nombreCorto: 'BANAMEX' },
  { codigo: '006', nombre: 'Banco Nacional de Comercio Exterior S.N.C.', nombreCorto: 'BANCOMEXT' },
  { codigo: '009', nombre: 'Banco Nacional de Obras y Servicios Públicos S.N.C.', nombreCorto: 'BANOBRAS' },
  { codigo: '012', nombre: 'BBVA México S.A.', nombreCorto: 'BBVA MÉXICO' },
  { codigo: '014', nombre: 'Banco Santander México S.A.', nombreCorto: 'SANTANDER' },
  { codigo: '019', nombre: 'Banco Nacional del Ejército Fuerza Aérea y Armada S.N.C.', nombreCorto: 'BANJERCITO' },
  { codigo: '021', nombre: 'HSBC México S.A.', nombreCorto: 'HSBC' },
  { codigo: '030', nombre: 'Banco del Bajío S.A.', nombreCorto: 'BAJÍO' },
  { codigo: '031', nombre: 'Banco Mercantil del Norte S.A.', nombreCorto: 'BANORTE' },
  { codigo: '032', nombre: 'ING Bank (México) S.A.', nombreCorto: 'ING' },
  { codigo: '036', nombre: 'Banco Inbursa S.A.', nombreCorto: 'INBURSA' },
  { codigo: '037', nombre: 'Banco Interacciones S.A.', nombreCorto: 'INTERACCIONES' },
  { codigo: '042', nombre: 'Banco Mifel S.A.', nombreCorto: 'MIFEL' },
  { codigo: '044', nombre: 'Scotiabank Inverlat S.A.', nombreCorto: 'SCOTIABANK' },
  { codigo: '058', nombre: 'Banco Regional de Monterrey S.A.', nombreCorto: 'BANREGIO' },
  { codigo: '059', nombre: 'Banco Invex S.A.', nombreCorto: 'INVEX' },
  { codigo: '060', nombre: 'Banco S3 México S.A.', nombreCorto: 'BANCO S3' },
  { codigo: '062', nombre: 'Banca Afirme S.A.', nombreCorto: 'AFIRME' },
  { codigo: '072', nombre: 'Banco Actinver S.A.', nombreCorto: 'ACTINVER' },
  { codigo: '102', nombre: 'The Royal Bank of Scotland México S.A.', nombreCorto: 'RBS' },
  { codigo: '103', nombre: 'American Express Bank (México) S.A.', nombreCorto: 'AMERICAN EXPRESS' },
  { codigo: '106', nombre: 'Bank of America México S.A.', nombreCorto: 'BANK OF AMERICA' },
  { codigo: '108', nombre: 'Bank of Tokyo-Mitsubishi UFJ (México) S.A.', nombreCorto: 'MUFG' },
  { codigo: '110', nombre: 'JP Morgan Chase Bank N.A.', nombreCorto: 'JP MORGAN' },
  { codigo: '112', nombre: 'Banco Multiva S.A.', nombreCorto: 'MULTIVA' },
  { codigo: '113', nombre: 'Credit Suisse (México) S.A.', nombreCorto: 'CREDIT SUISSE' },
  { codigo: '116', nombre: 'Banco Azteca S.A.', nombreCorto: 'AZTECA' },
  { codigo: '124', nombre: 'Deutsche Bank México S.A.', nombreCorto: 'DEUTSCHE' },
  { codigo: '126', nombre: 'Credit Agricole Corporate and Investment Bank S.A.', nombreCorto: 'CREDIT AGRICOLE' },
  { codigo: '127', nombre: 'Banco Jerarquía S.A.', nombreCorto: 'JERARQUÍA' },
  { codigo: '128', nombre: 'Bank of China (México) S.A.', nombreCorto: 'BANK OF CHINA' },
  { codigo: '129', nombre: 'Banco Sabadell México S.A.', nombreCorto: 'SABADELL' },
  { codigo: '130', nombre: 'Banco Nacional de Comercio Interior S.N.C.', nombreCorto: 'BNCI' },
  { codigo: '131', nombre: 'Banco Inmobiliario Mexicano S.A.', nombreCorto: 'BIM' },
  { codigo: '132', nombre: 'Banco Progreso S.A.', nombreCorto: 'PROGRESO' },
  { codigo: '133', nombre: 'Banco de la Microempresa S.A.', nombreCorto: 'MICROEMPRESA' },
  { codigo: '134', nombre: 'Banco Covalto S.A.', nombreCorto: 'COVALTO' },
  { codigo: '135', nombre: 'STP Sistema de Transferencias y Pagos S.A. de C.V. SOFOM E.N.R.', nombreCorto: 'STP' },
  { codigo: '136', nombre: 'ABC Capital S.A.', nombreCorto: 'ABC CAPITAL' },
  { codigo: '137', nombre: 'Volkswagen Bank S.A.', nombreCorto: 'VOLKSWAGEN' },
  { codigo: '138', nombre: 'CIBanco S.A.', nombreCorto: 'CIBANCO' },
  { codigo: '139', nombre: 'Banco Bancrea S.A.', nombreCorto: 'BANCREA' },
  { codigo: '140', nombre: 'Banca Mifel S.A.', nombreCorto: 'BANCA MIFEL' },
  { codigo: '141', nombre: 'Banco Finterra S.A.', nombreCorto: 'FINTERRA' },
  { codigo: '143', nombre: 'Banco Coppel S.A.', nombreCorto: 'COPPEL' },
  { codigo: '145', nombre: 'Banco BASE S.A.', nombreCorto: 'BASE' },
  { codigo: '166', nombre: 'Banco del Bienestar S.N.C.', nombreCorto: 'BIENESTAR' },
  { codigo: '168', nombre: 'Banco Hipotecario Federal S.N.C.', nombreCorto: 'HIPOTECARIO FEDERAL' },
  { codigo: '600', nombre: 'MonexCasa de Bolsa S.A. de C.V.', nombreCorto: 'MONEX' },
  { codigo: '601', nombre: 'GBM Grupo Bursátil Mexicano S.A. de C.V.', nombreCorto: 'GBM' },
  { codigo: '602', nombre: 'Masari Casa de Bolsa S.A.', nombreCorto: 'MASARI' },
  { codigo: '605', nombre: 'Value Grupo Financiero S.A. de C.V.', nombreCorto: 'VALUE' },
  { codigo: '608', nombre: 'Vector Casa de Bolsa S.A. de C.V.', nombreCorto: 'VECTOR' },
  { codigo: '610', nombre: 'B y B Casa de Cambio S.A. de C.V.', nombreCorto: 'B Y B' },
  { codigo: '614', nombre: 'Accival Casa de Bolsa S.A. de C.V.', nombreCorto: 'ACCIVAL' },
  { codigo: '616', nombre: 'Finamex Casa de Cambio S.A. de C.V.', nombreCorto: 'FINAMEX' },
  { codigo: '617', nombre: 'Estructuradores del Mercado de Valores Casa de Bolsa S.A. de C.V.', nombreCorto: 'EMV' },
  { codigo: '618', nombre: 'Intercam Casa de Bolsa S.A. de C.V.', nombreCorto: 'INTERCAM' },
  { codigo: '630', nombre: 'Intercam Banco S.A.', nombreCorto: 'INTERCAM BANCO' },
  { codigo: '631', nombre: 'Multiva Casa de Bolsa S.A. de C.V.', nombreCorto: 'MULTIVA CASA DE BOLSA' },
  { codigo: '636', nombre: 'HDI Seguros S.A. de C.V.', nombreCorto: 'HDI SEGUROS' },
  { codigo: '637', nombre: 'Order Express Casa de Cambio S.A. de C.V.', nombreCorto: 'ORDER EXPRESS' },
  { codigo: '638', nombre: 'Akala S.A. de C.V. SOFOM E.N.R.', nombreCorto: 'AKALA' },
  { codigo: '640', nombre: 'CB Intercam S.A. de C.V.', nombreCorto: 'CB INTERCAM' },
  { codigo: '642', nombre: 'Operadora de Recursos Reforma S.A. de C.V. SOFOM E.R.', nombreCorto: 'ORR' },
  { codigo: '646', nombre: 'Sistema de Inversión Kapital S.A. de C.V.', nombreCorto: 'SIK' },
  { codigo: '647', nombre: 'Consultoría Internacional Casa de Cambio S.A. de C.V.', nombreCorto: 'CONSULTORÍA INTERNACIONAL' },
  { codigo: '648', nombre: 'Divisas Corporativas Casa de Cambio S.A. de C.V.', nombreCorto: 'DIVISAS CORPORATIVAS' },
  { codigo: '649', nombre: 'Skandia Operadora S.A. de C.V.', nombreCorto: 'SKANDIA' },
  { codigo: '651', nombre: 'Segmty S.A. de C.V. SOFOM E.N.R.', nombreCorto: 'SEGMTY' },
  { codigo: '652', nombre: 'Assurant México S.A. de C.V.', nombreCorto: 'ASSURANT' },
  { codigo: '653', nombre: 'Sólida Administradora de Portafolios S.A. de C.V.', nombreCorto: 'SÓLIDA' },
  { codigo: '655', nombre: 'J.P. Morgan Casa de Bolsa S.A. de C.V.', nombreCorto: 'JP MORGAN CASA DE BOLSA' },
  { codigo: '656', nombre: 'Unión de Crédito Interactivo S.A. de C.V.', nombreCorto: 'UCI' },
  { codigo: '659', nombre: 'Fondo de Fomento Económico Banamex S.A. de C.V.', nombreCorto: 'FFEB' },
  { codigo: '670', nombre: 'Sistema de Transferencias y Pagos STP S.A. de C.V.', nombreCorto: 'STP PAGOS' },
  { codigo: '674', nombre: 'AXA Seguros S.A. de C.V.', nombreCorto: 'AXA' },
  { codigo: '677', nombre: 'Caja Popular Mexicana S.C. de A.P. de R.L. de C.V.', nombreCorto: 'CAJA POPULAR MEXICANA' },
  { codigo: '679', nombre: 'Financiera Nacional de Desarrollo Agropecuario Rural Forestal y Pesquero', nombreCorto: 'FND' },
  { codigo: '684', nombre: 'Punto Casa de Cambio S.A. de C.V.', nombreCorto: 'PUNTO CASA DE CAMBIO' },
  { codigo: '685', nombre: 'Intercam Casa de Cambio S.A. de C.V.', nombreCorto: 'INTERCAM CASA DE CAMBIO' },
  { codigo: '686', nombre: 'Banco Ve Por Mas S.A.', nombreCorto: 'VE POR MAS' },
  { codigo: '687', nombre: 'Transferencias Bancarias México S.A. de C.V.', nombreCorto: 'TBM' },
  { codigo: '689', nombre: 'Libertad Servicios Financieros S.A. de C.V.', nombreCorto: 'LIBERTAD' },
  { codigo: '901', nombre: 'Banco Nacional de México S.A. (Cuenta concentradora)', nombreCorto: 'BANAMEX CONCENTRADORA' },
  { codigo: '902', nombre: 'BBVA México S.A. (Cuenta concentradora)', nombreCorto: 'BBVA CONCENTRADORA' }
];

export const obtenerBancoPorCodigo = (codigo: string): Banco | undefined => {
  return bancosMexico.find(banco => banco.codigo === codigo);
};

export const obtenerBancoPorNombre = (nombre: string): Banco | undefined => {
  return bancosMexico.find(banco => 
    banco.nombre.toLowerCase().includes(nombre.toLowerCase()) ||
    banco.nombreCorto.toLowerCase().includes(nombre.toLowerCase())
  );
};

export const obtenerOpcionesBancos = () => {
  return bancosMexico.map(banco => ({
    valor: banco.codigo,
    etiqueta: banco.nombreCorto
  }));
};