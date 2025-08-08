import Cookies from 'js-cookie';

/**
 * Función auxiliar para obtener el token de autenticación de manera consistente
 * Prioriza las cookies pero también revisa localStorage como fallback para retrocompatibilidad
 */
export function getAuthToken(): string | undefined {
  // Primero intentar obtener de cookies (método actual)
  let token = Cookies.get('auth_token');
  
  // Fallback: verificar localStorage para retrocompatibilidad
  if (!token && typeof window !== 'undefined') {
    token = localStorage.getItem('auth_token') || undefined;
    
    // Si encontramos token en localStorage, migrar a cookies
    if (token) {
      console.log('AuthToken: Migrating from localStorage to cookies');
      Cookies.set('auth_token', token, { 
        expires: 1/3,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });
      
      // También migrar usuario si existe
      const userData = localStorage.getItem('auth_user');
      if (userData) {
        try {
          const user = JSON.parse(userData);
          Cookies.set('user_data', JSON.stringify(user), {
            expires: 1/3,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
          });
        } catch (error) {
          console.error('Error migrating user data:', error);
        }
      }
    }
  }
  
  // Verificar que el token no esté expirado (si es JWT)
  if (token) {
    try {
      const tokenParts = token.split('.');
      if (tokenParts.length === 3) {
        const payload = JSON.parse(atob(tokenParts[1]));
        const now = Math.floor(Date.now() / 1000);
        
        if (payload.exp && payload.exp < now) {
          console.log('AuthToken: Token expired, removing');
          Cookies.remove('auth_token');
          Cookies.remove('user_data');
          if (typeof window !== 'undefined') {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('auth_user');
          }
          return undefined;
        }
      }
    } catch (error) {
      console.warn('AuthToken: Could not validate token expiration:', error);
    }
  }
  
  return token;
}

/**
 * Función auxiliar para obtener datos del usuario autenticado
 */
export function getAuthUser() {
  // Primero intentar obtener de cookies
  let userData = Cookies.get('user_data');
  
  // Fallback: verificar localStorage para retrocompatibilidad
  if (!userData && typeof window !== 'undefined') {
    userData = localStorage.getItem('auth_user') || undefined;
    
    // Si encontramos datos en localStorage, migrar a cookies
    if (userData) {
      try {
        const user = JSON.parse(userData);
        Cookies.set('user_data', JSON.stringify(user), {
          expires: 1/3,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict'
        });
      } catch (error) {
        console.error('Error parsing user data from localStorage:', error);
        return null;
      }
    }
  }
  
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