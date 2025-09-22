'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthService } from '@/services/auth.service';
import { toast } from 'react-hot-toast';
import Cookies from 'js-cookie';

// Importamos la definición de User desde types/index.ts
import { User as UserType } from '@/types';

// Usamos el mismo tipo que ya está definido en la aplicación
type User = UserType;

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (credentials: { email: string; password: string }) => Promise<{ success: boolean; user?: User; token?: string; error?: string }>;
  logout: () => void;
  isLoading: boolean;
  updateUserData: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      // Cambiar a usar Cookies en lugar de localStorage para consistencia
      const storedToken = Cookies.get('auth_token');
      const cachedUser = Cookies.get('user_data');
      // console.log('AuthContext InitAuth - Token:', !!storedToken, 'User data:', !!cachedUser);

      setToken(storedToken ?? null);
      if (storedToken && cachedUser) {
        try {
          const parsedUser = JSON.parse(cachedUser);
          setUser(parsedUser);
          // console.log('AuthContext InitAuth - Parsed user:', parsedUser);
        } catch (error) {
          console.error('Error parsing cached user:', error);
          Cookies.remove('auth_token');
          Cookies.remove('user_data');
        }
      }
      setIsLoading(false);
    };
    initAuth();
  }, []);

  const login = async (credentials: { email: string; password: string }): Promise<{ success: boolean; user?: User; token?: string; error?: string }> => {
    const result = await AuthService.login(credentials);
    // console.log('AuthContext Login - Result:', { success: result.success, hasUser: !!result.user, hasToken: !!result.token, userRole: result.user?.rol });
    if (result.success && result.user && result.token) {
      setUser(result.user);
      setToken(result.token);
      // Como respaldo adicional, también guardar en localStorage
      // para casos donde las cookies no funcionen como esperado
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_token', result.token);
        localStorage.setItem('auth_user', JSON.stringify(result.user));
      }
      // Verificar que las cookies se están guardando correctamente
      setTimeout(() => {
        const savedToken = Cookies.get('auth_token');
        const savedUser = Cookies.get('user_data');
        // console.log('AuthContext Login - Cookies after save:', { hasToken: !!savedToken, hasUser: !!savedUser });
      }, 100);
      // Los tokens ya se almacenan en AuthService.login() usando Cookies
      // No necesitamos duplicar el almacenamiento aquí
      toast.success(`Bienvenido ${result.user.nombre}`);
    } else if (result.error) {
      toast.error(result.error);
    }
    return result;
  };

  const logout = async () => {
    try {
      await AuthService.logout(); // Ya limpia las cookies internamente
      setUser(null);
      setToken(null);
      // Limpiar también localStorage por si algún componente lo usa
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      sessionStorage.clear();
      toast.success('Sesión cerrada correctamente');
    } catch (error) {
      console.error('Error durante el cierre de sesión:', error);
      toast.error('Error al cerrar sesión');
    }
  };

  const updateUserData = (updatedUser: User) => {
    setUser(updatedUser);
    // Mantener consistencia con cookies
    Cookies.set('user_data', JSON.stringify(updatedUser), {
      expires: 1/3,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading, updateUserData }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}