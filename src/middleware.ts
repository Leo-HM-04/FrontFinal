import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Si accede exactamente a /dashboard, redirigir según el rol
  if (pathname === '/dashboard') {
    // Aquí debes obtener el rol del usuario desde cookies, token, etc.
    // Por ahora simulo la lógica
    const userRole = getUserRoleFromRequest(request);
    
    if (userRole) {
      const roleRoutes = {
        'admin_general': '/dashboard/admin',
        'administrativo': '/dashboard/administrativo',
        'tesoreria': '/dashboard/tesoreria',
        'director': '/dashboard/director'
      };
      
      const redirectTo = roleRoutes[userRole];
      if (redirectTo) {
        return NextResponse.redirect(new URL(redirectTo, request.url));
      }
    }
    
    // Si no hay rol válido, redirigir a login
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  return NextResponse.next();
}

function getUserRoleFromRequest(request: NextRequest): string | null {
  // Implementar lógica real para obtener el rol del usuario
  // Esto podría ser desde cookies, headers, JWT token, etc.
  
  // Ejemplo con cookies:
  const authCookie = request.cookies.get('auth_token');
  if (authCookie) {
    // Decodificar token y extraer rol
    // Por ahora retorno un rol de ejemplo
    return 'admin_general';
  }
  
  return null;
}

export const config = {
  matcher: ['/dashboard/:path*']
};
