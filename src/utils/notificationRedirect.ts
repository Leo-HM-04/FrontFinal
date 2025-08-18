import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

// Tipos para el redireccionamiento
export interface NotificacionWithRedirect {
  id_notificacion: number;
  mensaje: string;
  leida: boolean;
  fecha_creacion: string;
  tipo: string;
  entidad?: string; // 'solicitud', 'viatico', 'recurrente', 'usuario'
  entidad_id?: number;
  rol?: string; // 'solicitante', 'aprobador', 'pagador_banca', 'admin_general'
  accion?: string; // 'creada', 'aprobada', 'rechazada', 'pagada', 'vencida'
}

// Configuración de rutas por rol y entidad
const REDIRECT_ROUTES = {
  solicitante: {
    solicitud: {
      base: '/dashboard/solicitante/mis-solicitudes',
      actions: {
        creada: (id: number) => `/dashboard/solicitante/mis-solicitudes?highlight=${id}&openModal=true`,
        aprobada: (id: number) => `/dashboard/solicitante/mis-solicitudes?highlight=${id}&openModal=true`,
        autorizada: (id: number) => `/dashboard/solicitante/mis-solicitudes?highlight=${id}&openModal=true`,
        rechazada: (id: number) => `/dashboard/solicitante/mis-solicitudes?highlight=${id}&openModal=true`,
        pagada: (id: number) => `/dashboard/solicitante/mis-solicitudes?highlight=${id}&openModal=true`,
        default: (id: number) => `/dashboard/solicitante/mis-solicitudes?highlight=${id}`
      }
    },
    viatico: {
      base: '/dashboard/solicitante/mis-viaticos',
      actions: {
        aprobado: (id: number) => `/dashboard/solicitante/mis-viaticos?highlight=${id}`,
        rechazado: (id: number) => `/dashboard/solicitante/mis-viaticos?highlight=${id}`,
        pagado: (id: number) => `/dashboard/solicitante/mis-viaticos?highlight=${id}`,
        default: (id: number) => `/dashboard/solicitante/mis-viaticos?highlight=${id}`
      }
    },
    recurrente: {
      base: '/dashboard/solicitante/mis-recurrentes',
      actions: {
        aprobada: (id: number) => `/dashboard/solicitante/mis-recurrentes?highlight=${id}`,
        rechazada: (id: number) => `/dashboard/solicitante/mis-recurrentes?highlight=${id}`,
        default: (id: number) => `/dashboard/solicitante/mis-recurrentes?highlight=${id}`
      }
    }
  },
  aprobador: {
    solicitud: {
      base: '/dashboard/aprobador/solicitudes/pendientes',
      actions: {
        creada: (id: number) => `/dashboard/aprobador/solicitudes/pendientes?highlight=${id}`,
        pendiente: (id: number) => `/dashboard/aprobador/solicitudes/pendientes?highlight=${id}`,
        default: (id: number) => `/dashboard/aprobador/solicitudes/historial?highlight=${id}`
      }
    },
    viatico: {
      base: '/dashboard/aprobador/viaticos',
      actions: {
        creado: (id: number) => `/dashboard/aprobador/viaticos?highlight=${id}&filter=pendientes`,
        pendiente: (id: number) => `/dashboard/aprobador/viaticos?highlight=${id}&filter=pendientes`,
        default: (id: number) => `/dashboard/aprobador/viaticos?highlight=${id}`
      }
    },
    recurrente: {
      base: '/dashboard/aprobador/recurrentes',
      actions: {
        creada: (id: number) => `/dashboard/aprobador/recurrentes?highlight=${id}&filter=pendientes`,
        pendiente: (id: number) => `/dashboard/aprobador/recurrentes?highlight=${id}&filter=pendientes`,
        default: (id: number) => `/dashboard/aprobador/recurrentes?highlight=${id}`
      }
    }
  },
  pagador_banca: {
    solicitud: {
      base: '/dashboard/pagador/pagos/pendientes',
      actions: {
        autorizada: (id: number) => `/dashboard/pagador/pagos/pendientes?highlight=${id}`,
        aprobada: (id: number) => `/dashboard/pagador/pagos/pendientes?highlight=${id}`,
        default: (id: number) => `/dashboard/pagador/pagos/historial?highlight=${id}`
      }
    },
    viatico: {
      base: '/dashboard/pagador/viaticos',
      actions: {
        autorizado: (id: number) => `/dashboard/pagador/viaticos?highlight=${id}&filter=pendientes`,
        aprobado: (id: number) => `/dashboard/pagador/viaticos?highlight=${id}&filter=pendientes`,
        default: (id: number) => `/dashboard/pagador/viaticos?highlight=${id}`
      }
    },
    recurrente: {
      base: '/dashboard/pagador/recurrentes',
      actions: {
        necesita_comprobante: (id: number) => `/dashboard/pagador/pagos/subir-comprobante-recurrente?highlight=${id}`,
        aprobada: (id: number) => `/dashboard/pagador/pagos/subir-comprobante-recurrente?highlight=${id}`,
        default: (id: number) => `/dashboard/pagador/recurrentes?highlight=${id}`
      }
    }
  },
  admin_general: {
    solicitud: {
      base: '/dashboard/admin/solicitudes',
      actions: {
        default: (id: number) => `/dashboard/admin/solicitudes?highlight=${id}`
      }
    },
    viatico: {
      base: '/dashboard/admin/solicitudes', // Los viáticos se manejan como solicitudes en admin
      actions: {
        default: (id: number) => `/dashboard/admin/solicitudes?highlight=${id}&type=viatico`
      }
    },
    recurrente: {
      base: '/dashboard/admin/recurrentes',
      actions: {
        default: (id: number) => `/dashboard/admin/recurrentes?highlight=${id}`
      }
    },
    usuario: {
      base: '/dashboard/admin/usuarios',
      actions: {
        default: (id: number) => `/dashboard/admin/usuarios?highlight=${id}`
      }
    }
  }
} as const;

// Función principal para redirigir según la notificación
export const redirectToEntity = (
  notification: NotificacionWithRedirect,
  router: AppRouterInstance,
  onClose?: () => void
) => {
  const { entidad, entidad_id, rol, accion } = notification;

  // Cerrar el panel de notificaciones si se proporciona
  if (onClose) {
    onClose();
  }

  // Validar que tenemos la información necesaria
  if (!entidad || !entidad_id || !rol) {
    console.warn('Notificación sin información de redireccionamiento completa:', notification);
    return;
  }

  // Obtener la configuración de rutas para el rol
  const roleRoutes = REDIRECT_ROUTES[rol as keyof typeof REDIRECT_ROUTES];
  if (!roleRoutes) {
    console.warn(`Rol no soportado para redireccionamiento: ${rol}`);
    return;
  }

  // Obtener la configuración de la entidad
  const entityRoutes = roleRoutes[entidad as keyof typeof roleRoutes];
  if (!entityRoutes) {
    console.warn(`Entidad no soportada para el rol ${rol}: ${entidad}`);
    return;
  }

  // Obtener la URL específica según la acción
  let targetUrl: string;
  if (accion && entityRoutes.actions[accion as keyof typeof entityRoutes.actions]) {
    targetUrl = entityRoutes.actions[accion as keyof typeof entityRoutes.actions](entidad_id);
  } else if (entityRoutes.actions.default) {
    targetUrl = entityRoutes.actions.default(entidad_id);
  } else {
    targetUrl = `${entityRoutes.base}?highlight=${entidad_id}`;
  }

  // Navegar a la URL
  router.push(targetUrl);

  // Log para debugging
  console.log(`Redirigiendo ${rol} a ${targetUrl} para ${entidad} ${entidad_id} (${accion || 'default'})`);
};

// Función para marcar notificación como leída
export const markNotificationAsRead = async (notificationId: number) => {
  try {
    const token = localStorage.getItem('auth_token') || 
                  document.cookie.split('; ').find(row => row.startsWith('auth_token='))?.split('=')[1];
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "/api"}/notificaciones/${notificationId}/leer`, {
      method: 'PUT',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Error al marcar notificación como leída');
    }

    return true;
  } catch (error) {
    console.error('Error marcando notificación como leída:', error);
    return false;
  }
};

// Función helper para extraer información de redireccionamiento del mensaje
export const extractRedirectInfo = (mensaje: string): { accion?: string; entidad?: string } => {
  // Patterns para extraer información del mensaje
  const patterns = {
    solicitud: {
      creada: /nueva solicitud|solicitud creada|solicitud enviada/i,
      aprobada: /solicitud aprobada|solicitud autorizada/i,
      rechazada: /solicitud rechazada|solicitud denegada/i,
      pagada: /solicitud pagada|pago realizado/i
    },
    viatico: {
      aprobado: /viático aprobado|viático autorizado/i,
      rechazado: /viático rechazado|viático denegado/i,
      pagado: /viático pagado/i
    },
    recurrente: {
      aprobada: /recurrente aprobada|plantilla aprobada/i,
      rechazada: /recurrente rechazada|plantilla rechazada/i,
      necesita_comprobante: /subir comprobante|comprobante requerido/i
    }
  };

  // Detectar entidad
  let entidad: string | undefined;
  if (/solicitud/i.test(mensaje)) entidad = 'solicitud';
  else if (/viático/i.test(mensaje)) entidad = 'viatico';
  else if (/recurrente|plantilla/i.test(mensaje)) entidad = 'recurrente';

  // Detectar acción
  let accion: string | undefined;
  if (entidad && patterns[entidad as keyof typeof patterns]) {
    const entityPatterns = patterns[entidad as keyof typeof patterns];
    for (const [action, pattern] of Object.entries(entityPatterns)) {
      if (pattern.test(mensaje)) {
        accion = action;
        break;
      }
    }
  }

  return { accion, entidad };
};

// Función para obtener el icono apropiado según el tipo de notificación
export const getNotificationIcon = (tipo: string, entidad?: string) => {
  // Se puede expandir con más iconos específicos
  const iconMap = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️',
    solicitud: '📄',
    viatico: '✈️',
    recurrente: '🔄',
    default: '🔔'
  };

  return iconMap[tipo as keyof typeof iconMap] || 
         iconMap[entidad as keyof typeof iconMap] || 
         iconMap.default;
};
