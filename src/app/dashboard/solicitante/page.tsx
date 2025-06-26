'use client';

import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Pagination } from '@/components/ui/Pagination';
import { Plus, FileText, Calendar, DollarSign, Building, Eye, Menu, LogOut, Home, Bell, Play, HelpCircle, Settings, CheckCircle, Clock } from 'lucide-react';
import { SolicitudesService } from '@/services/solicitudes.service';
import { usePagination } from '@/hooks/usePagination';
import { Solicitud, CreateSolicitudData } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-hot-toast';

export default function SolicitanteDashboard() {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logout } = useAuth();

  const [formData, setFormData] = useState<CreateSolicitudData>({
    departamento: '',
    monto: 0,
    cuenta_destino: '',
    factura_url: '',
    concepto: '',
    fecha_limite_pago: '',
    soporte_url: ''
  });

  useEffect(() => {
    fetchMySolicitudes();
  }, []);

  const fetchMySolicitudes = async () => {
    try {
      const data = await SolicitudesService.getMySolicitudes();
      setSolicitudes(data);
    } catch (error) {
      console.error('Error fetching solicitudes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'monto' ? parseFloat(value) || 0 : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      const newSolicitud = await SolicitudesService.create(formData);
      setSolicitudes(prev => [newSolicitud, ...prev]);
      setShowCreateForm(false);
      setFormData({
        departamento: '',
        monto: 0,
        cuenta_destino: '',
        factura_url: '',
        concepto: '',
        fecha_limite_pago: '',
        soporte_url: ''
      });
      toast.success('Solicitud creada exitosamente');
    } catch (error) {
      console.error('Error creating solicitud:', error);
    } finally {
      setCreating(false);
    }
  };

  const getEstadoColor = (estado: string) => {
    const colors = {
      pendiente: 'bg-yellow-100 text-yellow-800',
      autorizada: 'bg-green-100 text-green-800',
      rechazada: 'bg-red-100 text-red-800'
    };
    return colors[estado as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const stats = {
    total: solicitudes.length,
    pendientes: solicitudes.filter(s => s.estado === 'pendiente').length,
    autorizadas: solicitudes.filter(s => s.estado === 'autorizada').length,
    rechazadas: solicitudes.filter(s => s.estado === 'rechazada').length,
    montoTotal: solicitudes.reduce((sum, s) => sum + s.monto, 0)
  };
  
  return (
    <ProtectedRoute requiredRoles={['solicitante']}>
      <div className="min-h-screen font-montserrat" style={{background: 'linear-gradient(135deg, #004AB7 0%, #0057D9 100%)'}}>
        {/* Header exacto al Figma */}
        <header className="bg-white/10 backdrop-blur-lg border-b border-white/20">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-center justify-between h-20">
              {/* Botón Menú */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsMenuOpen(true)}
                className="bg-white/15 backdrop-blur-sm text-white border border-white/30 hover:bg-white/25 transition-all duration-300 px-4 py-2 rounded-xl font-medium"
              >
                <Menu className="w-4 h-4 mr-2" />
                Menú
              </Button>

              {/* Título Central */}
              <h1 className="text-3xl font-bold text-white text-center flex-1 font-montserrat tracking-wide">
                PLATAFORMA DE PAGOS
              </h1>

              {/* Botón Notificaciones */}
              <Button
                variant="outline"
                size="sm"
                className="bg-white/15 backdrop-blur-sm text-white border border-white/30 hover:bg-white/25 transition-all duration-300 px-4 py-2 rounded-xl font-medium"
              >
                <Bell className="w-4 h-4 mr-2" />
                Notificaciones
              </Button>
            </div>
          </div>
        </header>

        {/* Sidebar Menu */}
        {isMenuOpen && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setIsMenuOpen(false)} />
            <div className="absolute left-0 top-0 h-full w-80 bg-white shadow-xl transform transition-transform duration-300 ease-in-out">
              <div className="flex flex-col h-full">
                <div className="text-white p-6" style={{background: 'linear-gradient(135deg, #004AB7 0%, #0057D9 100%)'}}>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold font-montserrat">Panel Solicitante</h2>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsMenuOpen(false)}
                      className="text-white border-white/30 hover:bg-white/10"
                    >
                      ×
                    </Button>
                  </div>
                  <div className="bg-white/10 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                        <span className="text-lg font-bold">{user?.nombre?.charAt(0).toUpperCase()}</span>
                      </div>
                      <div>
                        <p className="font-semibold">{user?.nombre}</p>
                        <p className="text-sm text-white/80">Solicitante</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex-1 p-4 space-y-2">
                  <a href="/dashboard" className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-light-bg hover:text-primary-blue transition-colors">
                    <Home className="w-5 h-5" />
                    <span className="font-medium">Dashboard</span>
                  </a>
                  <a href="/dashboard/solicitante" className="flex items-center space-x-3 px-4 py-3 rounded-lg bg-light-bg text-primary-blue">
                    <FileText className="w-5 h-5" />
                    <span className="font-medium">Mis Solicitudes</span>
                  </a>
                  <a href="/dashboard/solicitante/create" className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-light-bg hover:text-primary-blue transition-colors">
                    <Plus className="w-5 h-5" />
                    <span className="font-medium">Nueva Solicitud</span>
                  </a>
                  <a href="#" className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-light-bg hover:text-primary-blue transition-colors">
                    <Settings className="w-5 h-5" />
                    <span className="font-medium">Configuración</span>
                  </a>
                </div>

                <div className="p-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      logout();
                      setIsMenuOpen(false);
                      window.location.href = '/login';
                    }}
                    className="flex items-center space-x-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors w-full"
                  >
                    <LogOut className="w-5 h-5" />
                    <span className="font-medium">Cerrar Sesión</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content - Layout de 2 columnas exacto al Figma */}
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            
            {/* Columna Izquierda - Contenido de texto */}
            <div className="text-white space-y-8">
              <h2 className="text-5xl font-bold font-montserrat leading-tight">
                Gestiona tus solicitudes de pago fácilmente.
              </h2>
              
              <p className="text-xl text-white/90 leading-relaxed">
                Crea, rastrea y gestiona todas tus solicitudes de pago desde un solo lugar. Nuestra plataforma simplifica el proceso para que puedas enfocarte en lo que realmente importa.
              </p>

              <Button 
                className="bg-white/15 backdrop-blur-sm text-white border border-white/30 hover:bg-white/25 transition-all duration-300 px-8 py-4 rounded-xl font-semibold text-lg"
              >
                <HelpCircle className="w-5 h-5 mr-3" />
                ¿Necesitas ayuda?
              </Button>
            </div>

            {/* Columna Derecha - Video Tutorial de Solicitudes */}
            <div className="flex justify-center lg:justify-end">
              <div className="relative w-full max-w-md">
                {/* Container del Video */}
                <div className="bg-gray-200 rounded-3xl overflow-hidden shadow-2xl aspect-video relative border-2 border-gray-300">
                  
                  {/* Header del Video */}
                  <div className="absolute top-0 left-0 right-0 bg-gray-300 p-3 border-b border-gray-400">
                    <div className="flex items-center justify-between">
                      <div className="flex space-x-2">
                        <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                        <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                        <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>
                        <span className="text-gray-700 text-sm font-semibold">Solicitudes Tutorial</span>
                      </div>
                    </div>
                  </div>

                  {/* Contenido del Video - Interfaz de Solicitudes */}
                  <div className="absolute inset-0 mt-12 bg-white">
                    
                    {/* Header de la aplicación */}
                    <div className="absolute top-0 left-0 right-0 h-12 bg-blue-600 flex items-center px-4">
                      <div className="text-white text-sm font-semibold">Sistema de Solicitudes</div>
                      <div className="ml-auto flex space-x-2">
                        <div className="w-6 h-6 bg-white/20 rounded-full"></div>
                        <div className="w-6 h-6 bg-white/20 rounded-full"></div>
                      </div>
                    </div>

                    {/* Contenido principal */}
                    <div className="mt-12 p-4 h-full bg-gray-50">
                      
                      {/* Formulario de solicitud simulado */}
                      <div className="bg-white rounded-lg p-4 mb-4 shadow-sm">
                        <div className="text-lg font-bold text-gray-800 mb-3">Nueva Solicitud</div>
                        <div className="space-y-2">
                          <div className="w-full h-3 bg-gray-200 rounded"></div>
                          <div className="w-3/4 h-3 bg-gray-200 rounded"></div>
                          <div className="w-1/2 h-3 bg-blue-200 rounded"></div>
                        </div>
                      </div>

                      {/* Lista de solicitudes simulada */}
                      <div className="space-y-2">
                        <div className="bg-white rounded-lg p-3 flex items-center justify-between shadow-sm">
                          <div className="flex items-center space-x-3">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <div className="w-20 h-2 bg-gray-300 rounded"></div>
                          </div>
                          <div className="w-12 h-2 bg-green-200 rounded"></div>
                        </div>
                        <div className="bg-white rounded-lg p-3 flex items-center justify-between shadow-sm">
                          <div className="flex items-center space-x-3">
                            <Clock className="w-4 h-4 text-yellow-500" />
                            <div className="w-24 h-2 bg-gray-300 rounded"></div>
                          </div>
                          <div className="w-16 h-2 bg-yellow-200 rounded"></div>
                        </div>
                      </div>
                    </div>

                    {/* Botón de Play centrado */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <button className="w-20 h-20 bg-white/95 backdrop-blur-sm rounded-full flex items-center justify-center shadow-xl hover:scale-110 transition-transform duration-300">
                        <Play className="w-8 h-8 text-gray-700 ml-1" />
                      </button>
                    </div>

                    {/* Atribución del usuario */}
                    <div className="absolute bottom-4 right-4">
                      <div className="bg-black/20 backdrop-blur-sm rounded-lg px-3 py-1">
                        <span className="text-white text-xs font-medium">tutorial_solicitudes</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Elementos decorativos alrededor del video */}
                <div className="absolute -top-4 -right-4 w-8 h-8 bg-white/30 rounded-full"></div>
                <div className="absolute -bottom-4 -left-4 w-6 h-6 bg-white/40 rounded-full"></div>
                <div className="absolute top-1/3 -left-3 w-4 h-4 bg-white/25 rounded-full"></div>
              </div>
            </div>
          </div>

          {/* Cards de acciones rápidas - Específicas para solicitante */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20">
            <a href="/dashboard/solicitante/create" className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 hover:bg-white/20 transition-all duration-300 group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white/80">Crear</p>
                  <p className="text-2xl font-bold text-white mt-1">Nueva Solicitud</p>
                  <p className="text-sm text-white/60 mt-2">Inicia el proceso de solicitud</p>
                </div>
                <div className="p-4 rounded-full bg-white/20">
                  <Plus className="w-8 h-8 text-white" />
                </div>
              </div>
            </a>

            <a href="/dashboard/solicitante" className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 hover:bg-white/20 transition-all duration-300 group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white/80">Ver</p>
                  <p className="text-2xl font-bold text-white mt-1">Mis Solicitudes</p>
                  <p className="text-sm text-white/60 mt-2">Rastrea el estado de tus solicitudes</p>
                </div>
                <div className="p-4 rounded-full bg-white/20">
                  <FileText className="w-8 h-8 text-white" />
                </div>
              </div>
            </a>

            <a href="#" className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 hover:bg-white/20 transition-all duration-300 group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white/80">Ver</p>
                  <p className="text-2xl font-bold text-white mt-1">Historial</p>
                  <p className="text-sm text-white/60 mt-2">Revisa solicitudes anteriores</p>
                </div>
                <div className="p-4 rounded-full bg-white/20">
                  <Calendar className="w-8 h-8 text-white" />
                </div>
              </div>
            </a>
          </div>
        </div>

        {/* ...existing modal code... */}
      </div>
    </ProtectedRoute>
  );
}