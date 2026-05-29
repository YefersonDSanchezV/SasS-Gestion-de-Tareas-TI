# Especificaciones Técnicas - Sistema de Gestión de Casos

## Arquitectura del Sistema

### Frontend Stack
- **Framework**: React 18.3.1
- **Lenguaje**: TypeScript
- **Routing**: React Router 7.13.0 (Data Router Pattern)
- **Estilos**: Tailwind CSS 4.1.12
- **Build Tool**: Vite 6.3.5

### Bibliotecas UI
- **Componentes Base**: Radix UI
- **Iconos**: Lucide React 0.487.0
- **Gráficos**: Recharts 2.15.2
- **Notificaciones**: Sonner 2.0.3
- **Formularios**: React Hook Form 7.55.0
- **Utilidades**: clsx, tailwind-merge

## Estructura de Carpetas

```
src/
├── app/
│   ├── components/
│   │   ├── ui/                    # Componentes UI reutilizables (Radix UI + Tailwind)
│   │   ├── Layout.tsx             # Layout principal con sidebar
│   │   ├── NotificationBell.tsx   # Sistema de notificaciones
│   │   └── ProtectedRoute.tsx     # Guard de rutas protegidas
│   ├── context/
│   │   └── AuthContext.tsx        # Contexto de autenticación
│   ├── data/
│   │   └── mockData.ts            # Datos de prueba
│   ├── pages/
│   │   ├── Login.tsx              # Página de inicio de sesión
│   │   ├── RequestAccess.tsx      # Formulario de solicitud de acceso
│   │   ├── Dashboard.tsx          # Dashboard con KPIs y gráficos
│   │   ├── Users.tsx              # Lista de usuarios
│   │   ├── UserDetail.tsx         # Detalle de usuario
│   │   ├── UserForm.tsx           # Formulario crear/editar usuario
│   │   ├── Cases.tsx              # Lista de casos
│   │   ├── CaseDetail.tsx         # Detalle de caso con timeline
│   │   └── Logs.tsx               # Sistema de logs con tabs
│   ├── types/
│   │   └── index.ts               # TypeScript types e interfaces
│   ├── routes.tsx                 # Configuración de routing
│   └── App.tsx                    # Componente raíz
├── lib/
│   └── utils.ts                   # Utilidades (cn helper)
└── styles/
    └── theme.css                  # Variables CSS y tema
```

## Tipos de Datos (TypeScript)

### User
```typescript
{
  id: string;
  identificationType: string;
  identificationNumber: string;
  firstName: string;
  lastName: string;
  phone: string;
  personalEmail: string;
  institutionalEmail: string;
  username: string;
  role: 'admin' | 'coordinator' | 'technician';
  status: 'active' | 'inactive';
  createdAt: string;
}
```

### Case
```typescript
{
  id: string;
  caseNumber: string;
  title: string;
  description: string;
  assignedTo: string;
  assignedBy: string;
  status: 'assigned' | 'observation' | 'execution' | 'completed';
  queue: string;
  createdAt: string;
  updatedAt: string;
}
```

### CaseObservation
```typescript
{
  id: string;
  caseId: string;
  userId: string;
  username: string;
  comment: string;
  sentByEmail: boolean;
  createdAt: string;
}
```

## Sistema de Autenticación

### Contexto de Auth
- Provider: `AuthContext`
- Estado: `user`, `isAuthenticated`
- Métodos: `login()`, `logout()`

### Protección de Rutas
- Componente: `ProtectedRoute`
- Props: `allowedRoles?: string[]`
- Redirección: `/login` si no autenticado

### Roles y Permisos

| Ruta | Admin | Coordinator | Technician |
|------|-------|-------------|------------|
| /dashboard | ✅ | ✅ | ✅ |
| /cases | ✅ | ✅ | ✅ |
| /users | ✅ | ✅ | ❌ |
| /logs | ✅ | ✅ | ❌ |

## Tema y Estilos

### Variables CSS Principales
```css
--primary: #1E3A8A       /* Azul oscuro */
--secondary: #3B82F6     /* Azul claro */
--background: #F3F4F6    /* Gris claro */
--foreground: #1F2937    /* Gris oscuro */
--destructive: #EF4444   /* Rojo */
```

### Estados de Casos
```css
--status-assigned: #6B7280      /* Gris */
--status-observation: #F59E0B   /* Amarillo */
--status-execution: #3B82F6     /* Azul */
--status-completed: #10B981     /* Verde */
```

## Componentes Principales

### Layout
- Sidebar colapsable
- Header con título y notificaciones
- Footer con versión
- Navegación basada en roles

### Dashboard
- **Admin/Coordinador**: 4 KPIs, 2 gráficos (líneas y pastel), tabla de logs, notificaciones
- **Técnico**: 4 KPIs personales, gráfico de pastel, notificaciones

### Gestión de Casos
- **Lista**: Tabla con búsqueda y filtros
- **Detalle**: 
  - Info del caso
  - Timeline de observaciones
  - Panel de acciones (nueva observación, finalizar)

### Gestión de Usuarios
- **Lista**: Tabla con búsqueda
- **Detalle**: Vista de información completa
- **Formulario**: Crear/Editar con validaciones

### Logs
- 4 Tabs independientes
- Búsqueda unificada
- Tabla con fecha/hora

## Sistema de Notificaciones

### Características
- Badge con contador de no leídas
- Dropdown con lista
- Marcar como leídas individualmente
- "Marcar todas como leídas"
- Tipos: info, warning, success

### Mock de Notificaciones
```typescript
{
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success';
  time: string;
  read: boolean;
}
```

## Flujo de Estados de Casos

```
Caso Creado → Asignado (gris)
    ↓
Usuario abre caso → En Observación (amarillo)
    ↓
Usuario cierra vista → En Ejecución (azul)
    ↓
Usuario finaliza → Finalizado (verde)
```

## Datos Mock

### Usuarios de Prueba
- **admin** / password
- **coordinator** / password
- **technician** / password

### Casos de Ejemplo
- 4 casos con diferentes estados
- 3 observaciones de ejemplo
- 2 solicitudes de acceso

### Logs de Ejemplo
- Logs de login
- Logs de solicitudes
- Logs de usuarios
- Logs de casos

## Características de Producción Requeridas

Para llevar a producción, implementar:

1. **Backend API**
   - REST API o GraphQL
   - Base de datos (PostgreSQL, MongoDB)
   - Sistema de autenticación JWT
   - WebSockets para tiempo real

2. **Seguridad**
   - Hashing de contraseñas (bcrypt)
   - Tokens de sesión
   - CORS configurado
   - Rate limiting
   - Validación de inputs

3. **Comunicaciones**
   - Integración SMTP para emails
   - API de WhatsApp/SMS
   - Sistema de colas (Redis, RabbitMQ)

4. **Almacenamiento**
   - Subida de archivos (AWS S3, Cloudinary)
   - Caché (Redis)
   - CDN para assets

5. **Monitoreo**
   - Logging centralizado
   - Métricas de rendimiento
   - Error tracking (Sentry)
   - Analytics

6. **Testing**
   - Unit tests (Vitest)
   - Integration tests
   - E2E tests (Playwright)

## Variables de Entorno (Futuro)

```env
VITE_API_URL=
VITE_WS_URL=
VITE_EMAIL_SERVICE=
VITE_SMS_SERVICE=
VITE_STORAGE_URL=
```

## Optimizaciones Aplicadas

✅ Lazy loading de rutas  
✅ Code splitting automático (Vite)  
✅ Componentes reutilizables  
✅ CSS modular con Tailwind  
✅ TypeScript para type safety  
✅ React Context para estado global  

## Navegadores Soportados

- Chrome/Edge: 90+
- Firefox: 88+
- Safari: 14+

## Resoluciones Soportadas

- Desktop: 1280px+
- Tablet: 768px - 1279px
- Mobile: 320px - 767px

---

**Versión del Sistema**: 1.0.0  
**Fecha de Documentación**: Abril 2026  
**Mantenedor**: Sistema de Soporte Técnico
