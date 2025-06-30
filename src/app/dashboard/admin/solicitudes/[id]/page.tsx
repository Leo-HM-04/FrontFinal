'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, DollarSign, Building, FileText, User, MessageSquare, Calendar, ExternalLink, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { SolicitudesService } from '@/services/solicitudes.service';
import { Solicitud } from '@/types';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AdminLayout } from '@/components/layout/AdminLayout';

export default function SolicitudDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [solicitud, setSolicitud] = useState<Solicitud | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params.id) {
      fetchSolicitud(params.id as string);
    }
  }, [params.id]);

  const fetchSolicitud = async (id: string) => {
    try {
      const data = await SolicitudesService.getById(parseInt(id));
      setSolicitud(data);
    } catch (error) {
      console.error('Error fetching solicitud:', error);
      setError('Error al cargar los detalles de la solicitud');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getEstadoColor = (estado: string) => {
    const colors = {
      pendiente: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      autorizada: 'bg-green-100 text-green-800 border-green-200',
      rechazada: 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[estado as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getDepartmentColorClass = (departamento: string) => {
    const departamentosColores = {
      'Finanzas': 'bg-blue-100 text-blue-800 border-blue-200',
      'Recursos Humanos': 'bg-purple-100 text-purple-800 border-purple-200',
      'Marketing': 'bg-green-100 text-green-800 border-green-200',
      'Ventas': 'bg-orange-100 text-orange-800 border-orange-200',
      'Operaciones': 'bg-teal-100 text-teal-800 border-teal-200',
      'Tecnología': 'bg-indigo-100 text-indigo-800 border-indigo-200',
      'Administración': 'bg-pink-100 text-pink-800 border-pink-200',
      'Logística': 'bg-amber-100 text-amber-800 border-amber-200',
      'Proyectos': 'bg-cyan-100 text-cyan-800 border-cyan-200',
      'Legal': 'bg-red-100 text-red-800 border-red-200'
    };
    
    return departamentosColores[departamento as keyof typeof departamentosColores] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{background: 'linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%)'}}>
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-lg">Cargando detalles de la solicitud...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{background: 'linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%)'}}>
        <div className="text-white text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-400" />
          <p className="text-lg">{error}</p>
          <Button
            variant="outline"
            className="mt-4 text-white border-white/30 hover:bg-white/10"
            onClick={() => router.push('/dashboard/admin/solicitudes')}
          >
            Volver a la lista
          </Button>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute requiredRoles={['admin_general']}>
      <AdminLayout>
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-white/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/dashboard/admin/solicitudes')}
                  className="text-white border-white/30 hover:bg-white/10"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Volver
                </Button>
                <div>
                  <h1 className="text-2xl font-bold text-white">
                    Solicitud #{solicitud?.id_solicitud}
                  </h1>
                  <p className="text-white/80">
                    Creada el {solicitud && new Date(solicitud.fecha_creacion).toLocaleDateString('es-CO')}
                  </p>
                </div>
              </div>
              {solicitud && (
                <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full border ${getEstadoColor(solicitud.estado)}`}>
                  {solicitud.estado.toUpperCase()}
                </span>
              )}
            </div>
          </div>

          {solicitud && (
            <div className="space-y-6">
              {/* Información Principal */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-white/10 backdrop-blur-sm border border-white/20 p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <DollarSign className="w-5 h-5 mr-2 text-blue-300" />
                    Información Financiera
                  </h3>
                  <div className="space-y-4 text-white">
                    <div>
                      <span className="text-sm text-white/70">Monto:</span>
                      <p className="text-2xl font-bold text-white">{formatCurrency(solicitud.monto)}</p>
                    </div>
                    <div>
                      <span className="text-sm text-white/70">Cuenta Destino:</span>
                      <p className="font-mono text-white">{solicitud.cuenta_destino}</p>
                    </div>
                    <div>
                      <span className="text-sm text-white/70">Fecha Límite de Pago:</span>
                      <p className="text-white flex items-center">
                        <Calendar className="w-4 h-4 mr-2 text-blue-300" />
                        {new Date(solicitud.fecha_limite_pago).toLocaleDateString('es-CO')}
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="bg-white/10 backdrop-blur-sm border border-white/20 p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <Building className="w-5 h-5 mr-2 text-blue-300" />
                    Información Organizacional
                  </h3>
                  <div className="space-y-4 text-white">
                    <div>
                      <span className="text-sm text-white/70">Departamento:</span>
                      <p className="mt-1">
                        <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full border ${getDepartmentColorClass(solicitud.departamento)}`}>
                          {solicitud.departamento}
                        </span>
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-white/70">Solicitante:</span>
                      <p className="flex items-center">
                        <User className="w-4 h-4 mr-2 text-blue-300" />
                        {solicitud.usuario_nombre || `Usuario ${solicitud.id_usuario}`}
                      </p>
                    </div>
                    {solicitud.aprobador_nombre && (
                      <div>
                        <span className="text-sm text-white/70">Aprobado por:</span>
                        <p className="flex items-center">
                          <User className="w-4 h-4 mr-2 text-green-300" />
                          {solicitud.aprobador_nombre}
                        </p>
                      </div>
                    )}
                  </div>
                </Card>
              </div>

              {/* Concepto */}
              <Card className="bg-white/10 backdrop-blur-sm border border-white/20 p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-blue-300" />
                  Concepto
                </h3>
                <p className="text-white leading-relaxed bg-white/5 p-4 rounded-lg">
                  {solicitud.concepto}
                </p>
              </Card>

              {/* Documentos */}
              <Card className="bg-white/10 backdrop-blur-sm border border-white/20 p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <ExternalLink className="w-5 h-5 mr-2 text-blue-300" />
                  Documentos Adjuntos
                </h3>
                <div className="flex flex-wrap gap-3">
                  <Button
                    variant="outline"
                    onClick={() => window.open(solicitud.factura_url, '_blank')}
                    className="text-white border-white/30 hover:bg-white/10 flex items-center space-x-2"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Ver Factura</span>
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </Button>
                  {solicitud.soporte_url && (
                    <Button
                      variant="outline"
                      onClick={() => window.open(solicitud.soporte_url, '_blank')}
                      className="text-white border-white/30 hover:bg-white/10 flex items-center space-x-2"
                    >
                      <FileText className="w-4 h-4" />
                      <span>Ver Soporte</span>
                      <ExternalLink className="w-4 h-4 ml-2" />
                    </Button>
                  )}
                </div>
              </Card>

              {/* Comentarios del Aprobador */}
              {solicitud.comentario_aprobador && (
                <Card className="bg-white/10 backdrop-blur-sm border border-white/20 p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <MessageSquare className="w-5 h-5 mr-2 text-blue-300" />
                    Comentario del Aprobador
                  </h3>
                  <div className="bg-white/5 p-4 rounded-lg">
                    <p className="text-white italic">"{solicitud.comentario_aprobador}"</p>
                    {solicitud.fecha_revision && (
                      <p className="text-sm text-white/70 mt-2 flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        Revisado el {new Date(solicitud.fecha_revision).toLocaleDateString('es-CO')}
                      </p>
                    )}
                  </div>
                </Card>
              )}
            </div>
          )}
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}
