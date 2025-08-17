"use client";

import { PagadorLayout } from '@/components/layout/PagadorLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function PagadorRecurrentesRedirect() {
  return (
    <ProtectedRoute requiredRoles={['pagador_banca']}>
      <PagadorLayout>
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-8 shadow-lg">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <AlertTriangle className="w-8 h-8 text-yellow-600" />
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">
                  Acceso Redirigido
                </h1>
                <div className="text-gray-700 space-y-4">
                  <p className="text-lg">
                    <strong>Como pagador, no necesitas gestionar las plantillas recurrentes directamente.</strong>
                  </p>
                  
                  <div className="bg-white/60 border border-yellow-200 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">¿Cómo funcionan las solicitudes recurrentes?</h3>
                    <ul className="list-disc pl-5 space-y-2 text-sm">
                      <li>Los solicitantes crean <strong>plantillas recurrentes</strong> (diarias, semanales, quincenales, mensuales)</li>
                      <li>Los aprobadores revisan y aprueban estas plantillas</li>
                      <li>El sistema <strong>genera automáticamente solicitudes normales</strong> según la frecuencia configurada</li>
                      <li>Estas solicitudes generadas automáticamente llegan a tu bandeja de <strong>solicitudes normales</strong></li>
                      <li>Tú procesas el pago y subes comprobantes en las <strong>solicitudes normales</strong>, como siempre</li>
                    </ul>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-semibold text-blue-900 mb-2">💡 ¿Dónde encuentras los pagos recurrentes?</h3>
                    <p className="text-blue-800 text-sm">
                      Las solicitudes generadas automáticamente desde plantillas recurrentes aparecen en tu sección de 
                      <strong> solicitudes normales</strong> con el prefijo <code>[RECURRENTE]</code> en el concepto.
                    </p>
                  </div>

                  <div className="pt-4">
                    <Link 
                      href="/dashboard/pagador/solicitudes"
                      className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors font-medium"
                    >
                      <span>Ir a Solicitudes Normales</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </PagadorLayout>
    </ProtectedRoute>
  );
}
