# Plantilla: Pago de Servicios Internos

## Información General

- **ID**: `pago-servicios-internos`
- **Nombre**: PAGO DE SERVICIOS INTERNOS
- **Versión**: 1.0.0
- **Estado**: Activa
- **Categoría**: Pagos Internos
- **Icono**: Settings (Configuración)
- **Color**: Verde

## Descripción

Esta plantilla está diseñada para gestionar pagos de servicios internos entre departamentos de la empresa. Es una plantilla simplificada que permite flexibilidad en la descripción del servicio y documentación de soporte.

## Campos de la Plantilla

### Sección: Información del Pago

#### 1. Descripción del Pago *(Obligatorio)*
- **Tipo**: Textarea (texto largo)
- **Validaciones**: 
  - Mínimo 20 caracteres
  - Máximo 1000 caracteres
  - Campo obligatorio
- **Propósito**: Descripción detallada del servicio interno a pagar
- **Ejemplo**: "Servicio de consultoría interna del departamento de TI para implementación de sistema de inventarios en el departamento de operaciones. Incluye análisis de requerimientos, diseño de arquitectura y capacitación del personal."

#### 2. Monto del Pago *(Obligatorio)*
- **Tipo**: Número (formato moneda)
- **Validaciones**: 
  - Debe ser mayor a 0.01
  - Campo obligatorio
- **Formato**: Moneda mexicana (MXN)
- **Ejemplo**: $15,000.00

#### 3. Fecha Límite de Pago *(Obligatorio)*
- **Tipo**: Fecha
- **Validaciones**: 
  - Campo obligatorio
  - Debe ser una fecha futura
- **Propósito**: Fecha límite para realizar el pago
- **Recomendación**: Mínimo 3 días de anticipación

### Sección: Documentación de Soporte

#### 4. Documentos de Soporte *(Opcional)*
- **Tipo**: Archivos múltiples
- **Límites**: 
  - Máximo 10 archivos
  - Tamaño máximo por archivo: 25MB
- **Formatos permitidos**: 
  - PDF (.pdf)
  - Word (.doc, .docx)
  - Excel (.xls, .xlsx)
  - Imágenes (.jpg, .jpeg, .png)
- **Propósito**: Documentos que respalden la solicitud de pago

## Casos de Uso Típicos

### 1. Servicios de Consultoría Interna
- Asesorías entre departamentos
- Servicios especializados internos
- Transferencia de conocimientos

### 2. Servicios de TI Internos
- Desarrollo de sistemas internos
- Soporte técnico especializado
- Implementación de tecnologías

### 3. Servicios Administrativos
- Servicios de recursos humanos
- Servicios contables internos
- Servicios legales internos

### 4. Capacitación y Entrenamiento
- Programas de capacitación internos
- Workshops especializados
- Transferencia de habilidades

## Departamentos Objetivo

Esta plantilla puede ser utilizada por todos los departamentos:
- Administración
- Finanzas
- Recursos Humanos
- TI
- Marketing
- Operaciones
- Legal
- Tesorería

## Configuración Específica

### Archivos Permitidos
- **Tipos**: PDF, DOC, DOCX, XLS, XLSX, JPG, JPEG, PNG
- **Tamaño máximo**: 25MB por archivo
- **Cantidad máxima**: 10 archivos por solicitud

### Validaciones Especiales
- **Descripción**: Entre 20 y 1000 caracteres
- **Monto**: Mayor a $0.01 MXN
- **Fecha límite**: Debe ser futura

## Flujo de Aprobación

1. **Solicitante** completa la plantilla con toda la información requerida
2. **Aprobador** revisa la solicitud y los documentos de soporte
3. **Pagador** procesa el pago según la fecha límite establecida

## Ventajas de esta Plantilla

### Simplicidad
- Solo 4 campos principales
- Interfaz limpia y fácil de usar
- Proceso rápido de llenado

### Flexibilidad
- Descripción libre del servicio
- Documentos opcionales
- Adaptable a cualquier tipo de servicio interno

### Control
- Validaciones de monto y fecha
- Límites en documentos
- Trazabilidad completa

## Mejores Prácticas

### Para Solicitantes
1. **Descripción detallada**: Incluir departamento solicitante, tipo de servicio, alcance y cualquier detalle relevante
2. **Documentación**: Adjuntar cotizaciones, órdenes de servicio o cualquier documento que respalde la solicitud
3. **Fecha límite realista**: Considerar tiempos de aprobación y procesamiento

### Para Aprobadores
1. **Verificar descripción**: Asegurar que el servicio esté bien definido
2. **Validar monto**: Confirmar que el monto sea razonable para el servicio
3. **Revisar documentos**: Verificar que la documentación sea suficiente

### Para Pagadores
1. **Confirmar fecha límite**: Asegurar que se puede cumplir con la fecha
2. **Verificar aprobación**: Confirmar que la solicitud esté debidamente aprobada
3. **Documentar pago**: Mantener registro del pago realizado

## Notas Técnicas

- **Archivo de plantilla**: `src/data/plantillas.ts`
- **Tipos específicos**: `src/types/plantillaServiciosInternos.ts`
- **ID único**: `pago-servicios-internos`
- **Última actualización**: 27 de Octubre 2025

## Soporte y Mantenimiento

Esta plantilla es mantenida por el equipo de desarrollo del sistema. Para reportar problemas o sugerir mejoras, contactar al administrador del sistema.