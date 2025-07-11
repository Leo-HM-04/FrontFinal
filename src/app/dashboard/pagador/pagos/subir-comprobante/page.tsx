'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { PagadorLayout } from '@/components/layout/PagadorLayout';
import { AlertCircle } from 'lucide-react';

export default function HistorialPagosPage() {
  return (
    <ProtectedRoute requiredRoles={['pagador_banca']}>
      <PagadorLayout>
        <div className="max-w-2xl mx-auto mt-24 text-center bg-white/80 rounded-xl shadow-lg p-10 border border-yellow-200">
          <AlertCircle className="w-16 h-16 mx-auto text-yellow-400 mb-4 animate-bounce" />
          <h2 className="text-3xl font-extrabold mb-2 text-yellow-900">¡Próximamente!</h2>
          <p className="text-lg text-gray-800 mb-4">Estamos trabajando para habilitar el de subir comprobante de solicitudes pagadas. Muy pronto podrás consultar y exportar todos tus pagos procesados desde esta sección.</p>
          <div className="flex justify-center mb-4">
            <span className="inline-block px-4 py-2 rounded-full bg-yellow-300 text-yellow-900 font-bold text-base shadow">En desarrollo</span>
          </div>
          <p className="text-sm text-gray-600">Si tienes dudas o necesitas información, contacta al administrador.</p>
        </div>
      </PagadorLayout>
    </ProtectedRoute>
  );
}

