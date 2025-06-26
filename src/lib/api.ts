import axios from 'axios';
import Cookies from 'js-cookie';
import { toast } from 'react-hot-toast';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token automáticamente
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar respuestas y errores
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const { response } = error;
    
    if (response?.status === 401) {
      // Token expirado o inválido
      Cookies.remove('auth_token');
      Cookies.remove('user_data');
      toast.error('Sesión expirada. Por favor, inicia sesión nuevamente.');
      
      // Redirigir al login si no estamos ya ahí
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    } else if (response?.status === 403) {
      toast.error('No tienes permisos para realizar esta acción.');
    } else if (response?.status === 404) {
      toast.error('Recurso no encontrado.');
    } else if (response?.status >= 500) {
      toast.error('Error del servidor. Intenta nuevamente.');
    } else if (response?.data?.message) {
      toast.error(response.data.message);
    } else {
      toast.error('Ocurrió un error inesperado.');
    }
    
    return Promise.reject(error);
  }
);

export default api;
