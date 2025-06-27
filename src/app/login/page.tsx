'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import Image from 'next/image';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({ email: '', password: '' });

  const { login } = useAuth();
  const router = useRouter();

  const validateForm = () => {
    const newErrors = { email: '', password: '' };
    
    if (!email) {
      newErrors.email = 'El email es requerido';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'El email no es válido';
    }
    
    if (!password) {
      newErrors.password = 'La contraseña es requerida';
    } else if (password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    }
    
    setErrors(newErrors);
    return !newErrors.email && !newErrors.password;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    const success = await login({ email, password });
    
    if (success) {
      // Obtener el usuario del contexto después del login exitoso
      const userData = localStorage.getItem('auth_user');
      if (userData) {
        const user = JSON.parse(userData);
        
        // Redireccionar según el rol del usuario
        switch (user.rol) {
          case 'admin_general':
            router.push('/dashboard/admin');
            break;
          case 'solicitante':
            router.push('/dashboard/solicitante');
            break;
          case 'aprobador':
            router.push('/dashboard/aprobador');
            break;
          case 'pagador_banca':
            router.push('/dashboard/pagador');
            break;
          default:
            router.push('/dashboard');
            break;
        }
      } else {
        router.push('/dashboard');
      }
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center p-4 font-montserrat">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Image
            src="/assets/images/bechapra-logo.png" 
            alt="Bechapra Logo"
            width={200}
            height={80}
            className="mx-auto drop-shadow-sm"
            priority
          />
        </div>

        {/* Card de Login */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-3xl shadow-2xl p-8 text-white backdrop-blur-sm">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white mb-2 font-montserrat">
              Inicio de sesión
            </h1>
            <div className="w-16 h-1 bg-white/30 mx-auto rounded-full"></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Campo Usuario */}
            <div className="flex items-center space-x-4">
              <label className="text-white font-medium text-lg min-w-[100px] text-right font-montserrat">
                Usuario:
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="correo@example.com"
                className="flex-1 px-4 py-3 rounded-xl bg-white/95 text-gray-800 placeholder-gray-500 border-0 focus:outline-none focus:ring-2 focus:ring-white/70 focus:bg-white focus:shadow-lg transition-all duration-300 font-montserrat"
              />
            </div>
            {errors.email && (
              <p className="text-sm text-red-200 ml-[116px] font-montserrat animate-fade-in">{errors.email}</p>
            )}

            {/* Campo Contraseña */}
            <div className="flex items-center space-x-4">
              <label className="text-white font-medium text-lg min-w-[100px] text-right font-montserrat">
                Contraseña:
              </label>
              <div className="relative flex-1">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mayus activado"
                  className="w-full px-4 py-3 pr-12 rounded-xl bg-white/95 text-gray-800 placeholder-gray-500 border-0 focus:outline-none focus:ring-2 focus:ring-white/70 focus:bg-white focus:shadow-lg transition-all duration-300 font-montserrat"
                />
                <button
                  type="button"
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors p-1 rounded-md hover:bg-gray-100"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
            {errors.password && (
              <p className="text-sm text-red-200 ml-[116px] font-montserrat animate-fade-in">{errors.password}</p>
            )}

            {/* Botón Ingresar */}
            <div className="pt-6 flex justify-center">
              <button
                type="submit"
                disabled={loading}
                className="bg-white text-blue-600 px-10 py-3 rounded-xl font-semibold hover:bg-gray-50 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed min-w-[140px] transform hover:scale-105 font-montserrat"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                    Ingresando...
                  </div>
                ) : (
                  'Ingresar'
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Enlaces de ayuda */}
        <div className="text-center mt-6">
          <p className="text-blue-600 font-medium font-montserrat">
            ¿Problemas para iniciar sesión?{' '}
            <button className="underline hover:text-blue-700 transition-colors">
              Contacta con administración
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}