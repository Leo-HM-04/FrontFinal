'use client';

import { useState } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
// import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { User, Mail, Shield } from 'lucide-react';
import LogoBechapra from '@/components/LogoBechapra';
import { useAuth } from '@/contexts/AuthContext';
// import { UsuariosService, UpdateProfileData, ChangePasswordData } from '@/services/usuarios.service';
// import { toast } from 'react-hot-toast';

interface TabType {
  id: string;
  label: string;
  icon: React.ReactNode;
}

const tabs: TabType[] = [
  { id: 'personal', label: 'Información Personal', icon: <User className="w-4 h-4" /> },
];

export default function AdminProfilePage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('personal');

  const renderPersonalInfo = () => (
    <div className="space-y-7">
      <h2 className="text-2xl font-extrabold text-white tracking-tight font-montserrat">Información Personal</h2>
      <div className="relative rounded-2xl p-8 border border-white/20 shadow-2xl overflow-hidden">
        <div className="absolute inset-0 z-0 bg-gradient-to-br from-blue-100/30 via-white/10 to-purple-100/20 pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row items-center gap-8 mb-10 z-10">
          <div className="relative w-28 h-28 flex-shrink-0 flex items-center justify-center rounded-full overflow-hidden bg-white/40 shadow-2xl ring-4 ring-white/40 transition-transform duration-300 hover:scale-105 hover:shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] cursor-pointer">
            <LogoBechapra size={112} />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h3 className="text-2xl font-extrabold text-white font-montserrat leading-tight drop-shadow">{user?.nombre}</h3>
            <p className="text-white/80 text-lg font-medium mt-1 drop-shadow">Administrador General</p>
          </div>
        </div>
        <div className="relative grid grid-cols-1 md:grid-cols-2 gap-8 z-10">
          <div>
            <label className="block text-white/80 text-sm font-semibold mb-2 tracking-wide">
              <User className="w-4 h-4 inline mr-2 align-text-bottom" />
              Nombre completo
            </label>
            <Input
              type="text"
              value={user?.nombre || ''}
              disabled
              className="bg-white/20 border-white/20 text-white cursor-not-allowed font-semibold placeholder-white/60 focus:ring-2 focus:ring-blue-400/40"
            />
          </div>
          <div>
            <label className="block text-white/80 text-sm font-semibold mb-2 tracking-wide">
              <Mail className="w-4 h-4 inline mr-2 align-text-bottom" />
              Correo electrónico
            </label>
            <Input
              type="email"
              value={user?.email || ''}
              disabled
              className="bg-white/20 border-white/20 text-white cursor-not-allowed font-semibold placeholder-white/60 focus:ring-2 focus:ring-blue-400/40"
            />
          </div>
          <div>
            <label className="block text-white/80 text-sm font-semibold mb-2 tracking-wide">
              <Shield className="w-4 h-4 inline mr-2 align-text-bottom" />
              Cargo
            </label>
            <Input
              type="text"
              value="Administrador General"
              disabled
              className="bg-white/20 border-white/20 text-white cursor-not-allowed font-semibold placeholder-white/60 focus:ring-2 focus:ring-blue-400/40"
            />
            <p className="text-xs text-white/60 mt-1">El cargo no puede ser modificado</p>
          </div>
        </div>
      </div>
    </div>
  );


  // renderNotifications eliminado

  const renderTabContent = () => {
    switch (activeTab) {
      case 'personal':
        return renderPersonalInfo();
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
