'use client';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { User, Mail, Shield, Bell, Edit, Save, X, CheckCircle, Lock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { UsuariosService, UpdateProfileData, ChangePasswordData } from '@/services/usuarios.service';
import { toast } from 'react-hot-toast';

interface TabType {
  id: string;
  label: string;
  icon: React.ReactNode;
}

const tabs: TabType[] = [
  { id: 'personal', label: 'Información Personal', icon: <User className="w-4 h-4" /> },
  { id: 'seguridad', label: 'Seguridad', icon: <Shield className="w-4 h-4" /> },
  { id: 'notificaciones', label: 'Notificaciones', icon: <Bell className="w-4 h-4" /> }
];

export default function AdminProfilePage() {
  const { user, updateUserData } = useAuth();
  const [activeTab, setActiveTab] = useState('personal');
  // Eliminado edición y loading

  const [formData, setFormData] = useState({ nombre: '', email: '', cargo: 'Administrador General' });

  useEffect(() => {
    if (user) {
      setFormData({ 
        nombre: user.nombre || '', 
        email: user.email || '', 
        cargo: 'Administrador General' 
      });
    }
  }, [user]);

  const [notifications, setNotifications] = useState({ solicitudesNuevas: true, solicitudesActualizadas: true, usuariosNuevos: false, reportesSemanal: true });

  // Eliminado handleInputChange

  // Eliminado handlePasswordChange

  const handleNotificationChange = (field: string, checked: boolean) => {
    setNotifications(prev => ({ ...prev, [field]: checked }));
  };

  // Eliminado handleSave

  // Eliminado handlePasswordUpdate

  const renderPersonalInfo = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-white">Información Personal</h2>
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
        <div className="flex items-center space-x-6 mb-8">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center ring-2 ring-white/30">
            <span className="text-2xl font-bold text-white">
              {user?.nombre?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">{user?.nombre}</h3>
            <p className="text-white/80">Administrador General</p>
            <div className="flex items-center mt-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white/20 text-white">
                <CheckCircle className="w-3 h-3 mr-1" />
                Cuenta Verificada
              </span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">
              <User className="w-4 h-4 inline mr-2" />
              Nombre completo
            </label>
            <Input
              type="text"
              value={user?.nombre || ''}
              disabled
              className="bg-white/10 border-white/10 text-white cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">
              <Mail className="w-4 h-4 inline mr-2" />
              Correo electrónico
            </label>
            <Input
              type="email"
              value={user?.email || ''}
              disabled
              className="bg-white/10 border-white/10 text-white cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">
              <Shield className="w-4 h-4 inline mr-2" />
              Cargo
            </label>
            <Input
              type="text"
              value="Administrador General"
              disabled
              className="bg-white/10 border-white/10 text-white cursor-not-allowed"
            />
            <p className="text-xs text-white/60 mt-1">El cargo no puede ser modificado</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSecurity = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-white">Seguridad</h2>
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
        <h3 className="text-lg font-semibold text-white mb-4">
          <Lock className="w-5 h-5 inline mr-2" />
          Cambiar Contraseña
        </h3>
        <div className="text-white/80 text-sm">La funcionalidad para cambiar la contraseña está deshabilitada temporalmente.</div>
      </div>
    </div>
  );

  const renderNotifications = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-white">Notificaciones</h2>

      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
        <h3 className="text-lg font-semibold text-white mb-4">Preferencias de Notificación</h3>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">Nuevas solicitudes</p>
              <p className="text-white/70 text-sm">Recibir notificaciones cuando se cree una nueva solicitud</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notifications.solicitudesNuevas}
                onChange={(e) => handleNotificationChange('solicitudesNuevas', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">Solicitudes actualizadas</p>
              <p className="text-white/70 text-sm">Recibir notificaciones cuando se actualice una solicitud</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notifications.solicitudesActualizadas}
                onChange={(e) => handleNotificationChange('solicitudesActualizadas', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">Nuevos usuarios</p>
              <p className="text-white/70 text-sm">Recibir notificaciones cuando se registre un nuevo usuario</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notifications.usuariosNuevos}
                onChange={(e) => handleNotificationChange('usuariosNuevos', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">Reporte semanal</p>
              <p className="text-white/70 text-sm">Recibir un reporte semanal con estadísticas</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notifications.reportesSemanal}
                onChange={(e) => handleNotificationChange('reportesSemanal', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-white/20">
          <Button 
            onClick={() => toast.success('Preferencias guardadas')} 
            className="bg-purple-600 text-white hover:bg-purple-700 shadow-lg border-0"
          >
            Guardar Preferencias
          </Button>
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'personal':
        return renderPersonalInfo();
      case 'seguridad':
        return renderSecurity();
      case 'notificaciones':
        return renderNotifications();
      default:
        return renderPersonalInfo();
    }
  };

  return (
    <ProtectedRoute requiredRoles={['admin_general']}>
      <AdminLayout>
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-white/20">
            <h1 className="text-2xl font-bold text-white font-montserrat">Mi Perfil</h1>
            <p className="text-white/80">Gestiona tu información personal y preferencias</p>
          </div>

          <div className="flex flex-col md:flex-row gap-8">
            <div className="w-full md:w-64">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 overflow-hidden">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-3 px-6 py-4 w-full text-left transition-colors ${
                      activeTab === tab.id
                        ? 'bg-white/20 text-white'
                        : 'text-white/80 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1">
              {renderTabContent()}
            </div>
          </div>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}
