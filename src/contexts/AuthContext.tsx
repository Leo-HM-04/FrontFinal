'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode, useMemo, useCallback } from 'react';
import { User, LoginCredentials } from '@/types';
import { AuthService } from '@/services/auth.service';
import { toast } from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  logout: () => void;
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Caché en memoria para el usuario
  const cachedUser = useMemo(() => {
    if (typeof window === 'undefined') return null;
    const cached = localStorage.getItem('auth_user');
    return cached ? JSON.parse(cached) : null;
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      setLoading(true);
      
      // Usar caché si está disponible
      if (cachedUser) {
        setUser(cachedUser);
        setLoading(false);
        return;
      }

      // Verificar autenticación del servidor solo si no hay caché
      try {
        // Aquí iría tu lógica de verificación del servidor
        const token = localStorage.getItem('auth_token');
        if (token) {
          // Simular verificación
          setTimeout(() => {
            const userData = { 
              id_usuario: '1', 
              nombre: 'Admin User', 
              email: 'admin@example.com', 
              rol: 'admin_general' 
            };
            setUser(userData);
            localStorage.setItem('auth_user', JSON.stringify(userData));
            setLoading(false);
          }, 100);
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('Error verificando autenticación:', error);
        setLoading(false);
      }
    };

    initAuth();
  }, [cachedUser]);

  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    try {
      setLoading(true);
      const response = await AuthService.login(credentials);
      setUser(response.user);
      localStorage.setItem('auth_user', JSON.stringify(response.user));
      localStorage.setItem('auth_token', 'dummy_token');
      toast.success(`¡Bienvenido, ${response.user.nombre}!`);
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    AuthService.logout();
    setUser(null);
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_token');
    toast.success('Sesión cerrada correctamente');
  };

  const hasRole = (role: string): boolean => {
    return user?.rol === role || false;
  };

  const hasAnyRole = (roles: string[]): boolean => {
    return user ? roles.includes(user.rol) : false;
  };

  const value = {
    user,
    loading,
    login,
    logout,
    hasRole,
    hasAnyRole,
  };

  return (
    <AuthContext.Provider value={value}>
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
