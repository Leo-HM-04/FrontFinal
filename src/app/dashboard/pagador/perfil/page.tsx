'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { PagadorLayout } from '@/components/layout/PagadorLayout';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { User, Mail, Shield, Calendar } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-hot-toast';
import Image from 'next/image';

export default function PerfilPagador() {
    const { user } = useAuth();
    
    const handleContactAdmin = () => {
        // Abrir correo electrónico del administrador
        window.location.href = `mailto:automatizaciones@bechapra.com.mx?subject=Solicitud de cambio de datos - Usuario ${user?.nombre}&body=Hola administrador,%0D%0A%0D%0ASoy ${user?.nombre} con rol de Pagador. Necesito realizar los siguientes cambios en mi información:%0D%0A%0D%0A[Describa los cambios requeridos]%0D%0A%0D%0AGracias.`;
        toast.success('Abriendo su cliente de correo...');
    };

    return (
        <ProtectedRoute requiredRoles={['pagador_banca']}>
            <PagadorLayout>
                <div className="max-w-5xl mx-auto px-6 py-8">
                {/* Header */}
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-white/20">
                    <div className="flex items-center space-x-6">
                    <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center ring-4 ring-white/30 overflow-hidden">
                        <Image
                          src="/assets/images/Logo_1x1_Azul@2x.png"
                          alt="Foto de perfil Bechapra"
                          width={80}
                          height={80}
                          className="object-cover w-full h-full rounded-full"
                          priority
                        />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white font-sans">
                        {user?.nombre}
                        </h2>
                        <p className="text-white/80">
                        <span className="flex items-center">
                            <Mail className="w-4 h-4 mr-2" />
                            {user?.email}
                        </span>
                        </p>
                        <p className="text-white/80 mt-1">
                        <span className="flex items-center">
                            <Shield className="w-4 h-4 mr-2" />
                            Rol: Pagador Banca
                        </span>
                        </p>
                    </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Información Personal */}
                    <Card className="bg-white/10 backdrop-blur-sm border border-white/20 p-6">
                    <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
                        <User className="w-5 h-5 mr-2 text-blue-300" />
                        Información Personal
                    </h3>
                    
                    <div className="space-y-6">
                        <div>
                        <p className="text-white/80 text-sm mb-2">Nombre:</p>
                        <p className="text-white text-lg font-medium">{user?.nombre || 'No disponible'}</p>
                        </div>
                        
                        <div>
                        <p className="text-white/80 text-sm mb-2">Correo Electrónico:</p>
                        <p className="text-white text-lg font-medium">{user?.email || 'No disponible'}</p>
                        </div>
                        
                        <div>
                        <p className="text-white/80 text-sm mb-2">Rol:</p>
                        <p className="text-white text-lg font-medium flex items-center">
                            <Shield className="w-4 h-4 mr-2 text-blue-300" />
                            Pagador Banca
                        </p>
                        </div>

                        <div>
                        <p className="text-white/80 text-sm mb-2">Fecha de Registro:</p>
                        <p className="text-white text-lg font-medium flex items-center">
                            <Calendar className="w-4 h-4 mr-2 text-blue-300" />
                            {new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                        </div>
                        
                        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mt-4">
                        <h4 className="text-yellow-300 font-medium mb-2 flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            Nota Importante
                        </h4>
                        <p className="text-white/90 text-sm">
                            Como pagador, no puedes modificar tu información personal. Solo el administrador puede realizar estos cambios.
                        </p>
                        </div>
                    </div>
                    </Card>

                    {/* Contactar al Administrador */}
                    <Card className="bg-white/10 backdrop-blur-sm border border-white/20 p-6">
                    <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
                        <Mail className="w-5 h-5 mr-2 text-blue-300" />
                        Contactar al Administrador
                    </h3>
                    
                    <div className="space-y-6">
                        <p className="text-white/80">
                        Si necesitas realizar cambios en tu información personal o tienes problemas con tu cuenta, 
                        por favor contacta al administrador del sistema.
                        </p>
                        
                        <div className="bg-white/5 p-4 rounded-lg">
                        <p className="text-white/90 text-sm mb-1">Correo del Administrador:</p>
                        <p className="text-white font-medium">automatizaciones@bechapra.com.mx</p>
                        </div>
                        
                        <div className="pt-4">
                        <Button
                            onClick={handleContactAdmin}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            <Mail className="w-4 h-4 mr-2" />
                            Enviar Correo al Administrador
                        </Button>
                        </div>
                    </div>
                    </Card>
                </div>
                </div>
            </PagadorLayout>
        </ProtectedRoute>
    );
}
