'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Eye, EyeOff } from 'lucide-react';
import Image from 'next/image';
import { toast } from 'react-hot-toast';

const roleRoutes: Record<string, string> = {
  admin_general: '/dashboard/admin',
  solicitante: '/dashboard/solicitante',
  aprobador: '/dashboard/aprobador',
  pagador_banca: '/dashboard/pagador',
};

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});

  const { login, user } = useAuth();
  const router = useRouter();

  // Redirige si ya está autenticado
  useEffect(() => {
    if (user) {
      const route = roleRoutes[user.rol];
      router.replace(route || '/dashboard');
    }
  }, [user, router]);

  // Prefetch de dashboards para navegación instantánea tras login
  useEffect(() => {
    Object.values(roleRoutes).forEach((route) => router.prefetch(route));
  }, [router]);

  const validateForm = () => {
    const newErrors: typeof errors = {};
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
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    try {
      const response = await login({ email, password });
      if (response.success && response.user) {
        router.replace('/home');
      } else if (response.error === 'USER_NOT_FOUND') {
        setErrors((prev) => ({ ...prev, email: 'El correo no está registrado' }));
        toast.error('El correo no está registrado.');
      } else if (response.error === 'INVALID_PASSWORD') {
        setErrors((prev) => ({ ...prev, password: 'Contraseña incorrecta' }));
        toast.error('Contraseña incorrecta.');
      } else {
        setErrors((prev) => ({ ...prev, general: 'Credenciales inválidas o error al iniciar sesión.' }));
        toast.error('Credenciales inválidas o error al iniciar sesión.');
      }
    } catch {
      setErrors((prev) => ({ ...prev, general: 'Ocurrió un error inesperado.' }));
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
              className="mx-auto drop-shadow-lg animate-fade-in max-w-[180px]"
              priority
              sizes="(max-width: 768px) 140px, 180px"
              style={{ height: 'auto' }}
            />
          </div>
        </div>

        <div className="w-full max-w-xl bg-gradient-to-br from-blue-600 to-blue-700 rounded-3xl shadow-2xl px-12 py-6 text-white backdrop-blur-sm flex flex-col items-center min-h-[340px]">
          <div className="text-center mb-8 w-full">
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 font-montserrat">Inicio de sesión</h1>
            <div className="w-16 h-1 bg-white/30 mx-auto rounded-full"></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 w-full" aria-busy={loading}>
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
                placeholder="correo@bechapra.com"
                className="px-4 py-3 rounded-xl bg-white/95 text-gray-800 placeholder-gray-500 border-0 focus:outline-none focus:ring-2 focus:ring-white/70 focus:bg-white focus:shadow-lg transition-all duration-200 font-montserrat w-full"
                autoFocus
                autoComplete="username"
                aria-label="Correo electrónico"
                aria-describedby={errors.email ? 'email-error' : undefined}
                disabled={loading}
              />
            </div>
            {errors.email && (
              <p id="email-error" className="text-sm text-red-200 font-montserrat animate-fade-in mt-1">{errors.email}</p>
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
                  autoComplete="current-password"
                  inputMode="text"
                  aria-label="Contraseña"
                  aria-describedby={errors.password ? 'password-error' : undefined}
                  disabled={loading}
                />
                {password && (
                  <button
                    type="button"
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors p-1 rounded-md hover:bg-gray-100"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    aria-pressed={showPassword}
                    tabIndex={0}
                    disabled={loading}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                )}
              </div>
            </div>
            {errors.password && (
              <p id="password-error" className="text-sm text-red-200 font-montserrat animate-fade-in mt-1">{errors.password}</p>
            )}

            {/* Error general */}
            {errors.general && (
              <p className="text-sm text-red-200 font-montserrat animate-fade-in mt-1">{errors.general}</p>
            )}

            {/* Botón */}
            <div className="pt-6 flex justify-center w-full">
              <button
                type="submit"
                disabled={loading}
                className="bg-white text-blue-600 px-10 py-3 rounded-xl font-semibold hover:bg-gray-50 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed min-w-[140px] transform hover:scale-105 font-montserrat"
                aria-busy={loading}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                    Validando...
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
              href="mailto:automatizaciones@bechapra.com.mx?subject=Problema%20con%20inicio%20de%20sesión"
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
