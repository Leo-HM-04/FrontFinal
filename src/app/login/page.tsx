'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Eye, EyeOff } from 'lucide-react';
import Image from 'next/image';
import { toast } from 'react-hot-toast';

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

  const redirectByRole = (rol: string) => {
    const routes: Record<string, string> = {
      admin_general: '/dashboard/admin',
      solicitante: '/dashboard/solicitante',
      aprobador: '/dashboard/aprobador',
      pagador_banca: '/dashboard/pagador',
    };
    router.push(routes[rol] || '/dashboard');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const { success, user } = await login({ email, password });

      if (success && user) {
        redirectByRole(user.rol);
      } else {
        toast.error('Credenciales inválidas o error al iniciar sesión.');
      }
    } catch (error) {
      toast.error('Ocurrió un error inesperado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 via-blue-50 to-blue-100 font-montserrat">
      <div className="w-full max-w-sm md:max-w-md lg:max-w-lg flex flex-col items-center justify-center px-4 py-8">
        <div className="text-center mb-8 w-full flex justify-center">
          <div className="relative flex items-center justify-center">
            <span className="absolute w-36 h-36 md:w-44 md:h-44 rounded-full bg-blue-600/10 blur-xl"></span>
            <Image
              src="/assets/images/bechapra-logo.png"
              alt="Logo de la plataforma Bechapra"
              width={180}
              height={70}
              className="mx-auto drop-shadow-lg animate-fade-in"
              priority
              sizes="(max-width: 768px) 140px, 180px"
            />
          </div>
        </div>

        <div className="w-full bg-gradient-to-br from-blue-600 to-blue-700 rounded-3xl shadow-2xl p-8 text-white backdrop-blur-sm flex flex-col items-center">
          <div className="text-center mb-8 w-full">
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 font-montserrat">Inicio de sesión</h1>
            <div className="w-16 h-1 bg-white/30 mx-auto rounded-full"></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 w-full">
            {/* Usuario */}
            <div className="flex flex-col gap-2 w-full">
              <label className="text-white font-semibold text-base font-montserrat" htmlFor="email">
                Usuario
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="correo@gmail.com"
                className="px-4 py-3 rounded-xl bg-white/95 text-gray-800 placeholder-gray-500 border-0 focus:outline-none focus:ring-2 focus:ring-white/70 focus:bg-white focus:shadow-lg transition-all duration-200 font-montserrat w-full"
                autoFocus
                autoComplete="username"
              />
            </div>
            {errors.email && (
              <p className="text-sm text-red-200 font-montserrat animate-fade-in mt-1">{errors.email}</p>
            )}

            {/* Contraseña */}
            <div className="flex flex-col gap-2 w-full">
              <label className="text-white font-semibold text-base font-montserrat" htmlFor="password">
                Contraseña
              </label>
              <div className="relative w-full">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Contraseña"
                  className="w-full px-4 py-3 pr-12 rounded-xl bg-white/95 text-gray-800 placeholder-gray-500 border-0 focus:outline-none focus:ring-2 focus:ring-white/70 focus:bg-white focus:shadow-lg transition-all duration-200 font-montserrat"
                  autoComplete="off"
                  inputMode="text"
                />
                {password && (
                  <button
                    type="button"
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors p-1 rounded-md hover:bg-gray-100"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label="Mostrar/ocultar contraseña"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                )}
              </div>
            </div>
            {errors.password && (
              <p className="text-sm text-red-200 font-montserrat animate-fade-in mt-1">{errors.password}</p>
            )}

            {/* Botón */}
            <div className="pt-6 flex justify-center w-full">
              <button
                type="submit"
                disabled={loading}
                className="bg-white text-blue-600 px-10 py-3 rounded-xl font-semibold hover:bg-gray-50 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed min-w-[140px] transform hover:scale-105 font-montserrat"
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

        <div className="text-center mt-6 w-full">
          <p className="text-blue-600 font-medium font-montserrat">
            ¿Problemas para iniciar sesión?{' '}
            <a
              href="mailto:kikeramirez160418@gmail.com?subject=Problema%20con%20inicio%20de%20sesión"
              className="underline hover:text-blue-700 transition-colors"
            >
              Contacta con administración
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
