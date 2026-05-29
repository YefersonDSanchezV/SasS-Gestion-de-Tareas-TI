# Sistema de Gestión de Casos - Soporte Sistemas

Sistema web moderno tipo SaaS para gestión de casos (tickets) enfocado en equipos de soporte técnico.

## Características Principales

### Módulo 1: Autenticación
- **Login**: Inicio de sesión con usuario y contraseña
- **Solicitud de Acceso**: Formulario completo para nuevos usuarios

### Módulo 2: Dashboard
- **Vista Admin/Coordinador**:
  - KPIs: Usuarios activos/inactivos, casos por estado
  - Gráfico de inicios de sesión (últimos 7 días)
  - Distribución de casos por estado (gráfico de pastel)
  - Logs recientes de actividad
  - Sistema de notificaciones

- **Vista Técnico**:
  - Casos asignados, en observación, en ejecución, finalizados
  - Notificaciones de casos
  - Información de versión

### Módulo 3: Gestión de Usuarios
- Tabla de usuarios con búsqueda
- Formulario CRU (Crear, Leer, Actualizar)
- Gestión de roles: Admin, Coordinador, Técnico
- Control de estado: Activo/Inactivo

### Módulo 4: Gestión de Casos
- **Lista de Casos**:
  - Tabla con filtros por estado
  - Búsqueda por número o título
  - Estados con colores distintivos

- **Detalle del Caso**:
  - Información completa del caso
  - Timeline de observaciones
  - Sección de acciones:
    - Agregar observaciones
    - Envío por correo
    - Finalizar caso

### Módulo 5: Logs
- **Tabs organizados**:
  - Logs de inicio de sesión
  - Logs de solicitudes de acceso
  - Logs de gestión de usuarios
  - Logs de gestión de casos

## Estados de Casos

| Estado | Color | Descripción |
|--------|-------|-------------|
| Asignado | Gris (#6B7280) | Caso recién asignado |
| En Observación | Amarillo (#F59E0B) | Caso bajo revisión |
| En Ejecución | Azul (#3B82F6) | Caso en proceso |
| Finalizado | Verde (#10B981) | Caso completado |

## Roles y Permisos

### Admin / Root
- Acceso completo al sistema
- Gestión de usuarios
- Visualización de todos los logs
- Dashboard completo

### Coordinador
- Gestión de casos
- Visualización de logs
- Dashboard completo
- No puede modificar admins

### Técnico
- Visualización de casos asignados
- Gestión de sus propios casos
- Dashboard simplificado

## Usuarios de Prueba

```
Admin:
- Usuario: admin
- Contraseña: password

Coordinador:
- Usuario: coordinator
- Contraseña: password

Técnico:
- Usuario: technician
- Contraseña: password
```

## Paleta de Colores

- **Primario**: #1E3A8A (Azul oscuro)
- **Secundario**: #3B82F6 (Azul claro)
- **Fondo**: #F3F4F6 (Gris claro)
- **Texto**: #1F2937 (Gris oscuro)

## Tecnologías Utilizadas

- **React 18** con TypeScript
- **React Router 7** para navegación
- **Tailwind CSS v4** para estilos
- **Recharts** para gráficos
- **Lucide React** para iconos
- **Sonner** para notificaciones
- **Radix UI** para componentes

## Estructura del Proyecto

```
src/
├── app/
│   ├── components/
│   │   ├── ui/           # Componentes de UI reutilizables
│   │   └── Layout.tsx    # Layout principal con sidebar
│   ├── context/
│   │   └── AuthContext.tsx
│   ├── data/
│   │   └── mockData.ts   # Datos de prueba
│   ├── pages/
│   │   ├── Login.tsx
│   │   ├── RequestAccess.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Users.tsx
│   │   ├── UserDetail.tsx
│   │   ├── UserForm.tsx
│   │   ├── Cases.tsx
│   │   ├── CaseDetail.tsx
│   │   └── Logs.tsx
│   ├── types/
│   │   └── index.ts
│   ├── routes.tsx
│   └── App.tsx
└── styles/
    └── theme.css
```

## Flujo de Usuario

1. **Login**: Usuario ingresa credenciales
2. **Dashboard**: Vista personalizada según rol
3. **Casos**:
   - Caso llega (simulado como creado automáticamente)
   - Usuario abre caso → Estado: "En Observación"
   - Usuario trabaja en caso → Estado: "En Ejecución"
   - Usuario finaliza → Estado: "Finalizado" (requiere comentario)
4. **Observaciones**: Cada acción se registra en timeline
5. **Notificaciones**: Sistema muestra alertas relevantes

## Características Adicionales

- ✅ Diseño responsive (desktop-first)
- ✅ Sidebar colapsable
- ✅ Sistema de notificaciones con badge
- ✅ Timeline de observaciones
- ✅ Filtros avanzados
- ✅ Mock de envío por correo/WhatsApp
- ✅ Indicadores visuales de estado
- ✅ Versión del sistema en footer

## Próximas Mejoras

- [ ] Integración con API real
- [ ] Sistema de autenticación JWT
- [ ] WebSockets para actualizaciones en tiempo real
- [ ] Envío real de correos y SMS
- [ ] Carga de archivos adjuntos
- [ ] Exportación de reportes
- [ ] Modo oscuro
- [ ] Notificaciones push
