import { getAuthToken, getAuthUser } from '@/utils/auth';

export function debugAuth() {
  console.log('=== AUTH DEBUG ===');
  
  const token = getAuthToken();
  console.log('Token disponible:', !!token);
  console.log('Token length:', token?.length || 0);
  console.log('Token preview:', token ? token.substring(0, 50) + '...' : 'null');
  
  const user = getAuthUser();
  console.log('Usuario disponible:', !!user);
  console.log('Usuario:', user);
  
  // Verificar localStorage directamente
  if (typeof window !== 'undefined') {
    console.log('localStorage auth_token:', localStorage.getItem('auth_token') ? 'exists' : 'null');
    console.log('localStorage auth_user:', localStorage.getItem('auth_user') ? 'exists' : 'null');
  }
  
  // Verificar cookies directamente
  console.log('Cookies disponibles:', document.cookie.split(';').map(c => c.trim().split('=')[0]));
  
  return {
    hasToken: !!token,
    hasUser: !!user,
    tokenPreview: token?.substring(0, 20) || null
  };
}