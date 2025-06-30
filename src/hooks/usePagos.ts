'use client';

import { useState, useEffect } from 'react';
import { PagoProcesado } from '@/utils/exportUtils';
import { getPagosProcesados, getPagosPendientes } from '@/services/pagos.service';

// Este hook se encargará de obtener los pagos procesados
export function usePagosProcesados() {
  const [pagos, setPagos] = useState<PagoProcesado[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPagos = async () => {
      setLoading(true);
      try {
        // Obtener datos usando el servicio
        const data = await getPagosProcesados();
        setPagos(data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching pagos:', err);
        setError('Error al cargar los pagos procesados');
        setPagos(pagosProcesadosEjemplo); // Datos de ejemplo como fallback
        setLoading(false);
      }
    };

    fetchPagos();
  }, []);

  return { pagos, loading, error };
}

// Datos de ejemplo para pagos procesados
export const pagosProcesadosEjemplo: PagoProcesado[] = [
  {
    id_pago: 1000,
    id_solicitud: 500,
    solicitante: 'María González',
    departamento: 'Recursos Humanos',
    monto: 1250000,
    concepto: 'Pago de capacitaciones',
    fecha_aprobacion: '2025-06-20',
    fecha_pago: '2025-06-21',
    estado: 'completado',
    urgencia: 'alta',
    metodo_pago: 'transferencia',
    banco_destino: 'Bancolombia',
    cuenta_destino: '2468013579',
    comprobante_id: 'CP-2025-001'
  },
  {
    id_pago: 999,
    id_solicitud: 499,
    solicitante: 'Pedro Ramírez',
    departamento: 'Ventas',
    monto: 850000,
    concepto: 'Reembolso de gastos',
    fecha_aprobacion: '2025-06-19',
    fecha_pago: '2025-06-20',
    estado: 'completado',
    urgencia: 'media',
    metodo_pago: 'transferencia',
    banco_destino: 'Davivienda',
    cuenta_destino: '1357924680',
    comprobante_id: 'CP-2025-002'
  },
  {
    id_pago: 998,
    id_solicitud: 498,
    solicitante: 'Luisa Mendoza',
    departamento: 'Tecnología',
    monto: 3750000,
    concepto: 'Software empresarial',
    fecha_aprobacion: '2025-06-18',
    fecha_pago: '2025-06-19',
    estado: 'completado',
    urgencia: 'baja',
    metodo_pago: 'transferencia',
    banco_destino: 'Banco de Bogotá',
    cuenta_destino: '9876501234',
    comprobante_id: 'CP-2025-003'
  },
  {
    id_pago: 997,
    id_solicitud: 497,
    solicitante: 'Roberto Torres',
    departamento: 'Marketing',
    monto: 1560000,
    concepto: 'Publicidad digital',
    fecha_aprobacion: '2025-06-17',
    fecha_pago: '2025-06-18',
    estado: 'completado',
    urgencia: 'media',
    metodo_pago: 'transferencia',
    banco_destino: 'Bancolombia',
    cuenta_destino: '5678901234',
    comprobante_id: 'CP-2025-004'
  },
  {
    id_pago: 996,
    id_solicitud: 496,
    solicitante: 'Andrea Sánchez',
    departamento: 'Finanzas',
    monto: 4250000,
    concepto: 'Pago a proveedores',
    fecha_aprobacion: '2025-06-16',
    fecha_pago: '2025-06-17',
    estado: 'completado',
    urgencia: 'alta',
    metodo_pago: 'transferencia',
    banco_destino: 'Davivienda',
    cuenta_destino: '1122334455',
    comprobante_id: 'CP-2025-005'
  },
  {
    id_pago: 995,
    id_solicitud: 495,
    solicitante: 'Carlos Mendez',
    departamento: 'Operaciones',
    monto: 2150000,
    concepto: 'Insumos de oficina',
    fecha_aprobacion: '2025-06-15',
    fecha_pago: '2025-06-16',
    estado: 'completado',
    urgencia: 'baja',
    metodo_pago: 'transferencia',
    banco_destino: 'Banco de Occidente',
    cuenta_destino: '6677889900',
    comprobante_id: 'CP-2025-006'
  },
  {
    id_pago: 994,
    id_solicitud: 494,
    solicitante: 'Diana Restrepo',
    departamento: 'Legal',
    monto: 1800000,
    concepto: 'Servicios legales',
    fecha_aprobacion: '2025-06-14',
    fecha_pago: '2025-06-15',
    estado: 'completado',
    urgencia: 'media',
    metodo_pago: 'transferencia',
    banco_destino: 'Bancolombia',
    cuenta_destino: '1212343456',
    comprobante_id: 'CP-2025-007'
  },
  {
    id_pago: 993,
    id_solicitud: 493,
    solicitante: 'Fernando López',
    departamento: 'Proyectos',
    monto: 5600000,
    concepto: 'Materiales de construcción',
    fecha_aprobacion: '2025-06-13',
    fecha_pago: '2025-06-14',
    estado: 'completado',
    urgencia: 'alta',
    metodo_pago: 'transferencia',
    banco_destino: 'Banco de Bogotá',
    cuenta_destino: '2233445566',
    comprobante_id: 'CP-2025-008'
  },
  {
    id_pago: 992,
    id_solicitud: 492,
    solicitante: 'Juliana Martínez',
    departamento: 'Administración',
    monto: 920000,
    concepto: 'Servicios públicos',
    fecha_aprobacion: '2025-06-12',
    fecha_pago: '2025-06-13',
    estado: 'completado',
    urgencia: 'alta',
    metodo_pago: 'transferencia',
    banco_destino: 'Davivienda',
    cuenta_destino: '5566778899',
    comprobante_id: 'CP-2025-009'
  },
  {
    id_pago: 991,
    id_solicitud: 491,
    solicitante: 'Gabriel Osorio',
    departamento: 'Logística',
    monto: 3700000,
    concepto: 'Transporte de mercancía',
    fecha_aprobacion: '2025-06-11',
    fecha_pago: '2025-06-12',
    estado: 'completado',
    urgencia: 'media',
    metodo_pago: 'transferencia',
    banco_destino: 'Bancolombia',
    cuenta_destino: '1133557799',
    comprobante_id: 'CP-2025-010'
  },
  {
    id_pago: 990,
    id_solicitud: 490,
    solicitante: 'Valeria Giraldo',
    departamento: 'Recursos Humanos',
    monto: 1650000,
    concepto: 'Bonificaciones personal',
    fecha_aprobacion: '2025-06-10',
    fecha_pago: '2025-06-11',
    estado: 'completado',
    urgencia: 'baja',
    metodo_pago: 'transferencia',
    banco_destino: 'Banco de Occidente',
    cuenta_destino: '2244668800',
    comprobante_id: 'CP-2025-011'
  },
  {
    id_pago: 989,
    id_solicitud: 489,
    solicitante: 'Eduardo Gómez',
    departamento: 'Marketing',
    monto: 2400000,
    concepto: 'Campañas digitales',
    fecha_aprobacion: '2025-06-09',
    fecha_pago: '2025-06-10',
    estado: 'completado',
    urgencia: 'media',
    metodo_pago: 'transferencia',
    banco_destino: 'Bancolombia',
    cuenta_destino: '9988776655',
    comprobante_id: 'CP-2025-012'
  }
];

// Para pagos pendientes también
export function usePagosPendientes() {
  const [pagos, setPagos] = useState<PagoProcesado[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPagos = async () => {
      setLoading(true);
      try {
        // Obtener datos usando el servicio
        const data = await getPagosPendientes();
        setPagos(data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching pagos pendientes:', err);
        setError('Error al cargar los pagos pendientes');
        setPagos(pagosPendientesEjemplo); // Datos de ejemplo como fallback
        setLoading(false);
      }
    };

    fetchPagos();
  }, []);

  return { pagos, loading, error };
}

// Datos de ejemplo para pagos pendientes
export const pagosPendientesEjemplo: PagoProcesado[] = [
  {
    id_pago: 1001,
    id_solicitud: 501,
    solicitante: 'Carlos López',
    departamento: 'Finanzas',
    monto: 2500000,
    concepto: 'Pago a proveedores',
    fecha_aprobacion: '2025-06-25',
    fecha_pago: '',
    estado: 'pendiente',
    urgencia: 'alta',
    metodo_pago: 'transferencia',
    banco_destino: 'Bancolombia',
    cuenta_destino: '1234567890',
    comprobante_id: ''
  },
  {
    id_pago: 1002,
    id_solicitud: 502,
    solicitante: 'Ana Martínez',
    departamento: 'Marketing',
    monto: 1800000,
    concepto: 'Campaña publicitaria',
    fecha_aprobacion: '2025-06-24',
    fecha_pago: '',
    estado: 'pendiente',
    urgencia: 'media',
    metodo_pago: 'transferencia',
    banco_destino: 'Davivienda',
    cuenta_destino: '0987654321',
    comprobante_id: ''
  },
  {
    id_pago: 1003,
    id_solicitud: 503,
    solicitante: 'Juan Gómez',
    departamento: 'Tecnología',
    monto: 3250000,
    concepto: 'Equipos informáticos',
    fecha_aprobacion: '2025-06-23',
    fecha_pago: '',
    estado: 'pendiente',
    urgencia: 'baja',
    metodo_pago: 'transferencia',
    banco_destino: 'Banco de Bogotá',
    cuenta_destino: '5678901234',
    comprobante_id: ''
  },
  {
    id_pago: 1004,
    id_solicitud: 504,
    solicitante: 'Laura Vargas',
    departamento: 'Recursos Humanos',
    monto: 950000,
    concepto: 'Capacitación personal',
    fecha_aprobacion: '2025-06-22',
    fecha_pago: '',
    estado: 'pendiente',
    urgencia: 'media',
    metodo_pago: 'transferencia',
    banco_destino: 'Banco de Occidente',
    cuenta_destino: '1324354657',
    comprobante_id: ''
  },
  {
    id_pago: 1005,
    id_solicitud: 505,
    solicitante: 'Miguel Rodríguez',
    departamento: 'Operaciones',
    monto: 4750000,
    concepto: 'Mantenimiento maquinaria',
    fecha_aprobacion: '2025-06-21',
    fecha_pago: '',
    estado: 'pendiente',
    urgencia: 'alta',
    metodo_pago: 'transferencia',
    banco_destino: 'Bancolombia',
    cuenta_destino: '9876543210',
    comprobante_id: ''
  }
];
