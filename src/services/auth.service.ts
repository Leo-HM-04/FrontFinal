import api from '@/lib/api';
import { UsuariosService } from './usuarios.service';
import { LoginCredentials, AuthResponse, User } from '@/types';
import Cookies from 'js-cookie';

export class AuthService {
  static async login(credentials: LoginCredentials): Promise<{ success: boolean; user?: User; token?: string; error?: string }> {
    try {
      const response = await api.post<AuthResponse>('/auth/login', credentials);
      if (response.data.token) {
        Cookies.set('auth_token', response.data.token, { 
          expires: 1/3,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict'
        });
        Cookies.set('user_data', JSON.stringify(response.data.user), {
          expires: 1/3,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict'
        });
        return { success: true, user: response.data.user, token: response.data.token };
      }
      return { success: false, error: response.data.message || 'Error desconocido' };
    } catch (err: unknown) {
      // Captura el mensaje del backend si existe
      let errorMsg = 'Error de conexión';
      let statusCode = 0;
      
      if (typeof err === 'object' && err !== null) {
        // Check for AxiosError shape
        if ('response' in err && typeof (err as { response?: unknown }).response === 'object' && (err as { response?: unknown }).response !== null) {
          const response = (err as { response?: { data?: { message?: string }; status?: number } }).response;
          if (response) {
            statusCode = response.status || 0;
            
            if (response.data && typeof response.data === 'object' && 'message' in response.data && typeof response.data.message === 'string') {
              errorMsg = response.data.message;
            } else if (statusCode === 500) {
              errorMsg = 'Error interno del servidor. Por favor contacte al administrador.';
            } else if (statusCode === 400) {
              errorMsg = 'Datos de login inválidos. Verifique email y contraseña.';
            } else if (statusCode === 401) {
              errorMsg = 'Credenciales incorrectas.';
            }
          }
        } else if ('message' in err && typeof (err as { message?: unknown }).message === 'string') {
          errorMsg = (err as { message: string }).message;
        }
      }
      
      console.error('Auth Service Error:', { error: err, statusCode, errorMsg });
      return { success: false, error: errorMsg };
    }
  }

  static async logout(): Promise<void> {
    try {
      await UsuariosService.logout();
    } catch  {
      // Si el backend falla, igual borra el token local
    }
    Cookies.remove('auth_token');
    Cookies.remove('user_data');
  }

  static getToken(): string | undefined {
    return Cookies.get('auth_token');
  }

  static getCurrentUser(): User | null {
    const userData = Cookies.get('user_data');
    if (userData) {
      try {
        return JSON.parse(userData);
      } catch (error) {
        console.error('Error parsing user data:', error);
        return null;
      }
    }
    return null;
  }

  static isAuthenticated(): boolean {
    return !!this.getToken();
  }

  static hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user?.rol === role;
  }

  static hasAnyRole(roles: string[]): boolean {
    const user = this.getCurrentUser();
    return user ? roles.includes(user.rol) : false;
  }
}
