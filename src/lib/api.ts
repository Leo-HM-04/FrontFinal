import axios from 'axios';
import Cookies from 'js-cookie';
import { toast } from 'react-hot-toast';
import { getAuthToken } from '@/utils/auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = getAuthToken(); // Usar función auxiliar para obtener token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const { response, config } = error;

    // Verificamos si es la petición de login
    let isLoginRequest = false;
    try {
      const fullUrl = config?.url?.startsWith('http')
        ? config.url
        : API_BASE_URL + config?.url;

      const parsedUrl = new URL(fullUrl);
      isLoginRequest = parsedUrl.pathname.includes('/auth/login');
    } catch {
      isLoginRequest = false;
    }

    // Manejo de errores globales
    if (response?.status === 401 && !isLoginRequest) {
      // Limpiar ambos almacenamientos para asegurar limpieza completa
      Cookies.remove('auth_token');
      Cookies.remove('user_data');
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
      }
      toast.error('Sesión expirada. Por favor, inicia sesión nuevamente.');

      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    } else if (response?.status === 403 && !isLoginRequest) {
      toast.error('No tienes permisos para realizar esta acción.');
    } else if (response?.status === 404) {
      toast.error('Recurso no encontrado.');
    } else if (response?.status >= 500) {
      toast.error('Error del servidor. Intenta nuevamente.');
    } else if (response?.data?.message && !isLoginRequest) {
      toast.error(response.data.message);
    } else if (!isLoginRequest) {
      toast.error('Ocurrió un error inesperado.');
    }

    return Promise.reject(error);
  }
);

export default api;