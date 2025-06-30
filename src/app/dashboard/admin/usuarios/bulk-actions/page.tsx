'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Users, Download, Upload, Settings } from 'lucide-react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Button } from '@/components/ui/Button';

export default function BulkActionsPage() {
  const router = useRouter();

  return (
    <ProtectedRoute requiredRoles={['admin_general']}>
      <AdminLayout>
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-white/20">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                className="text-white border-white/30 hover:bg-white/10"
                onClick={() => router.push('/dashboard/admin/usuarios')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-white">Acciones Masivas</h1>
                <p className="text-white/80">Gestionar múltiples usuarios simultáneamente</p>
              </div>
            </div>
          </div>

        {/* Bulk Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="flex items-center space-x-3 mb-4">
              <Download className="w-8 h-8 text-blue-400" />
              <h3 className="text-xl font-semibold text-white">Exportar Usuarios</h3>
            </div>
            <p className="text-white/80 mb-4">
              Exporta la lista completa de usuarios en formato CSV o Excel
            </p>
            <Button className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg">
              Exportar Datos
            </Button>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="flex items-center space-x-3 mb-4">
              <Upload className="w-8 h-8 text-green-400" />
              <h3 className="text-xl font-semibold text-white">Importar Usuarios</h3>
            </div>
            <p className="text-white/80 mb-4">
              Importa múltiples usuarios desde un archivo CSV
            </p>
            <Button className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg">
              Importar Archivo
            </Button>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="flex items-center space-x-3 mb-4">
              <Users className="w-8 h-8 text-purple-400" />
              <h3 className="text-xl font-semibold text-white">Cambio de Roles</h3>
            </div>
            <p className="text-white/80 mb-4">
              Cambiar roles de múltiples usuarios simultáneamente
            </p>
            <Button className="w-full bg-purple-500 hover:bg-purple-600 text-white py-3 rounded-lg">
              Gestionar Roles
            </Button>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="flex items-center space-x-3 mb-4">
              <Settings className="w-8 h-8 text-orange-400" />
              <h3 className="text-xl font-semibold text-white">Configuración Global</h3>
            </div>
            <p className="text-white/80 mb-4">
              Aplicar configuraciones a todos los usuarios
            </p>
            <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg">
              Configurar
            </Button>
          </div>
        </div>
      </div>
    </AdminLayout>
    </ProtectedRoute>
  );
}
