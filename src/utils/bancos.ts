// Utilidades para manejo de información bancaria
import { bancosMexico, obtenerBancoPorCodigo } from '@/data/bancos';

/**
 * Convierte un código de banco a su nombre corto
 * @param codigoBanco - Código numérico del banco (puede ser string o número)
 * @returns Nombre corto del banco o el código original si no se encuentra
 */
export function obtenerNombreBanco(codigoBanco: string | number): string {
  if (!codigoBanco) return 'No especificado';
  
  const codigo = String(codigoBanco);
  
  // Buscar el banco por código usando la función de bancos.ts
  const banco = obtenerBancoPorCodigo(codigo);
  if (banco) {
    return banco.nombreCorto;
  }

  // Si es un código de 1-2 dígitos, agregar ceros a la izquierda y buscar de nuevo
  const codigoNormalizado = codigo.padStart(3, '0');
  const bancoNormalizado = obtenerBancoPorCodigo(codigoNormalizado);
  if (bancoNormalizado) {
    return bancoNormalizado.nombreCorto;
  }

  // Fallback: buscar por nombre corto directamente en caso de que se haya guardado el nombre
  const bancoPorNombre = bancosMexico.find(b => 
    b.nombreCorto.toLowerCase() === codigo.toLowerCase() ||
    b.nombre.toLowerCase().includes(codigo.toLowerCase())
  );
  if (bancoPorNombre) {
    return bancoPorNombre.nombreCorto;
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
  
  // Usar la función de bancos.ts para verificar
  const banco = obtenerBancoPorCodigo(codigo) || obtenerBancoPorCodigo(codigo.padStart(3, '0'));
  return !!banco;
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