import { useState, useCallback } from 'react';
import { PlantillaSolicitud, DatosFormularioPlantilla, EstadoPlantilla, CampoPlantilla } from '@/types/plantillas';

// Hook personalizado para manejar plantillas de solicitudes
export const usePlantillaSolicitud = () => {
  const [estado, setEstado] = useState<EstadoPlantilla>({
    plantillaSeleccionada: null,
    datos: {},
    errores: {},
    camposVisibles: new Set(),
    cargando: false
  });

  // Función para seleccionar una plantilla
  const seleccionarPlantilla = useCallback((plantilla: PlantillaSolicitud | null) => {
    setEstado(prev => {
      if (!plantilla) {
        return {
          plantillaSeleccionada: null,
          datos: {},
          errores: {},
          camposVisibles: new Set(),
          cargando: false
        };
      }

      // Inicializar datos con valores por defecto
      const datosIniciales: DatosFormularioPlantilla = {};
      const camposVisiblesIniciales = new Set<string>();

      plantilla.secciones.forEach(seccion => {
        seccion.campos.forEach(campo => {
          // Establecer valor por defecto
          if (campo.valorPorDefecto !== undefined) {
            datosIniciales[campo.id] = campo.valorPorDefecto;
          }

          // Determinar visibilidad inicial
          if (!campo.dependencias || campo.dependencias.length === 0) {
            camposVisiblesIniciales.add(campo.id);
          }
        });
      });

      // Evaluar dependencias iniciales con valores por defecto
      plantilla.secciones.forEach(seccion => {
        seccion.campos.forEach(campo => {
          if (campo.dependencias && campo.dependencias.length > 0) {
            campo.dependencias.forEach(dependencia => {
              const valorCumple = datosIniciales[dependencia.campo] === dependencia.valor;
              
              if (dependencia.accion === 'mostrar' && valorCumple) {
                camposVisiblesIniciales.add(campo.id);
              } else if (dependencia.accion === 'ocultar' && valorCumple) {
                camposVisiblesIniciales.delete(campo.id);
              }
            });
          }
        });
      });

      return {
        plantillaSeleccionada: plantilla,
        datos: datosIniciales,
        errores: {},
        camposVisibles: camposVisiblesIniciales,
        cargando: false
      };
    });
  }, []);

  // Función para actualizar un campo
  const actualizarCampo = useCallback((campoId: string, valor: unknown) => {
    setEstado(prev => {
      const nuevosDatos = { ...prev.datos, [campoId]: valor };
      const nuevosErrores = { ...prev.errores };
      
      // Limpiar error del campo si existe
      delete nuevosErrores[campoId];

      // Actualizar visibilidad de campos dependientes
      const nuevaCamposVisibles = new Set(prev.camposVisibles);
      
      if (prev.plantillaSeleccionada) {
        prev.plantillaSeleccionada.secciones.forEach(seccion => {
          seccion.campos.forEach(campo => {
            if (campo.dependencias) {
              campo.dependencias.forEach(dependencia => {
                if (dependencia.campo === campoId) {
                  const valorCumple = nuevosDatos[dependencia.campo] === dependencia.valor;
                  
                  if (dependencia.accion === 'mostrar' && valorCumple) {
                    nuevaCamposVisibles.add(campo.id);
                  } else if (dependencia.accion === 'ocultar' && valorCumple) {
                    nuevaCamposVisibles.delete(campo.id);
                    // Limpiar valor del campo oculto
                    delete nuevosDatos[campo.id];
                  } else if (dependencia.accion === 'mostrar' && !valorCumple) {
                    nuevaCamposVisibles.delete(campo.id);
                    // Limpiar valor del campo oculto
                    delete nuevosDatos[campo.id];
                  }
                }
              });
            }
          });
        });
      }

      return {
        ...prev,
        datos: nuevosDatos,
        errores: nuevosErrores,
        camposVisibles: nuevaCamposVisibles
      };
    });
  }, []);

  // Función para validar un campo
  const validarCampo = useCallback((campo: CampoPlantilla, valor: unknown): string | null => {
    if (!campo.validaciones) return null;

    const { requerido, minLength, maxLength, longitudExacta, soloNumeros, patron, mensaje } = campo.validaciones;

    // Validar campo requerido
    if (requerido && (!valor || (typeof valor === 'string' && valor.trim() === ''))) {
      return mensaje || `${campo.etiqueta} es requerido`;
    }

    // Si el campo está vacío y no es requerido, no validar más
    if (!valor || (typeof valor === 'string' && valor.trim() === '')) {
      return null;
    }

    const valorStr = String(valor);

    // Validar solo números
    if (soloNumeros && !/^\d+$/.test(valorStr)) {
      return mensaje || `${campo.etiqueta} debe contener solo números`;
    }

    // Validar longitud exacta
    if (longitudExacta && valorStr.length !== longitudExacta) {
      return mensaje || `${campo.etiqueta} debe tener exactamente ${longitudExacta} caracteres`;
    }

    // Validar longitud mínima
    if (minLength && valorStr.length < minLength) {
      return mensaje || `${campo.etiqueta} debe tener al menos ${minLength} caracteres`;
    }

    // Validar longitud máxima
    if (maxLength && valorStr.length > maxLength) {
      return mensaje || `${campo.etiqueta} debe tener máximo ${maxLength} caracteres`;
    }

    // Validar patrón
    if (patron && !new RegExp(patron).test(valorStr)) {
      return mensaje || `${campo.etiqueta} tiene un formato inválido`;
    }

    // Validaciones específicas por tipo de campo
    if (campo.tipo === 'cuenta_clabe') {
      const tipoCuenta = estado.datos['tipo_cuenta'];
      if (tipoCuenta === 'CLABE') {
        if (valorStr.length !== 16 && valorStr.length !== 18) {
          return 'La CLABE debe tener 16 o 18 dígitos';
        }
      }
      if (tipoCuenta === 'CUENTA') {
        if (valorStr.length < 8 || valorStr.length > 10) {
          return 'El número de cuenta debe tener entre 8 y 10 dígitos';
        }
      }
    }

    if (campo.tipo === 'moneda') {
      const numeroLimpio = valorStr.replace(/[,$]/g, '');
      if (!/^\d+(\.\d{1,2})?$/.test(numeroLimpio)) {
        return 'Ingrese un monto válido';
      }
      if (parseFloat(numeroLimpio) <= 0) {
        return 'El monto debe ser mayor a 0';
      }
    }

    return null;
  }, [estado.datos]);

  // Función para validar todo el formulario
  const validarFormulario = useCallback((): boolean => {
    if (!estado.plantillaSeleccionada) return false;

    const nuevosErrores: { [key: string]: string } = {};
    let formularioValido = true;

    estado.plantillaSeleccionada.secciones.forEach(seccion => {
      seccion.campos.forEach(campo => {
        // Solo validar campos visibles
        if (estado.camposVisibles.has(campo.id)) {
          const error = validarCampo(campo, estado.datos[campo.id]);
          if (error) {
            nuevosErrores[campo.id] = error;
            formularioValido = false;
          }
        }
      });
    });

    setEstado(prev => ({
      ...prev,
      errores: nuevosErrores
    }));

    return formularioValido;
  }, [estado.plantillaSeleccionada, estado.camposVisibles, estado.datos, validarCampo]);

  // Función para resetear el formulario
  const resetearFormulario = useCallback(() => {
    if (estado.plantillaSeleccionada) {
      seleccionarPlantilla(estado.plantillaSeleccionada);
    }
  }, [estado.plantillaSeleccionada, seleccionarPlantilla]);

  // Función para obtener datos para envío
  const obtenerDatosParaEnvio = useCallback(() => {
    if (!estado.plantillaSeleccionada) return null;

    const datosParaEnvio: Record<string, unknown> = {
      plantilla_id: estado.plantillaSeleccionada.id,
      plantilla_nombre: estado.plantillaSeleccionada.nombre,
      plantilla_version: estado.plantillaSeleccionada.version,
      datos_formulario: {}
    };

    // Solo incluir datos de campos visibles
    estado.plantillaSeleccionada.secciones.forEach(seccion => {
      seccion.campos.forEach(campo => {
        if (estado.camposVisibles.has(campo.id) && estado.datos[campo.id] !== undefined) {
          (datosParaEnvio.datos_formulario as Record<string, unknown>)[campo.id] = estado.datos[campo.id];
        }
      });
    });

    return datosParaEnvio;
  }, [estado]);

  return {
    estado,
    seleccionarPlantilla,
    actualizarCampo,
    validarFormulario,
    resetearFormulario,
    obtenerDatosParaEnvio,
    validarCampo
  };
};
