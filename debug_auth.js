// Script para debuggear el estado de la autenticación
console.log('=== DEBUG AUTH STATE ===');
console.log('Cookies auth_token:', document.cookie.split(';').find(c => c.trim().startsWith('auth_token=')));
console.log('LocalStorage auth_token:', localStorage.getItem('auth_token'));
console.log('LocalStorage auth_user:', localStorage.getItem('auth_user'));

// Simular getAuthToken
function getAuthTokenDebug() {
  // Verificar cookies
  const cookieToken = document.cookie.split(';')
    .find(c => c.trim().startsWith('auth_token='));
  
  if (cookieToken) {
    return cookieToken.split('=')[1];
  }
  
  // Verificar localStorage
  return localStorage.getItem('auth_token');
}

console.log('Token result:', getAuthTokenDebug());