'use client';

import { useState, useRef } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Button } from '@/components/ui/Button';
import { 
  User, Mail, Phone, MapPin, Calendar, Edit, Save, X, ArrowLeft, 
  Eye, EyeOff, Shield, Award, Activity, TrendingUp, Clock, CheckCircle2,
  Building, IdCard, UserCheck, Camera, Upload, Download, Bell,
  Key, Trash2, AlertTriangle, Globe, Smartphone, Monitor,
  Settings, LogOut, Star, BadgeCheck, Crown, Zap
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-hot-toast';
import Image from 'next/image';

interface TabType {
  id: string;
  label: string;
  icon: React.ReactNode;
}

const tabs: TabType[] = [
  { id: 'personal', label: 'Información Personal', icon: <User className="w-4 h-4" /> },
  { id: 'security', label: 'Seguridad', icon: <Shield className="w-4 h-4" /> },
  { id: 'notifications', label: 'Notificaciones', icon: <Bell className="w-4 h-4" /> },
  { id: 'preferences', label: 'Preferencias', icon: <Settings className="w-4 h-4" /> },
];

export default function PerfilSolicitantePage() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('personal');
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Estados para los campos del formulario
  const [formData, setFormData] = useState({
    nombre: user?.nombre || '',
    email: user?.email || '',
    telefono: '(+57) 300-123-4567',
    direccion: 'Calle 123 #45-67, Bogotá',
    fechaNacimiento: '1990-01-01',
    documento: '12345678',
    tipoDocumento: 'CC',
    cargo: 'Analista Senior',
    departamento: 'Administración',
    fechaIngreso: '2023-01-15',
    biografia: 'Profesional dedicado con más de 5 años de experiencia en análisis de datos y gestión de proyectos.',
    sitioWeb: 'https://miportafolio.com',
    linkedin: 'https://linkedin.com/in/usuario'
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [notifications, setNotifications] = useState({
    emailSolicitudes: true,
    emailRespuestas: true,
    pushSolicitudes: false,
    pushRespuestas: true,
    weeklyReport: true,
    monthlyReport: false
  });

  const [preferences, setPreferences] = useState({
    theme: 'system',
    language: 'es',
    timezone: 'America/Bogota',
    dateFormat: 'DD/MM/YYYY',
    autoSave: true,
    compactView: false
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePasswordChange = (field: string, value: string) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNotificationChange = (field: string, value: boolean) => {
    setNotifications(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePreferenceChange = (field: string, value: string | boolean) => {
    setPreferences(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileImage(e.target?.result as string);
        toast.success('Imagen de perfil actualizada');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      // Simular llamada a API
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast.success('Perfil actualizado exitosamente');
      setIsEditing(false);
    } catch (error) {
      toast.error('Error al actualizar el perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }
    
    if (passwordData.newPassword.length < 8) {
      toast.error('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast.success('Contraseña actualizada exitosamente');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error('Error al cambiar la contraseña');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNotifications = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Preferencias de notificación guardadas');
    } catch (error) {
      toast.error('Error al guardar las preferencias');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePreferences = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Preferencias guardadas correctamente');
    } catch (error) {
      toast.error('Error al guardar las preferencias');
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = () => {
    const dataToExport = {
      profile: formData,
      statistics: {
        totalSolicitudes: 24,
        aprobadas: 18,
        pendientes: 4,
        rechazadas: 2
      },
      exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mi-perfil-datos.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Datos exportados correctamente');
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'personal':
        return (
          <div className="space-y-6">
            {/* Información Personal */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 shadow-lg">
              <div className="flex items-center justify-between p-6 border-b border-white/20">
                <div className="flex items-center space-x-3">
                  <User className="w-5 h-5 text-white/80" />
                  <h3 className="text-lg font-semibold text-white">Información Básica</h3>
                </div>
                {!isEditing ? (
                  <Button
                    onClick={() => setIsEditing(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-all hover:scale-105"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Editar
                  </Button>
                ) : (
                  <div className="flex space-x-2">
                    <Button
                      onClick={handleSaveProfile}
                      disabled={loading}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-all hover:scale-105"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {loading ? 'Guardando...' : 'Guardar'}
                    </Button>
                    <Button
                      onClick={() => setIsEditing(false)}
                      variant="outline"
                      className="border-white/30 text-white hover:bg-white/10"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancelar
                    </Button>
                  </div>
                )}
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Nombre Completo */}
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Nombre Completo *
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.nombre}
                        onChange={(e) => handleInputChange('nombre', e.target.value)}
                        className="w-full px-4 py-3 bg-white/90 border border-white/30 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all text-gray-900"
                        placeholder="Ingresa tu nombre completo"
                      />
                    ) : (
                      <div className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg border border-white/10">
                        <User className="w-4 h-4 text-white/60" />
                        <span className="text-white font-medium">{formData.nombre}</span>
                      </div>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Correo Electrónico
                    </label>
                    <div className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg border border-white/10">
                      <Mail className="w-4 h-4 text-white/60" />
                      <span className="text-white flex-1">{formData.email}</span>
                      <div className="flex items-center space-x-1">
                        <BadgeCheck className="w-4 h-4 text-green-400" />
                        <span className="text-xs text-green-400">Verificado</span>
                      </div>
                    </div>
                  </div>

                  {/* Teléfono */}
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Teléfono
                    </label>
                    {isEditing ? (
                      <input
                        type="tel"
                        value={formData.telefono}
                        onChange={(e) => handleInputChange('telefono', e.target.value)}
                        className="w-full px-4 py-3 bg-white/90 border border-white/30 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all text-gray-900"
                        placeholder="+57 300 123 4567"
                      />
                    ) : (
                      <div className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg border border-white/10">
                        <Phone className="w-4 h-4 text-white/60" />
                        <span className="text-white">{formData.telefono}</span>
                      </div>
                    )}
                  </div>

                  {/* Documento */}
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Documento de Identidad
                    </label>
                    {isEditing ? (
                      <div className="flex space-x-2">
                        <select
                          value={formData.tipoDocumento}
                          onChange={(e) => handleInputChange('tipoDocumento', e.target.value)}
                          className="px-3 py-3 bg-white/90 border border-white/30 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-gray-900"
                        >
                          <option value="CC">CC</option>
                          <option value="CE">CE</option>
                          <option value="PP">PP</option>
                          <option value="TI">TI</option>
                        </select>
                        <input
                          type="text"
                          value={formData.documento}
                          onChange={(e) => handleInputChange('documento', e.target.value)}
                          className="flex-1 px-4 py-3 bg-white/90 border border-white/30 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-gray-900"
                          placeholder="Número de documento"
                        />
                      </div>
                    ) : (
                      <div className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg border border-white/10">
                        <IdCard className="w-4 h-4 text-white/60" />
                        <span className="text-white">{formData.tipoDocumento}: {formData.documento}</span>
                      </div>
                    )}
                  </div>

                  {/* Dirección */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Dirección
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.direccion}
                        onChange={(e) => handleInputChange('direccion', e.target.value)}
                        className="w-full px-4 py-3 bg-white/90 border border-white/30 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all text-gray-900"
                        placeholder="Calle 123 #45-67, Ciudad"
                      />
                    ) : (
                      <div className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg border border-white/10">
                        <MapPin className="w-4 h-4 text-white/60" />
                        <span className="text-white">{formData.direccion}</span>
                      </div>
                    )}
                  </div>

                  {/* Fecha de Nacimiento */}
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Fecha de Nacimiento
                    </label>
                    {isEditing ? (
                      <input
                        type="date"
                        value={formData.fechaNacimiento}
                        onChange={(e) => handleInputChange('fechaNacimiento', e.target.value)}
                        className="w-full px-4 py-3 bg-white/90 border border-white/30 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all text-gray-900"
                      />
                    ) : (
                      <div className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg border border-white/10">
                        <Calendar className="w-4 h-4 text-white/60" />
                        <span className="text-white">{new Date(formData.fechaNacimiento).toLocaleDateString('es-CO')}</span>
                      </div>
                    )}
                  </div>

                  {/* Biografía */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Biografía
                    </label>
                    {isEditing ? (
                      <textarea
                        value={formData.biografia}
                        onChange={(e) => handleInputChange('biografia', e.target.value)}
                        rows={3}
                        className="w-full px-4 py-3 bg-white/90 border border-white/30 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all text-gray-900"
                        placeholder="Cuéntanos sobre ti..."
                      />
                    ) : (
                      <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                        <p className="text-white text-sm leading-relaxed">{formData.biografia}</p>
                      </div>
                    )}
                  </div>

                  {/* Enlaces Profesionales */}
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Sitio Web
                    </label>
                    {isEditing ? (
                      <input
                        type="url"
                        value={formData.sitioWeb}
                        onChange={(e) => handleInputChange('sitioWeb', e.target.value)}
                        className="w-full px-4 py-3 bg-white/90 border border-white/30 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all text-gray-900"
                        placeholder="https://miportafolio.com"
                      />
                    ) : (
                      <div className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg border border-white/10">
                        <Globe className="w-4 h-4 text-white/60" />
                        <a href={formData.sitioWeb} target="_blank" rel="noopener noreferrer" 
                           className="text-blue-400 hover:text-blue-300 transition-colors">
                          {formData.sitioWeb}
                        </a>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      LinkedIn
                    </label>
                    {isEditing ? (
                      <input
                        type="url"
                        value={formData.linkedin}
                        onChange={(e) => handleInputChange('linkedin', e.target.value)}
                        className="w-full px-4 py-3 bg-white/90 border border-white/30 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all text-gray-900"
                        placeholder="https://linkedin.com/in/usuario"
                      />
                    ) : (
                      <div className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg border border-white/10">
                        <svg className="w-4 h-4 text-white/60" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                        </svg>
                        <a href={formData.linkedin} target="_blank" rel="noopener noreferrer" 
                           className="text-blue-400 hover:text-blue-300 transition-colors">
                          Ver perfil de LinkedIn
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Información Laboral */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 shadow-lg">
              <div className="flex items-center space-x-3 p-6 border-b border-white/20">
                <Building className="w-5 h-5 text-white/80" />
                <h3 className="text-lg font-semibold text-white">Información Laboral</h3>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">Cargo</label>
                    <div className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg border border-white/10">
                      <span className="text-white font-medium">{formData.cargo}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">Departamento</label>
                    <div className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg border border-white/10">
                      <span className="text-white font-medium">{formData.departamento}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">Fecha de Ingreso</label>
                    <div className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg border border-white/10">
                      <Calendar className="w-4 h-4 text-white/60" />
                      <span className="text-white">{new Date(formData.fechaIngreso).toLocaleDateString('es-CO')}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">Rol en el Sistema</label>
                    <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-lg border border-green-500/30">
                      <Crown className="w-4 h-4 text-yellow-400" />
                      <span className="text-green-300 font-medium">Solicitante Premium</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'security':
        return (
          <div className="space-y-6">
            {/* Cambiar Contraseña */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 shadow-lg">
              <div className="flex items-center space-x-3 p-6 border-b border-white/20">
                <Key className="w-5 h-5 text-white/80" />
                <h3 className="text-lg font-semibold text-white">Cambiar Contraseña</h3>
              </div>
              
              <div className="p-6">
                <div className="space-y-4 max-w-md">
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Contraseña Actual
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={passwordData.currentPassword}
                        onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                        className="w-full px-4 py-3 pr-12 bg-white/90 border border-white/30 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-gray-900"
                        placeholder="Contraseña actual"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Nueva Contraseña
                    </label>
                    <input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                      className="w-full px-4 py-3 bg-white/90 border border-white/30 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-gray-900"
                      placeholder="Nueva contraseña (mín. 8 caracteres)"
                    />
                    <div className="mt-2 text-xs text-white/60">
                      <p>La contraseña debe contener:</p>
                      <ul className="list-disc list-inside ml-2 space-y-1">
                        <li>Al menos 8 caracteres</li>
                        <li>Una letra mayúscula</li>
                        <li>Una letra minúscula</li>
                        <li>Un número</li>
                      </ul>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Confirmar Contraseña
                    </label>
                    <input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                      className="w-full px-4 py-3 bg-white/90 border border-white/30 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-gray-900"
                      placeholder="Confirmar nueva contraseña"
                    />
                  </div>

                  <Button
                    onClick={handleChangePassword}
                    disabled={loading || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    {loading ? 'Actualizando...' : 'Actualizar Contraseña'}
                  </Button>
                </div>
              </div>
            </div>

            {/* Actividad de Seguridad */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 shadow-lg">
              <div className="flex items-center space-x-3 p-6 border-b border-white/20">
                <Monitor className="w-5 h-5 text-white/80" />
                <h3 className="text-lg font-semibold text-white">Actividad Reciente</h3>
              </div>
              
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-green-500/20 rounded-lg border border-green-500/30">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-500/30 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4 text-green-300" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">Inicio de sesión exitoso</p>
                        <p className="text-xs text-white/60">Hoy a las 09:30 AM desde Chrome en Windows</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-blue-500/20 rounded-lg border border-blue-500/30">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-500/30 rounded-full flex items-center justify-center">
                        <Smartphone className="w-4 h-4 text-blue-300" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">Acceso desde dispositivo móvil</p>
                        <p className="text-xs text-white/60">Ayer a las 06:15 PM desde Safari en iPhone</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-yellow-500/20 rounded-lg border border-yellow-500/30">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-yellow-500/30 rounded-full flex items-center justify-center">
                        <AlertTriangle className="w-4 h-4 text-yellow-300" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">Contraseña actualizada</p>
                        <p className="text-xs text-white/60">Hace 3 días</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Configuración de Seguridad */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 shadow-lg">
              <div className="flex items-center space-x-3 p-6 border-b border-white/20">
                <Shield className="w-5 h-5 text-white/80" />
                <h3 className="text-lg font-semibold text-white">Configuración de Seguridad</h3>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                  <div>
                    <p className="text-sm font-medium text-white">Autenticación de dos factores</p>
                    <p className="text-xs text-white/60">Protege tu cuenta con un código adicional</p>
                  </div>
                  <Button className="bg-green-600 hover:bg-green-700 text-white text-sm px-4 py-2">
                    Activar
                  </Button>
                </div>

                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                  <div>
                    <p className="text-sm font-medium text-white">Cerrar sesiones activas</p>
                    <p className="text-xs text-white/60">Cierra todas las sesiones en otros dispositivos</p>
                  </div>
                  <Button variant="outline" className="border-red-500/50 text-red-400 hover:bg-red-500/20 text-sm px-4 py-2">
                    <LogOut className="w-4 h-4 mr-2" />
                    Cerrar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-6">
            {/* Notificaciones por Email */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 shadow-lg">
              <div className="flex items-center space-x-3 p-6 border-b border-white/20">
                <Mail className="w-5 h-5 text-white/80" />
                <h3 className="text-lg font-semibold text-white">Notificaciones por Email</h3>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">Nuevas solicitudes</p>
                    <p className="text-xs text-white/60">Recibir email cuando se crea una nueva solicitud</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifications.emailSolicitudes}
                      onChange={(e) => handleNotificationChange('emailSolicitudes', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">Respuestas a solicitudes</p>
                    <p className="text-xs text-white/60">Notificar cuando hay respuestas o cambios de estado</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifications.emailRespuestas}
                      onChange={(e) => handleNotificationChange('emailRespuestas', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">Reporte semanal</p>
                    <p className="text-xs text-white/60">Resumen semanal de actividad</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifications.weeklyReport}
                      onChange={(e) => handleNotificationChange('weeklyReport', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* Notificaciones Push */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 shadow-lg">
              <div className="flex items-center space-x-3 p-6 border-b border-white/20">
                <Bell className="w-5 h-5 text-white/80" />
                <h3 className="text-lg font-semibold text-white">Notificaciones Push</h3>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">Solicitudes urgentes</p>
                    <p className="text-xs text-white/60">Notificaciones inmediatas para solicitudes prioritarias</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifications.pushSolicitudes}
                      onChange={(e) => handleNotificationChange('pushSolicitudes', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">Respuestas rápidas</p>
                    <p className="text-xs text-white/60">Notificar inmediatamente las respuestas</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifications.pushRespuestas}
                      onChange={(e) => handleNotificationChange('pushRespuestas', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <Button
                  onClick={handleSaveNotifications}
                  disabled={loading}
                  className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-all hover:scale-105"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {loading ? 'Guardando...' : 'Guardar Preferencias'}
                </Button>
              </div>
            </div>
          </div>
        );

      case 'preferences':
        return (
          <div className="space-y-6">
            {/* Preferencias de Interfaz */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 shadow-lg">
              <div className="flex items-center space-x-3 p-6 border-b border-white/20">
                <Monitor className="w-5 h-5 text-white/80" />
                <h3 className="text-lg font-semibold text-white">Preferencias de Interfaz</h3>
              </div>
              
              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-3">Tema</label>
                  <div className="grid grid-cols-3 gap-3">
                    <label className="relative cursor-pointer">
                      <input
                        type="radio"
                        name="theme"
                        value="light"
                        checked={preferences.theme === 'light'}
                        onChange={(e) => handlePreferenceChange('theme', e.target.value)}
                        className="sr-only peer"
                      />
                      <div className="p-3 bg-white/5 border border-white/10 rounded-lg peer-checked:border-blue-400 peer-checked:bg-blue-500/20 transition-all">
                        <div className="text-center">
                          <div className="w-8 h-8 bg-white rounded mx-auto mb-2"></div>
                          <span className="text-xs text-white">Claro</span>
                        </div>
                      </div>
                    </label>
                    
                    <label className="relative cursor-pointer">
                      <input
                        type="radio"
                        name="theme"
                        value="dark"
                        checked={preferences.theme === 'dark'}
                        onChange={(e) => handlePreferenceChange('theme', e.target.value)}
                        className="sr-only peer"
                      />
                      <div className="p-3 bg-white/5 border border-white/10 rounded-lg peer-checked:border-blue-400 peer-checked:bg-blue-500/20 transition-all">
                        <div className="text-center">
                          <div className="w-8 h-8 bg-gray-800 rounded mx-auto mb-2"></div>
                          <span className="text-xs text-white">Oscuro</span>
                        </div>
                      </div>
                    </label>
                    
                    <label className="relative cursor-pointer">
                      <input
                        type="radio"
                        name="theme"
                        value="system"
                        checked={preferences.theme === 'system'}
                        onChange={(e) => handlePreferenceChange('theme', e.target.value)}
                        className="sr-only peer"
                      />
                      <div className="p-3 bg-white/5 border border-white/10 rounded-lg peer-checked:border-blue-400 peer-checked:bg-blue-500/20 transition-all">
                        <div className="text-center">
                          <div className="w-8 h-8 bg-gradient-to-r from-white to-gray-800 rounded mx-auto mb-2"></div>
                          <span className="text-xs text-white">Sistema</span>
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Idioma</label>
                  <select
                    value={preferences.language}
                    onChange={(e) => handlePreferenceChange('language', e.target.value)}
                    className="w-full px-4 py-3 bg-white/90 border border-white/30 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-gray-900"
                  >
                    <option value="es">Español</option>
                    <option value="en">English</option>
                    <option value="pt">Português</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Zona Horaria</label>
                  <select
                    value={preferences.timezone}
                    onChange={(e) => handlePreferenceChange('timezone', e.target.value)}
                    className="w-full px-4 py-3 bg-white/90 border border-white/30 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-gray-900"
                  >
                    <option value="America/Bogota">Bogotá (GMT-5)</option>
                    <option value="America/Mexico_City">Ciudad de México (GMT-6)</option>
                    <option value="America/Lima">Lima (GMT-5)</option>
                    <option value="America/Buenos_Aires">Buenos Aires (GMT-3)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Formato de Fecha</label>
                  <select
                    value={preferences.dateFormat}
                    onChange={(e) => handlePreferenceChange('dateFormat', e.target.value)}
                    className="w-full px-4 py-3 bg-white/90 border border-white/30 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-gray-900"
                  >
                    <option value="DD/MM/YYYY">DD/MM/AAAA</option>
                    <option value="MM/DD/YYYY">MM/DD/AAAA</option>
                    <option value="YYYY-MM-DD">AAAA-MM-DD</option>
                  </select>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-white">Autoguardado</p>
                      <p className="text-xs text-white/60">Guardar automáticamente los cambios</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.autoSave}
                        onChange={(e) => handlePreferenceChange('autoSave', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-white">Vista compacta</p>
                      <p className="text-xs text-white/60">Mostrar más información en menos espacio</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.compactView}
                        onChange={(e) => handlePreferenceChange('compactView', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>

                <Button
                  onClick={handleSavePreferences}
                  disabled={loading}
                  className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-all hover:scale-105"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {loading ? 'Guardando...' : 'Guardar Preferencias'}
                </Button>
              </div>
            </div>

            {/* Exportar Datos */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 shadow-lg">
              <div className="flex items-center space-x-3 p-6 border-b border-white/20">
                <Download className="w-5 h-5 text-white/80" />
                <h3 className="text-lg font-semibold text-white">Exportar Datos</h3>
              </div>
              
              <div className="p-6">
                <p className="text-white/80 text-sm mb-4">
                  Descarga una copia de tus datos personales y estadísticas de la plataforma.
                </p>
                <Button
                  onClick={handleExportData}
                  className="bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-lg transition-all hover:scale-105"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Exportar Mis Datos
                </Button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <ProtectedRoute requiredRoles={['solicitante']}>
      <div className="min-h-screen font-montserrat" style={{background: 'linear-gradient(135deg, #0A1933 0%, #004AB7 50%, #0057D9 100%)'}}>
        {/* Header Mejorado */}
        <header className="bg-white/10 backdrop-blur-sm border-b border-white/20">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.history.back()}
                  className="text-white border-white/30 hover:bg-white/10 hover:border-white/50"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Volver
                </Button>
                <div className="h-8 w-px bg-white/30"></div>
                <div>
                  <h1 className="text-xl font-bold text-white">Mi Perfil</h1>
                  <p className="text-sm text-white/80">Gestiona tu información personal</p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm font-medium text-white">{user?.nombre}</p>
                  <p className="text-xs text-white/80">Solicitante</p>
                </div>
                <div className="relative">
                  {profileImage ? (
                    <Image
                      src={profileImage}
                      alt="Profile"
                      width={32}
                      height={32}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                      <span className="text-sm font-bold text-white">
                        {user?.nombre?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Breadcrumb */}
        <div className="bg-white/5 backdrop-blur-sm border-b border-white/10">
          <div className="max-w-7xl mx-auto px-6 py-3">
            <nav className="flex items-center space-x-2 text-sm">
              <span className="text-white/70">Dashboard</span>
              <span className="text-white/50">›</span>
              <span className="text-white/70">Solicitante</span>
              <span className="text-white/50">›</span>
              <span className="text-white font-medium">Mi Perfil</span>
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Sidebar con Avatar y Estadísticas */}
            <div className="lg:col-span-4 space-y-6">
              {/* Card de Perfil */
              <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6 shadow-lg">
                <div className="text-center">
                  <div className="relative inline-block">
                    {profileImage ? (
                      <Image
                        src={profileImage}
                        alt="Profile"
                        width={96}
                        height={96}
                        className="w-24 h-24 rounded-full object-cover shadow-lg"
                      />
                    ) : (
                      <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                        <span className="text-2xl font-bold text-white">
                          {user?.nombre?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute -bottom-1 -right-1 w-7 h-7 bg-white rounded-full shadow-lg flex items-center justify-center border-2 border-blue-200 hover:bg-blue-50 transition-colors"
                    >
                      <Camera className="w-3 h-3 text-blue-600" />
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </div>
                  
                  <div className="mt-4">
                    <h2 className="text-xl font-bold text-white">{user?.nombre}</h2>
                    <p className="text-white/80">{formData.email}</p>
                    <div className="mt-3 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-300 border border-green-500/30">
                      <Crown className="w-3 h-3 mr-1 text-yellow-400" />
                      Solicitante Premium
                    </div>
                  </div>
                  
                  <div className="mt-6 pt-6 border-t border-white/20">
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <p className="text-2xl font-bold text-white">24</p>
                        <p className="text-xs text-white/70">Solicitudes</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-green-400">18</p>
                        <p className="text-xs text-white/70">Aprobadas</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Estadísticas Detalladas */}
              <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Estadísticas</h3>
                  <Activity className="w-5 h-5 text-white/60" />
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-green-500/20 rounded-lg border border-green-500/30">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-500/30 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4 text-green-300" />
                      </div>
                      <span className="text-sm font-medium text-white">Aprobadas</span>
                    </div>
                    <span className="text-lg font-bold text-green-400">18</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-yellow-500/20 rounded-lg border border-yellow-500/30">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-yellow-500/30 rounded-full flex items-center justify-center">
                        <Clock className="w-4 h-4 text-yellow-300" />
                      </div>
                      <span className="text-sm font-medium text-white">Pendientes</span>
                    </div>
                    <span className="text-lg font-bold text-yellow-400">4</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-red-500/20 rounded-lg border border-red-500/30">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-red-500/30 rounded-full flex items-center justify-center">
                        <X className="w-4 h-4 text-red-300" />
                      </div>
                      <span className="text-sm font-medium text-white">Rechazadas</span>
                    </div>
                    <span className="text-lg font-bold text-red-400">2</span>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-white/20">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/70">Tasa de éxito</span>
                    <span className="font-semibold text-white">75%</span>
                  </div>
                  <div className="mt-2 w-full bg-white/20 rounded-full h-2">
                    <div className="bg-green-400 h-2 rounded-full transition-all duration-1000" style={{width: '75%'}}></div>
                  </div>
                </div>
              </div>

              {/* Información de Membresía */}
              <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6 shadow-lg">
                <div className="flex items-center space-x-3 mb-4">
                  <Award className="w-5 h-5 text-blue-400" />
                  <h3 className="text-lg font-semibold text-white">Membresía</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-white/70">Miembro desde</span>
                    <span className="text-sm font-medium text-white">Enero 2023</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-white/70">Último acceso</span>
                    <span className="text-sm font-medium text-white">Hoy</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-white/70">Estado</span>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-300 border border-green-500/30">
                      <Zap className="w-3 h-3 mr-1" />
                      Premium Activo
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Contenido Principal con Tabs */}
            <div className="lg:col-span-8">
              {/* Navigation Tabs */}
              <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 mb-6 p-2">
                <div className="flex space-x-1 overflow-x-auto">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center space-x-2 px-4 py-3 rounded-lg font-medium text-sm transition-all whitespace-nowrap ${
                        activeTab === tab.id
                          ? 'bg-blue-600 text-white shadow-lg'
                          : 'text-white/80 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      {tab.icon}
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab Content */}
              {renderTabContent()}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}