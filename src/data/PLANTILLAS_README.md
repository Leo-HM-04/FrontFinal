# 📋 Sistema de Plantillas de Solicitudes

> **Última actualización:** 08 de Octubre 2025  
> **Versión:** 2.0.0  
> **Archivo principal:** `plantillas.ts`

## 📚 Índice

1. [Introducción](#introducción)
2. [Estructura de Plantillas](#estructura-de-plantillas)
3. [Plantillas Disponibles](#plantillas-disponibles)
4. [Guía de Uso](#guía-de-uso)
5. [Agregar Nuevas Plantillas](#agregar-nuevas-plantillas)
6. [API y Funciones Utilitarias](#api-y-funciones-utilitarias)

---

## 🎯 Introducción

Este sistema proporciona plantillas predefinidas para la creación de solicitudes de pago en la plataforma. Cada plantilla define:

- ✅ Campos requeridos y opcionales
- ✅ Validaciones automáticas
- ✅ Estructura de datos
- ✅ Configuración de archivos adjuntos
- ✅ Metadatos y versioning

---

## 🏗️ Estructura de Plantillas

### Anatomía de una Plantilla

```typescript
{
  id: string,                    // Identificador único
  nombre: string,                // Nombre descriptivo
  descripcion: string,           // Descripción detallada
  version: string,               // Versión semántica (v2.0.0)
  activa: boolean,               // Estado de disponibilidad
  icono: LucideIcon,            // Ícono visual (Lucide React)
  color: string,                // Color temático
  categoria: string,            // Agrupación lógica
  secciones: Seccion[],         // Secciones con campos
  configuracion: Config,        // Config de archivos
  metadatos: Metadata           // Info adicional
}
```

### Categorías de Campos

| Tipo | Descripción | Ejemplo |
|------|-------------|---------|
| `texto` | Campo de texto simple | Nombre, Asunto |
| `textarea` | Texto multilínea | Descripción, Comentarios |
| `numero` | Valor numérico | Cantidad, Monto |
| `moneda` | Valor monetario formateado | $56,250.36 |
| `fecha` | Selector de fecha | Fecha límite |
| `select` | Lista desplegable | Banco, Moneda |
| `radio` | Opciones excluyentes | Tipo de cuenta |
| `archivo` | Carga de archivos | PDF, Excel, Imágenes |
| `banco` | Selector de bancos mexicanos | BBVA, Santander |
| `cuenta_clabe` | CLABE/Cuenta bancaria | 18 o 10 dígitos |

---

## 📦 Plantillas Disponibles

### 🏢 Pagos Corporativos

#### 1. **SOLICITUD DE PAGO TARJETAS N09 Y TOKA**
- **ID:** `tarjetas-n09-toka`
- **Color:** 🔵 Azul
- **Propósito:** Pagos a proveedores de tarjetas N09 y fondeo TOKA
- **Campos clave:**
  - Asunto (Radio): PAGO_PROVEEDOR_N09 / TOKA_FONDEO_AVIT
  - Cliente
  - Beneficiario
  - Datos bancarios (CLABE/Cuenta)
  - Monto y moneda
  - Archivos adjuntos (PDF, Excel, imágenes)

#### 2. **SOLICITUD DE PAGO TARJETAS TUKASH**
- **ID:** `tarjetas-tukash`
- **Color:** 🟢 Verde
- **Propósito:** Pagos y fondeo exclusivo TUKASH
- **Campos clave:**
  - Cliente
  - Beneficiario
  - Número de tarjeta (13-16 dígitos)
  - Monto total cliente
  - Monto total TUKASH

---

### 🏛️ Pagos Fiscales e IMSS

#### 3. **PAGO SUA INTERNAS**
- **ID:** `pago-sua-internas`
- **Color:** 🟣 Púrpura
- **Propósito:** Pagos de impuestos IMSS para empresas internas
- **Campos clave:**
  - Asunto (texto libre)
  - Empresa (Se paga por)
  - Monto conforme a SIPARE
  - Fecha límite
  - Línea de captura IMSS (validación alfanumérica)
  - Archivos ZIP (6 documentos PDF)

#### 4. **PAGO SUA FRENSHETSI**
- **ID:** `pago-sua-frenshetsi`
- **Color:** 🔷 Índigo
- **Propósito:** Pagos IMSS específicos para FRENSHETSI
- **Diferencia:** Empresa fija (FRENSHETSI) + campo Cliente adicional

---

### 💰 Comisiones y Compensaciones

#### 5. **PAGO COMISIONES**
- **ID:** `pago-comisiones`
- **Color:** 💵 Amarillo
- **Propósito:** Pagos de comisiones a empleados/colaboradores
- **Campos clave:**
  - Cliente generador de comisión
  - Beneficiario (Quien recibe)
  - Cuenta/CLABE (Selector dinámico)
  - Banco destino
  - Archivos: 2 Excel + 1 PDF comprobante

---

### 🛡️ Seguros y Pólizas

#### 6. **PAGO POLIZAS**
- **ID:** `pago-polizas-gnp`
- **Color:** 🔴 Rojo (Shield)
- **Propósito:** Pagos de pólizas a aseguradoras
- **Características especiales:**
  - Selector de aseguradora: GNP, ZURICH, AXA, Seguros Monterrey, Qualitas, Allianz
  - **Métodos de pago dinámicos** (máximo 4)
  - Empresa emisora del pago
- **Archivos:** 2-3 PDF (datos de pago + carátula póliza)

---

### 🔄 Regresos y Reembolsos

#### 7. **REGRESOS EN TRANSFERENCIA**
- **ID:** `regresos-transferencia`
- **Color:** 🔵 Azul (ArrowLeftRight)
- **Propósito:** Devoluciones vía transferencia bancaria
- **Características especiales:**
  - **Cuentas dinámicas** (máximo 3)
  - Datos bancarios completos por cuenta

#### 8. **REGRESOS EN EFECTIVO**
- **ID:** `regresos-efectivo`
- **Color:** 💵 Verde (Banknote)
- **Propósito:** Devoluciones en efectivo con viáticos
- **Campos clave:**
  - Cliente
  - Persona que recibe
  - Fecha de entrega
  - Monto efectivo
  - Viáticos (opcional)
  - Elementos adicionales: Tarjetas, tokens, cheques de viaje

---

## 🚀 Guía de Uso

### Importar Plantillas

```typescript
import {
  plantillaTarjetasN09Toka,
  obtenerPlantillaPorId,
  obtenerPlantillasActivas
} from '@/data/plantillas';
```

### Obtener Plantilla Específica

```typescript
// Por ID
const plantilla = obtenerPlantillaPorId('tarjetas-n09-toka');

if (plantilla) {
  console.log(`Nombre: ${plantilla.nombre}`);
  console.log(`Versión: ${plantilla.version}`);
}
```

### Listar Plantillas Activas

```typescript
const activas = obtenerPlantillasActivas();

activas.forEach(plantilla => {
  console.log(`${plantilla.nombre} - ${plantilla.categoria}`);
});
```

### Validar Disponibilidad

```typescript
import { validarPlantillaActiva } from '@/data/plantillas';

if (validarPlantillaActiva('pago-comisiones')) {
  // Procesar solicitud
} else {
  console.error('Plantilla no disponible');
}
```

### Filtrar por Categoría

```typescript
import { obtenerPlantillasPorCategoria } from '@/data/plantillas';

const pagosFiscales = obtenerPlantillasPorCategoria('Pagos Fiscales');
```

### Estadísticas del Sistema

```typescript
import { obtenerEstadisticasPlantillas } from '@/data/plantillas';

const stats = obtenerEstadisticasPlantillas();
console.log(`Total: ${stats.total}`);
console.log(`Activas: ${stats.activas}`);
console.log(`Categorías: ${stats.categorias.join(', ')}`);
```

---

## ➕ Agregar Nuevas Plantillas

### Paso 1: Definir la Plantilla

```typescript
/**
 * Plantilla: MI NUEVA PLANTILLA
 * 
 * Propósito: Descripción del propósito
 * Departamentos: Lista de departamentos
 * Características: Características especiales
 */
export const plantillaMiNueva: PlantillaSolicitud = {
  id: 'mi-nueva-plantilla',
  nombre: 'MI NUEVA PLANTILLA',
  descripcion: 'Descripción detallada',
  version: '1.0.0',
  activa: true,
  icono: FileText, // Import from lucide-react
  color: 'blue',
  categoria: 'Mi Categoría',
  secciones: [
    // Definir secciones y campos
  ],
  configuracion: {
    permiteArchivosMultiples: true,
    tiposArchivosPermitidos: ['.pdf', '.xlsx'],
    tamanoMaximoArchivo: 10 * 1024 * 1024, // 10MB
    mostrarProgreso: true
  },
  metadatos: {
    creadoPor: 'Sistema',
    fechaCreacion: '2025-10-08T00:00:00.000Z',
    fechaModificacion: new Date().toISOString(),
    usosFrecuentes: 0
  }
};
```

### Paso 2: Agregar al Array

```typescript
export const plantillasDisponibles: PlantillaSolicitud[] = [
  // ... plantillas existentes
  plantillaMiNueva // ← Agregar aquí
];
```

### Paso 3: Actualizar Documentación

- Actualizar este README
- Incrementar versión si es cambio mayor
- Documentar campos especiales

---

## 📖 API y Funciones Utilitarias

### Funciones Principales

| Función | Parámetros | Retorno | Descripción |
|---------|-----------|---------|-------------|
| `obtenerPlantillaPorId()` | `id: string` | `PlantillaSolicitud \| null` | Busca plantilla por ID |
| `obtenerPlantillasActivas()` | - | `PlantillaSolicitud[]` | Lista plantillas activas |
| `obtenerTodasLasPlantillas()` | - | `PlantillaSolicitud[]` | Lista todas las plantillas |
| `obtenerPlantillasInactivas()` | - | `PlantillaSolicitud[]` | Lista plantillas inactivas |
| `obtenerPlantillasPorCategoria()` | `categoria: string` | `PlantillaSolicitud[]` | Filtra por categoría |
| `validarPlantillaActiva()` | `id: string` | `boolean` | Valida si existe y está activa |
| `obtenerEstadisticasPlantillas()` | - | `Object` | Estadísticas del sistema |

---

## 🔒 Validaciones Comunes

### Validación de CLABE/Cuenta

```typescript
validaciones: {
  requerido: true,
  soloNumeros: true,
  minLength: 10,
  maxLength: 18,
  mensaje: 'CLABE: 16-18 dígitos / Cuenta: 8-10 dígitos'
}
```

### Validación de Monto

```typescript
validaciones: {
  requerido: true,
  minimo: 0.01,
  mensaje: 'El monto debe ser mayor a 0'
}
```

### Validación de Línea de Captura IMSS

```typescript
validaciones: {
  requerido: true,
  patron: '^[A-Z0-9-]+$',
  minLength: 10,
  maxLength: 200,
  mensaje: 'Solo letras mayúsculas, números y guiones'
}
```

---

## 📊 Configuración de Archivos

### Configuración Estándar

```typescript
configuracion: {
  permiteArchivosMultiples: true,
  tiposArchivosPermitidos: [
    '.pdf', '.jpg', '.jpeg', '.png', 
    '.xlsx', '.xls', '.doc', '.docx'
  ],
  tamanoMaximoArchivo: 10 * 1024 * 1024, // 10MB
  mostrarProgreso: true
}
```

### Configuración para ZIP (IMSS)

```typescript
configuracion: {
  permiteArchivosMultiples: true,
  tiposArchivosPermitidos: ['.pdf', '.zip', '.jpg', '.png'],
  tamanoMaximoArchivo: 25 * 1024 * 1024, // 25MB
  mostrarProgreso: true
}
```

---

## 🎨 Colores por Categoría

| Categoría | Color | Uso |
|-----------|-------|-----|
| Pagos Corporativos | 🔵 `blue` | N09, TOKA |
| Tarjetas | 🟢 `green` | TUKASH |
| Pagos Fiscales | 🟣 `purple` | SUA INTERNAS |
| IMSS Específico | 🔷 `indigo` | SUA FRENSHETSI |
| Comisiones | 💵 `yellow` | Pagos comisiones |
| Seguros | 🔴 `red` | Pólizas |
| Regresos | 🔵 `blue` | Transferencias/Efectivo |

---

## 🔄 Control de Versiones

### Versionado Semántico

- **MAYOR.MENOR.PARCHE** (ej. `2.0.0`)
  - **MAYOR:** Cambios incompatibles en la API
  - **MENOR:** Nueva funcionalidad compatible
  - **PARCHE:** Correcciones de errores

### Historial de Versiones

| Versión | Fecha | Cambios |
|---------|-------|---------|
| `2.0.0` | 08/10/2025 | ✨ Mejoras de documentación, íconos Lucide, funciones utilitarias |
| `1.0.0` | - | 🎉 Versión inicial del sistema |

---

## 📞 Soporte y Mantenimiento

### Contacto

- **Equipo:** Desarrollo Backend/Frontend
- **Archivo:** `src/data/plantillas.ts`
- **Tipos:** `src/types/plantillas.ts`

### Mejores Prácticas

1. ✅ **Siempre validar** plantillas antes de procesar solicitudes
2. ✅ **Usar funciones utilitarias** en lugar de acceso directo al array
3. ✅ **Mantener versiones actualizadas** en metadatos
4. ✅ **Documentar cambios** en este README
5. ✅ **Probar validaciones** antes de deployment

---

## 📝 Notas Importantes

⚠️ **IMPORTANTE:** 
- Las plantillas inactivas no aparecen en el selector de usuario
- Los cambios en plantillas activas pueden afectar solicitudes existentes
- Siempre incrementar versión al hacer cambios significativos

📌 **RECORDATORIO:**
- Los íconos usan Lucide React (no emojis en código)
- Las fechas de creación son fijas, las de modificación se actualizan automáticamente
- El tamaño máximo de archivos es 10MB (25MB para ZIP)

---

**Última revisión:** 08 de Octubre 2025  
**Mantenido por:** Equipo de Desarrollo Bechapra
