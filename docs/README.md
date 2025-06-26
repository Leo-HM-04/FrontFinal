# Sistema de Solicitudes de Pago - API Backend

## 📋 Descripción

Sistema backend para gestión de solicitudes de pago con autenticación JWT y autorización basada en roles. Desarrollado con Node.js, Express y MySQL.

## 🏗️ Arquitectura

```
backend_solicitudes_pago/
├── 📁 controllers/          # Lógica de negocio
├── 📁 middlewares/          # Middlewares (auth, validación, etc.)
├── 📁 models/               # Modelos de datos
├── 📁 routes/               # Definición de rutas
├── 📁 seeders/              # Scripts para poblar y limpiar la DB
├── 📁 utils/                # Utilidades (logger, helpers)
├── 📁 docs/                 # Documentación
├── 📁 logs/                 # Archivos de log
├── 📁 db/                   # Configuración de base de datos
├── server.js                # Punto de entrada
└── package.json             # Dependencias y scripts
```

## 🔐 Roles y Permisos

### Roles Disponibles:
- **admin_general**: Acceso completo al sistema (solo puede haber uno)
- **solicitante**: Crear y ver sus propias solicitudes
- **aprobador**: Aprobar/rechazar solicitudes, ver todas las solicitudes
- **pagador_banca**: Ver solicitudes para procesar pagos (futuro)

### Matriz de Permisos:
| Acción | Admin | Solicitante | Aprobador | Pagador |
|--------|-------|-------------|-----------|---------|
| Crear usuarios | ✅ | ❌ | ❌ | ❌ |
| Ver todos los usuarios | ✅ | ❌ | ❌ | ❌ |
| Actualizar usuarios | ✅ | ❌ | ❌ | ❌ |
| Eliminar usuarios | ✅ | ❌ | ❌ | ❌ |
| Crear solicitudes | ✅ | ✅ | ❌ | ❌ |
| Ver todas las solicitudes | ✅ | ❌ | ✅ | ✅ |
| Ver propias solicitudes | ✅ | ✅ | ✅ | ✅ |
| Aprobar/Rechazar | ✅ | ❌ | ✅ | ❌ |
| Eliminar solicitudes | ✅ | ❌ | ❌ | ❌ |

## 🚀 Instalación y Configuración

### 1. Clonar el repositorio
```bash
git clone <repository-url>
cd backend_solicitudes_pago
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
Crear archivo `.env`:
```env
# Base de datos
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=plataforma_solicitudes_pago

# JWT
JWT_SECRET=tu_clave_super_secreta_aqui_minimo_32_caracteres

# Servidor
PORT=3000
NODE_ENV=development
```

### 4. Configurar base de datos
```sql
-- Crear base de datos
CREATE DATABASE plataforma_solicitudes_pago;
USE plataforma_solicitudes_pago;

-- Tabla usuarios
CREATE TABLE usuarios (
  id_usuario INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  rol ENUM('admin_general', 'solicitante', 'aprobador', 'pagador_banca') NOT NULL,
  intentos_fallidos INT DEFAULT 0,
  bloqueado BOOLEAN DEFAULT FALSE,
  bloqueo_temporal_fin DATETIME NULL,
  bloqueo_temporal_activado BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla solicitudes_pago
CREATE TABLE solicitudes_pago (
  id_solicitud INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT NOT NULL,
  departamento VARCHAR(100) NOT NULL,
  monto DECIMAL(15,2) NOT NULL,
  cuenta_destino VARCHAR(50) NOT NULL,
  factura_url VARCHAR(500) NOT NULL,
  concepto TEXT NOT NULL,
  fecha_limite_pago DATE NOT NULL,
  soporte_url VARCHAR(500) NULL,
  estado ENUM('pendiente', 'autorizada', 'rechazada') DEFAULT 'pendiente',
  id_aprobador INT NULL,
  comentario_aprobador TEXT NULL,
  fecha_revision DATETIME NULL,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  FOREIGN KEY (id_aprobador) REFERENCES usuarios(id_usuario) ON DELETE SET NULL
);
```

### 5. Poblar la base de datos
```bash
# Crear usuarios (incluye admin y usuarios de prueba)
npm run seed:usuarios

# Crear solicitudes de ejemplo (requiere usuarios creados)
npm run seed:solicitudes

# Ejecutar ambos seeders
npm run seed:all

# Limpiar base de datos
npm run clear:all

# Resetear y poblar desde cero
npm run reset:db
```

### 6. Iniciar el servidor
```bash
# Desarrollo con auto-reload
npm run dev

# Producción
npm start
```

## 📚 API Endpoints

### Autenticación
- `POST /api/auth/login` - Iniciar sesión

### Usuarios (Solo Admin)
- `GET /api/usuarios` - Listar usuarios
- `GET /api/usuarios/:id` - Obtener usuario
- `POST /api/usuarios` - Crear usuario
- `PUT /api/usuarios/:id` - Actualizar usuario
- `DELETE /api/usuarios/:id` - Eliminar usuario

### Solicitudes
- `GET /api/solicitudes` - Listar solicitudes (según rol)
- `GET /api/solicitudes/:id` - Obtener solicitud
- `POST /api/solicitudes` - Crear solicitud (Solo solicitantes)
- `PUT /api/solicitudes/:id/estado` - Aprobar/Rechazar (Solo aprobadores)
- `DELETE /api/solicitudes/:id` - Eliminar (Solo admin)

### Sistema
- `GET /health` - Health check del servidor

## 📖 Documentación API

La documentación completa de la API con Swagger está disponible en:
```
http://localhost:3000/api-docs
```

## 🔧 Scripts Disponibles

### Servidor
```bash
npm start                    # Iniciar en producción
npm run dev                  # Iniciar en desarrollo (nodemon)
```

### Base de datos - Seeders
```bash
npm run seed:usuarios        # Crear 66 usuarios de prueba
npm run seed:solicitudes     # Crear 100 solicitudes de prueba
npm run seed:all            # Ejecutar ambos seeders
```

### Base de datos - Limpieza
```bash
npm run clear:usuarios       # Limpiar tabla usuarios
npm run clear:solicitudes    # Limpiar tabla solicitudes
npm run clear:all           # Limpiar ambas tablas
npm run reset:db            # Limpiar todo y poblar desde cero
```

### Opciones especiales
```bash
# Mantener admin principal al limpiar usuarios
npm run clear:usuarios -- --keep-admin

# Limpiar antes de poblar
npm run seed:usuarios -- --clear
npm run seed:solicitudes -- --clear
```

### Documentación
```bash
npm run docs                # Generar documentación adicional
```

## 🛡️ Seguridad

### Autenticación
- JWT con expiración de 8 horas
- Contraseñas hasheadas con bcrypt (salt rounds: 10)
- Headers `Authorization: Bearer <token>`

### Protección contra ataques
- **Bloqueo progresivo de cuentas**:
  - 3 intentos fallidos → bloqueo temporal (15 segundos)
  - 1 intento adicional después del bloqueo → bloqueo permanente
- **Validación de entrada**: Joi schemas para validar datos
- **Headers de seguridad**: Helmet.js implementado
- **CORS**: Configurado para desarrollo

### Variables sensibles
- `JWT_SECRET` debe ser una clave fuerte de mínimo 32 caracteres
- Credenciales de DB en variables de entorno
- Nunca commitear el archivo `.env`

## 📊 Monitoreo y Logs

### Sistema de logging
- Logs automáticos en `/logs/app-YYYY-MM-DD.log`
- Diferentes niveles: `info`, `error`, `warn`, `debug`, `auth`
- Logs en consola con colores para desarrollo
- Logging automático de errores y operaciones críticas

### Health Check
```bash
curl http://localhost:3000/health
```

Respuesta:
```json
{
  "status": "OK",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600
}
```

## 🧪 Testing y Datos de Prueba

### Usuarios de prueba creados por el seeder:

**Administrador:**
- Email: `admin@bechapra.com`
- Password: `admin123`
- Rol: `admin_general`

**Usuarios generados automáticamente:**
- 30 Solicitantes: `nombre.apellido[N]@bechapra.com` / `solicitante123`
- 20 Aprobadores: `nombre.apellido[N]@bechapra.com` / `aprobador123`
- 15 Pagadores: `nombre.apellido[N]@bechapra.com` / `pagador_banca123`

### Datos de solicitudes
- 100 solicitudes con datos realistas
- Estados distribuidos aleatoriamente
- Montos entre $50,000 y $5,000,000
- Departamentos y conceptos variados

## 🔄 Flujo de Solicitudes

1. **Solicitante** inicia sesión y crea una solicitud de pago
2. La solicitud queda en estado `pendiente` automáticamente
3. **Aprobador** revisa la solicitud y puede:
   - Aprobarla (estado `autorizada`)
   - Rechazarla (estado `rechazada`)
   - Agregar comentarios explicativos
4. **Pagador** (funcionalidad futura) procesa el pago
5. **Admin** puede eliminar solicitudes si es necesario

### Estados de solicitud:
- `pendiente`: Solicitud recién creada
- `autorizada`: Aprobada por un aprobador
- `rechazada`: Rechazada por un aprobador

## 🚨 Manejo de Errores

### Códigos de estado HTTP
- `200`: Operación exitosa
- `201`: Recurso creado
- `400`: Error de validación
- `401`: No autenticado
- `403`: Sin permisos
- `404`: Recurso no encontrado
- `409`: Conflicto (email duplicado, etc.)
- `500`: Error interno del servidor

### Logging de errores
- Todos los errores se registran automáticamente
- Incluye timestamp, nivel, mensaje y metadatos
- Separación entre logs de consola y archivo

## 📈 Estadísticas y Reportes

El sistema genera automáticamente estadísticas sobre:
- Número de usuarios por rol
- Solicitudes por estado (pendiente, autorizada, rechazada)
- Montos promedio y totales por estado
- Disponible en los logs del seeder
- Accesible via API para futuras funcionalidades

## 🔧 Configuración Avanzada

### Variables de entorno adicionales
```env
# Configuración JWT
JWT_EXPIRES_IN=8h

# Configuración de bloqueo de cuentas
MAX_LOGIN_ATTEMPTS=3
LOCKOUT_TIME_MS=15000

# Logging
LOG_LEVEL=info
LOG_TO_FILE=true
```

### Estructura de respuestas de error
```json
{
  "message": "Descripción del error",
  "code": "ERROR_CODE",
  "errors": [
    {
      "field": "email",
      "message": "El email debe tener un formato válido"
    }
  ]
}
```

## 🤝 Contribución

1. Fork el proyecto
2. Crear rama para feature (`git checkout -b feature/nueva-funcionalidad`)
3. Seguir convenciones de código existentes
4. Agregar documentación Swagger para nuevos endpoints
5. Asegurar que los tests pasen (futuros)
6. Commit cambios (`git commit -am 'Agregar nueva funcionalidad'`)
7. Push a la rama (`git push origin feature/nueva-funcionalidad`)
8. Crear Pull Request con descripción detallada

### Convenciones de código
- Usar camelCase para variables y funciones
- Documentar funciones complejas
- Manejar errores apropiadamente
- Validar entrada de datos
- Usar logging para operaciones importantes

## 📞 Soporte y Recursos

### Contacto técnico
- Email: admin@bechapra.com
- Documentación API: http://localhost:3000/api-docs

### Recursos útiles
- [Documentación Express.js](https://expressjs.com/)
- [Documentación JWT](https://jwt.io/)
- [Documentación MySQL2](https://github.com/sidorares/node-mysql2)
- [Documentación Swagger](https://swagger.io/docs/)

### Troubleshooting común
1. **Error de conexión DB**: Verificar variables de entorno
2. **Token inválido**: Verificar JWT_SECRET y expiración
3. **Tabla no existe**: Ejecutar scripts SQL de creación
4. **Puerto ocupado**: Cambiar PORT en .env
5. **Seeder falla**: Verificar estructura de BD y permisos
