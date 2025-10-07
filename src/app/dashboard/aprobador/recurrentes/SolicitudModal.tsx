import React from "react";
import { PlantillaRecurrente } from '@/types';
import { FaUser, FaBuilding, FaMoneyBillWave, FaCreditCard, FaRedo, FaCheckCircle, FaRegCalendarAlt, FaUserCheck, FaUserTie, FaCommentDots, FaTimesCircle } from 'react-icons/fa';

interface SolicitudModalProps {
  solicitud: PlantillaRecurrente;
  open: boolean;
  onClose: () => void;
}

export const SolicitudModal: React.FC<SolicitudModalProps> = ({ solicitud, open, onClose }) => {
  if (!open || !solicitud) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(230, 223, 223, 0.4)' }}>
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full relative animate-fade-in border-2 border-blue-200 text-gray-800">
        <button 
          className="absolute top-3 right-3 text-gray-500 hover:text-red-500 text-2xl font-bold transition"
          onClick={onClose}
          title="Cerrar"
        >
          <FaTimesCircle />
        </button>
        <h2 className="text-2xl font-bold text-blue-800 mb-4 text-center flex items-center justify-center gap-2">
          <FaRegCalendarAlt className="text-blue-400" /> Detalle de la Solicitud
        </h2>
        <div className="space-y-3 text-base">
          <div className="flex items-center gap-2"><span className="font-bold text-blue-900">ID:</span> {solicitud.id_recurrente}</div>
          <div className="flex items-center gap-2"><span className="font-bold text-yellow-700">Folio:</span> {solicitud.folio || '-'}</div>
          <div className="flex items-center gap-2"><FaUser className="text-blue-500" /><span className="font-bold">Usuario:</span> {solicitud.nombre_usuario || '-'}</div>
          <div className="flex items-center gap-2"><FaBuilding className="text-blue-500" /><span className="font-bold">Departamento:</span> {solicitud.departamento}</div>
          <div className="flex items-center gap-2"><FaMoneyBillWave className="text-green-600" /><span className="font-bold">Monto:</span> ${solicitud.monto?.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}</div>
          
          {/* Nuevos campos */}
          <div className="flex items-center gap-2"><FaCreditCard className="text-blue-400" /><span className="font-bold">Tipo de Cuenta:</span> {solicitud.tipo_cuenta_destino || 'CLABE'}</div>
          {solicitud.tipo_cuenta_destino === 'Tarjeta' && (
            <div className="flex items-center gap-2"><FaCreditCard className="text-blue-400" /><span className="font-bold">Tipo de Tarjeta:</span> {solicitud.tipo_tarjeta}</div>
          )}
          <div className="flex items-center gap-2"><FaCreditCard className="text-blue-400" /><span className="font-bold">Banco:</span> {solicitud.banco_destino || '-'}</div>
          <div className="flex items-center gap-2"><FaCreditCard className="text-blue-400" /><span className="font-bold">Cuenta destino:</span> {solicitud.cuenta_destino}</div>
          
          {solicitud.empresa_a_pagar && (
            <div className="flex items-center gap-2"><FaBuilding className="text-blue-500" /><span className="font-bold">Empresa a pagar:</span> {solicitud.empresa_a_pagar}</div>
          )}
          <div className="flex items-center gap-2"><FaUser className="text-blue-500" /><span className="font-bold">Persona que recibe:</span> {solicitud.nombre_persona || '-'}</div>
          
          <div className="flex items-center gap-2"><FaRedo className="text-purple-500" /><span className="font-bold">Frecuencia:</span> {solicitud.frecuencia}</div>
          <div className="flex items-center gap-2">
            {solicitud.estado === 'aprobada' && <FaCheckCircle className="text-green-600" />}
            {solicitud.estado === 'pendiente' && <FaRegCalendarAlt className="text-yellow-500" />}
            {solicitud.estado === 'rechazada' && <FaTimesCircle className="text-red-500" />}
            <span className="font-bold">Estado:</span> {solicitud.estado.charAt(0).toUpperCase() + solicitud.estado.slice(1)}
          </div>
          
          {solicitud.tipo_pago_descripcion && (
            <div className="flex items-center gap-2"><FaCommentDots className="text-blue-500" /><span className="font-bold">Descripción del tipo de pago:</span> {solicitud.tipo_pago_descripcion}</div>
          )}
          <div className="flex items-center gap-2"><FaRegCalendarAlt className="text-blue-400" /><span className="font-bold">Siguiente fecha:</span> {solicitud.siguiente_fecha ? new Date(solicitud.siguiente_fecha).toLocaleString('es-MX', { timeZone: 'America/Mexico_City' }) : '-'}</div>
          <div className="flex items-center gap-2"><FaUserCheck className="text-green-700" /><span className="font-bold">Aprobador:</span> {solicitud.nombre_aprobador || '-'} {solicitud.id_aprobador ? `(ID: ${solicitud.id_aprobador})` : ''}</div>
          <div className="flex items-center gap-2"><FaUserTie className="text-blue-700" /><span className="font-bold">Pagador:</span> {solicitud.nombre_pagador || '-'}</div>
          {solicitud.comentario_aprobador && (
            <div className="flex items-center gap-2"><FaCommentDots className="text-pink-500" /><span className="font-bold">Comentario del aprobador:</span> {solicitud.comentario_aprobador}</div>
          )}
        </div>
      </div>
    </div>
  );
};
