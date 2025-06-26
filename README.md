# 💳 Plataforma de Pagos BECHAPRA

Una aplicación web moderna desarrollada con Next.js para la gestión integral de pagos y administración de usuarios con diferentes roles y permisos.

## 🚀 Características Principales

### 🔐 Sistema de Autenticación Multi-Rol
- **Admin General**: Control total del sistema, gestión de usuarios y solicitudes
- **Administrativo**: Gestión operativa y procesamiento de solicitudes
- **Tesorero**: Manejo de transacciones y reportes financieros
- **Director**: Supervisión y aprobaciones ejecutivas

### 🎨 Interfaz de Usuario
- Diseño responsive con Tailwind CSS
- Componentes modernos con efectos glassmorphism
- Sidebar dinámico con navegación contextual
- Loading states y transiciones suaves
- Sistema de notificaciones integrado

### 🛡️ Seguridad y Protección
- Rutas protegidas por roles
- Middleware de autenticación automática
- Redirección inteligente basada en permisos
- Gestión segura de sesiones con cookies

## 🛠️ Stack Tecnológico

```bash
Frontend:
├── Next.js 15.3.4          # Framework React con SSR
├── React 19.0.0            # Biblioteca de UI
├── TypeScript 5.x          # Tipado estático
├── Tailwind CSS 4.x        # Framework de estilos
├── Lucide React            # Iconografía moderna
└── React Hook Form         # Gestión de formularios

Herramientas:
├── React Hot Toast         # Sistema de notificaciones
├── Axios                   # Cliente HTTP
├── js-cookie               # Gestión de cookies
└── ESLint + Prettier       # Linting y formateo
```

## 📁 Estructura del Proyecto

```
src/
├── app/                    # App Router de Next.js
│   ├── dashboard/          # Dashboards por rol
│   │   ├── admin/          # Panel administrativo
│   │   ├── administrativo/ # Panel operativo
│   │   ├── tesoreria/      # Panel financiero
│   │   └── director/       # Panel ejecutivo
│   ├── login/              # Autenticación
│   └── layout.tsx          # Layout principal
├── components/             # Componentes reutilizables
│   ├── ui/                 # Componentes base
│   ├── forms/              # Formularios
│   └── navigation/         # Navegación
├── hooks/                  # Custom hooks
├── lib/                    # Utilidades y configuración
├── types/                  # Definiciones TypeScript
└── middleware.ts           # Middleware de autenticación
```

## 🚀 Inicio Rápido

### Prerequisitos
- Node.js 18+ 
- npm, yarn, pnpm o bun

### Instalación

1. **Clonar el repositorio**
```bash
git clone <repository-url>
cd frontend_platafoemadepagos
```

2. **Instalar dependencias**
```bash
npm install
# o
yarn install
# o
pnpm install
```

3. **Configurar variables de entorno**
```bash
cp .env.example .env.local
# Editar .env.local con tus configuraciones
```

4. **Ejecutar en desarrollo**
```bash
npm run dev
# o
yarn dev
# o
pnpm dev
```

5. **Abrir en el navegador**
```
http://localhost:3000
```

## 🔧 Scripts Disponibles

```bash
npm run dev          # Servidor de desarrollo con Turbopack
npm run build        # Build de producción
npm run start        # Servidor de producción
npm run lint         # Linting con ESLint
```

## 🎯 Funcionalidades por Rol

### 👑 Admin General
- ✅ Gestión completa de usuarios
- ✅ Control de solicitudes y aprobaciones
- ✅ Configuración del sistema
- ✅ Reportes y analytics
- ✅ Gestión de roles y permisos

### 💼 Administrativo
- ✅ Procesamiento de solicitudes
- ✅ Gestión operativa diaria
- ✅ Comunicación con usuarios
- ✅ Reportes operativos

### 💰 Tesorero
- ✅ Gestión de transacciones
- ✅ Reportes financieros
- ✅ Control de pagos
- ✅ Conciliación bancaria

### 🎖️ Director
- ✅ Supervisión general
- ✅ Aprobaciones ejecutivas
- ✅ Reportes estratégicos
- ✅ Toma de decisiones

## 🔒 Sistema de Autenticación

### Flujo de Autenticación
1. **Login**: Usuario ingresa credenciales
2. **Validación**: Verificación en backend
3. **Token**: Generación de token JWT
4. **Redirección**: Automática al dashboard del rol
5. **Middleware**: Protección de rutas sensibles

### Roles y Permisos
```typescript
interface UserRole {
  admin_general: {
    permissions: ['read', 'write', 'delete', 'manage_users']
    dashboard: '/dashboard/admin'
  }
  administrativo: {
    permissions: ['read', 'write', 'process_requests']
    dashboard: '/dashboard/administrativo'
  }
  tesoreria: {
    permissions: ['read', 'write', 'financial_reports']
    dashboard: '/dashboard/tesoreria'
  }
  director: {
    permissions: ['read', 'approve', 'strategic_reports']
    dashboard: '/dashboard/director'
  }
}
```

## 🎨 Personalización de UI

### Tema y Colores
```css
:root {
  --primary-blue: #004AB7;
  --secondary-blue: #0057D9;
  --gradient: linear-gradient(135deg, #004AB7 0%, #0057D9 100%);
}
```

### Componentes Personalizables
- Botones con variantes (outline, solid, ghost)
- Cards con efectos glassmorphism
- Modales y overlays
- Formularios con validación
- Tablas responsivas

## 📱 Responsive Design

La aplicación está optimizada para:
- 📱 **Mobile**: 320px - 768px
- 📋 **Tablet**: 768px - 1024px
- 🖥️ **Desktop**: 1024px+

## 🚀 Deployment

### Vercel (Recomendado)
```bash
npm run build
vercel --prod
```

### Docker
```dockerfile
# Dockerfile incluido en el proyecto
docker build -t plataforma-pagos .
docker run -p 3000:3000 plataforma-pagos
```

### Variables de Entorno Requeridas
```env
NEXT_PUBLIC_API_URL=your_api_url
NEXT_PUBLIC_APP_ENV=production
JWT_SECRET=your_jwt_secret
DATABASE_URL=your_database_url
```

## 🤝 Contribución

1. Fork el proyecto
2. Crear branch para feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -m 'Agregar nueva funcionalidad'`)
4. Push al branch (`git push origin feature/nueva-funcionalidad`)
5. Abrir Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

## 👥 Equipo de Desarrollo

- **Frontend**: Desarrollado con Next.js y React
- **UI/UX**: Diseño moderno con Tailwind CSS
- **Backend**: API RESTful integrada
- **DevOps**: Deployment automatizado

## 📞 Soporte

Para soporte técnico o consultas:
- 📧 Email: ti@bechapra.com
- 💬 Slack: #plataforma-pagos

---

**BECHAPRA** - Plataforma de Pagos © 2025
