'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ArrowLeft, Save, AlertCircle } from 'lucide-react';
import { UsuariosService } from '@/services/usuarios.service';
import { User as UserType } from '@/types';
import { toast } from 'react-hot-toast';

const Button = ({ children, variant = 'primary', size = 'md', className = '', onClick, disabled, ...props }) => {
    const baseClasses = "inline-flex items-center justify-center font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
    const variantClasses = variant === 'outline' ? 'border' : '';
    const sizeClasses = size === 'sm' ? 'text-sm px-4 py-2' : 'text-base px-6 py-3';
    
    return (
        <button 
        className={`${baseClasses} ${variantClasses} ${sizeClasses} ${className}`}
        onClick={onClick}
        disabled={disabled}
        {...props}
        >
        {children}
        </button>
    );
};

export default function EditUsuarioPage() {
    const params = useParams();
    const [usuario, setUsuario] = useState<UserType | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        nombre: '',
        email: '',
        rol: ''
    });

    useEffect(() => {
        if (params.id) {
        fetchUsuario(params.id as string);
        }
    }, [params.id]);

    const fetchUsuario = async (id: string) => {
        try {
        const data = await UsuariosService.getById(id);
        setUsuario(data);
        setFormData({
            nombre: data.nombre,
            email: data.email,
            rol: data.rol
        });
        } catch (error) {
        console.error('Error fetching usuario:', error);
        setError('Error al cargar los datos del usuario');
        } finally {
        setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!usuario) return;

        setSaving(true);
        try {
        await UsuariosService.update(usuario.id_usuario, formData);
        toast.success('Usuario actualizado exitosamente');
        window.location.href = `/dashboard/admin/usuarios/${usuario.id_usuario}`;
        } catch (error) {
        console.error('Error updating usuario:', error);
        toast.error('Error al actualizar el usuario');
        } finally {
        setSaving(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
        }));
    };

    if (loading) {
        return (
        <div className="min-h-screen flex items-center justify-center" style={{background: 'linear-gradient(135deg, #0A1933 0%, #004AB7 50%, #0057D9 100%)'}}>
            <div className="text-white text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-lg">Cargando datos del usuario...</p>
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
            <div className="flex items-center space-x-4">
                <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.href = `/dashboard/admin/usuarios/${params.id}`}
                className="text-white border-white/30 hover:bg-white/10"
                >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver
                </Button>
                <div>
                <h1 className="text-2xl font-bold text-white">Editar Usuario</h1>
                <p className="text-white/80">Modificar información del usuario</p>
                </div>
            </div>
            </div>

            {/* Edit Form */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Nombre */}
                <div>
                    <label className="block text-white font-medium mb-2">
                    Nombre completo
                    </label>
                    <input
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ingrese el nombre completo"
                    />
                </div>

                {/* Email */}
                <div>
                    <label className="block text-white font-medium mb-2">
                    Correo electrónico
                    </label>
                    <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ingrese el correo electrónico"
                    />
                </div>

                {/* Rol */}
                <div className="md:col-span-2">
                    <label className="block text-white font-medium mb-2">
                    Rol
                    </label>
                    <select
                    name="rol"
                    value={formData.rol}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                    <option value="">Seleccionar rol</option>
                    <option value="admin_general">Administrador General</option>
                    <option value="solicitante">Solicitante</option>
                    <option value="aprobador">Aprobador</option>
                    <option value="pagador_banca">Pagador</option>
                    </select>
                </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end space-x-4 pt-6 border-t border-white/20">
                <Button
                    type="button"
                    variant="outline"
                    className="text-white border-white/30 hover:bg-white/10"
                    onClick={() => window.location.href = `/dashboard/admin/usuarios/${params.id}`}
                >
                    Cancelar
                </Button>
                <Button
                    type="submit"
                    disabled={saving}
                    className="bg-white hover:bg-gray-50 font-semibold px-8 py-3 rounded-xl"
                    style={{color: '#004AB7'}}
                >
                    {saving ? (
                    <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                        Guardando...
                    </>
                    ) : (
                    <>
                        <Save className="w-4 h-4 mr-2" />
                        Guardar Cambios
                    </>
                    )}
                </Button>
                </div>
            </form>
            </div>
        </div>
        </div>
    );
}