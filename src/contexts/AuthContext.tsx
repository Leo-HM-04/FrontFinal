'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthService } from '@/services/auth.service';
import { toast } from 'react-hot-toast';

// Importamos la definición de User desde types/index.ts
import { User as UserType } from '@/types';

// Usamos el mismo tipo que ya está definido en la aplicación
type User = UserType;

interface AuthContextType {
  user: User | null;
  login: (credentials: { email: string; password: string }) => Promise<{ success: boolean; user?: User; token?: string; error?: string }>;
  logout: () => void;
  isLoading: boolean;
  updateUserData: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('auth_token');
      const cachedUser = localStorage.getItem('auth_user');
      
      if (token && cachedUser) {
        try {
          setUser(JSON.parse(cachedUser));
        } catch (error) {
          console.error('Error parsing cached user:', error);
          localStorage.removeItem('auth_token');
          localStorage.removeItem('auth_user');
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (credentials: { email: string; password: string }): Promise<{ success: boolean; user?: User; token?: string; error?: string }> => {
    const result = await AuthService.login(credentials);
    if (result.success && result.user && result.token) {
      setUser(result.user);
      localStorage.setItem('auth_token', result.token);
      localStorage.setItem('auth_user', JSON.stringify(result.user));
      toast.success(`Bienvenido ${result.user.nombre}`);
    } else if (result.error) {
      toast.error(result.error);
    }
    return result;
  };

  const logout = () => {
    try {
      // Limpiar el estado
      setUser(null);
      
      // Limpiar el localStorage
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      
      // Limpiar otras posibles referencias en sessionStorage
      sessionStorage.clear();
      
      // Mostrar mensaje de éxito
      toast.success('Sesión cerrada correctamente');
      
      // Forzar un refresco de componentes si es necesario
      // window.location.href = '/login'; // Opción más agresiva si hay problemas persistentes
    } catch (error) {
      console.error('Error durante el cierre de sesión:', error);
      toast.error('Error al cerrar sesión');
    }
  };

  const updateUserData = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('auth_user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading, updateUserData }}>
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