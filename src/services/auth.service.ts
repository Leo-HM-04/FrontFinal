import api from '@/lib/api';
import { LoginCredentials, AuthResponse, User } from '@/types';
import Cookies from 'js-cookie';

export class AuthService {
  static async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await api.post<AuthResponse>('/auth/login', credentials);

      if (response.data.token) {
        // Guardar token en cookies
        Cookies.set('auth_token', response.data.token, { 
          expires: 1 / 3, // 8 horas
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict'
        });

        Cookies.set('user_data', JSON.stringify(response.data.user), {
          expires: 1 / 3,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict'
        });
      }

      return response.data;

    } catch (error: any) {
      // Si el backend manda un mensaje de error, lo extraemos
      const message = error?.response?.data?.message || 'Error al iniciar sesión';

      // Creamos un nuevo error personalizado que pueda manejar el AuthContext
      const customError = new Error(message);
      // @ts-ignore
      customError.response = { data: { message } };

      throw customError;
    }
  }

  static logout(): void {
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
