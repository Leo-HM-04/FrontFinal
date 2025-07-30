# 💳 Plataforma de Pagos BECHAPRA

Aplicación web moderna para la gestión de pagos, solicitudes y administración de usuarios con roles y reportes avanzados. Desarrollada con Next.js, React y Tailwind CSS.

---

## 🚀 Características Destacadas

### 🔐 Autenticación Multi-Rol
- **Admin General**: Control total, reportes, gestión de usuarios y solicitudes.
- **Administrativo**: Procesamiento y gestión operativa de solicitudes.
- **Tesorero**: Transacciones, conciliación y reportes financieros.
- **Director**: Supervisión, aprobaciones y reportes estratégicos.

### 📊 Dashboard y Reportes
- Paneles personalizados por rol.
- Gráficas interactivas (Bar, Pie, Área) para pagos, solicitudes, usuarios y notificaciones.
- Resúmenes ejecutivos y métricas clave.
- Animaciones y visualización moderna.
- Exportación de reportes (próximamente).

### 🎨 Interfaz de Usuario
- Diseño responsive con Tailwind CSS.
- Componentes modernos con glassmorphism.
- Sidebar dinámico y navegación contextual.
- Loading states y transiciones suaves.
- Sistema de notificaciones integrado.

### 🛡️ Seguridad
- Rutas protegidas por roles y permisos.
- Middleware de autenticación automática.
- Redirección inteligente según rol.
- Gestión segura de sesiones con cookies.

---

## 🛠️ Stack Tecnológico

```bash
Frontend:
├── Next.js 15.x           # Framework React con SSR
├── React 19.x             # Biblioteca de UI
├── TypeScript 5.x         # Tipado estático
├── Tailwind CSS 4.x       # Framework de estilos
├── Lucide React           # Iconografía moderna
├── React Hook Form        # Formularios

Herramientas:
├── React Hot Toast        # Notificaciones
├── Axios                  # Cliente HTTP
├── js-cookie              # Cookies
├── ESLint + Prettier      # Linting y formateo
```

---

## 📁 Estructura del Proyecto

```
src/
├── app/
│   ├── dashboard/
│   │   ├── admin/           # Panel admin y reportes
│   │   ├── administrativo/  # Panel operativo
│   │   ├── tesoreria/       # Panel financiero
│   │   └── director/        # Panel ejecutivo
│   ├── login/               # Autenticación
│   └── layout.tsx           # Layout principal
├── components/              # UI, forms, navegación
├── hooks/                   # Custom hooks
├── lib/                     # Utilidades
├── types/                   # Tipos TypeScript
└── middleware.ts            # Middleware de autenticación
```

---

## 🚀 Inicio Rápido

### Prerequisitos
- Node.js 18+
- npm, yarn, pnpm o bun

### Instalación
1. **Clonar el repositorio**
   ```bash
   git clone <repository-url>
   cd FRONNEW
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
   # Edita .env.local con tus configuraciones
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

---

## 🔧 Scripts Disponibles

```bash
npm run dev      # Servidor de desarrollo
npm run build    # Build de producción
npm run start    # Servidor de producción
npm run lint     # Linting con ESLint
```

---

## 🎯 Funcionalidades por Rol

### 👑 Admin General
- Gestión completa de usuarios y roles
- Control de solicitudes y aprobaciones
- Configuración avanzada del sistema
- Reportes y gráficas interactivas
- Dashboard ejecutivo

### 💼 Administrativo
- Procesamiento y gestión de solicitudes
- Reportes operativos
- Comunicación interna

### 💰 Tesorero
- Gestión de pagos y transacciones
- Reportes financieros y conciliación

### 🎖️ Director
- Supervisión general y aprobaciones
- Reportes estratégicos

---

## 🔒 Sistema de Autenticación

### Flujo
1. Login: Usuario ingresa credenciales
2. Validación: Backend verifica y genera JWT
3. Redirección: Automática según rol
4. Middleware: Protección de rutas y permisos

### Roles y Permisos
```typescript
interface UserRole {
  admin_general: {
    permissions: ['read', 'write', 'delete', 'manage_users', 'reports']
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

---

## 🎨 Personalización de UI

### Tema y Colores
```css
:root {
  --primary-blue: #3B82F6;
  --secondary-blue: #60A5FA;
  --gradient: linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%);
}
```

### Componentes Personalizables
- Botones con variantes
- Cards con glassmorphism
- Modales y overlays
- Formularios con validación
- Tablas responsivas

---

## 📱 Responsive Design

Optimizada para:
- 📱 Mobile: 320px - 768px
- 📋 Tablet: 768px - 1024px
- 🖥️ Desktop: 1024px+

---

## 🚀 Deployment

### Vercel (Recomendado)
```bash
npm run build
vercel --prod
```



### Variables de Entorno
```env
NEXT_PUBLIC_API_URL=your_api_url
NEXT_PUBLIC_APP_ENV=production
JWT_SECRET=your_jwt_secret
DATABASE_URL=your_database_url
```

---

## 🤝 Contribución

1. Fork del proyecto
2. Crear branch para feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -m 'Agregar nueva funcionalidad'`)
4. Push al branch (`git push origin feature/nueva-funcionalidad`)
5. Abrir Pull Request

---

## 📄 Licencia

MIT. Ver `LICENSE` para más detalles.

## 👥 Equipo

- **Frontend**: Next.js, React
- **UI/UX**: Tailwind CSS
- **Backend**: API RESTful
- **DevOps**: Automatización y despliegue

## 📞 Soporte

Para soporte técnico o consultas:
- 📧 Email: ti@bechapra.com
- 💬 Slack: #plataforma-pagos

---

**BECHAPRA** - Plataforma de Pagos © 2025
