import { NextRequest, NextResponse } from 'next/server';

function getUserRoleFromRequest(request: NextRequest): string | null {
  try {
    const authCookie = request.cookies.get('auth_token');
    if (!authCookie?.value) {
      return null;
    }

    // Decodificar JWT sin verificar (solo para extraer el payload)
    // En un entorno de producción deberías verificar la firma
    const tokenParts = authCookie.value.split('.');
    if (tokenParts.length !== 3) {
      return null;
    }

    // Decodificar el payload (segunda parte del JWT)
    const payload = JSON.parse(atob(tokenParts[1]));
    return payload.rol || null;
  } catch (error) {
    console.error('Error parsing JWT in middleware:', error);
    return null;
  }
}

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
        'aprobador': '/dashboard/aprobador',
        'solicitante': '/dashboard/solicitante',
        'pagador_banca': '/dashboard/pagador',
      };
      
      const redirectTo = roleRoutes[userRole as keyof typeof roleRoutes];
      if (redirectTo) {
        return NextResponse.redirect(new URL(redirectTo, request.url));
      }
    }
    
    // Si no hay rol válido, redirigir a login
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*']
};