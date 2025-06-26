'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ArrowLeft, User, Mail, Calendar, Shield, AlertCircle } from 'lucide-react';
import { UsuariosService } from '@/services/usuarios.service';
import { User as UserType } from '@/types';

    const Button = ({ children, variant = 'primary', size = 'md', className = '', onClick, ...props }) => {
    const baseClasses = "inline-flex items-center justify-center font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2";
    const variantClasses = variant === 'outline' ? 'border' : '';
    const sizeClasses = size === 'sm' ? 'text-sm px-4 py-2' : 'text-base px-6 py-3';
    
    return (
        <button 
        className={`${baseClasses} ${variantClasses} ${sizeClasses} ${className}`}
        onClick={onClick}
        {...props}
        >
        {children}
        </button>
    );
    };

export default function UsuarioDetailPage() {
    const params = useParams();
    const [usuario, setUsuario] = useState<UserType | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (params.id) {
        fetchUsuario(params.id as string);
        }
    }, [params.id]);

    const fetchUsuario = async (id: string) => {
        try {
        const data = await UsuariosService.getById(id);
        setUsuario(data);
        } catch (error) {
        console.error('Error fetching usuario:', error);
        setError('Error al cargar los detalles del usuario');
        } finally {
        setLoading(false);
        }
    };

    const getRoleLabel = (role: string) => {
        const roles = {
        admin_general: 'Administrador General',
        solicitante: 'Solicitante',
        aprobador: 'Aprobador',
        pagador_banca: 'Pagador'
        };
        return roles[role as keyof typeof roles] || role;
    };

    if (loading) {
        return (
        <div className="min-h-screen flex items-center justify-center" style={{background: 'linear-gradient(135deg, #0A1933 0%, #004AB7 50%, #0057D9 100%)'}}>
            <div className="text-white text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-lg">Cargando detalles del usuario...</p>
            </div>
        </div>
        );
    }

    if (error) {
        return (
        <div className="min-h-screen flex items-center justify-center" style={{background: 'linear-gradient(135deg, #0A1933 0%, #004AB7 50%, #0057D9 100%)'}}>
            <div className="text-white text-center">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-400" />
            <p className="text-lg">{error}</p>
            <Button
                variant="outline"
                className="mt-4 text-white border-white/30 hover:bg-white/10"
                onClick={() => window.location.href = '/dashboard/admin/usuarios'}
            >
                Volver a la lista
            </Button>
            </div>
        </div>
        );
    }

    return (
        <div className="min-h-screen font-montserrat" style={{background: 'linear-gradient(135deg, #0A1933 0%, #004AB7 50%, #0057D9 100%)'}}>
        <div className="max-w-4xl mx-auto px-4 py-8">
            {/* Header */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-white/20">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.location.href = '/dashboard/admin/usuarios'}
                    className="text-white border-white/30 hover:bg-white/10"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Volver
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-white">Detalles del Usuario</h1>
                    <p className="text-white/80">Información completa del usuario</p>
                </div>
                </div>
                <Button
                className="bg-white hover:bg-gray-50 font-semibold px-6 py-3 rounded-xl"
                style={{color: '#004AB7'}}
                onClick={() => window.location.href = `/dashboard/admin/usuarios/${params.id}/edit`}
                >
                Editar Usuario
                </Button>
            </div>
            </div>

            {/* User Details */}
            {usuario && (
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Información Personal */}
                <div className="space-y-6">
                    <h2 className="text-xl font-semibold text-white border-b border-white/20 pb-2">
                    Información Personal
                    </h2>
                    
                    <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                        <User className="w-5 h-5 text-white/70" />
                        <div>
                        <p className="text-white/70 text-sm">Nombre completo</p>
                        <p className="text-white font-medium">{usuario.nombre}</p>
                        </div>
                    </div>

                    <div className="flex items-center space-x-3">
                        <Mail className="w-5 h-5 text-white/70" />
                        <div>
                        <p className="text-white/70 text-sm">Correo electrónico</p>
                        <p className="text-white font-medium">{usuario.email}</p>
                        </div>
                    </div>

                    <div className="flex items-center space-x-3">
                        <Shield className="w-5 h-5 text-white/70" />
                        <div>
                        <p className="text-white/70 text-sm">Rol</p>
                        <span className="inline-flex px-3 py-1 text-sm font-semibold rounded-full text-white" style={{backgroundColor: '#004AB7'}}>
                            {getRoleLabel(usuario.rol)}
                        </span>
                        </div>
                    </div>
                    </div>
                </div>

                {/* Estado y Fechas */}
                <div className="space-y-6">
                    <h2 className="text-xl font-semibold text-white border-b border-white/20 pb-2">
                    Fechas
                    </h2>
                    
                    <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                        <Calendar className="w-5 h-5 text-white/70" />
                        <div>
                        <p className="text-white/70 text-sm">Fecha de registro</p>
                        <p className="text-white font-medium">
                            {new Date(usuario.created_at).toLocaleDateString('es-CO', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                            })}
                        </p>
                        </div>
                    </div>

                    <div className="flex items-center space-x-3">
                        <Calendar className="w-5 h-5 text-white/70" />
                        <div>
                        <p className="text-white/70 text-sm">Última actualización</p>
                        <p className="text-white font-medium">
                            {new Date(usuario.updated_at).toLocaleDateString('es-CO', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                            })}
                        </p>
                        </div>
                    </div>
                    </div>
                </div>
                </div>

                {/* ID del Usuario */}
                <div className="mt-8 pt-6 border-t border-white/20">
                <div className="bg-white/5 rounded-lg p-4">
                    <p className="text-white/70 text-sm mb-1">ID del Usuario</p>
                    <p className="text-white font-mono text-lg">{usuario.id_usuario}</p>
                </div>
                </div>
            </div>
            )}
        </div>
        </div>
    );
}
