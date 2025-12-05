# 🚀 Guía de Prompts - Fase Mobile: PWA Mobile-First para Operadores
## Collector Enterprise - Versión Mobile Optimizada

---

## 📋 Contexto de la Fase Mobile

Esta guía implementa una **versión mobile-first optimizada** para operadores de campo, manteniendo la misma PWA pero con:
- **Arquitectura separada**: Rutas `/mobile/*` con componentes específicos
- **Code splitting**: Lazy loading de módulos mobile
- **UX Mobile-Native**: Gestos, animaciones, y patrones móviles
- **Offline-First**: Funcionalidad completa sin conexión
- **Performance**: Optimizado para redes lentas y dispositivos móviles

**Roles que usarán la versión mobile:**
- OPERATOR: Usuarios de campo que responden formularios
- SUPERVISOR: Supervisión en terreno

**Features mobile-específicas:**
- Captura de fotos con cámara
- Geolocalización automática
- Firma digital táctil
- Modo offline robusto
- Sincronización automática
- Push notifications

---

## 🎯 Fase Mobile 1: Arquitectura y Setup Base

### M1.1 - Configurar Estructura Mobile✅

**Prompt:**
```
Necesito crear la estructura base para la versión mobile de Collector.

Ubicación: frontend/src/

Requisitos:
- Crear carpeta structure:
  frontend/src/
    ├── mobile/
    │   ├── components/     # Componentes mobile-specific
    │   ├── layouts/        # Layouts mobile
    │   ├── pages/          # Páginas mobile
    │   ├── hooks/          # Hooks mobile
    │   ├── utils/          # Utilities mobile
    │   └── styles/         # Estilos mobile-specific
    ├── shared/             # Componentes compartidos admin/mobile
    └── admin/              # Todo lo existente va aquí (si no está ya)

- Mover componentes existentes:
  - Todo lo actual a /admin si no está categorizado
  - Componentes reutilizables a /shared
  
- NO tocar funcionalidad existente
- Solo reorganizar para separar contextos
- Actualizar imports donde sea necesario
- Comentarios en español

Esta es preparación arquitectónica, no código funcional todavía.
```

### M1.2 - Router con Code Splitting Mobile✅

**Prompt:**
```
Actualiza el router para soportar rutas mobile con lazy loading.

Ubicación: frontend/src/App.tsx

Requisitos:
- Usar React.lazy() para cargar módulos mobile solo cuando se necesiten
- Estructura de rutas:
  / -> Landing (existente)
  /login -> Login (existente)
  /admin/* -> AdminLayout (existente, lazy)
  /mobile/* -> MobileLayout (nuevo, lazy)
  
- Rutas mobile iniciales:
  /mobile/dashboard -> Dashboard mobile
  /mobile/assignments -> Lista de formularios asignados
  /mobile/form/:assignmentId -> Responder formulario
  /mobile/profile -> Perfil de usuario
  
- ProtectedRoute debe detectar rol y redirigir:
  - ADMIN/MANAGER -> /admin/dashboard
  - OPERATOR/SUPERVISOR -> /mobile/dashboard
  
- Suspense con skeleton loader mobile-friendly
- Prefetch de rutas críticas
- TypeScript estricto
- Comentarios en español

Objetivo: Separación clara admin/mobile con lazy loading eficiente.
```

### M1.3 - Layout Mobile Base✅

**Prompt:**
```
Crea el layout base para la versión mobile.

Ubicación: frontend/src/mobile/layouts/MobileLayout.tsx

Requisitos de Diseño:
- Mobile-first completamente (diseño para pantallas 320px-428px)
- Header mobile:
  - Logo pequeño centrado
  - Menú hamburguesa izquierda
  - Notificaciones derecha
  - Altura: 56px (estándar mobile)
  - Sticky con blur backdrop
  
- Bottom Navigation (Tab Bar):
  - 4 tabs: Inicio, Tareas, Cámara, Perfil
  - Íconos de lucide-react
  - Active state visible
  - Safe area para iOS notch
  - Altura: 64px
  
- Content Area:
  - Padding adecuado
  - Scroll independiente del header/footer
  - Pull-to-refresh indicator
  
- Side Drawer (Sheet):
  - Menu lateral deslizable
  - User info arriba
  - Links de navegación
  - Logout abajo
  - Cierra con backdrop tap
  
- Características técnicas:
  - Usar Sheet de shadcn/ui para drawer
  - Gestos táctiles (swipe)
  - Transiciones suaves (300ms)
  - No usar hover states (solo active/focus)
  - Viewport height correcto (vh vs dvh)
  
- Responsive:
  - 320px: muy ajustado pero funcional
  - 375px: óptimo (iPhone SE, 12/13 mini)
  - 428px: espacioso (iPhone Pro Max)
  - Tablet (>768px): muestra versión admin
  
- TypeScript estricto
- Comentarios en español

Diseño inspirado en: WhatsApp, Instagram, apps bancarias modernas.
```

### M1.4 - Theme Mobile Específico✅

**Prompt:**
```
Crea configuración de theme específica para mobile.

Ubicación: frontend/src/mobile/styles/mobileTheme.ts

Requisitos:
- Extensión del theme de Tailwind para mobile:
  - Tamaños de tap: min 44x44px (iOS guidelines)
  - Espaciados optimizados para touch
  - Typography mobile-friendly:
    - Base: 16px (no 14px)
    - Headings: más grandes
    - Line-height: más espaciado
  - Colores con alto contraste para exteriores
  - Sombras sutiles (no muy pesadas)
  
- Utilidades custom Tailwind:
  - .safe-top: padding para notch
  - .safe-bottom: padding para home indicator
  - .tap-target: min touch target size
  - .mobile-card: cards mobile optimizadas
  - .mobile-input: inputs grandes y claros
  
- Variables CSS custom:
  --header-height: 56px
  --bottom-nav-height: 64px
  --safe-area-top: env(safe-area-inset-top)
  --safe-area-bottom: env(safe-area-inset-bottom)
  
- Animations mobile-friendly:
  - slide-in-bottom
  - slide-in-right
  - fade-in-up
  - bounce-subtle
  
- Export como plugin de Tailwind
- TypeScript estricto
- Comentarios en español

Objetivo: Theme que se siente nativo en mobile.
```

### M1.5 - Detector de Dispositivo y Rol✅

**Prompt:**
```
Crea utility para detectar dispositivo y redirigir según rol.

Ubicación: frontend/src/mobile/utils/deviceDetector.ts

Requisitos:
- Funciones:
  - isMobileDevice(): detecta si es mobile (touch, screen size)
  - isTablet(): detecta tablets
  - isIOS(): detecta iOS
  - isAndroid(): detecta Android
  - isPWAInstalled(): detecta si está instalada como PWA
  - getDeviceInfo(): retorna info completa del dispositivo
  
- Hook useDeviceDetection():
  - Retorna: { isMobile, isTablet, isIOS, isAndroid, isPWA }
  - Reactivo a cambios de orientación
  - Usa useEffect + window.matchMedia
  
- Hook useRoleBasedRedirect():
  - Redirige automáticamente según rol:
    - OPERATOR/SUPERVISOR + mobile -> /mobile/dashboard
    - ADMIN/MANAGER + mobile -> /admin/dashboard (pero avisar versión no optimizada)
    - OPERATOR en desktop -> sugerir usar mobile
  - Usar useAuth() y useNavigate()
  
- Guardar preferencia de usuario (localStorage):
  - Si admin insiste en usar en mobile
  - Si operator insiste en usar en desktop
  
- TypeScript estricto
- Comentarios en español

Utility para routing inteligente basado en contexto.
```

---

## 📱 Fase Mobile 2: Dashboard y Navegación

### M2.1 - Dashboard Mobile✅

**Prompt:**
```
Crea el dashboard principal para operadores móviles.

Ubicación: frontend/src/mobile/pages/Dashboard.tsx

Requisitos de Diseño:
- Hero Card superior:
  - Saludo personalizado: "Hola, [Nombre]"
  - Hora actual y fecha
  - Ubicación actual (ciudad) con ícono
  - Background gradient sutil
  
- Quick Stats (2 cards horizontales):
  - Tareas pendientes (número grande + ícono)
  - Tareas completadas hoy (con check verde)
  - Tap para ver detalles
  - Skeleton mientras carga
  
- Sección "Tareas de Hoy":
  - Lista de formularios asignados para hoy
  - Card por tarea:
    - Nombre del formulario
    - Hora límite (si aplica)
    - Badge de prioridad (si aplica)
    - Progress bar si está parcialmente completado
    - Swipe left para opciones (iniciar, ver detalles)
  - Máximo 3 tareas, luego "Ver todas"
  - Empty state amigable si no hay tareas
  
- Sección "Acceso Rápido" (chips horizontales scroll):
  - Escanear QR
  - Tomar foto
  - Reportar incidente
  - Ver historial
  - Custom chips según permisos
  
- Pull-to-refresh funcional:
  - Actualiza tareas
  - Muestra spinner
  - Feedback háptico (si disponible)
  
- Características técnicas:
  - Lazy load de tareas
  - Skeleton placeholders
  - Infinite scroll si hay muchas tareas
  - Gestos swipe con framer-motion o similar
  - Optimistic UI updates
  - Cache de datos con useQuery (React Query)
  
- Estados:
  - Loading: skeletons
  - Empty: ilustración + mensaje motivador
  - Error: retry button
  - Success: animación sutil de entrada
  
- Responsive en mobile:
  - 1 columna siempre
  - Padding lateral consistente (16px)
  - Espaciado generoso entre secciones
  
- TypeScript estricto
- Comentarios en español

Diseño inspirado en: Todoist mobile, Asana mobile, Microsoft To Do.
```

### M2.2 - Bottom Navigation✅

**Prompt:**
```
Implementa el bottom navigation funcional.

Ubicación: frontend/src/mobile/components/BottomNav.tsx

Requisitos:
- 4 tabs principales:
  1. Inicio (HomeIcon):
     - Ruta: /mobile/dashboard
     - Siempre visible
  
  2. Tareas (ClipboardListIcon):
     - Ruta: /mobile/assignments
     - Badge con contador de pendientes
  
  3. Cámara (CameraIcon):
     - Abre modal de captura directamente
     - No navega, ejecuta acción
  
  4. Perfil (UserIcon):
     - Ruta: /mobile/profile
     - Punto rojo si hay notificaciones
  
- Active state:
  - Ícono con color primary
  - Label con color primary y font-medium
  - Indicador superior (línea o dot)
  - Transición suave
  
- Inactive state:
  - Ícono gris
  - Label gris y más pequeño
  - Sin indicador
  
- Interacciones:
  - Tap con feedback visual (scale 0.95)
  - Ripple effect sutil
  - Haptic feedback (si disponible)
  - No usar hover
  
- Safe area:
  - Padding bottom para home indicator iOS
  - Detectar safe-area-inset-bottom
  
- Accesibilidad:
  - Labels ARIA
  - Role="navigation"
  - Keyboard accessible (tab navigation)
  
- Fixed position:
  - bottom: 0
  - z-index alto
  - Blur backdrop
  - Border top sutil
  
- TypeScript con interfaces
- Comentarios en español

Nav bar debe sentirse nativo, no web.
```

### M2.3 - Side Drawer Menu✅

**Prompt:**
```
Crea el menú lateral deslizable (hamburger menu).

Ubicación: frontend/src/mobile/components/MobileDrawer.tsx

Requisitos:
- Props:
  - open: boolean
  - onClose: () => void
  
- Header del drawer:
  - Avatar grande del usuario
  - Nombre completo
  - Email o rol badge
  - Edit profile icon
  - Background con gradient
  
- Menu Items (lista vertical):
  Sección Principal:
  - Inicio (HomeIcon)
  - Mis Tareas (ClipboardListIcon)
  - Historial (ClockIcon)
  - Notificaciones (BellIcon + badge)
  
  Sección Herramientas:
  - Escanear QR (QrCodeIcon)
  - Capturar Foto (CameraIcon)
  - Mi Ubicación (MapPinIcon)
  
  Sección Configuración:
  - Ajustes (SettingsIcon)
  - Ayuda (HelpCircleIcon)
  - Acerca de (InfoIcon)
  
  Footer:
  - Modo offline indicator
  - Versión de la app
  - Logout (LogOutIcon) con color rojo
  
- Cada item:
  - Ícono izquierda
  - Label centro
  - Badge derecha (si aplica)
  - Ripple effect al tap
  - Navigate al tap
  
- Comportamiento:
  - Slide from left (300ms ease)
  - Backdrop blur
  - Cierra con:
    - Tap en backdrop
    - Swipe left
    - Navegación a otra ruta
  - Bloquea scroll del body cuando abierto
  
- Usar Sheet de shadcn/ui como base
- Personalizar con estilos mobile
- TypeScript estricto
- Comentarios en español

Inspiración: Gmail mobile, Slack mobile drawers.
```

### M2.4 - Pull to Refresh✅

**Prompt:**
```
Implementa pull-to-refresh nativo en páginas mobile.

Ubicación: frontend/src/mobile/hooks/usePullToRefresh.ts

Requisitos:
- Hook customizado: usePullToRefresh(onRefresh)
  - onRefresh: función async que se ejecuta al refresh
  - Retorna: { isPulling, refreshing }
  
- Mecánica:
  - Detectar touch start en el top del scroll
  - Trackear pull distance
  - Threshold: 80px para activar
  - Mostrar indicador de refresh mientras tira
  - Ejecutar onRefresh al soltar si > threshold
  - Mostrar spinner mientras refreshing
  - Feedback háptico en threshold
  
- Componente RefreshIndicator:
  - Círculo con flecha o spinner
  - Animación de rotación mientras refreshing
  - Fade in/out suave
  - Position absolute en top
  - Solo visible en mobile
  
- Integración:
  - Envolver contenido de páginas en RefreshContainer
  - Props: onRefresh, disabled (si está cargando)
  - No interfiere con scroll normal
  
- Performance:
  - RequestAnimationFrame para smooth animation
  - Throttle de eventos touch
  - Cleanup correcto en unmount
  
- Fallback:
  - Si no es touch device: usar botón de refresh
  
- TypeScript estricto
- Comentarios en español

Referencia: Instagram, Twitter mobile pull-to-refresh.
```

### M2.5 - Gesture Handlers✅

**Prompt:**
```
Implementa handlers para gestos táctiles comunes.

Ubicación: frontend/src/mobile/hooks/useGestures.ts

Requisitos:
- Hook useSwipe(onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown):
  - Detecta swipe en 4 direcciones
  - Threshold: 50px de distancia mínima
  - Velocity threshold para swipes rápidos
  - Retorna event handlers (onTouchStart, onTouchMove, onTouchEnd)
  
- Hook useLongPress(onLongPress, delay = 500):
  - Detecta long press (press & hold)
  - Delay configurable
  - Cancela si user mueve el dedo
  - Feedback háptico al activar
  - Previene context menu nativo
  
- Hook useDoubleTap(onDoubleTap, delay = 300):
  - Detecta double tap
  - Delay entre taps configurable
  - Distingue de single tap
  
- Utility hapticFeedback(type):
  - Types: 'light', 'medium', 'heavy', 'success', 'warning', 'error'
  - Usa Vibration API si disponible
  - Fallback silencioso si no soportado
  
- Utility preventZoom():
  - Previene zoom con pinch
  - Útil en formularios
  - Usar touch-action CSS
  
- Todas las funciones:
  - Previenen comportamiento default cuando sea necesario
  - Cleanup correcto
  - TypeScript estricto
  - Comentarios en español

Gestos nativos para UX mobile premium.
```

---

## 📝 Fase Mobile 3: Lista de Tareas y Asignaciones

### M3.1 - Página de Asignaciones Mobile✅

**Prompt:**
```
Crea la página de lista de tareas asignadas para mobile.

Ubicación: frontend/src/mobile/pages/Assignments.tsx

Requisitos:
- Header sticky:
  - Título "Mis Tareas"
  - Filtros button derecha
  - Search icon derecha (abre search modal)
  
- Tabs horizontales (scrollable):
  - Pendientes (badge con contador)
  - Completadas
  - Vencidas (badge rojo si hay)
  - Todas
  
- Lista de tareas:
  - Card por asignación:
    - Formulario nombre (bold, truncate 2 líneas)
    - Descripción corta (gris, truncate 1 línea)
    - Metadata row:
      - Fecha/hora límite (ClockIcon)
      - Prioridad badge (si aplica)
      - Progress bar si iniciado
    - Swipe actions:
      - Right: Ver detalles (InfoIcon)
      - Left: Iniciar/Completar (CheckIcon verde)
    - Tap: navega a formulario
  
  - Card states:
    - Default: white background
    - Vencida: red-50 background + red border
    - En progreso: blue-50 background
    - Completada: green-50 background + check badge
  
- Infinite scroll:
  - Load more al llegar al 80% del scroll
  - Skeleton loaders al final
  - "No hay más tareas" cuando termina
  
- Pull-to-refresh integrado
  
- Empty states por tab:
  - Pendientes: "No tienes tareas pendientes 🎉"
  - Completadas: "Aún no has completado tareas"
  - Todas: "No tienes tareas asignadas"
  - Ilustración + mensaje motivador
  
- Filtros modal (Sheet bottom):
  - Por fecha (rango)
  - Por formulario (multiselect)
  - Por estado
  - Por prioridad
  - Reset filters button
  - Apply button
  
- Search modal (Sheet bottom):
  - Input grande con autofocus
  - Buscar por nombre de formulario
  - Resultados en tiempo real
  - Debounce 300ms
  - Close button
  
- Loading states:
  - Initial load: skeleton cards
  - Refresh: pull-to-refresh indicator
  - Load more: skeleton al final
  
- Error state:
  - Ilustración de error
  - Mensaje claro
  - Retry button
  
- Performance:
  - Virtualización si >50 items (react-window)
  - Memoización de cards
  - Optimistic updates
  
- TypeScript estricto
- Comentarios en español

Lista eficiente y fácil de usar en campo.
```

### M3.2 - Card de Tarea con Swipe Actions✅

**Prompt:**
```
Crea el componente de card de tarea con swipe actions.

Ubicación: frontend/src/mobile/components/AssignmentCard.tsx

Requisitos:
- Props:
  - assignment: Assignment
  - onStart: () => void
  - onView: () => void
  - onComplete: () => void
  
- Layout del card:
  - Padding generoso (16px)
  - Border radius (12px)
  - Shadow sutil
  - Background white
  - Border left con color de prioridad
  
- Contenido:
  - Header row:
    - Form name (font-semibold, 16px, truncate 2 líneas)
    - Priority badge (right aligned, si aplica)
  
  - Description:
    - Gris, 14px, truncate 1 línea
    - Solo si existe description
  
  - Metadata row (flex wrap):
    - Due date chip:
      - ClockIcon + texto
      - Color rojo si vencido
      - Color amber si <24h
      - Gris si >24h
    - Location chip (si aplica):
      - MapPinIcon + nombre obra
    - Progress (si iniciado):
      - Progress bar mini
      - X/Y campos completados
  
  - Status badge (absolute top-right):
    - Pendiente: blue
    - En progreso: amber
    - Completado: green
    - Vencido: red
  
- Swipe actions (usar framer-motion):
  - Swipe right (revelar left):
    - Background verde
    - CheckIcon
    - "Completar" text
    - Threshold: 100px para activar
  
  - Swipe left (revelar right):
    - Background blue
    - InfoIcon
    - "Detalles" text
    - Threshold: 100px para activar
  
  - Release to activate:
    - Vibración háptica
    - Animación de confirmación
    - Ejecutar acción
    - Card vuelve a posición
  
- Tap normal:
  - Navega a formulario
  - Scale down 0.98 al tap
  - Ripple effect sutil
  
- Estados loading:
  - Skeleton en lugar de contenido
  - Spinner overlay al ejecutar acción
  - Disabled state
  
- Accesibilidad:
  - Botones de acción alternativos (no solo swipe)
  - Labels ARIA
  - Focus visible
  
- TypeScript con interfaces
- Comentarios en español

Card táctil con interacciones nativas.
```

### M3.3 - Filtros y Búsqueda Mobile✅

**Prompt:**
```
Crea los modales de filtros y búsqueda para mobile.

Ubicación: frontend/src/mobile/components/AssignmentFilters.tsx

Requisitos para Filtros Sheet:
- Componente FiltersSheet:
  - Props: open, onClose, filters, onApply
  - Sheet desde bottom (height: 70vh)
  
- Header del sheet:
  - Título "Filtros"
  - Close button (X)
  - Reset button (texto, derecha)
  
- Secciones de filtros:
  1. Estado:
     - Radio group (Todas, Pendientes, Completadas, Vencidas)
     - Visual chips seleccionables
  
  2. Fecha:
     - Date range picker mobile-friendly
     - Presets: Hoy, Esta semana, Este mes, Personalizado
  
  3. Formulario:
     - Multiselect con search
     - Chips de seleccionados
     - Max height con scroll
  
  4. Prioridad:
     - Checkbox group (Alta, Media, Baja)
     - Con color indicators
  
- Footer sticky:
  - Ver resultados (X tareas) - button primary
  - Limpiar filtros - button ghost
  
- Animaciones:
  - Slide up desde bottom
  - Backdrop blur fade in
  
Requisitos para Search Sheet:
- Componente SearchSheet:
  - Props: open, onClose, onSearch
  
- Input de búsqueda:
  - Autofocus al abrir
  - Placeholder: "Buscar tareas..."
  - Clear button (X)
  - SearchIcon left
  - Debounce 300ms
  
- Resultados:
  - Lista de AssignmentCard mini
  - Highlight de término buscado
  - Empty state: "No se encontraron tareas"
  - Skeleton mientras busca
  
- Historial de búsquedas:
  - Últimas 5 búsquedas
  - Tap para re-buscar
  - Clear history button
  - Guardar en localStorage
  
- Keyboard:
  - Enter para buscar
  - Escape para cerrar
  - Arrow keys para navegar resultados
  
- TypeScript estricto
- Comentarios en español

Filtros y búsqueda optimizados para touch.
```

### M3.4 - Estado Offline de Tareas✅

**Prompt:**
```
Implementa manejo de estado offline para tareas.

Ubicación: frontend/src/mobile/hooks/useOfflineAssignments.ts

Requisitos:
- Hook useOfflineAssignments():
  - Retorna:
    - assignments: lista combinada (server + local)
    - isOnline: boolean
    - syncStatus: 'synced' | 'pending' | 'syncing' | 'error'
    - pendingChanges: number
    - syncNow: () => Promise<void>
  
- Funcionalidad:
  1. Fetch assignments cuando hay conexión
  2. Guardar en IndexedDB (no localStorage, es más robusto)
  3. Cuando offline:
     - Servir desde IndexedDB
     - Permitir cambios locales
     - Marcar cambios como "pending sync"
  4. Cuando vuelve conexión:
     - Auto-sync cambios pendientes
     - Resolver conflictos (last-write-wins)
     - Notificar éxito/error
  
- Storage con IndexedDB:
  - Store: 'assignments'
  - Key: assignmentId
  - Fields: ...assignment, _syncStatus, _lastModified
  
- Sync Queue:
  - Store: 'sync_queue'
  - Guardar acciones pendientes:
    - startAssignment
    - completeAssignment
    - updateProgress
  - Ejecutar en orden FIFO
  - Retry 3 veces si falla
  - Mostrar en UI cuántas pending
  
- Indicadores visuales:
  - Badge "Offline" en header si no hay conexión
  - Cloud icon en cada card:
    - Synced: green check
    - Pending: amber clock
    - Error: red warning
  - Toast al sincronizar exitosamente
  
- Background sync:
  - Usar Service Worker background sync API
  - Fallback: polling cada 30s cuando hay cambios pending
  
- Conflict resolution:
  - Server data wins por default
  - Guardar versión local como "draft"
  - Notificar al usuario si hay conflicto
  
- TypeScript estricto
- Comentarios en español

Offline-first para trabajar sin conexión en campo.
```

### M3.5 - Notificaciones Push Mobile✅

**Prompt:**
```
Implementa sistema de notificaciones push para mobile.

Ubicación: frontend/src/mobile/utils/pushNotifications.ts

Requisitos:
- Setup de Push Notifications:
  - Pedir permiso al usuario (iOS y Android)
  - Registrar service worker para notificaciones
  - Obtener token de FCM (Firebase Cloud Messaging)
  - Enviar token al backend
  
- Función requestNotificationPermission():
  - Verificar soporte del browser
  - Mostrar prompt de permiso nativo
  - Guardar respuesta del usuario
  - Manejar denegación (sugerir habilitar en settings)
  
- Función subscribeToNotifications():
  - Obtener registration del SW
  - Subscribe con VAPID key
  - Enviar subscription al backend
  
- Tipos de notificaciones mobile:
  1. Nueva tarea asignada:
     - Título: "Nueva tarea asignada"
     - Body: nombre del formulario
     - Action: abrir formulario
     - Badge con número
  
  2. Recordatorio de tarea:
     - Título: "Recordatorio"
     - Body: "Tienes X tareas pendientes"
     - Scheduled notification (si disponible)
  
  3. Tarea vencida:
     - Título: "Tarea vencida"
     - Body: nombre del formulario
     - Priority: high
     - Vibration pattern
  
  4. Comentario o actualización:
     - Título: "Actualización"
     - Body: mensaje
     - Action buttons: Ver, Ignorar
  
- Handling de notificaciones:
  - Click: navegar a la página relevante
  - Action buttons: ejecutar acción específica
  - Dismiss: limpiar badge
  
- Notificaciones en foreground:
  - Mostrar toast en lugar de notificación nativa
  - Sonido sutil
  - Badge update
  
- Badge counter:
  - Actualizar app icon badge
  - Sincronizar con tareas pendientes
  - Clear al abrir app
  
- Configuración de usuario:
  - Enable/disable push
  - Tipos de notificaciones
  - Horario de notificaciones (DND)
  - Guardar en perfil
  
- Backend integration:
  - Endpoint POST /api/push/subscribe
  - Endpoint POST /api/push/unsubscribe
  - Backend envía notificaciones vía FCM
  
- TypeScript estricto
- Comentarios en español

Push notifications para mantener usuarios informados.
```

---

## 📋 Fase Mobile 4: Formulario Mobile Optimizado

### M4.1 - Página de Formulario Mobile✅

**Prompt:**
```
Crea la página para responder formularios en mobile.

Ubicación: frontend/src/mobile/pages/FormResponse.tsx

Requisitos:
- Recibir assignmentId de URL params
- Cargar formulario y assignment data
- Verificar que esté asignado al usuario actual

Layout Mobile:
- Header sticky:
  - Back button (< icon)
  - Form title (truncate 1 línea)
  - Progress indicator (X/Y campos)
  - Menu (...)
  
- Progress bar horizontal:
  - Debajo del header
  - Visual del progreso general
  - Animado al completar campos
  
- Stepper lateral (opcional, colapsable):
  - Lista de secciones/campos
  - Current position highlighted
  - Tap para saltar (si permite)
  
- Contenido principal:
  - Campos one-per-screen (mobile pattern):
    - 1 campo visible a la vez
    - Swipe left/right para navegar
    - O scroll vertical tradicional (configurable)
  - Padding generoso (24px)
  - Typography grande y legible
  - Inputs optimizados para mobile
  
- Campo actual:
  - Label grande (18px, bold)
  - Helper text si existe (gris, 14px)
  - Input apropiado según tipo
  - Validation en tiempo real
  - Error message debajo (rojo, con icon)
  - Success indicator (check verde)
  
- Navegación entre campos:
  - Botones: Anterior / Siguiente
  - Keyboard Next automático
  - Skip si no es requerido
  - Jump to final si todos completos
  
- Footer sticky:
  - Guardar borrador (ghost button)
  - Siguiente/Enviar (primary button)
  - Safe area bottom padding
  
- Menu contextual (...):
  - Ver resumen
  - Guardar y salir
  - Reportar problema
  - Ayuda
  
Modal de confirmación antes de enviar:
- Resumen de campos completados
- Advertencia de campos vacíos
- Checkbox "Confirmo que los datos son correctos"
- Botones: Revisar / Enviar

Auto-save:
- Guardar progreso cada 30s
- Guardar al cambiar de campo
- Indicador "Guardando..." sutil
- Toast "Borrador guardado" (discreto)

Validaciones mobile-friendly:
- Validar solo al salir del campo (no en cada keystroke)
- Mensajes cortos y claros
- Scroll automático a error
- Vibración háptica en error

Estados:
- Loading: skeleton del formulario
- Saving: overlay con spinner
- Success: animación de éxito + redirect
- Error: modal con mensaje y retry

Offline mode:
- Permitir llenar formulario offline
- Guardar en IndexedDB
- Badge "Offline" visible
- Sincronizar cuando vuelva conexión
- Advertir si hay campos que requieren conexión (geolocalización, fotos)

TypeScript estricto
Comentarios en español

Formulario conversacional y fácil de usar con una mano.
```

### M4.2 - Inputs Mobile Optimizados✅

**Prompt:**
```
Crea componentes de input optimizados para mobile.

Ubicación: frontend/src/mobile/components/inputs/

Requisitos generales para todos los inputs:
- Altura mínima: 56px (fácil de tocar)
- Padding: 16px horizontal
- Font-size: 16px (previene zoom en iOS)
- Border radius: 12px
- Focus state: border color primary + ring
- Error state: border red + shake animation
- Disabled state: opacity 0.5 + cursor not-allowed
- Label arriba (no flotante)
- Helper text debajo
- Character counter (si aplica)

Componentes a crear:

1. MobileTextInput:
   - Props: value, onChange, label, placeholder, error, helperText, maxLength
   - Types: text, email, tel, url
   - Input mode apropiado (text, email, tel, url, numeric)
   - Autocomplete attributes
   - Clear button (X) cuando tiene contenido
   - Success checkmark si validado
   
2. MobileTextarea:
   - Auto-resize según contenido
   - Max height con scroll
   - Character counter visible
   - Rows iniciales: 3
   
3. MobileNumberInput:
   - Input mode numeric
   - Botones +/- a los lados
   - Min/max validation visual
   - Haptic feedback en botones
   - Formato con separadores (1,000)
   
4. MobileDateInput:
   - Native date picker en mobile
   - Fallback: modal calendar picker
   - Formato: DD/MM/YYYY (localizado)
   - Quick selects: Hoy, Mañana, En 1 semana
   - Clear button
   
5. MobileTimeInput:
   - Native time picker en mobile
   - Formato 24h o 12h según locale
   - Quick selects: Ahora, +30min, +1h
   
6. MobileSelect:
   - Sheet bottom con opciones
   - Search si >10 opciones
   - Multi-select con chips
   - Native select fallback
   - Scroll largo si muchas opciones
   - Selected items highlighted
   
7. MobileRadioGroup:
   - Cards grandes seleccionables
   - Radio button visible a la derecha
   - Descripción opcional bajo cada opción
   - Selected: border primary + background light
   - Haptic feedback al seleccionar
   
8. MobileCheckbox:
   - Checkbox grande (32x32px)
   - Label a la derecha (no envuelve checkbox)
   - Tap en label también selecciona
   - Indeterminate state si aplica
   
9. MobileSwitch:
   - Estilo iOS/Android según plataforma
   - Grande y fácil de tocar
   - Animación suave
   - Label a la izquierda
   
10. MobileFileInput:
    - Botón grande "Adjuntar archivo"
    - Muestra preview si es imagen
    - File size y type visible
    - Remove button en preview
    - Drag & drop NO (no funciona bien en mobile)
    - Acceso directo a cámara si es foto
    
11. MobileSignatureInput:
    - Canvas para firma digital
    - Full screen modal
    - Clear button
    - Undo last stroke
    - Save button
    - Preview thumbnail cuando firmado
    - Responsive al tamaño de pantalla
    
12. MobileGeolocationInput:
    - Botón "Obtener ubicación actual"
    - Muestra lat/long y dirección
    - Mini mapa preview (optional)
    - Refresh button
    - Loading spinner mientras obtiene
    - Error handling (permisos denegados)

Validación visual común:
- Error: border red + shake + error message
- Success: border green + checkmark
- Warning: border amber + warning icon
- Info: border blue + info icon

Accesibilidad:
- Labels asociados con IDs
- ARIA attributes
- Focus visible
- Keyboard navigation
- Error announcements para screen readers

TypeScript con interfaces estrictas
Comentarios en español

Inputs que se sienten nativos en mobile.
```

### M4.3 - Captura de Fotos con Cámara✅

**Prompt:**
```
Implementa captura de fotos optimizada para mobile.

Ubicación: frontend/src/mobile/components/CameraCapture.tsx

Requisitos:
- Componente CameraCapture:
  - Props: onCapture, onClose, maxPhotos, compressQuality
  - Full screen modal
  - Acceso a cámara nativa
  
- UI de captura:
  - Video preview (cámara en vivo)
  - Botón de captura (círculo grande, centro bottom)
  - Switch camera button (flip front/back)
  - Flash toggle (auto, on, off)
  - Grid overlay (rule of thirds, opcional)
  - Zoom slider (si soportado)
  - Close button (X, top left)
  
- Permisos:
  - Request camera permission
  - Mostrar mensaje claro si denegado
  - Link a settings para habilitar
  - Graceful degradation (usar file input)
  
- Captura:
  - Tap en botón o volume button
  - Haptic feedback
  - Shutter animation y sonido
  - Preview de foto capturada (3 segundos)
  - Opciones: Retomar, Usar foto
  
- Multi-captura:
  - Permitir tomar múltiples fotos
  - Thumbnail gallery bottom
  - Drag to reorder
  - Swipe up to delete
  - Contador: X/Y fotos
  
- Edición básica:
  - Crop/rotate
  - Brightness/contrast sliders
  - Filters (opcional)
  - Botón guardar cambios
  
- Compresión:
  - Comprimir antes de upload
  - Quality configurable (default: 0.8)
  - Max dimension: 1920px
  - Convert a WebP si soportado
  - Mostrar tamaño antes/después
  
- Metadata:
  - Geolocalización (EXIF)
  - Timestamp
  - Device info
  - Preservar si posible
  
- Upload:
  - Progress bar por foto
  - Upload en background
  - Retry si falla
  - Queue de uploads
  
- Fallback para desktop/tablet:
  - File input tradicional
  - Drag & drop
  - Paste desde clipboard
  
- Componente PhotoGallery:
  - Grid de fotos capturadas
  - Lightbox al tap
  - Swipe between photos
  - Delete button
  - Download button (opcional)
  
- Estados:
  - Loading camera: spinner
  - No permission: mensaje con instrucciones
  - Error: mensaje de error con retry
  - Uploading: progress indicators
  
- Performance:
  - Lazy load video stream
  - Pause stream cuando no visible
  - Cleanup on unmount
  - Memory management
  
- TypeScript estricto
- Comentarios en español

Captura de fotos profesional como app nativa.
```

### M4.4 - Firma Digital Móvil✅

**Prompt:**
```
Implementa componente de firma digital para mobile.

Ubicación: frontend/src/mobile/components/SignaturePad.tsx

Requisitos:
- Componente SignaturePad:
  - Props: onSave, onClose, value (si existe)
  - Full screen modal
  - Canvas HTML5
  
- UI del canvas:
  - Full width canvas (responsive)
  - Background white con línea guía
  - Instrucción: "Firme aquí"
  - Landscape orientation preferida (auto-rotate hint)
  
- Controles:
  - Pen color picker (negro, azul)
  - Pen size (fino, medio, grueso)
  - Clear button (⟲)
  - Undo button (solo último trazo)
  - Close button (X)
  - Save button (✓)
  
- Drawing:
  - Smooth lines (Bézier curves)
  - Pressure sensitivity (si soportado)
  - Touch events optimizados
  - No lag (requestAnimationFrame)
  - Prevenir scroll mientras dibuja
  
- Validación:
  - Verificar que no esté vacío
  - Mínimo X trazos
  - Advertencia si firma muy pequeña
  
- Exportar:
  - PNG transparent background
  - Base64 string
  - Metadata: timestamp, device
  - Comprimir si es muy grande
  
- Preview:
  - Thumbnail de firma guardada
  - Tap para ver full size
  - Edit button para re-firmar
  - Clear button
  
- Orientación:
  - Detectar landscape
  - Sugerir rotar para mejor experiencia
  - Lock orientation mientras firma (si posible)
  
- Estados:
  - Empty: mostrar hint
  - Drawing: ocultar hint
  - Saved: mostrar preview
  - Loading: spinner
  
- Accesibilidad:
  - Alt text para signature image
  - Keyboard navigation de controles
  - Screen reader announcements
  
- Performance:
  - Canvas size optimizado
  - Throttle de eventos
  - Debounce de save
  - Memory cleanup
  
- TypeScript estricto
- Comentarios en español

Firma digital natural como firmar en papel.
```

### M4.5 - Geolocalización Mejorada✅

**Prompt:**
```
Mejora el componente de geolocalización para mobile.

Ubicación: frontend/src/mobile/components/LocationPicker.tsx

Requisitos:
- Componente LocationPicker:
  - Props: onLocationSelect, initialLocation, required
  - Inline o modal según espacio
  
- UI compacta:
  - Botón "Obtener ubicación actual"
  - GPS icon + loading spinner
  - Lat/Long display (si obtenido)
  - Dirección aproximada (reverse geocoding)
  - Accuracy indicator (metros)
  - Timestamp de captura
  
- Obtención de ubicación:
  - High accuracy mode
  - Timeout: 30 segundos
  - Multiple attempts (3 retries)
  - Fallback a low accuracy si falla
  - Show loading state mientras obtiene
  
- Permisos:
  - Request location permission
  - Mensaje claro si denegado
  - Link a settings
  - Fallback: ingresar dirección manual
  
- Mapa interactivo (opcional):
  - Mini mapa con marker
  - Tap para abrir full screen
  - Drag marker para ajustar
  - Zoom controls
  - Current location button
  - Usar Leaflet o Google Maps
  
- Reverse Geocoding:
  - Convertir lat/long a dirección
  - Mostrar: calle, ciudad, región
  - API: Google Maps, OpenStreetMap, o similar
  - Cache de resultados
  
- Accuracy visualization:
  - Verde: <10m (excelente)
  - Amarillo: 10-50m (buena)
  - Rojo: >50m (pobre)
  - Sugerir retry si es pobre
  
- Background location (opcional):
  - Trackear ubicación cada X minutos
  - Útil para formularios largos
  - Guardar histórico de ubicaciones
  - Mostrar ruta si aplicable
  
- Offline mode:
  - Guardar última ubicación conocida
  - Indicar que es "cached location"
  - Actualizar cuando vuelva conexión
  
- Validación:
  - Verificar que esté dentro de área permitida (opcional)
  - Alertar si está muy lejos de la obra
  - Validar accuracy mínima
  
- Estados:
  - Idle: botón para obtener
  - Loading: spinner + mensaje
  - Success: datos de ubicación
  - Error: mensaje con retry
  - Denied: instrucciones para habilitar
  
- Performance:
  - Cancelar request si unmount
  - Debounce de updates
  - Cache de geocoding
  
- TypeScript estricto
- Comentarios en español

Geolocalización precisa y confiable para campo.
```

---

## 💾 Fase Mobile 5: Offline y Sincronización

### M5.1 - Service Worker Avanzado✅

**Prompt:**
```
Mejora el Service Worker para offline robusto.

Ubicación: frontend/public/sw.js y frontend/src/mobile/utils/serviceWorkerManager.ts

Requisitos para Service Worker:
- Estrategias de cache:
  1. Network First (API calls):
     - Intenta fetch de red
     - Timeout: 5 segundos
     - Fallback a cache
     - Cache response si exitoso
  
  2. Cache First (assets estáticos):
     - JS, CSS, imágenes, fonts
     - Fallback a network si no en cache
  
  3. Stale While Revalidate (data frecuente):
     - Dashboard data
     - Retorna cache inmediatamente
     - Fetch en background y actualiza cache
  
  4. Network Only (crítico):
     - Login, logout
     - No cachear nunca
  
- Pre-caching:
  - Shell de la app (HTML, JS, CSS core)
  - Iconos y assets críticos
  - Páginas principales (dashboard, assignments)
  - Listar en workbox-config o manual
  
- Runtime caching:
  - API responses (max 50 items, 7 días)
  - Imágenes (max 100 items, 30 días)
  - Fonts (max 20 items, 1 año)
  - LRU eviction policy
  
- Background Sync:
  - Queue de acciones pendientes
  - Retry automático cuando hay conexión
  - Notificar éxito/error
  - Tags: 'submit-form', 'upload-photo', 'sync-location'
  
- Push Notifications:
  - Listen push events
  - Show notification
  - Handle notification click
  - Badge updates
  
- Update handling:
  - Detectar nuevo SW disponible
  - Mostrar prompt "Nueva versión disponible"
  - Botón: Actualizar ahora / Después
  - Skip waiting al confirmar
  - Reload page después de activar
  
- Offline page:
  - Página custom para rutas no cacheadas
  - Lista de funcionalidades disponibles offline
  - Retry button
  - Status de conexión
  
Manager de Service Worker:
- Función registerServiceWorker():
  - Registrar SW
  - Handle updates
  - Listen messages del SW
  
- Función checkForUpdates():
  - Manual check
  - Periodicidad configurable
  
- Hook useServiceWorker():
  - isOnline: boolean
  - needsUpdate: boolean
  - updateApp: () => void
  - isInstalling: boolean
  
- Comunicación bidireccional:
  - postMessage desde app a SW
  - Broadcast channel para updates
  
TypeScript para manager
Comentarios en español

Service Worker robusto para offline completo.
```

### M5.2 - IndexedDB Storage Manager✅

**Prompt:**
```
Implementa manager de IndexedDB para storage offline.

Ubicación: frontend/src/mobile/utils/offlineStorage.ts

Requisitos:
- Usar librería: Dexie.js (wrapper de IndexedDB)
- Instalar: npm install dexie

Database schema:
- Store 'assignments':
  - id (primary key)
  - formId, userId, data, status, createdAt, updatedAt
  - _syncStatus: 'synced' | 'pending' | 'conflict'
  - _version: number
  
- Store 'form_responses':
  - id, assignmentId, data, photos, signature, location
  - _isDraft: boolean
  - _syncStatus, _lastSaved, _version
  
- Store 'photos':
  - id, responseId, blob, metadata
  - _uploaded: boolean
  
- Store 'sync_queue':
  - id, action, payload, retries, createdAt
  
- Store 'cache':
  - key, value, expiresAt

Clase OfflineStorageManager:
- Singleton pattern
- Métodos para assignments:
  - getAssignments(filter?)
  - getAssignment(id)
  - saveAssignment(data)
  - deleteAssignment(id)
  - markAsSync(id)
  
- Métodos para responses:
  - getResponse(id)
  - saveResponse(data)
  - saveDraft(data)
  - getDrafts()
  - deleteDraft(id)
  
- Métodos para photos:
  - savePhoto(blob, metadata)
  - getPhoto(id)
  - getPhotos(responseId)
  - deletePhoto(id)
  - markAsUploaded(id)
  
- Métodos para sync queue:
  - addToQueue(action, payload)
  - getQueue()
  - removeFromQueue(id)
  - clearQueue()
  
- Métodos de utility:
  - clear(): limpiar toda la DB
  - getSize(): tamaño usado
  - export(): exportar data
  - import(data): importar data
  
- Manejo de errores:
  - QuotaExceededError: alertar usuario
  - Corruption: intentar recovery
  - Logging de errores
  
Hook useOfflineStorage():
- Wrapper del manager
- Reactivo a cambios
- Integración con React

Migration strategy:
- Versionado de schema
- Upgrade functions
- Backwards compatibility

Performance:
- Batch operations
- Indexes apropiados
- Lazy loading
- Transaction optimization

TypeScript estricto
Comentarios en español

Storage robusto para datos offline.
```

### M5.3 - Sincronización Automática✅

**Prompt:**
```
Implementa sistema de sincronización automática.

Ubicación: frontend/src/mobile/utils/syncManager.ts

Requisitos:
- Clase SyncManager (singleton):
  
Métodos principales:
- sync(): sincronizar todo
- syncAssignments(): sync asignaciones
- syncResponses(): sync respuestas
- syncPhotos(): sync fotos
- syncQueue(): procesar cola de acciones

Lógica de sincronización:
1. Verificar conexión
2. Obtener items pendientes de sync
3. Ordenar por prioridad (responses > photos)
4. Procesar uno por uno
5. Manejar éxitos y errores
6. Actualizar status local
7. Notificar progreso

Manejo de conflictos:
- Detectar: version local vs server
- Estrategias:
  - Server wins (default)
  - Local wins (si user elige)
  - Merge (si posible)
  - Manual resolution (mostrar modal)
- Guardar conflictos para review

Retry logic:
- Exponential backoff
- Max 3 retries per item
- Diferentes tiempos según error:
  - Network: retry rápido
  - Server error: retry más lento
  - Auth error: no retry (pedir login)

Priorización:
- Critical: responses completas
- High: photos
- Medium: partial updates
- Low: analytics events

Progress tracking:
- Total items
- Current item
- Success count
- Error count
- Estimated time

Notificaciones:
- Inicio de sync: toast discreto
- Progreso: progress bar
- Éxito: toast con check
- Error: modal con detalle

Background sync:
- Trigger automático:
  - Al obtener conexión
  - Al abrir la app
  - Cada 5 minutos (si hay pending)
- Usar Service Worker background sync API
- Fallback: setInterval

Hook useSyncManager():
- isSyncing: boolean
- progress: number (0-100)
- pendingCount: number
- lastSyncDate: Date
- syncNow(): manual trigger
- cancelSync(): cancelar sync actual

Events emitter:
- sync-start
- sync-progress
- sync-complete
- sync-error
- conflict-detected

Status persistence:
- Guardar último sync
- Guardar errores
- Recovery automático

TypeScript estricto
Comentarios en español

Sincronización inteligente y resiliente.
```

### M5.4 - Indicadores de Estado Offline✅

**Prompt:**
```
Crea componentes visuales de estado offline/sync.

Ubicación: frontend/src/mobile/components/offline/

Componentes a crear:

1. OfflineBanner:
   - Banner top fijo cuando offline
   - Background amber/red
   - Texto: "Sin conexión"
   - Icon: WifiOffIcon
   - Dismiss button (temporal)
   - Slide down animation
   
2. SyncIndicator:
   - Badge flotante (bottom-right)
   - Estados:
     - Synced: green check, hidden después de 2s
     - Syncing: spinner + contador
     - Pending: amber clock + número
     - Error: red warning
   - Tap para ver detalles
   - Pulsa suavemente
   
3. SyncStatusModal:
   - Lista de items en sync
   - Progress bar por item
   - Success/error icons
   - Retry failed button
   - Clear completed button
   - Close button
   
4. ConnectionStatus:
   - Indicador en header
   - Icon circular:
     - Online: green dot
     - Offline: red dot
     - Slow: amber dot
   - Tooltip con info:
     - Status
     - Last sync
     - Pending count
     
5. OfflineModeBadge:
   - Badge en cards que están offline
   - "Local" o "Sin subir"
   - Color gris
   - Small size
   
6. DataUsageIndicator:
   - Storage usado / disponible
   - Progress bar
   - En settings page
   - Alert si casi lleno
   - Clear cache button
   
7. NetworkSpeedIndicator:
   - Detectar velocidad de conexión
   - 4G, 3G, 2G, WiFi
   - Sugerir esperar si es lenta
   - En sync modal

Animaciones:
- Fade in/out suaves
- Slide transitions
- Pulse para pending items
- Shake para errores
- Spin para syncing

Estados:
- Online: verde
- Offline: rojo
- Syncing: azul
- Error: rojo intenso
- Warning: amarillo

TypeScript con interfaces
Comentarios en español

Feedback visual claro del estado de conexión.
```

### M5.5 - Manejo de Datos Grandes Offline✅

**Prompt:**
```
Implementa estrategias para manejar datos grandes offline.

Ubicación: frontend/src/mobile/utils/dataManager.ts

Requisitos:

Compresión de datos:
- Comprimir JSON antes de guardar:
  - Usar lz-string o similar
  - Solo para objetos grandes
  - Transparente al usuario
  
- Comprimir imágenes:
  - Resize antes de guardar
  - WebP format
  - Quality configurable
  - Mantener aspect ratio

Paginación de cache:
- No cargar todo en memoria
- Paginar queries a IndexedDB
- Lazy loading de listas
- Virtual scrolling

Selective sync:
- Permitir elegir qué syncronizar
- WiFi-only sync para fotos
- Priority sync para responses
- Defer sync de data no crítica

Data cleanup:
- Auto-delete data vieja:
  - Responses >30 días synced
  - Photos subidas >7 días
  - Cache expirado
- Manual cleanup:
  - Clear all cache
  - Delete old drafts
  - Selective delete

Quota management:
- Monitorear storage usado
- Alert al 80% de capacidad
- Sugerencias de limpieza
- Prevenir QuotaExceeded

Estrategia de fotos:
- Thumbnail local siempre
- Full size solo si necesario
- Upload en WiFi preferido
- Queue de uploads
- Compress before upload

Optimización de queries:
- Indexes correctos
- Limit de resultados
- Cursor-based pagination
- Projection (select fields)

Background tasks:
- Cleanup periódico
- Compression en idle
- Prefetch de data probable

Hook useDataManager():
- storageUsed: number
- storageAvailable: number
- compressionEnabled: boolean
- cleanupOldData(): Promise
- getStorageInfo(): Object

Settings de usuario:
- Auto cleanup toggle
- Cleanup frequency
- WiFi-only uploads
- Max cache size
- Photo quality

TypeScript estricto
Comentarios en español

Gestión eficiente de storage limitado en mobile.
```

---

## 👤 Fase Mobile 6: Perfil y Configuración

### M6.1 - Página de Perfil Mobile✅

**Prompt:**
```
Crea la página de perfil de usuario para mobile.

Ubicación: frontend/src/mobile/pages/Profile.tsx

Requisitos:

Header del perfil:
- Cover image (gradient o foto)
- Avatar grande centrado (overlap con cover)
- Nombre completo
- Rol badge
- Email
- Edit button (top-right)

Secciones del perfil:

1. Información Personal (expandible):
   - Nombre completo
   - Email
   - Teléfono
   - Empresa/Área
   - Edit mode inline
   
2. Estadísticas:
   - Grid 2x2 de cards:
     - Tareas completadas (número + ícono)
     - Racha actual (días consecutivos)
     - Tasa de cumplimiento (%)
     - Horas trabajadas (este mes)
   - Tap para ver detalles
   
3. Actividad Reciente:
   - Timeline de últimas 5 acciones
   - Iconos por tipo de acción
   - Fecha relativa
   - Ver todas →
   
4. Configuración rápida:
   - Lista de toggles:
     - Notificaciones push
     - Modo offline
     - Auto-sync
     - Ubicación siempre
   - Tap para abrir settings detallados

5. Sección Seguridad:
   - Cambiar contraseña →
   - Sesiones activas →
   - Autenticación biométrica (toggle)
   
6. Preferencias:
   - Idioma
   - Tema (Light/Dark/Auto)
   - Tamaño de fuente
   
7. Ayuda y Soporte:
   - Tutorial interactivo
   - Preguntas frecuentes
   - Contactar soporte
   - Reportar problema
   
8. Acerca de:
   - Versión de la app
   - Términos y condiciones
   - Política de privacidad
   - Licencias

Footer:
- Botón Logout (rojo, outline)
- Confirmación modal

Edición de perfil:
- Modal bottom sheet
- Formulario con campos editables
- Validación en tiempo real
- Save button
- Discard changes confirmation

Cambiar avatar:
- Tap en avatar
- Opciones:
  - Tomar foto
  - Elegir de galería
  - Usar avatar predeterminado
- Crop circular
- Preview antes de guardar

Estados:
- Loading: skeleton
- Editing: form mode
- Saving: spinner overlay
- Error: toast con mensaje

TypeScript estricto
Comentarios en español

Perfil completo y personalizable.
```

### M6.2 - Configuración Detallada✅

**Prompt:**
```
Crea página de configuración/ajustes completa.

Ubicación: frontend/src/mobile/pages/Settings.tsx

Requisitos:

Layout:
- Header: "Configuración" + back button
- Lista agrupada por categorías
- Cada item navega a sub-página o toggle inline

Categorías:

1. Cuenta:
   - Ver perfil
   - Editar información
   - Cambiar contraseña
   - Verificación en dos pasos
   - Sesiones activas
   - Eliminar cuenta (con advertencias)
   
2. Notificaciones:
   - Push notifications (toggle master)
   - Tipos de notificaciones:
     - Nuevas tareas (toggle)
     - Recordatorios (toggle)
     - Comentarios (toggle)
     - Actualizaciones (toggle)
   - Horario de notificaciones:
     - No molestar (time range)
   - Sonido (picker)
   - Vibración (toggle)
   - Badge count (toggle)
   
3. Datos y Sincronización:
   - Auto-sync (toggle)
   - Sync solo en WiFi (toggle)
   - Frecuencia de sync (select: manual, cada 5min, cada 15min, cada hora)
   - Sincronizar ahora (button)
   - Datos pendientes (número)
   - Última sincronización (fecha)
   
4. Almacenamiento:
   - Espacio usado (progress bar)
   - Desglose por tipo:
     - Formularios
     - Fotos
     - Cache
     - Borradores
   - Limpiar cache (button con confirmación)
   - Eliminar borradores antiguos (>30 días)
   - Gestionar descargas
   
5. Privacidad y Permisos:
   - Ubicación (always, when using, never)
   - Cámara (permitir/denegar)
   - Micrófono (si aplica)
   - Almacenamiento
   - Abrir configuración del sistema (link)
   
6. Apariencia:
   - Tema:
     - Light
     - Dark
     - Automático (según sistema)
   - Tamaño de texto (slider: pequeño, normal, grande, muy grande)
   - Densidad de información (compacto, normal, espacioso)
   - Animaciones (toggle)
   
7. Accesibilidad:
   - Alto contraste (toggle)
   - Reducir movimiento (toggle)
   - Subtítulos (si hay video)
   - Lector de pantalla compatible
   
8. Conexión:
   - Modo offline (force offline para testing)
   - Calidad de imágenes:
     - Alta (WiFi)
     - Media (Móvil)
     - Baja (Datos)
   - Limitar uso de datos (toggle)
   
9. Idioma y Región:
   - Idioma de la app (picker)
   - Formato de fecha
   - Formato de hora (12h/24h)
   - Zona horaria
   
10. Avanzado:
    - Modo desarrollador (hidden, activar con 7 taps)
    - Logs de depuración
    - Exportar datos
    - Importar datos
    - Restablecer configuración

Cada sub-página:
- Header con título + back
- Descripción explicativa
- Campos apropiados
- Save automático o button
- Confirmación si es destructivo

Modal de confirmación:
- Para acciones destructivas
- Título claro
- Descripción de consecuencias
- Botones: Cancelar / Confirmar

TypeScript estricto
Comentarios en español

Configuración completa y organizada.
```

### M6.3 - Cambio de Contraseña y Seguridad✅

**Prompt:**
```
Implementa funcionalidades de seguridad.

Ubicación: frontend/src/mobile/pages/Security.tsx

Requisitos:

Página de Cambio de Contraseña:
- Formulario:
  - Contraseña actual (password input)
  - Nueva contraseña (password input)
  - Confirmar contraseña (password input)
  - Show/hide password toggles
  
- Validación de contraseña:
  - Strength meter visual:
    - Débil: roja
    - Media: amarilla
    - Fuerte: verde
  - Requisitos (checklist visual):
    - Mínimo 8 caracteres
    - Al menos 1 mayúscula
    - Al menos 1 número
    - Al menos 1 carácter especial
  - Match de confirmación
  
- Botón "Cambiar contraseña"
- Confirmar con contraseña actual
- Toast de éxito
- Auto-logout después de cambiar

Sesiones Activas:
- Lista de sesiones:
  - Device name
  - Browser/OS
  - Location (aproximada)
  - IP address
  - Last active
  - Current session (badge)
  
- Acciones por sesión:
  - Ver detalles
  - Cerrar sesión
  
- Cerrar todas las sesiones (excepto actual)
- Confirmación modal

Autenticación Biométrica:
- Toggle para habilitar
- Tipos soportados:
  - Face ID (iOS)
  - Touch ID (iOS)
  - Fingerprint (Android)
  
- Configuración:
  - Requerir para:
    - Abrir app
    - Confirmar acciones sensibles
    - Ver datos confidenciales
  
- Fallback a PIN/contraseña
- Test biométrico al habilitar

Verificación en Dos Pasos (2FA):
- Toggle master
- Métodos:
  - SMS (phone number)
  - App autenticadora (QR code)
  - Email
  
- Setup wizard:
  1. Elegir método
  2. Verificar identidad actual
  3. Configurar método
  4. Códigos de respaldo
  5. Confirmar funcionamiento
  
- Códigos de respaldo:
  - Generar 10 códigos
  - Mostrar en lista
  - Copiar/descargar
  - Advertencia de guardar
  - Regenerar (invalida anteriores)

Actividad de Seguridad:
- Timeline de eventos:
  - Login exitoso
  - Login fallido
  - Cambio de contraseña
  - 2FA habilitado/deshabilitado
  - Sesión cerrada
  
- Filtros por tipo y fecha
- Exportar log (CSV)

Alertas de Seguridad:
- Notificar eventos sospechosos:
  - Login desde nuevo dispositivo
  - Login desde nueva ubicación
  - Múltiples intentos fallidos
  - Cambio de información crítica

TypeScript estricto
Comentarios en español

Seguridad robusta para proteger usuarios.
```

### M6.4 - Tutorial Interactivo✅

**Prompt:**
```
Crea tutorial interactivo para nuevos usuarios mobile.

Ubicación: frontend/src/mobile/components/Tutorial.tsx

Requisitos:

Tour Inicial (First-Time User Experience):
- Trigger: primera vez que abre app
- 5-7 pasos máximo
- Skippable pero recomendado

Pasos del tutorial:
1. Bienvenida:
   - Logo animado
   - Texto: "Bienvenido a Collector"
   - Beneficio principal
   - Botón "Comenzar" o "Omitir"
   
2. Dashboard:
   - Highlight de sección de tareas
   - Explicar: "Aquí verás tus tareas del día"
   - Next button
   
3. Bottom Navigation:
   - Highlight de bottom nav
   - Explicar cada tab
   - Swipe para siguiente
   
4. Captura de Datos:
   - Mostrar cómo tomar fotos
   - Explicar geolocalización
   - Mencionar modo offline
   
5. Sincronización:
   - Explicar sync automático
   - Mostrar indicador de estado
   - Tranquilizar sobre offline
   
6. Finalización:
   - Mensaje motivador
   - "Listo para comenzar"
   - Botón "Empezar"

Características:
- Overlay semi-transparente oscuro
- Spotlight en elemento destacado
- Animaciones suaves de transición
- Progress dots (1/5, 2/5, etc)
- Gestos:
  - Swipe para siguiente
  - Tap en Next button
  - Skip button siempre visible
  
- Guardar progreso:
  - Si cierra, continuar después
  - Opción "No volver a mostrar"

Tutoriales Contextuales:
- Tooltips en primera interacción:
  - Primera vez que abre formulario
  - Primera foto capturada
  - Primer uso offline
  
- Coach marks:
  - Flecha apuntando a función
  - Mensaje breve
  - Dismiss al usar o tap outside
  - Max 1 por sesión

Help Center Integrado:
- Botón "?" en cada pantalla
- Muestra ayuda contextual:
  - Tips de la página actual
  - FAQs relevantes
  - Video tutoriales (si existen)
  - Chat de soporte (opcional)

Biblioteca de Tutoriales:
- En Settings > Ayuda
- Lista de tutoriales disponibles:
  - Cómo completar formulario
  - Cómo capturar fotos
  - Cómo trabajar offline
  - Cómo revisar historial
  - Consejos y trucos
  
- Cada uno:
  - Thumbnail
  - Duración
  - Descripción
  - Launch button

Interactive Demo:
- Sandbox mode
- Data de prueba
- Sin consecuencias
- Permite experimentar
- Reset al salir

TypeScript estricto
Comentarios en español

Tutorial que reduce curva de aprendizaje.
```

### M6.5 - Historial y Actividad✅

**Prompt:**
```
Crea página de historial de actividad del usuario.

Ubicación: frontend/src/mobile/pages/History.tsx

Requisitos:

Header:
- Título "Historial"
- Filtros button
- Search button
- Export button (opcional)

Vista principal - Timeline:
- Agrupado por fecha:
  - Hoy
  - Ayer
  - Esta semana
  - Este mes
  - Más antiguo
  
- Card por actividad:
  - Icon según tipo de acción
  - Título de acción
  - Descripción breve
  - Timestamp
  - Status badge (si aplica)
  - Tap para ver detalles
  
Tipos de actividad:
- Formulario completado:
  - Nombre del formulario
  - Hora de envío
  - Status: Enviado/Pendiente
  - Ver respuestas button
  
- Foto capturada:
  - Thumbnail
  - Cantidad de fotos
  - Ver galería button
  
- Tarea iniciada:
  - Nombre de tarea
  - Hora de inicio
  
- Sesión iniciada:
  - Device info
  - Location
  
- Configuración cambiada:
  - Qué cambió
  - Valor anterior → nuevo

Filtros modal:
- Por tipo de actividad (multiselect)
- Por rango de fechas
- Por formulario específico
- Por resultado (exitoso/error)
- Apply/Reset buttons

Search:
- Buscar por nombre de formulario
- Buscar por descripción
- Resultados en tiempo real
- Highlight de términos

Detalles de actividad:
- Modal o página completa
- Info completa según tipo:
  - Formulario: todas las respuestas
  - Fotos: galería completa
  - Error: stack trace (si dev mode)
- Botones de acción:
  - Ver original
  - Compartir
  - Eliminar
  - Reportar problema

Estados:
- Loading: skeleton cards
- Empty: "No hay actividad aún"
- Error: retry button

Infinite scroll:
- Load más al scroll down
- Chunk size: 20 items
- Skeleton al cargar más

Export:
- Formatos: PDF, CSV
- Rango de fechas seleccionable
- Filtros aplicados
- Enviar por email o descargar

Performance:
- Virtualización si >50 items
- Lazy load de detalles
- Cache de queries

TypeScript estricto
Comentarios en español

Historial completo de actividad del usuario.
```

---

## 🎨 Fase Mobile 7: Animaciones y Transiciones

### M7.1 - Sistema de Animaciones✅

**Prompt:**
```
Implementa sistema consistente de animaciones mobile.

Ubicación: frontend/src/mobile/utils/animations.ts

Requisitos:

Usar Framer Motion:
- Instalar: npm install framer-motion

Variantes predefinidas:
```typescript
// Fade animations
export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.2 }
}

// Slide animations
export const slideInFromBottom = {
  initial: { y: '100%', opacity: 0 },
  animate: { y: 0, opacity: 1 },
  exit: { y: '100%', opacity: 0 },
  transition: { type: 'spring', damping: 25, stiffness: 200 }
}

export const slideInFromRight = {
  initial: { x: '100%' },
  animate: { x: 0 },
  exit: { x: '100%' },
  transition: { type: 'spring', damping: 25, stiffness: 200 }
}

// Scale animations
export const scaleIn = {
  initial: { scale: 0.9, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  exit: { scale: 0.9, opacity: 0 }
}

// List animations
export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.05
    }
  }
}

export const staggerItem = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 }
}
```

Animaciones interactivas:
- Tap (press):
  ```typescript
  export const tapScale = {
    whileTap: { scale: 0.95 },
    transition: { duration: 0.1 }
  }
  ```

- Swipe:
  ```typescript
  export const swipeable = {
    drag: "x",
    dragConstraints: { left: -100, right: 100 },
    dragElastic: 0.2
  }
  ```

- Long press:
  ```typescript
  export const longPress = {
    whileTap: { scale: 0.98 },
    transition: { duration: 0.5 }
  }
  ```

Page transitions:
- Entre rutas mobile
- Slide horizontal (navegación forward)
- Slide reverso (navegación back)
- Detectar dirección automáticamente

Micro-interactions:
- Success: bounce + check icon
- Error: shake + error icon
- Loading: pulse
- New badge: bounce in

Skeleton loaders:
- Shimmer effect
- Pulse effect
- Match estructura real

Pull-to-refresh animation:
- Pull: rotate arrow
- Release: spin to loader
- Complete: check y fade out

Componentes animados:

AnimatedCard:
- Fade in on mount
- Scale on tap
- Swipe gestures

AnimatedList:
- Stagger children
- Fade in sequence
- Exit animation

AnimatedModal:
- Slide from bottom
- Backdrop fade
- Dismiss gesture

AnimatedButton:
- Tap scale
- Loading state
- Success/error states

AnimatedInput:
- Focus scale
- Error shake
- Success bounce

Performance:
- Usar transform y opacity (GPU)
- Evitar layout animations
- will-change CSS
- Reduce motion media query
- Disable en low-end devices

Hook useAnimationConfig:
- Detectar preferencia usuario
- Detectar performance device
- Return config apropiado

TypeScript estricto
Comentarios en español

Animaciones fluidas y nativas.


### M7.2 - Transiciones de Página✅

**Prompt:**
```
Implementa transiciones entre páginas mobile.

Ubicación: frontend/src/mobile/components/PageTransition.tsx

Requisitos:

Componente PageTransition:
- Wrapper para páginas
- Detecta dirección de navegación
- Aplica animación apropiada

Tipos de transición:
1. Push (navegar forward):
   - Página nueva slide desde derecha
   - Página actual slide a izquierda
   - iOS style
   
2. Pop (navegar back):
   - Página actual slide a derecha
   - Página anterior slide desde izquierda
   - Reverse de push
   
3. Modal:
   - Slide desde bottom
   - Backdrop fade in
   - Safe area aware
   
4. Fade:
   - Simple fade
   - Para cambios sin jerarquía
   - Ej: tabs bottom nav

Implementación:
```typescript
import { AnimatePresence, motion } from 'framer-motion'
import { useLocation } from 'react-router-dom'

const pageVariants = {
  initial: (direction: number) => ({
    x: direction > 0 ? '100%' : '-100%',
    opacity: 0
  }),
  animate: {
    x: 0,
    opacity: 1
  },
  exit: (direction: number) => ({
    x: direction > 0 ? '-100%' : '100%',
    opacity: 0
  })
}

// Usage
<AnimatePresence mode="wait" custom={direction}>
  <motion.div
    key={location.pathname}
    custom={direction}
    variants={pageVariants}
    initial="initial"
    animate="animate"
    exit="exit"
    transition={{ type: 'tween', duration: 0.3 }}
  >
    {children}
  </motion.div>
</AnimatePresence>
```

Detectar dirección:
- Usar history stack
- Push = forward (1)
- Pop = back (-1)
- Replace = fade (0)

Gestos de navegación:
- Swipe desde borde izquierdo = back
- Threshold: 50% de pantalla
- Velocity based
- iOS style
- Cancel si swipe incompleto

Excepciones:
- Modales: siempre desde bottom
- Tabs: fade cross
- Splash: no animation

Performance:
- Preload next page
- Cleanup animations on unmount
- Reduce motion si user prefiere

TypeScript estricto
Comentarios en español

Transiciones que se sienten nativas.
```

### M7.3 - Feedback Háptico✅

**Prompt:**
```
Implementa sistema de feedback háptico.

Ubicación: frontend/src/mobile/utils/haptics.ts

Requisitos:

Wrapper de Vibration API:
```typescript
class HapticFeedback {
  private isSupported: boolean
  private isEnabled: boolean
  
  constructor() {
    this.isSupported = 'vibrate' in navigator
    this.isEnabled = this.getUserPreference()
  }
  
  // Tipos de feedback
  light() {
    if (!this.canVibrate()) return
    navigator.vibrate(10)
  }
  
  medium() {
    if (!this.canVibrate()) return
    navigator.vibrate(20)
  }
  
  heavy() {
    if (!this.canVibrate()) return
    navigator.vibrate(40)
  }
  
  success() {
    if (!this.canVibrate()) return
    navigator.vibrate([10, 50, 10])
  }
  
  warning() {
    if (!this.canVibrate()) return
    navigator.vibrate([20, 100, 20])
  }
  
  error() {
    if (!this.canVibrate()) return
    navigator.vibrate([40, 100, 40, 100, 40])
  }
  
  notification() {
    if (!this.canVibrate()) return
    navigator.vibrate([10, 100, 10])
  }
  
  selection() {
    if (!this.canVibrate()) return
    navigator.vibrate(5)
  }
  
  private canVibrate(): boolean {
    return this.isSupported && this.isEnabled
  }
}

export const haptics = new HapticFeedback()
```

Cuándo usar cada tipo:
- light: tap en botón, select item
- medium: toggle switch, checkbox
- heavy: long press, importante action
- success: formulario enviado, tarea completada
- warning: advertencia, dato incorrecto
- error: error crítico, acción fallida
- notification: nueva notificación
- selection: scroll picker, selector

Integración en componentes:
```typescript
// En Button
const handleClick = () => {
  haptics.light()
  onClick()
}

// En SwipeCard
const handleSwipeComplete = () => {
  haptics.medium()
  onComplete()
}

// En FormSubmit
const handleSubmit = async () => {
  try {
    await submitForm()
    haptics.success()
  } catch (error) {
    haptics.error()
  }
}
```

Settings de usuario:
- Toggle para habilitar/deshabilitar
- Intensity slider (light/medium/heavy)
- Test button para probar
- Guardar en localStorage

Fallbacks:
- Si no soportado: silent
- No mostrar error
- Log en dev mode

Performance:
- Throttle para evitar vibración continua
- Debounce para acciones rápidas
- Queue si múltiples llamadas

TypeScript estricto
Comentarios en español

Feedback táctil que mejora UX mobile.


### M7.4 - Loading States Avanzados✅

**Prompt:**
```
Crea sistema de loading states para mobile.

Ubicación: frontend/src/mobile/components/loading/

Componentes de loading:

1. SkeletonCard:
```typescript
// Card skeleton que imita estructura real
<div className="animate-pulse">
  <div className="h-12 bg-gray-200 rounded w-3/4" />
  <div className="h-4 bg-gray-200 rounded w-1/2 mt-2" />
  <div className="h-4 bg-gray-200 rounded w-full mt-2" />
</div>
```

2. SkeletonList:
- Múltiples SkeletonCard
- Shimmer effect overlay
- Cantidad configurable

3. SpinnerOverlay:
- Full screen overlay
- Semi-transparent backdrop
- Spinner centrado
- Mensaje opcional
- No permite interacción

4. InlineLoader:
- Spinner pequeño
- Inline con texto
- Ej: "Cargando..."

5. PullRefreshLoader:
- Círculo con flecha
- Rotación según pull distance
- Spinner cuando refreshing

6. ProgressLoader:
- Progress bar
- Porcentaje
- Mensaje de progreso
- Para uploads/downloads

7. SkeletonScreen:
- Skeleton de página completa
- Header + contenido
- Shimmer effect

Shimmer effect:
```css
@keyframes shimmer {
  0% {
    background-position: -468px 0;
  }
  100% {
    background-position: 468px 0;
  }
}

.shimmer {
  animation: shimmer 1.5s infinite linear;
  background: linear-gradient(
    to right,
    #f0f0f0 0%,
    #f8f8f8 50%,
    #f0f0f0 100%
  );
  background-size: 800px 104px;
}
```

Suspense boundaries:
- Usar React Suspense
- Fallback con skeleton apropiado
- Por ruta o componente

Loading indicators por contexto:
- Initial load: skeleton screen
- Refresh: pull-to-refresh
- Load more: inline spinner al final
- Submit: button con spinner
- Background: toast con progress

Tiempos:
- <1s: no mostrar loading
- 1-3s: inline spinner
- >3s: skeleton/progress con mensaje

Estados de error:
- Transición de loading a error
- Retry button
- Mensaje claro

TypeScript estricto
Comentarios en español

Loading states claros y no intrusivos.


### M7.5 - Empty States✅

**Prompt:**
```
Crea componentes de empty state para mobile.

Ubicación: frontend/src/mobile/components/EmptyState.tsx

Requisitos:

Componente EmptyState genérico:
```typescript
interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  illustration?: string // URL de ilustración
}
```

Layout:
- Centrado vertical y horizontal
- Icon/Ilustración arriba (grande)
- Título (18px, bold)
- Descripción (14px, gris)
- Botón de acción (opcional)
- Padding generoso

Empty states específicos:

1. NoAssignments:
- Icon: ClipboardIcon
- Título: "No tienes tareas"
- Descripción: "Cuando te asignen tareas aparecerán aquí"
- Ilustración: persona relajándose
- No action button

2. NoSearchResults:
- Icon: SearchIcon
- Título: "Sin resultados"
- Descripción: "Intenta con otros términos de búsqueda"
- Action: "Limpiar búsqueda"

3. NoHistory:
- Icon: ClockIcon
- Título: "Sin historial"
- Descripción: "Tu actividad aparecerá aquí"
- Ilustración: reloj

4. NoPhotos:
- Icon: CameraIcon
- Título: "Sin fotos"
- Descripción: "Captura tu primera foto"
- Action: "Tomar foto"

5. OfflineNoData:
- Icon: WifiOffIcon
- Título: "Sin conexión"
- Descripción: "No hay datos en cache para mostrar offline"
- Action: "Reintentar"

6. ErrorState:
- Icon: AlertCircleIcon
- Título: "Algo salió mal"
- Descripción: mensaje de error
- Action: "Reintentar"

7. PermissionDenied:
- Icon: LockIcon
- Título: "Permiso denegado"
- Descripción: "Necesitamos permiso para [X]"
- Action: "Dar permiso"

Animaciones:
- Fade in al aparecer
- Icon con bounce sutil
- Action button con hover effect

Variantes de tamaño:
- Full page: para páginas vacías
- Inline: para secciones vacías
- Compact: para cards vacíos

Tono:
- Amigable y positivo
- No culpar al usuario
- Sugerir acción cuando sea posible
- Usar ilustraciones amigables

TypeScript estricto
Comentarios en español

Empty states que guían al usuario.


## 🔍 Fase Mobile 8: Búsqueda y Filtros Avanzados

### M8.1 - Búsqueda Global✅

**Prompt:**
```
Implementa búsqueda global en la app mobile.

Ubicación: frontend/src/mobile/components/GlobalSearch.tsx

Requisitos:

Activación:
- Icon en header (SearchIcon)
- Tap abre modal full screen
- Keyboard shortcut (Cmd+K en iOS)

Modal de búsqueda:
- Full screen
- Close button (X)
- Search input grande con autofocus
- Placeholder: "Buscar tareas, formularios..."
- Clear button (X en input)

Input:
- Debounce: 300ms
- Min 2 caracteres
- Search icon left
- Loading spinner right (mientras busca)

Resultados agrupados:
1. Tareas (max 5)
   - Nombre de formulario
   - Estado
   - Fecha
   
2. Formularios (max 3)
   - Nombre
   - Descripción
   
3. Historial (max 5)
   - Actividad
   - Fecha

Cada resultado:
- Icon según tipo
- Título (highlight término)
- Metadata
- Tap navega

Search suggestions:
- Búsquedas recientes (últimas 5)
- Búsquedas populares
- Tap para rellenar input

Estados:
- Empty input: sugerencias
- Searching: spinner
- Results: lista agrupada
- No results: empty state con mensaje

Advanced filters:
- Button "Filtros avanzados"
- Abre sheet con:
  - Tipo (tareas, formularios, historial)
  - Fecha (rango)
  - Estado
  - Otros filtros contextuales

Keyboard navigation:
- Arrow keys para navegar resultados
- Enter para seleccionar
- Escape para cerrar

Search API:
- Endpoint: GET /api/search?q=...&filters=...
- Backend busca en:
  - Assignments (nombre, descripción)
  - Forms (nombre, descripción)
  - History (actividad)
- Return unificado

Performance:
- Cache de resultados
- Cancel request al cambiar query
- Limit de resultados por tipo
- Índices en DB para speed

TypeScript estricto
Comentarios en español

Búsqueda rápida y potente.
```

### M8.2 - Sistema de Filtros Complejo✅

**Prompt:**
```
Crea sistema de filtros multi-criterio.

Ubicación: frontend/src/mobile/components/FilterSystem.tsx

Requisitos:

Componente FilterSystem:
```typescript
interface FilterConfig {
  id: string
  type: 'select' | 'multiselect' | 'date' | 'daterange' | 'toggle' | 'slider'
  label: string
  options?: Array<{value: string, label: string}>
  min?: number
  max?: number
  defaultValue?: any
}

interface FilterSystemProps {
  filters: FilterConfig[]
  values: Record<string, any>
  onChange: (values: Record<string, any>) => void
  onApply: () => void
  onReset: () => void
}
```

UI de filtros:
- Sheet desde bottom (70% altura)
- Header:
  - Título "Filtros"
  - Close (X)
  - Reset filtros (text button)
  
- Body scrollable:
  - Secciones por categoría
  - Cada filtro con label
  - Input apropiado según type
  
- Footer sticky:
  - Contador: "X filtros activos"
  - Button "Ver resultados" (primary)
  - Button "Limpiar" (ghost)

Tipos de filtro implementados:

1. Select (single):
- Radio group visual
- Cards seleccionables
- Scroll si muchas opciones

2. Multiselect:
- Checkboxes
- "Seleccionar todos"
- Contador de seleccionados

3. Date:
- Native date picker
- Quick presets
- Clear button

4. Date Range:
- From/To dates
- Presets: Hoy, Esta semana, Este mes
- Validación (from < to)

5. Toggle:
- Switch grande
- Label descriptivo

6. Slider:
- Range slider
- Min/max values visible
- Current value display

7. Search-select:
- Input de búsqueda
- Filtra opciones
- Para listas largas (>20)

Chips de filtros activos:
- Mostrar fuera del modal
- Horizontal scroll
- Tap para remover
- "Limpiar todo" button

Persistencia:
- Guardar en URL params
- Restaurar al volver
- localStorage como backup

Validación:
- Validar rangos
- Validar dependencias
- Mostrar errores inline

Smart filters:
- Sugerencias basadas en contexto
- Ocultar opciones sin resultados
- Contador por opción

TypeScript estricto
Comentarios en español

Filtros potentes y fáciles de usar.
```

### M8.3 - Sorting y Ordenamiento✅

**Prompt:**
```
Implementa sistema de ordenamiento.

Ubicación: frontend/src/mobile/components/SortOptions.tsx

Requisitos:

Componente SortOptions:
- Button que muestra sort actual
- Icon: ArrowUpDown
- Label: "Ordenar por: [criterio]"
- Tap abre sheet

Sheet de ordenamiento:
- Header: "Ordenar por"
- Lista de opciones:
  - Radio group
  - Icon según criterio
  - Dirección (asc/desc) toggle
  
Criterios comunes:
1. Fecha (más reciente primero)
2. Fecha (más antigua primero)
3. Nombre (A-Z)
4. Nombre (Z-A)
5. Prioridad (alta a baja)
6. Estado (pendiente primero)
7. Progreso (menos completo primero)

Por tipo de lista:
- Tareas:
  - Fecha límite
  - Prioridad
  - Progreso
  - Estado
  
- Historial:
  - Fecha (reciente/antigua)
  - Tipo de actividad
  
- Formularios:
  - Nombre
  - Fecha creación
  - Veces usado

Visual feedback:
- Selected option highlighted
- Direction arrow visible
- Apply automático al seleccionar

Persistencia:
- Guardar preferencia por vista
- localStorage
- Restaurar al volver

Animación:
- Lista se reordena con animación
- Stagger effect sutil
- Smooth transition

Combinación con filtros:
- Aplicar sort después de filtros
- Mostrar ambos activos
- Clear independientes

TypeScript estricto
Comentarios en español

Ordenamiento intuitivo y rápido.
```

### M8.4 - Tags y Etiquetas✅

**Prompt:**
```
Implementa sistema de tags para categorización.

Ubicación: frontend/src/mobile/components/TagSystem.tsx

Requisitos:

Tags en tareas:
- Agregar múltiples tags a tarea
- Colores predefinidos
- Tags del sistema + custom
- Visual como chips

Componente TagPicker:
- Sheet desde bottom
- Búsqueda de tags
- Grid de tags disponibles
- Tap para toggle selección
- Create new tag button
- Selected tags arriba

Tags predefinidos:
- Urgente (rojo)
- Importante (naranja)
- Revisar (amarillo)
- Completado (verde)
- En progreso (azul)
- Bloqueado (gris)

Custom tags:
- Usuario puede crear
- Color picker (8 colores)
- Nombre (max 20 chars)
- Icon opcional
- Guardar para reutilizar

Tags en UI:
- Chips pequeños
- Color de fondo + texto
- Max 3 visibles, luego "+X"
- Tap en tag: filtrar por ese tag
- Long press: opciones (editar, eliminar)

Filtrado por tags:
- Multiselect de tags
- AND/OR logic toggle
- Ver count de items por tag

Gestión de tags:
- En Settings
- Lista de todos los tags
- Edit: nombre, color, icon
- Delete con confirmación
- Usage count

Auto-suggestions:
- Sugerir tags basados en:
  - Nombre del formulario
  - Contenido de respuestas
  - Tags de tareas similares
- ML/AI opcional

TypeScript estricto
Comentarios en español

Tags para mejor organización.
```

### M8.5 - Búsqueda por Voz✅

**Prompt:**
```
Implementa búsqueda por voz (opcional).

Ubicación: frontend/src/mobile/components/VoiceSearch.tsx

Requisitos:

Activación:
- Mic icon en search input
- Tap para iniciar
- Animación de escucha

Web Speech API:
```typescript
const SpeechRecognition = 
  window.SpeechRecognition || 
  window.webkitSpeechRecognition

const recognition = new SpeechRecognition()
recognition.continuous = false
recognition.lang = 'es-CL' // o según idioma
recognition.interimResults = true
recognition.maxAlternatives = 1

recognition.onresult = (event) => {
  const transcript = event.results[0][0].transcript
  setSearchQuery(transcript)
}

recognition.onerror = (event) => {
  handleError(event.error)
}
```

UI durante grabación:
- Modal/Sheet con animación
- Icono mic pulsando
- Texto: "Escuchando..."
- Waveform animation
- Transcript en tiempo real (interim)
- Cancel button
- Tap outside para detener

Estados:
- Idle: mic icon gris
- Listening: mic rojo + pulse
- Processing: spinner
- Success: checkmark + búsqueda
- Error: mensaje de error

Permisos:
- Request microphone
- Mensaje si denegado
- Link a settings

Fallbacks:
- Si no soportado: ocultar mic icon
- Si error: switch a keyboard
- Timeout 10 segundos

Idiomas soportados:
- Español
- Inglés
- Configurable en settings

Mejoras:
- Comandos de voz:
  - "Buscar [término]"
  - "Filtrar por [criterio]"
  - "Mostrar tareas de hoy"
- Wake word (opcional): "Hey Collector"

TypeScript estricto
Comentarios en español

Búsqueda por voz para manos libres.
```

---

## 📊 Fase Mobile 9: Reportes y Analytics Mobile

### M9.1 - Dashboard Simplificado Mobile✅

**Prompt:**
```
Crea versión simplificada del dashboard para mobile.

Ubicación: frontend/src/mobile/pages/ReportsDashboard.tsx

Requisitos:

Layout compacto:
- Stats cards en grid 2x2:
  - Tareas completadas (hoy)
  - Tareas pendientes
  - Tasa de cumplimiento
  - Racha actual
  
- Cada card:
  - Número grande central
  - Label pequeño abajo
  - Icon sutil
  - Color según métrica
  - Tap para detalle

Gráfico principal:
- Formularios completados últimos 7 días
- Bar chart o line chart
- Responsive width
- Tap en bar: ver detalle del día
- Swipe para ver más días

Insights rápidos:
- Cards con tips:
  - "Vas 20% mejor que semana pasada"
  - "Completa 2 más para tu récord"
  - "Racha de 5 días!"
- Swipeable horizontal
- Motivacionales y positivos

Accesos rápidos:
- Chips horizontal scroll:
  - Ver reportes completos
  - Exportar datos
  - Compartir progreso
  - Configurar metas

Última sincronización:
- Timestamp pequeño abajo
- Refresh button
- Indicador si hay data pendiente

Pull-to-refresh:
- Actualiza stats
- Re-fetch data
- Smooth animation

Estados:
- Loading: skeleton de cards y gráfico
- Error: mensaje con retry
- Empty: motivar a completar tareas

Responsive:
- 1 columna en 320-375px
- 2 columnas en >375px
- Optimizado para pantalla pequeña

TypeScript estricto
Comentarios en español

Dashboard mobile enfocado en lo esencial.
```

### M9.2 - Reportes Personales✅

**Prompt:**
```
Crea vista de reportes personales para operador.

Ubicación: frontend/src/mobile/pages/PersonalReports.tsx

Requisitos:

Tabs superiores:
- Hoy
- Esta semana
- Este mes
- Personalizado

Métricas por período:
1. Productividad:
   - Tareas completadas
   - Tiempo promedio por tarea
   - Tasa de completitud
   - Comparación con período anterior

2. Calidad:
   - Formularios sin errores
   - Resubmisiones necesarias
   - Feedback recibido

3. Actividad:
   - Días activos
   - Horas trabajadas
   - Ubicaciones visitadas
   - Fotos capturadas

Visualizaciones mobile-friendly:
- Progress rings (circular)
- Simple bar charts
- Line charts con zoom
- Heat map de actividad (calendario)

Logros y badges:
- Gamificación sutil:
  - "Racha de 7 días"
  - "100 tareas completadas"
  - "Perfeccionista" (0 errores)
- Visual atractivo
- Compartible en redes (opcional)

Comparaciones:
- Yo vs promedio del equipo
- Progress hacia meta personal
- Mejora temporal

Exportar:
- PDF del reporte
- CSV de datos crudos
- Compartir por email/WhatsApp
- Copiar link

Filtros:
- Por tipo de formulario
- Por proyecto
- Por ubicación

Estados:
- Loading: skeleton
- Empty: mensaje motivador
- Offline: mostrar data cacheada

TypeScript estricto
Comentarios en español

Reportes que motivan al operador.
```

### M9.3 - Exportación Mobile✅

**Prompt:**
```
Implementa exportación de datos desde mobile.

Ubicación: frontend/src/mobile/utils/mobileExport.ts

Requisitos:

Formatos soportados:
1. PDF:
   - Usar jsPDF
   - Template mobile-optimized
   - Logo de empresa
   - Datos del reporte
   - Gráficos como imágenes
   - Footer con metadata

2. CSV:
   - Data en formato tabular
   - Encoding UTF-8 con BOM
   - Headers claros
   - Dates en formato ISO

3. Excel (XLSX):
   - Usar SheetJS
   - Multiple sheets si aplica
   - Estilos básicos
   - Fórmulas si necesario

4. Imagen (PNG):
   - Screenshot del reporte
   - Usar html2canvas
   - Alta resolución
   - Logo watermark

Flujo de exportación:
1. User tap "Exportar"
2. Sheet con opciones:
   - Formato
   - Rango de datos
   - Incluir gráficos (toggle)
3. Botón "Generar"
4. Progress indicator
5. Opciones de compartir:
   - Descargar
   - Compartir (Share API)
   - Email
   - WhatsApp
   - Drive/Dropbox

Share API:
```typescript
const shareReport = async (file: Blob, filename: string) => {
  if (navigator.share && navigator.canShare({ files: [file] })) {
    await navigator.share({
      files: [new File([file], filename, { type: file.type })],
      title: 'Reporte Collector',
      text: 'Mi reporte de actividad'
    })
  } else {
    // Fallback: download
    downloadFile(file, filename)
  }
}
```

Optimizaciones mobile:
- Generar en chunks (no bloquear UI)
- Comprimir si es grande
- Warn si >5MB
- Offline queue si no hay conexión

Metadata en exports:
- Fecha de generación
- Usuario
- Período
- Versión de app

Cache de exports:
- Guardar últimos 3
- Reuse si data no cambió
- Delete automáticamente viejos

TypeScript estricto
Comentarios en español

Exportación fácil desde mobile.
```

### M9.4 - Gráficos Interactivos Mobile✅

**Prompt:**
```
Crea componentes de gráficos optimizados para mobile.

Ubicación: frontend/src/mobile/components/charts/

Requisitos generales:
- Responsive al 100%
- Touch-friendly (tap, swipe, pinch)
- Tooltips adaptados a touch
- Colores de alto contraste
- Labels legibles (no sobrecargar)

Componentes:

1. MobileBarChart:
   - Barras anchas (fáciles de tap)
   - Tap en bar: show value
   - Swipe horizontal: scroll data
   - Axis labels rotatables
   - Max 7-10 bars visibles

2. MobileLineChart:
   - Smooth curves
   - Tap en punto: tooltip
   - Drag para zoom
   - Pinch to zoom in/out
   - Pan horizontal
   - Grid opcional (no muy densa)

3. MobilePieChart:
   - Donut style (más moderno)
   - Tap en slice: highlight + info
   - Legend abajo (no al lado)
   - Max 6 slices
   - "Otros" para el resto

4. MobileProgressRing:
   - Circular progress
   - Número central grande
   - Color según progreso
   - Animation on mount

5. MobileHeatMap:
   - Calendar view
   - Cells grandes (min 32x32px)
   - Tap en cell: detalle del día
   - Legend clara
   - Swipe para cambiar mes

Librería recomendada:
- Recharts (ya se usa)
- Customizar para mobile
- O usar Chart.js con config mobile

Tooltips mobile:
- Aparecer al tap (no hover)
- Posición inteligente (no fuera de pantalla)
- Dismiss al tap fuera
- Sticky hasta dismiss

Animations:
- Entrance animations
- Smooth transitions
- No muy lentas (max 500ms)
- Respect reduced motion

TypeScript estricto
Comentarios en español

Gráficos bellos y funcionales en mobile.
```

### M9.5 - Insights y Recomendaciones✅

**Prompt:**
```
Implementa sistema de insights automáticos.

Ubicación: frontend/src/mobile/utils/insightsEngine.ts

Requisitos:

Tipos de insights:

1. Productividad:
   - "Completaste 25% más tareas que la semana pasada"
   - "Tu mejor día es Martes (promedio 8 tareas)"
   - "Tu tiempo promedio mejoró en 15 minutos"

2. Patrones:
   - "Tus tareas más rápidas son tipo [X]"
   - "Completas más tareas en la mañana"
   - "Tienes mejor tasa de acierto los Lunes"

3. Alertas:
   - "Tienes 3 tareas que vencen mañana"
   - "No has completado tareas hoy"
   - "Llevas 2 días sin sincronizar"

4. Motivacionales:
   - "¡Racha de 5 días! Sigue así"
   - "Estás a 2 tareas de tu récord personal"
   - "Eres el más rápido del equipo esta semana"

5. Recomendaciones:
   - "Considera completar [X] primero (es urgente)"
   - "Sincroniza ahora, tienes buena conexión"
   - "Toma un descanso, llevas 3 horas activo"

Generación de insights:
```typescript
class InsightsEngine {
  generateInsights(userData: UserData): Insight[] {
    const insights: Insight[] = []
    
    // Análisis de tendencias
    if (this.isImprovingProductivity(userData)) {
      insights.push({
        type: 'positive',
        category: 'productivity',
        message: '...',
        action: 'Ver detalle'
      })
    }
    
    // Detección de patrones
    const bestDay = this.findBestDay(userData)
    if (bestDay) {
      insights.push({...})
    }
    
    // Alertas importantes
    const urgentTasks = this.getUrgentTasks(userData)
    if (urgentTasks.length > 0) {
      insights.push({...})
    }
    
    return insights
  }
}
```

UI de insights:
- Cards deslizables horizontal
- Icon según tipo
- Mensaje claro y corto
- Call-to-action opcional
- Dismiss button
- "Ver más insights"

Frecuencia:
- Diario: resumen del día anterior
- Semanal: resumen de semana
- Mensual: logros del mes
- Tiempo real: alertas importantes

Personalización:
- Aprender de preferencias
- No repetir insights similares
- Ajustar tono según feedback

Machine Learning (opcional):
- Predecir mejor momento para tareas
- Sugerir optimizaciones
- Anomaly detection

TypeScript estricto
Comentarios en español

Insights que agregan valor real al usuario.
```

---

## 🔐 Fase Mobile 10: Seguridad Mobile Avanzada

### M10.1 - Biometría y PIN

**Prompt:**
```
Implementa autenticación biométrica completa.

Ubicación: frontend/src/mobile/utils/biometricAuth.ts

Requisitos:

Web Authentication API:
```typescript
class BiometricAuth {
  async isSupported(): Promise<boolean> {
    return (
      'credentials' in navigator &&
      'create' in navigator.credentials
    )
  }
  
  async isBiometricAvailable(): Promise<boolean> {
    if (!await this.isSupported()) return false
    
    // Check for biometric capability
    const available = await PublicKeyCredential
      .isUserVerifyingPlatformAuthenticatorAvailable()
    
    return available
  }
  
  async registerBiometric(userId: string) {
    const credential = await navigator.credentials.create({
      publicKey: {
        challenge: new Uint8Array(32),
        rp: { name: "Collector Enterprise" },
        user: {
          id: new Uint8Array(16),
          name: userId,
          displayName: "Usuario"
        },
        pubKeyCredParams: [
          { alg: -7, type: "public-key" }
        ],
        authenticatorSelection: {
          authenticatorAttachment: "platform",
          userVerification: "required"
        }
      }
    })
    
    // Save credential
    return credential
  }
  
  async authenticate(): Promise<boolean> {
    try {
      const credential = await navigator.credentials.get({
        publicKey: {
          challenge: new Uint8Array(32),
          timeout: 60000,
          userVerification: "required"
        }
      })
      
      return !!credential
    } catch (error) {
      return false
    }
  }
}
```

Fallback a PIN:
- 4-6 dígitos
- Numeric keyboard
- Dots oscurecen entrada
- Shake on error
- Max 3 intentos
- Lockout temporal después

Setup wizard:
1. Explicar beneficio biometría
2. Prompt de sistema para registrar
3. Test funcionamiento
4. Configurar PIN backup
5. Confirmar PIN
6. Guardar preferencias

Cuándo requerir auth:
- Al abrir app (configurable)
- Después de X minutos inactive
- Antes de acciones sensibles:
  - Ver datos confidenciales
  - Enviar formularios
  - Cambiar configuración

UI de auth:
- Modal full screen
- Icon de huella/face
- Mensaje: "Autentícate para continuar"
- Fallback button: "Usar PIN"
- Cancel button

Session handling:
- Token después de auth exitosa
- Refresh token seguro
- Auto-logout configurable
- Re-auth para acciones críticas

TypeScript estricto
Comentarios en español

Autenticación segura y conveniente.
```

### M10.2 - Encriptación Local

**Prompt:**
```
Implementa encriptación de datos sensibles.

Ubicación: frontend/src/mobile/utils/encryption.ts

Requisitos:

Web Crypto API:
```typescript
class DataEncryption {
  private key: CryptoKey | null = null
  
  async generateKey(password: string): Promise<void> {
    const encoder = new TextEncoder()
    const keyMaterial = await window.crypto.subtle.importKey(
      "raw",
      encoder.encode(password),
      "PBKDF2",
      false,
      ["deriveBits", "deriveKey"]
    )
    
    this.key = await window.crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: encoder.encode("collector-salt"),
        iterations: 100000,
        hash: "SHA-256"
      },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"]
    )
  }
  
  async encrypt(data: string): Promise<string> {
    if (!this.key) throw new Error("Key not initialized")
    
    const encoder = new TextEncoder()
    const iv = window.crypto.getRandomValues(new Uint8Array(12))
    
    const encrypted = await window.crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      this.key,
      encoder.encode(data)
    )
    
    // Combine IV + encrypted data
    const combined = new Uint8Array(iv.length + encrypted.byteLength)
    combined.set(iv)
    combined.set(new Uint8Array(encrypted), iv.length)
    
    return btoa(String.fromCharCode(...combined))
  }
  
  async decrypt(encryptedData: string): Promise<string> {
    if (!this.key) throw new Error("Key not initialized")
    
    const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0))
    const iv = combined.slice(0, 12)
    const data = combined.slice(12)
    
    const decrypted = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      this.key,
      data
    )
    
    const decoder = new TextDecoder()
    return decoder.decode(decrypted)
  }
}
```

Qué encriptar:
- Respuestas de formularios en draft
- Fotos antes de upload
- Datos personales del usuario
- Tokens de sesión
- Configuración sensible

Manejo de keys:
- Generar desde password/PIN usuario
- No guardar key en plaintext
- Regenerar en cada sesión
- Secure key derivation (PBKDF2)

Storage encriptado:
```typescript
class SecureStorage {
  private encryption: DataEncryption
  
  async setItem(key: string, value: any): Promise<void> {
    const json = JSON.stringify(value)
    const encrypted = await this.encryption.encrypt(json)
    localStorage.setItem(key, encrypted)
  }
  
  async getItem(key: string): Promise<any> {
    const encrypted = localStorage.getItem(key)
    if (!encrypted) return null
    
    const json = await this.encryption.decrypt(encrypted)
    return JSON.parse(json)
  }
}
```

Performance:
- Encriptar en background (Web Worker)
- Batch operations
- Cache de keys en memoria (session)
- Progress indicator para operaciones largas

TypeScript estricto
Comentarios en español

Encriptación robusta de datos sensibles.
```

### M10.3 - Detección de Screenshot/Screen Recording

**Prompt:**
```
Implementa detección y bloqueo de capturas (opcional).

Ubicación: frontend/src/mobile/utils/screenCapture.ts

Requisitos:

Detección (limitada en web):
```typescript
class ScreenCaptureDetector {
  private listeners: Array<() => void> = []
  
  startMonitoring() {
    // Detectar cuando app va a background
    document.addEventListener('visibilitychange', this.handleVisibility)
    
    // Detectar window resize (puede indicar screenshot)
    window.addEventListener('resize', this.handleResize)
    
    // Detectar blur (algunas plataformas)
    window.addEventListener('blur', this.handleBlur)
  }
  
  private handleVisibility = () => {
    if (document.hidden) {
      // App moved to background
      // Posible screenshot en iOS
      this.notifyListeners()
    }
  }
  
  private handleResize = () => {
    // Rapid resize puede indicar screenshot tool
    // False positives posibles
  }
  
  onScreenshotDetected(callback: () => void) {
    this.listeners.push(callback)
  }
}
```

Advertencias:
- Detección no es 100% confiable en web
- Muchos false positives
- No se puede bloquear realmente
- Mejor: educar sobre privacidad

Mitigación:
- Watermark en contenido sensible
  - User ID
  - Timestamp
  - Semi-transparente
  
- Ocultar contenido al background
  - Replace con placeholder
  - "Contenido oculto por seguridad"
  
- Screenshot logging
  - Log intento (si detectado)
  - Notificar a admin (opcional)
  - Audit trail

UI protegida:
- Flag secure (Android nativo)
- No disponible en PWA
- Alternativa: warning message

Políticas:
- Términos de uso claros
- Consentimiento informado
- No almacenar data ultra sensible

TypeScript estricto
Comentarios en español

Detección con limitaciones conocidas de web.
```

### M10.4 - Secure Data Wipe

**Prompt:**
```
Implementa borrado seguro de datos.

Ubicación: frontend/src/mobile/utils/secureWipe.ts

Requisitos:

Secure wipe completo:
```typescript
class SecureWipe {
  async wipeAllData(): Promise<void> {
    // 1. Clear IndexedDB
    await this.wipeIndexedDB()
    
    // 2. Clear localStorage
    localStorage.clear()
    
    // 3. Clear sessionStorage
    sessionStorage.clear()
    
    // 4. Clear service worker cache
    await this.wipeServiceWorkerCache()
    
    // 5. Unregister service worker
    await this.unregisterServiceWorker()
    
    // 6. Clear cookies
    this.wipeCookies()
    
    // 7. Revoke object URLs
    this.revokeObjectURLs()
  }
  
  private async wipeIndexedDB(): Promise<void> {
    const databases = await window.indexedDB.databases()
    for (const db of databases) {
      if (db.name) {
        window.indexedDB.deleteDatabase(db.name)
      }
    }
  }
  
  private async wipeServiceWorkerCache(): Promise<void> {
    const cacheNames = await caches.keys()
    await Promise.all(
      cacheNames.map(name => caches.delete(name))
    )
  }
  
  private wipeCookies(): void {
    document.cookie.split(";").forEach(cookie => {
      const name = cookie.split("=")[0].trim()
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
    })
  }
}
```

Triggers para wipe:
1. Logout manual:
   - Confirmar: "¿Eliminar datos locales?"
   - Opciones: Solo cerrar sesión / Eliminar todo
   
2. Remote wipe:
   - Admin puede disparar desde backend
   - Push notification dispara wipe
   - Ejecuta en próxima apertura de app
   
3. Security breach:
   - Múltiples intentos fallidos de auth
   - Sesión comprometida detectada
   
4. Inactividad prolongada:
   - Configurable (ej: 30 días sin uso)
   - Warning antes de wipe

Confirmaciones:
- Modal grave con advertencias
- Checkbox: "Entiendo que esto es irreversible"
- Re-auth antes de wipe
- Countdown (5 segundos)

Post-wipe:
- Redirect a login
- Toast: "Datos eliminados exitosamente"
- Opción de re-instalar app

Backup reminder:
- Antes de wipe, recordar:
  - Sincronizar pending data
  - Exportar reportes importantes
  - Confirmar backup en servidor

TypeScript estricto
Comentarios en español

Wipe seguro para proteger privacidad.
```

### M10.5 - Audit Trail Mobile

**Prompt:**
```
Implementa logging de auditoría en mobile.

Ubicación: frontend/src/mobile/utils/auditLogger.ts

Requisitos:

Logger de eventos:
```typescript
interface AuditEvent {
  id: string
  timestamp: Date
  userId: string
  action: string
  category: 'auth' | 'data' | 'security' | 'system'
  details: Record<string, any>
  deviceInfo: DeviceInfo
  location?: Geolocation
  ipAddress?: string
}

class AuditLogger {
  private queue: AuditEvent[] = []
  private maxQueueSize = 100
  
  log(action: string, category: string, details?: any) {
    const event: AuditEvent = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      userId: this.getCurrentUserId(),
      action,
      category,
      details: details || {},
      deviceInfo: this.getDeviceInfo()
    }
    
    this.queue.push(event)
    
    // Auto-flush si queue está lleno
    if (this.queue.length >= this.maxQueueSize) {
      this.flush()
    }
  }
  
  async flush(): Promise<void> {
    if (this.queue.length === 0) return
    
    try {
      await api.post('/api/audit/batch', {
        events: this.queue
      })
      this.queue = []
    } catch (error) {
      // Guardar en IndexedDB si falla
      await this.saveToLocal()
    }
  }
}
```

Eventos a loggear:
- Auth:
  - Login exitoso/fallido
  - Logout
  - Biometric auth usado
  - PIN intentos
  
- Data:
  - Formulario iniciado
  - Formulario enviado
  - Foto capturada
  - Datos exportados
  
- Security:
  - Screenshot detectado
  - Session timeout
  - Data wipe ejecutado
  - Configuración seguridad cambiada
  
- System:
  - App instalada
  - App actualizada
  - Service worker updated
  - Crash/error

Privacy:
- No loggear PII innecesaria
- Anonimizar donde sea posible
- Encriptar logs sensibles
- Retention policy (30-90 días)

Sync de logs:
- Batch upload (cada 15min o 100 events)
- Background sync cuando offline
- Compression antes de enviar
- Retry logic

Visualización (solo para user):
- En Settings > Actividad
- Filtros básicos
- No editable
- Export para auditorías

TypeScript estricto
Comentarios en español

Audit trail completo y privado.
```

---

## 🎯 Fase Mobile 11: Optimización y Polish Final

### M11.1 - Performance Optimization

**Prompt:**
```
Implementa optimizaciones finales de performance.

Ubicación: frontend/src/mobile/utils/performanceOptimizer.ts

Requisitos:

1. Image Lazy Loading Avanzado:
```typescript
class ImageOptimizer {
  observeImages() {
    const options = {
      root: null,
      rootMargin: '50px', // Cargar antes de entrar viewport
      threshold: 0.01
    }
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement
          this.loadImage(img)
          observer.unobserve(img)
        }
      })
    }, options)
    
    document.querySelectorAll('img[data-src]').forEach(img => {
      observer.observe(img)
    })
  }
  
  loadImage(img: HTMLImageElement) {
    const src = img.dataset.src
    if (!src) return
    
    // Cargar imagen progresivamente
    const tempImg = new Image()
    tempImg.onload = () => {
      img.src = src
      img.classList.add('loaded')
    }
    tempImg.src = src
  }
}
```

2. Virtual Scrolling:
```typescript
// Para listas largas (>50 items)
import { useVirtualizer } from '@tanstack/react-virtual'

const VirtualList = ({ items }) => {
  const parentRef = useRef<HTMLDivElement>(null)
  
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80, // Altura estimada de cada item
    overscan: 5 // Items extra para smooth scrolling
  })
  
  return (
    <div ref={parentRef} style={{ height: '400px', overflow: 'auto' }}>
      <div style={{ height: `${virtualizer.getTotalSize()}px` }}>
        {virtualizer.getVirtualItems().map(virtualItem => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualItem.size}px`,
              transform: `translateY(${virtualItem.start}px)`
            }}
          >
            {items[virtualItem.index]}
          </div>
        ))}
      </div>
    </div>
  )
}
```

3. Debounce y Throttle:
```typescript
// Debounce para search
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value)
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)
    
    return () => clearTimeout(handler)
  }, [value, delay])
  
  return debouncedValue
}

// Throttle para scroll events
const useThrottle = (callback: Function, delay: number) => {
  const lastRan = useRef(Date.now())
  
  return useCallback((...args: any[]) => {
    if (Date.now() - lastRan.current >= delay) {
      callback(...args)
      lastRan.current = Date.now()
    }
  }, [callback, delay])
}
```

4. Code Splitting Agresivo:
```typescript
// Lazy load components pesados
const Camera = lazy(() => import('./components/CameraCapture'))
const Charts = lazy(() => import('./components/Charts'))
const SignaturePad = lazy(() => import('./components/SignaturePad'))

// Preload en hover/focus
const preloadComponent = (factory: () => Promise<any>) => {
  factory()
}

<button
  onMouseEnter={() => preloadComponent(() => import('./Camera'))}
  onClick={openCamera}
>
  Abrir Cámara
</button>
```

5. Request Batching:
```typescript
class RequestBatcher {
  private queue: Array<{
    endpoint: string
    data: any
    resolve: Function
    reject: Function
  }> = []
  private timer: NodeJS.Timeout | null = null
  
  add(endpoint: string, data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.queue.push({ endpoint, data, resolve, reject })
      
      if (!this.timer) {
        this.timer = setTimeout(() => this.flush(), 100)
      }
    })
  }
  
  private async flush() {
    const batch = this.queue.splice(0)
    this.timer = null
    
    try {
      const response = await api.post('/api/batch', {
        requests: batch.map(r => ({
          endpoint: r.endpoint,
          data: r.data
        }))
      })
      
      response.data.forEach((result: any, i: number) => {
        if (result.success) {
          batch[i].resolve(result.data)
        } else {
          batch[i].reject(result.error)
        }
      })
    } catch (error) {
      batch.forEach(r => r.reject(error))
    }
  }
}
```

6. Memory Management:
```typescript
class MemoryManager {
  private cache = new Map<string, any>()
  private maxSize = 50 // MB
  
  set(key: string, value: any) {
    // Estimar tamaño
    const size = this.estimateSize(value)
    
    // Limpiar si excede límite
    if (this.getCurrentSize() + size > this.maxSize) {
      this.evictOldest()
    }
    
    this.cache.set(key, {
      value,
      size,
      timestamp: Date.now()
    })
  }
  
  private evictOldest() {
    let oldest: [string, any] | null = null
    
    for (const entry of this.cache.entries()) {
      if (!oldest || entry[1].timestamp < oldest[1].timestamp) {
        oldest = entry
      }
    }
    
    if (oldest) {
      this.cache.delete(oldest[0])
    }
  }
}
```

7. Resource Hints:
```html
<!-- Preconnect a APIs -->
<link rel="preconnect" href="https://api.collector.com">
<link rel="dns-prefetch" href="https://api.collector.com">

<!-- Preload de assets críticos -->
<link rel="preload" href="/fonts/inter.woff2" as="font" crossorigin>
<link rel="preload" href="/icons/logo.svg" as="image">
```

8. Network Optimization:
```typescript
// Detectar tipo de conexión
const useNetworkStatus = () => {
  const [effectiveType, setEffectiveType] = useState('4g')
  
  useEffect(() => {
    const connection = (navigator as any).connection
    if (!connection) return
    
    setEffectiveType(connection.effectiveType)
    
    const handleChange = () => {
      setEffectiveType(connection.effectiveType)
    }
    
    connection.addEventListener('change', handleChange)
    return () => connection.removeEventListener('change', handleChange)
  }, [])
  
  return {
    effectiveType,
    isSlowConnection: effectiveType === '2g' || effectiveType === 'slow-2g',
    isFastConnection: effectiveType === '4g'
  }
}

// Ajustar calidad según conexión
const { isSlowConnection } = useNetworkStatus()
const imageQuality = isSlowConnection ? 'low' : 'high'
```

TypeScript estricto
Comentarios en español

Performance optimizado para mobile.
```

### M11.2 - Accessibility Mobile

**Prompt:**
```
Mejora accesibilidad específica para mobile.

Ubicación: frontend/src/mobile/utils/accessibility.ts

Requisitos:

1. Touch Target Size:
```css
/* Utility classes para targets seguros */
.touch-target {
  min-height: 44px;
  min-width: 44px;
  padding: 12px;
}

.touch-target-large {
  min-height: 56px;
  min-width: 56px;
  padding: 16px;
}
```

2. Focus Management:
```typescript
// Trap focus en modales
const useFocusTrap = (isOpen: boolean) => {
  const containerRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    if (!isOpen || !containerRef.current) return
    
    const focusableElements = containerRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    
    const firstElement = focusableElements[0] as HTMLElement
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement
    
    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus()
          e.preventDefault()
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus()
          e.preventDefault()
        }
      }
    }
    
    document.addEventListener('keydown', handleTab)
    firstElement?.focus()
    
    return () => document.removeEventListener('keydown', handleTab)
  }, [isOpen])
  
  return containerRef
}
```

3. Screen Reader Support:
```typescript
// Anuncios dinámicos
const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
  const announcer = document.getElementById('aria-announcer')
  if (!announcer) return
  
  announcer.setAttribute('aria-live', priority)
  announcer.textContent = message
  
  // Limpiar después
  setTimeout(() => {
    announcer.textContent = ''
  }, 1000)
}

// En HTML
<div
  id="aria-announcer"
  className="sr-only"
  role="status"
  aria-live="polite"
  aria-atomic="true"
/>
```

4. Gesture Alternatives:
```typescript
// Siempre proveer alternativa a gestos
const SwipeableCard = ({ onSwipeLeft, onSwipeRight, children }) => {
  return (
    <div>
      {/* Contenido con swipe */}
      <div className="swipeable">{children}</div>
      
      {/* Botones alternativos (visibles con screen reader) */}
      <div className="sr-only">
        <button onClick={onSwipeLeft}>Acción Izquierda</button>
        <button onClick={onSwipeRight}>Acción Derecha</button>
      </div>
    </div>
  )
}
```

5. Color Contrast:
```typescript
// Verificar contraste en dev mode
const checkContrast = (foreground: string, background: string) => {
  // Calcular ratio de contraste
  // WCAG AA: 4.5:1 para texto normal, 3:1 para texto grande
  const ratio = calculateContrastRatio(foreground, background)
  
  if (ratio < 4.5) {
    console.warn(`Low contrast: ${ratio.toFixed(2)}:1`)
  }
}
```

6. Reduce Motion:
```css
/* Respetar preferencia del usuario */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

7. Font Scaling:
```typescript
// Respetar ajuste de fuente del sistema
const useSystemFontScale = () => {
  const [scale, setScale] = useState(1)
  
  useEffect(() => {
    // Detectar font scale del sistema (limitado en web)
    const computedSize = parseFloat(
      getComputedStyle(document.documentElement).fontSize
    )
    const baseSize = 16
    setScale(computedSize / baseSize)
  }, [])
  
  return scale
}
```

8. Semantic HTML:
```tsx
// Usar elementos semánticos correctos
<nav aria-label="Navegación principal">
  <ul role="list">
    <li><a href="/home">Inicio</a></li>
  </ul>
</nav>

<main role="main" aria-label="Contenido principal">
  <article>
    <h1>Título</h1>
    <p>Contenido...</p>
  </article>
</main>

<footer role="contentinfo">
  <p>&copy; 2024</p>
</footer>
```

9. Error Messages Accessible:
```tsx
<div>
  <label htmlFor="email">Email</label>
  <input
    id="email"
    type="email"
    aria-invalid={hasError}
    aria-describedby={hasError ? "email-error" : undefined}
  />
  {hasError && (
    <div id="email-error" role="alert" className="error">
      Email inválido
    </div>
  )}
</div>
```

10. Skip Links:
```tsx
// Permitir saltar navegación
<a href="#main-content" className="skip-link">
  Saltar al contenido principal
</a>

<style>
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: var(--primary);
  color: white;
  padding: 8px;
  z-index: 100;
}

.skip-link:focus {
  top: 0;
}
</style>
```

TypeScript estricto
Comentarios en español

App accesible para todos los usuarios.
```

### M11.3 - Error Handling Robusto

**Prompt:**
```
Implementa manejo de errores completo para mobile.

Ubicación: frontend/src/mobile/utils/errorHandler.ts

Requisitos:

1. Error Boundary Mejorado:
```typescript
class MobileErrorBoundary extends React.Component<Props, State> {
  state = { hasError: false, error: null }
  
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }
  
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log a servicio de monitoring
    logErrorToService({
      error,
      errorInfo,
      userAgent: navigator.userAgent,
      timestamp: new Date(),
      url: window.location.href
    })
  }
  
  handleReset = () => {
    this.setState({ hasError: false, error: null })
    window.location.href = '/mobile/dashboard'
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <ErrorScreen
          error={this.state.error}
          onReset={this.handleReset}
          onReport={this.handleReport}
        />
      )
    }
    
    return this.props.children
  }
}
```

2. Clasificación de Errores:
```typescript
enum ErrorType {
  NETWORK = 'network',
  AUTH = 'auth',
  VALIDATION = 'validation',
  SERVER = 'server',
  CLIENT = 'client',
  UNKNOWN = 'unknown'
}

class ErrorClassifier {
  classify(error: any): ErrorType {
    if (!navigator.onLine) return ErrorType.NETWORK
    if (error.response?.status === 401) return ErrorType.AUTH
    if (error.response?.status === 422) return ErrorType.VALIDATION
    if (error.response?.status >= 500) return ErrorType.SERVER
    if (error instanceof TypeError) return ErrorType.CLIENT
    return ErrorType.UNKNOWN
  }
  
  getMessage(type: ErrorType): string {
    const messages = {
      [ErrorType.NETWORK]: 'Sin conexión a Internet',
      [ErrorType.AUTH]: 'Sesión expirada. Por favor inicia sesión nuevamente',
      [ErrorType.VALIDATION]: 'Verifica los datos ingresados',
      [ErrorType.SERVER]: 'Error del servidor. Intenta más tarde',
      [ErrorType.CLIENT]: 'Error en la aplicación',
      [ErrorType.UNKNOWN]: 'Ocurrió un error inesperado'
    }
    return messages[type]
  }
  
  getSuggestion(type: ErrorType): string {
    const suggestions = {
      [ErrorType.NETWORK]: 'Verifica tu conexión e intenta nuevamente',
      [ErrorType.AUTH]: 'Inicia sesión para continuar',
      [ErrorType.VALIDATION]: 'Revisa los campos marcados en rojo',
      [ErrorType.SERVER]: 'Si persiste, contacta a soporte',
      [ErrorType.CLIENT]: 'Intenta recargar la aplicación',
      [ErrorType.UNKNOWN]: 'Reporta este error si continúa'
    }
    return suggestions[type]
  }
}
```

3. Retry Logic:
```typescript
class RetryHandler {
  async execute<T>(
    fn: () => Promise<T>,
    maxRetries = 3,
    delay = 1000
  ): Promise<T> {
    let lastError: Error
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn()
      } catch (error) {
        lastError = error as Error
        
        // No retry para ciertos errores
        if (error.response?.status === 401 || error.response?.status === 404) {
          throw error
        }
        
        // Esperar antes del próximo intento
        if (i < maxRetries - 1) {
          await this.wait(delay * Math.pow(2, i)) // Exponential backoff
        }
      }
    }
    
    throw lastError!
  }
  
  private wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}
```

4. Error UI Components:
```tsx
const ErrorScreen: React.FC<ErrorScreenProps> = ({ error, onRetry, onReport }) => {
  const classifier = new ErrorClassifier()
  const type = classifier.classify(error)
  
  return (
    <div className="error-screen">
      <ErrorIcon type={type} />
      <h2>{classifier.getMessage(type)}</h2>
      <p>{classifier.getSuggestion(type)}</p>
      
      {type === ErrorType.NETWORK && (
        <NetworkStatus />
      )}
      
      <div className="actions">
        <Button onClick={onRetry} variant="primary">
          Reintentar
        </Button>
        <Button onClick={onReport} variant="ghost">
          Reportar problema
        </Button>
      </div>
      
      {process.env.NODE_ENV === 'development' && (
        <details className="error-details">
          <summary>Detalles técnicos</summary>
          <pre>{error.stack}</pre>
        </details>
      )}
    </div>
  )
}
```

5. Global Error Handler:
```typescript
// Capturar errores no manejados
window.addEventListener('error', (event) => {
  logError({
    type: 'uncaught',
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    error: event.error
  })
})

// Capturar promesas rechazadas
window.addEventListener('unhandledrejection', (event) => {
  logError({
    type: 'unhandled-rejection',
    reason: event.reason
  })
})
```

6. User Feedback:
```typescript
// Permitir que usuario reporte errores
const ReportErrorDialog: React.FC = ({ error }) => {
  const [description, setDescription] = useState('')
  const [screenshot, setScreenshot] = useState<string | null>(null)
  
  const handleCapture = async () => {
    // Capturar screenshot del error
    const canvas = await html2canvas(document.body)
    setScreenshot(canvas.toDataURL())
  }
  
  const handleSubmit = async () => {
    await api.post('/api/errors/report', {
      error: {
        message: error.message,
        stack: error.stack
      },
      userDescription: description,
      screenshot,
      context: {
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date()
      }
    })
    
    toast.success('Reporte enviado. Gracias por tu ayuda!')
  }
  
  return (
    <Dialog>
      <h3>Reportar Problema</h3>
      <p>Ayúdanos a mejorar. ¿Qué estabas haciendo?</p>
      <Textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Describe qué pasó..."
      />
      <Button onClick={handleCapture}>Capturar Pantalla</Button>
      {screenshot && <img src={screenshot} alt="Screenshot" />}
      <Button onClick={handleSubmit}>Enviar Reporte</Button>
    </Dialog>
  )
}
```

TypeScript estricto
Comentarios en español

Error handling que ayuda al usuario y al desarrollo.
```

### M11.4 - Testing Mobile

**Prompt:**
```
Configura testing específico para componentes mobile.

Ubicación: frontend/src/mobile/__tests__/

Requisitos:

1. Setup de Testing:
```typescript
// setupTests.ts
import '@testing-library/jest-dom'
import 'jest-canvas-mock'

// Mock de APIs mobile
global.navigator.vibrate = jest.fn()
global.navigator.geolocation = {
  getCurrentPosition: jest.fn(),
  watchPosition: jest.fn()
}

// Mock de IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  observe = jest.fn()
  disconnect = jest.fn()
  unobserve = jest.fn()
}

// Mock de matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn()
  }))
})
```

2. Test de Componentes Mobile:
```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MobileLayout } from '../layouts/MobileLayout'

describe('MobileLayout', () => {
  it('renders bottom navigation', () => {
    render(<MobileLayout />)
    expect(screen.getByRole('navigation')).toBeInTheDocument()
    expect(screen.getByText('Inicio')).toBeInTheDocument()
  })
  
  it('opens drawer on menu click', async () => {
    render(<MobileLayout />)
    const menuButton = screen.getByLabelText('Abrir menú')
    
    fireEvent.click(menuButton)
    
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeVisible()
    })
  })
  
  it('handles swipe gestures', async () => {
    const onSwipe = jest.fn()
    render(<SwipeableCard onSwipeLeft={onSwipe} />)
    
    const card = screen.getByTestId('swipeable-card')
    
    fireEvent.touchStart(card, { touches: [{ clientX: 100, clientY: 0 }] })
    fireEvent.touchMove(card, { touches: [{ clientX: 0, clientY: 0 }] })
    fireEvent.touchEnd(card)
    
    expect(onSwipe).toHaveBeenCalled()
  })
})
```

3. Test de Hooks:
```typescript
import { renderHook, act } from '@testing-library/react'
import { useOfflineSync } from '../hooks/useOfflineSync'

describe('useOfflineSync', () => {
  it('queues actions when offline', async () => {
    const { result } = renderHook(() => useOfflineSync())
    
    // Simular offline
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false
    })
    
    act(() => {
      result.current.submitForm({ data: 'test' })
    })
    
    expect(result.current.pendingCount).toBe(1)
  })
  
  it('syncs when back online', async () => {
    const { result } = renderHook(() => useOfflineSync())
    
    // Simular online
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true
    })
    
    act(() => {
      window.dispatchEvent(new Event('online'))
    })
    
    await waitFor(() => {
      expect(result.current.pendingCount).toBe(0)
    })
  })
})
```

4. Test de Gestos:
```typescript
import { createSwipeEvent } from '../test-utils/touchEvents'

describe('Swipe Gestures', () => {
  it('detects swipe left', () => {
    const onSwipeLeft = jest.fn()
    const { container } = render(
      <SwipeDetector onSwipeLeft={onSwipeLeft} />
    )
    
    const swipeEvent = createSwipeEvent('left', 150)
    fireEvent(container.firstChild, swipeEvent)
    
    expect(onSwipeLeft).toHaveBeenCalled()
  })
})
```

5. Visual Regression Testing:
```typescript
// Usando jest-image-snapshot
import { toMatchImageSnapshot } from 'jest-image-snapshot'

expect.extend({ toMatchImageSnapshot })

it('matches snapshot on mobile viewport', async () => {
  const { container } = render(<Dashboard />)
  
  // Simular viewport mobile
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    value: 375
  })
  
  const image = await takeScreenshot(container)
  expect(image).toMatchImageSnapshot()
})
```

6. Performance Testing:
```typescript
import { measurePerformance } from '../test-utils/performance'

it('renders large list performantly', async () => {
  const items = Array.from({ length: 1000 }, (_, i) => ({
    id: i,
    name: `Item ${i}`
  }))
  
  const metrics = await measurePerformance(() => {
    render(<VirtualList items={items} />)
  })
  
  expect(metrics.renderTime).toBeLessThan(100) // ms
})
```

TypeScript estricto
Comentarios en español

Testing completo para garantizar calidad.
```

### M11.5 - PWA Polish Final

**Prompt:**
```
Mejoras finales para PWA mobile.

Ubicación: frontend/vite.config.ts y manifest

Requisitos:

1. Manifest Completo:
```json
{
  "name": "Collector Enterprise - Amaranto",
  "short_name": "Collector",
  "description": "Gestión de formularios y tareas para construcción",
  "start_url": "/mobile/dashboard",
  "scope": "/",
  "display": "standalone",
  "orientation": "portrait-primary",
  "theme_color": "#0f172a",
  "background_color": "#ffffff",
  "icons": [
    {
      "src": "/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-96x96.png",
      "sizes": "96x96",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-128x128.png",
      "sizes": "128x128",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-152x152.png",
      "sizes": "152x152",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-384x384.png",
      "sizes": "384x384",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  "screenshots": [
    {
      "src": "/screenshots/mobile-1.png",
      "sizes": "750x1334",
      "type": "image/png",
      "platform": "narrow",
      "label": "Dashboard"
    },
    {
      "src": "/screenshots/mobile-2.png",
      "sizes": "750x1334",
      "type": "image/png",
      "platform": "narrow",
      "label": "Formularios"
    }
  ],
  "categories": ["productivity", "business"],
  "shortcuts": [
    {
      "name": "Nueva Tarea",
      "short_name": "Nueva",
      "url": "/mobile/assignments?new=true",
      "icons": [
        {
          "src": "/icons/shortcut-new.png",
          "sizes": "96x96"
        }
      ]
    },
    {
      "name": "Capturar Foto",
      "short_name": "Foto",
      "url": "/mobile/camera",
      "icons": [
        {
          "src": "/icons/shortcut-camera.png",
          "sizes": "96x96"
        }
      ]
    }
  ],
  "share_target": {
    "action": "/mobile/share",
    "method": "POST",
    "enctype": "multipart/form-data",
    "params": {
      "title": "title",
      "text": "text",
      "url": "url",
      "files": [
        {
          "name": "photos",
          "accept": ["image/*"]
        }
      ]
    }
  }
}
```

2. Install Prompt Mejorado:
```typescript
const InstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showInstall, setShowInstall] = useState(false)
  
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      
      // Mostrar después de cierto uso (no inmediatamente)
      const visitCount = parseInt(localStorage.getItem('visitCount') || '0')
      if (visitCount >= 3) {
        setShowInstall(true)
      }
    }
    
    window.addEventListener('beforeinstallprompt', handler)
    
    // Incrementar contador de visitas
    const count = parseInt(localStorage.getItem('visitCount') || '0')
    localStorage.setItem('visitCount', String(count + 1))
    
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])
  
  const handleInstall = async () => {
    if (!deferredPrompt) return
    
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    
    if (outcome === 'accepted') {
      // Track install
      analytics.track('pwa_installed')
    }
    
    setDeferredPrompt(null)
    setShowInstall(false)
  }
  
  const handleDismiss = () => {
    setShowInstall(false)
    localStorage.setItem('installDismissed', Date.now().toString())
  }
  
  if (!showInstall) return null
  
  return (
    <Sheet open={showInstall} onOpenChange={setShowInstall}>
      <SheetContent side="bottom">
        <div className="install-prompt">
          <img src="/icons/icon-192x192.png" alt="Logo" />
          <h3>Instalar Collector</h3>
          <p>
            Instala la app para acceso rápido, notificaciones y 
            funcionamiento offline completo.
          </p>
          
          <div className="benefits">
            <div className="benefit">
              <CheckIcon />
              <span>Acceso con un tap</span>
            </div>
            <div className="benefit">
              <CheckIcon />
              <span>Funciona sin conexión</span>
            </div>
            <div className="benefit">
              <CheckIcon />
              <span>Notificaciones instantáneas</span>
            </div>
          </div>
          
          <div className="actions">
            <Button onClick={handleInstall} variant="primary">
              Instalar
            </Button>
            <Button onClick={handleDismiss} variant="ghost">
              Más tarde
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
```

3. iOS Install Instructions:
```typescript
const IOSInstallGuide: React.FC = () => {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
  const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches
  
  if (!isIOS || isInStandaloneMode) return null
  
  return (
    <Dialog>
      <DialogContent>
        <h3>Instalar en iOS</h3>
        <ol className="install-steps">
          <li>
            <ShareIcon />
            <span>Toca el botón de compartir</span>
          </li>
          <li>
            <PlusSquareIcon />
            <span>Selecciona "Añadir a pantalla de inicio"</span>
          </li>
          <li>
            <CheckIcon />
            <span>Toca "Añadir" en la esquina superior derecha</span>
          </li>
        </ol>
        <video autoPlay loop muted playsInline>
          <source src="/videos/ios-install.mp4" type="video/mp4" />
        </video>
      </DialogContent>
    </Dialog>
  )
}
```

4. Update Notification:
```typescript
const UpdateNotification: React.FC = () => {
  const [showUpdate, setShowUpdate] = useState(false)
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null)
  
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    
    navigator.serviceWorker.ready.then(reg => {
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing
        
        newWorker?.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            setShowUpdate(true)
            setRegistration(reg)
          }
        })
      })
    })
  }, [])
  
  const handleUpdate = () => {
    if (!registration || !registration.waiting) return
    
    registration.waiting.postMessage({ type: 'SKIP_WAITING' })
    
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload()
    })
  }
  
  if (!showUpdate) return null
  
  return (
    <div className="update-notification">
      <div className="content">
        <SparklesIcon />
        <div>
          <strong>Nueva versión disponible</strong>
          <p>Actualiza para obtener las últimas mejoras</p>
        </div>
      </div>
      <Button onClick={handleUpdate} size="sm">
        Actualizar
      </Button>
    </div>
  )
}
```

5. Splash Screens:
```html
<!-- iOS Splash Screens -->
<link
  rel="apple-touch-startup-image"
  media="screen and (device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
  href="/splashscreens/iPhone_15_Pro_Max__iPhone_15_Plus__iPhone_14_Pro_Max_portrait.png"
>
<link
  rel="apple-touch-startup-image"
  media="screen and (device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
  href="/splashscreens/iPhone_15_Pro__iPhone_15__iPhone_14_Pro_portrait.png"
>
<link
  rel="apple-touch-startup-image"
  media="screen and (device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
  href="/splashscreens/iPhone_14_Plus__iPhone_13_Pro_Max__iPhone_12_Pro_Max_portrait.png"
>
```

6. Meta Tags Adicionales:
```html
<!-- iOS Meta Tags -->
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Collector">

<!-- Android Meta Tags -->
<meta name="mobile-web-app-capable" content="yes">
<meta name="theme-color" content="#0f172a">
<meta name="color-scheme" content="light dark">

<!-- Windows Meta Tags -->
<meta name="msapplication-TileColor" content="#0f172a">
<meta name="msapplication-config" content="/browserconfig.xml">

<!-- Safe Area -->
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover, user-scalable=no">
```

7. Workbox Config Optimizado:
```javascript
// workbox-config.js
module.exports = {
  globDirectory: 'dist/',
  globPatterns: [
    '**/*.{html,js,css,png,svg,jpg,jpeg,gif,webp,woff,woff2,ttf,eot,ico}'
  ],
  swDest: 'dist/sw.js',
  
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/api\.collector\.com\/.*/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-cache',
        networkTimeoutSeconds: 5,
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 5 * 60 // 5 minutos
        },
        cacheableResponse: {
          statuses: [0, 200]
        }
      }
    },
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'image-cache',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 30 * 24 * 60 * 60 // 30 días
        }
      }
    },
    {
      urlPattern: /\.(?:woff|woff2|ttf|eot)$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'font-cache',
        expiration: {
          maxEntries: 20,
          maxAgeSeconds: 365 * 24 * 60 * 60 // 1 año
        }
      }
    }
  ],
  
  skipWaiting: false,
  clientsClaim: false
}
```

TypeScript estricto
Comentarios en español

PWA pulido y profesional listo para producción.
```

---

## 🎊 Fase Mobile 12: Integración Final y Documentación

### M12.1 - Detección y Redirección Automática

**Prompt:**
```
Implementa sistema inteligente de detección de dispositivo y redirección.

Ubicación: frontend/src/App.tsx (integración)

Requisitos:

1. Detector de Contexto:
```typescript
class UserContextDetector {
  detectOptimalRoute(): string {
    const device = this.detectDevice()
    const role = this.getUserRole()
    const preference = this.getUserPreference()
    
    // Si tiene preferencia guardada, respetarla
    if (preference) return preference
    
    // Lógica de redirección
    if (device === 'mobile') {
      if (role === 'OPERATOR' || role === 'SUPERVISOR') {
        return '/mobile/dashboard'
      } else {
        // Admin/Manager en mobile: avisar que no está optimizado
        return '/mobile/dashboard' // o '/admin/dashboard' con warning
      }
    } else {
      // Desktop/Tablet
      if (role === 'OPERATOR') {
        // Sugerir usar mobile
        return '/admin/dashboard' // con banner sugerencia
      } else {
        return '/admin/dashboard'
      }
    }
  }
  
  private detectDevice(): 'mobile' | 'tablet' | 'desktop' {
    const width = window.innerWidth
    
    if (width < 768) return 'mobile'
    if (width < 1024) return 'tablet'
    return 'desktop'
  }
  
  private getUserRole(): string {
    const user = authStore.getState().user
    return user?.role || 'OPERATOR'
  }
  
  private getUserPreference(): string | null {
    return localStorage.getItem('preferredInterface')
  }
  
  savePreference(route: string) {
    localStorage.setItem('preferredInterface', route)
  }
}
```

2. Smart Redirect Component:
```typescript
const SmartRedirect: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const detector = new UserContextDetector()
  
  useEffect(() => {
    // Solo en root o login
    if (location.pathname !== '/' && location.pathname !== '/login') return
    
    const optimalRoute = detector.detectOptimalRoute()
    
    if (location.pathname !== optimalRoute) {
      navigate(optimalRoute, { replace: true })
    }
  }, [location])
  
  return null
}
```

3. Interface Switcher:
```typescript
const InterfaceSwitcher: React.FC = () => {
  const [showSwitcher, setShowSwitcher] = useState(false)
  const detector = new UserContextDetector()
  const location = useLocation()
  
  useEffect(() => {
    const isMobile = detector.detectDevice() === 'mobile'
    const isOnMobileRoute = location.pathname.startsWith('/mobile')
    const isOnAdminRoute = location.pathname.startsWith('/admin')
    
    // Mostrar switcher si está en interfaz no óptima
    setShowSwitcher(
      (isMobile && isOnAdminRoute) || (!isMobile && isOnMobileRoute)
    )
  }, [location])
  
  const handleSwitch = () => {
    const currentRoute = location.pathname
    const newRoute = currentRoute.startsWith('/mobile')
      ? currentRoute.replace('/mobile', '/admin')
      : currentRoute.replace('/admin', '/mobile')
    
    detector.savePreference(newRoute)
    navigate(newRoute)
  }
  
  if (!showSwitcher) return null
  
  return (
    <div className="interface-switcher-banner">
      <InfoIcon />
      <span>
        Hay una versión optimizada para tu dispositivo
      </span>
      <Button onClick={handleSwitch} size="sm">
        Cambiar
      </Button>
      <Button onClick={() => setShowSwitcher(false)} variant="ghost" size="sm">
        <XIcon />
      </Button>
    </div>
  )
}
```

4. Route Guard:
```typescript
const MobileOnlyRoute: React.FC<RouteProps> = ({ children }) => {
  const detector = new UserContextDetector()
  const device = detector.detectDevice()
  
  if (device !== 'mobile') {
    return (
      <div className="device-restriction-message">
        <SmartphoneIcon />
        <h2>Esta función está optimizada para móvil</h2>
        <p>Por favor accede desde tu dispositivo móvil</p>
        <Button onClick={() => navigate('/admin/dashboard')}>
          Ir al panel administrativo
        </Button>
      </div>
    )
  }
  
  return <>{children}</>
}
```

5. Integration en App.tsx:
```typescript
function App() {
  return (
    <BrowserRouter>
      <SmartRedirect />
      <InterfaceSwitcher />
      
      <Routes>
        {/* Landing y Auth */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        
        {/* Admin Routes */}
        <Route path="/admin" element={
          <ProtectedRoute>
            <Suspense fallback={<LoadingScreen />}>
              <AdminLayout />
            </Suspense>
          </ProtectedRoute>
        }>
          {/* ... rutas admin existentes */}
        </Route>
        
        {/* Mobile Routes */}
        <Route path="/mobile" element={
          <ProtectedRoute>
            <Suspense fallback={<MobileLoadingScreen />}>
              <MobileLayout />
            </Suspense>
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/mobile/dashboard" replace />} />
          <Route path="dashboard" element={<MobileDashboard />} />
          <Route path="assignments" element={<MobileAssignments />} />
          <Route path="form/:assignmentId" element={<MobileFormResponse />} />
          <Route path="history" element={<MobileHistory />} />
          <Route path="profile" element={<MobileProfile />} />
          <Route path="settings" element={<MobileSettings />} />
          <Route path="reports" element={<MobileReports />} />
          <Route path="camera" element={
            <MobileOnlyRoute>
              <CameraCapture />
            </MobileOnlyRoute>
          } />
        </Route>
        
        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}
```

TypeScript estricto
Comentarios en español

Routing inteligente y transparente para el usuario.
```

### M12.2 - Documentación de Código Mobile

**Prompt:**
```
Crea documentación técnica completa de la versión mobile.

Ubicación: docs/MOBILE.md

Requisitos:

# Documentación Mobile - Collector Enterprise

## Arquitectura

### Estructura de Carpetas
```
frontend/src/
├── mobile/              # Código específico mobile
│   ├── components/      # Componentes mobile
│   │   ├── inputs/      # Inputs optimizados
│   │   ├── loading/     # Loading states
│   │   ├── offline/     # Indicadores offline
│   │   └── ...
│   ├── layouts/         # Layouts mobile
│   ├── pages/           # Páginas mobile
│   ├── hooks/           # Hooks mobile
│   ├── utils/           # Utilidades mobile
│   └── styles/          # Estilos mobile
├── admin/               # Código admin (existente)
└── shared/              # Componentes compartidos
```

### Routing
- `/mobile/*` - Rutas optimizadas para mobile
- `/admin/*` - Panel administrativo web
- Detección automática de dispositivo
- Lazy loading por sección

### Code Splitting
```typescript
// Cada sección mobile se carga bajo demanda
const MobileDashboard = lazy(() => import('./pages/Dashboard'))
const MobileAssignments = lazy(() => import('./pages/Assignments'))
// etc...
```

## Componentes Principales

### MobileLayout
Layout base para todas las páginas mobile.

**Features:**
- Header sticky con navegación
- Bottom navigation bar (4 tabs)
- Side drawer menu
- Safe area handling (iOS notch)

**Uso:**
```typescript
<MobileLayout>
  <YourPage />
</MobileLayout>
```

### BottomNav
Barra de navegación inferior.

**Tabs:**
1. Inicio - Dashboard
2. Tareas - Lista de asignaciones
3. Cámara - Captura rápida
4. Perfil - Usuario y configuración

### MobileDrawer
Menú lateral deslizable.

**Props:**
- `open: boolean`
- `onClose: () => void`

**Contenido:**
- Info de usuario
- Links de navegación
- Configuración
- Logout

## Offline Support

### IndexedDB Storage
```typescript
import { offlineStorage } from '@/mobile/utils/offlineStorage'

// Guardar data
await offlineStorage.saveResponse(responseData)

// Recuperar data
const response = await offlineStorage.getResponse(id)
```

### Service Worker
- Cache de assets estáticos
- Cache de API responses
- Background sync para acciones pendientes
- Push notifications

### Sync Manager
```typescript
import { syncManager } from '@/mobile/utils/syncManager'

// Sincronizar todo
await syncManager.sync()

// Sincronizar tipo específico
await syncManager.syncResponses()
```

## Captura de Medios

### Cámara
```typescript
import CameraCapture from '@/mobile/components/CameraCapture'

<CameraCapture
  onCapture={(photo) => handlePhoto(photo)}
  maxPhotos={5}
  compressQuality={0.8}
/>
```

**Features:**
- Acceso a cámara nativa
- Switch front/back
- Flash control
- Compresión automática
- Multi-captura

### Firma Digital
```typescript
import SignaturePad from '@/mobile/components/SignaturePad'

<SignaturePad
  onSave={(signature) => handleSignature(signature)}
/>
```

**Features:**
- Canvas de firma
- Smooth drawing
- Export PNG base64
- Responsive

### Geolocalización
```typescript
import { useGeolocation } from '@/mobile/hooks/useGeolocation'

const { location, error, loading, requestLocation } = useGeolocation()
```

**Features:**
- High accuracy mode
- Reverse geocoding
- Permission handling
- Retry logic

## Gestos y Animaciones

### Gestos
```typescript
import { useSwipe } from '@/mobile/hooks/useGestures'

const { handleTouchStart, handleTouchMove, handleTouchEnd } = useSwipe({
  onSwipeLeft: () => console.log('swiped left'),
  onSwipeRight: () => console.log('swiped right')
})
```

### Animaciones
```typescript
import { motion } from 'framer-motion'
import { fadeIn, slideInFromBottom } from '@/mobile/utils/animations'

<motion.div {...fadeIn}>
  Contenido
</motion.div>
```

## Performance

### Optimizaciones Implementadas
- Virtual scrolling para listas largas
- Image lazy loading
- Code splitting agresivo
- Request batching
- Debounce/throttle de eventos
- Memory management

### Monitoring
```typescript
// Performance metrics
import { measurePerformance } from '@/mobile/utils/performance'

const metrics = measurePerformance('renderList')
// ... código a medir
metrics.end()
```

## Seguridad

### Autenticación Biométrica
```typescript
import { biometricAuth } from '@/mobile/utils/biometricAuth'

const isSupported = await biometricAuth.isSupported()
if (isSupported) {
  await biometricAuth.registerBiometric(userId)
}

// Autenticar
const success = await biometricAuth.authenticate()
```

### Encriptación Local
```typescript
import { secureStorage } from '@/mobile/utils/encryption'

// Guardar encriptado
await secureStorage.setItem('sensitiveData', data)

// Recuperar
const data = await secureStorage.getItem('sensitiveData')
```

## Testing

### Setup
```bash
npm test -- mobile
```

### Ejemplos
```typescript
// Test de componente
import { render, fireEvent } from '@testing-library/react'
import { BottomNav } from '@/mobile/components/BottomNav'

test('renders all tabs', () => {
  const { getByText } = render(<BottomNav />)
  expect(getByText('Inicio')).toBeInTheDocument()
})

// Test de hook
import { renderHook } from '@testing-library/react'
import { useOfflineSync } from '@/mobile/hooks/useOfflineSync'

test('queues actions when offline', () => {
  const { result } = renderHook(() => useOfflineSync())
  // ...
})
```

## Troubleshooting

### Problema: Cámara no funciona
- Verificar permisos en configuración del browser
- HTTPS es requerido para camera API
- Verificar que dispositivo tenga cámara

### Problema: Offline sync no funciona
- Verificar Service Worker registrado
- Check IndexedDB permisos
- Verificar conexión de red

### Problema: Gestos no responden
- Verificar touch-action CSS
- Check event listeners
- Prevenir comportamiento default

### Problema: Performance lenta
- Verificar virtual scrolling activo
- Check memory leaks
- Optimizar imágenes
- Reducir re-renders

## Best Practices

### Do's ✅
- Siempre usar TypeScript estricto
- Implementar error boundaries
- Manejar estados offline
- Validar inputs
- Comprimir imágenes
- Usar lazy loading
- Implementar retry logic
- Cache agresivamente

### Don'ts ❌
- No usar localStorage para data grande
- No bloquear UI thread
- No asumir conexión siempre disponible
- No ignorar permisos denegados
- No usar hover states
- No asumir viewport fijo

## Próximos Pasos

- [ ] Push notifications avanzadas
- [ ] Background geolocation tracking
- [ ] Offline maps
- [ ] Voice commands
- [ ] AR features (futuro)
- [ ] Wear OS support (futuro)

## Recursos

- [PWA Documentation](https://web.dev/progressive-web-apps/)
- [Framer Motion Docs](https://www.framer.com/motion/)
- [IndexedDB Guide](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [Web APIs](https://developer.mozilla.org/en-US/docs/Web/API)

## Soporte

Para preguntas o issues:
- Email: dev@collector.com
- Slack: #mobile-dev
- GitHub Issues: [link]

---

**Versión:** 1.0.0  
**Última actualización:** [Fecha]  
**Autor:** Equipo Collector

En español para equipo de desarrollo hispanohablante.
```

### M12.3 - Guía de Usuario Mobile

**Prompt:**
```
Crea guía de usuario para la versión mobile.

Ubicación: docs/USER_GUIDE_MOBILE.md

Requisitos:

# Guía de Usuario - Collector Mobile

## Instalación

### iPhone (iOS)
1. Abre Safari (debe ser Safari, no Chrome)
2. Navega a collector.amaranto.com
3. Toca el ícono de compartir (cuadrado con flecha)
4. Desplázate y selecciona "Añadir a pantalla de inicio"
5. Toca "Añadir"

### Android
1. Abre Chrome
2. Navega a collector.amaranto.com
3. Toca el menú (tres puntos)
4. Selecciona "Instalar app" o "Añadir a pantalla de inicio"
5. Confirma instalación

## Primer Uso

### Inicio de Sesión
1. Abre la app Collector
2. Ingresa tu email corporativo
3. Ingresa tu contraseña
4. Toca "Iniciar Sesión"

### Configuración Inicial
La app te guiará en:
- Habilitar notificaciones
- Permitir acceso a cámara
- Permitir acceso a ubicación
- Configurar autenticación biométrica (opcional)

## Dashboard

### Vista Principal
- **Tareas de Hoy**: Formularios asignados para completar
- **Estadísticas**: Tus números del día
- **Accesos Rápidos**: Funciones frecuentes

### Deslizar para Actualizar
- Desliza hacia abajo en cualquier momento para actualizar datos

## Tareas

### Ver Tareas Asignadas
1. Toca "Tareas" en la barra inferior
2. Verás lista de formularios asignados
3. Usa las pestañas para filtrar:
   - Pendientes
   - Completadas
   - Vencidas

### Iniciar Tarea
**Opción 1: Tap directo**
- Toca una tarea para abrirla

**Opción 2: Deslizar**
- Desliza hacia la derecha para ver detalles
- Desliza hacia la izquierda para iniciar rápido

### Buscar Tareas
- Toca el ícono de búsqueda (lupa)
- Escribe nombre del formulario
- Resultados aparecen en tiempo real

### Filtrar Tareas
- Toca el ícono de filtros
- Selecciona criterios:
  - Por fecha
  - Por formulario
  - Por estado
  - Por prioridad
- Toca "Ver resultados"

## Completar Formulario

### Navegar entre Campos
- **Opción 1**: Desliza izquierda/derecha entre campos
- **Opción 2**: Toca "Siguiente" abajo
- **Opción 3**: Usa el teclado (botón "Siguiente")

### Tipos de Campos

#### Texto
- Toca para escribir
- El teclado aparece automáticamente
- Usa auto-corrección

#### Número
- Teclado numérico aparece
- Usa botones +/- si están disponibles

#### Fecha
- Toca para abrir calendario
- Desliza para cambiar mes/año
- Toca fecha para seleccionar
- O usa "Hoy", "Mañana", etc.

#### Selección
- Toca para ver opciones
- Desplázate si hay muchas
- Toca opción para seleccionar
- Para múltiple selección: toca varias

#### Firma
- Toca "Firmar"
- Gira tu teléfono horizontal (opcional)
- Firma con tu dedo
- Toca "✓" para confirmar
- Toca "⟲" para borrar

#### Foto
- Toca "Capturar Foto"
- Permite acceso a cámara (si es primera vez)
- Toma la foto
- Revisa preview
- Toca "Usar" o "Retomar"
- Puedes capturar múltiples fotos

#### Ubicación
- Toca "Obtener Ubicación"
- Permite acceso (si es primera vez)
- Espera unos segundos
- La app captura ubicación automáticamente
- Verás dirección aproximada

### Guardar Progreso
- La app guarda automáticamente cada 30 segundos
- También al cambiar de campo
- Verás "✓ Guardado" brevemente

### Ver Resumen
- Toca menú (⋮) arriba
- Selecciona "Ver resumen"
- Revisa campos completados
- Toca para saltar a campo específico

### Enviar Formulario
1. Completa todos los campos requeridos
2. Toca "Enviar"
3. Revisa resumen
4. Marca "Confirmo que los datos son correctos"
5. Toca "Enviar" nuevamente
6. ¡Listo! Verás confirmación

## Trabajar Sin Conexión

### Modo Offline
- La app funciona sin internet
- Puedes completar formularios
- Los datos se guardan localmente
- Se sincronizan cuando vuelve conexión

### Sincronización
- Automática cuando hay conexión
- Verás ícono de sync arriba
- Puedes forzar: desliza para actualizar

### Ver Estado de Sync
- Toca ícono de nube arriba
- Verás:
  - Items sincronizados (✓ verde)
  - Items pendientes (⏱ ámbar)
  - Items con error (⚠ rojo)
- Toca para ver detalles

## Cámara

### Captura Rápida
1. Toca ícono de cámara en barra inferior
2. O usa acceso rápido en dashboard
3. Permite acceso a cámara
4. Toma foto(s)
5. Las fotos se guardan con geolocalización

### Tips para Buenas Fotos
- Limpia el lente
- Buena iluminación
- Enfoca bien
- Mantén estable
- Captura detalles necesarios

### Cambiar Cámara
- Toca ícono de flip (🔄)
- Alterna entre frontal y trasera

### Zoom (si disponible)
- Pellizca en pantalla
- O usa control deslizante

### Flash
- Toca ícono de rayo
- Opciones: Auto, Encendido, Apagado

## Perfil y Configuración

### Ver Perfil
1. Toca tu avatar o "Perfil" en barra inferior
2. Verás tu información y estadísticas

### Editar Perfil
1. En perfil, toca "Editar"
2. Modifica campos
3. Toca "Guardar"

### Cambiar Avatar
1. Toca tu foto de perfil
2. Elige:
   - Tomar foto
   - Elegir de galería
   - Avatar predeterminado
3. Ajusta recorte
4. Confirma

### Configuración
Accede desde perfil o menú lateral:

**Notificaciones**
- Habilitar/deshabilitar push
- Tipos de notificaciones
- Horario no molestar
- Sonido y vibración

**Sincronización**
- Auto-sync on/off
- Solo en WiFi
- Frecuencia de sync

**Almacenamiento**
- Ver espacio usado
- Limpiar cache
- Eliminar borradores antiguos

**Seguridad**
- Cambiar contraseña
- Autenticación biométrica (Face ID/Touch ID)
- PIN de respaldo
- Sesiones activas
- Verificación en dos pasos

**Apariencia**
- Tema (Claro/Oscuro/Auto)
- Tamaño de texto
- Animaciones

**Idioma**
- Cambiar idioma de la app
- Formato de fecha/hora

## Historial

### Ver Actividad
1. Desde menú lateral, toca "Historial"
2. Verás timeline de tus acciones
3. Agrupado por fecha

### Filtrar Historial
- Toca ícono de filtro
- Selecciona:
  - Tipo de actividad
  - Rango de fechas
  - Formulario específico
- Aplica filtros

### Ver Detalles
- Toca cualquier actividad
- Verás información completa
- Acciones disponibles según tipo

## Reportes

### Ver Estadísticas Personales
1. Menú lateral > Reportes
2. Selecciona período:
   - Hoy
   - Esta semana
   - Este mes
   - Personalizado
3. Revisa tus métricas

### Exportar Datos
1. En reportes, toca "Exportar"
2. Elige formato (PDF/Excel/CSV)
3. Selecciona qué incluir
4. Toca "Generar"
5. Comparte o descarga

## Notificaciones

### Tipos de Notificaciones
- **Nueva tarea asignada**: Te avisa de formularios nuevos
- **Recordatorio**: Tareas que vencen pronto
- **Tarea vencida**: Tareas no completadas a tiempo
- **Comentarios**: Actualizaciones en tus formularios

### Configurar Notificaciones
1. Configuración > Notificaciones
2. Habilita las que quieras recibir
3. Configura horario de "No molestar"

### Ver Notificaciones
- Toca campana (🔔) en header
- Verás lista de notificaciones
- Marca como leídas con tap
- Toca notificación para ver detalle

## Solución de Problemas

### La app no se instala
**iOS:**
- Debes usar Safari (no funciona en Chrome)
- Actualiza iOS a última versión

**Android:**
- Usa Chrome o Edge
- Actualiza browser

### No puedo iniciar sesión
- Verifica tu email y contraseña
- Verifica conexión a internet
- Intenta restablecer contraseña
- Contacta a tu supervisor

### La cámara no funciona
- Ve a Ajustes del teléfono
- Busca Collector
- Permite acceso a cámara
- Si persiste, reinicia app

### Ubicación no se captura
- Ve a Ajustes del teléfono
- Busca Collector
- Permite acceso a ubicación (siempre)
- Asegúrate de estar en exterior si es posible
- Espera unos segundos más

### Datos no se sincronizan
- Verifica conexión a internet
- Desliza para actualizar manualmente
- Revisa ícono de sync
- Si hay muchos pendientes, espera un momento
- En WiFi sincroniza más rápido

### La app está lenta
- Cierra y reabre la app
- Limpia cache: Configuración > Almacenamiento > Limpiar cache
- Elimina fotos/borradores viejos
- Reinicia tu teléfono

### Olvidé mi PIN
- Usa tu contraseña normal
- O autenticación biométrica
- Si olvidaste contraseña, restablécela desde login

### App no abre/crash
- Fuerza cerrar app
- Abre nuevamente
- Si persiste, desinstala y reinstala
- Tus datos están en el servidor (seguros)

## Preguntas Frecuentes

**¿Necesito internet siempre?**
No. Puedes trabajar completamente offline. Los datos se sincronizan cuando vuelve conexión.

**¿Cuánto espacio ocupa?**
Aproximadamente 50-100 MB inicial. Crece con fotos y data en cache.

**¿Puedo usar en tablet?**
Sí, pero está optimizada para teléfono. En tablet verás versión escritorio.

**¿Mis fotos consumen muchos datos?**
Las fotos se comprimen automáticamente. Configura "Solo WiFi" para uploads grandes.

**¿Puedo tener la app en múltiples dispositivos?**
Sí. Inicia sesión en cada dispositivo. Los datos se sincronizan entre todos.

**¿Es segura mi información?**
Sí. Usamos encriptación de datos, conexiones HTTPS, y puedes habilitar Face ID/Touch ID.

**¿Cómo actualizo la app?**
Las actualizaciones son automáticas. Verás notificación cuando haya nueva versión.

**¿Puedo compartir formularios?**
Actualmente no. Los formularios se envían automáticamente a supervisores.

**¿Funciona sin GPS?**
Algunas funciones requieren GPS. Puedes ingresar ubicación manualmente si es necesario.

**¿Qué hago si perdí mi teléfono?**
Informa inmediatamente a tu supervisor. Ellos pueden cerrar tu sesión remotamente.

## Consejos y Trucos

### Atajos Rápidos
- **Doble tap en header**: Volver arriba
- **Deslizar desde borde**: Menú lateral
- **Long press en tarea**: Ver opciones
- **Shake**: Reportar problema (en dev mode)

### Trabajar Más Rápido
- Completa tareas similares juntas
- Usa accesos rápidos del dashboard
- Aprovecha guardado automático
- Toma fotos por lotes

### Ahorrar Batería
- Reduce brillo de pantalla
- Desactiva animaciones en configuración
- Sincroniza solo en WiFi
- Cierra app cuando no la uses

### Ahorrar Datos
- Habilita "Solo WiFi" para fotos
- Reduce calidad de imágenes en configuración
- Sincroniza manualmente cuando lo necesites

### Mejor Experiencia
- Mantén app actualizada
- Limpia cache periódicamente
- Reporta bugs que encuentres
- Da feedback para mejoras

## Soporte

### Obtener Ayuda
Dentro de la app:
1. Menú lateral > Ayuda
2. Busca tu pregunta en FAQs
3. Ve tutoriales en video
4. Contacta soporte

### Reportar Problema
1. Menú lateral > Reportar problema
2. Describe qué pasó
3. Opcionalmente captura pantalla
4. Envía reporte

### Contacto
- **Email**: soporte@collector.amaranto.com
- **Teléfono**: +56 9 XXXX XXXX
- **Horario**: Lunes a Viernes, 8:00 - 18:00

---

**¡Bienvenido a Collector Mobile!**

Esta guía se actualiza regularmente con nuevas funciones y mejoras. Si tienes sugerencias, déjanos saber.

**Versión de la guía:** 1.0  
**Última actualización:** [Fecha]

En español para usuarios de habla hispana.
```

### M12.4 - Checklist de Lanzamiento Mobile

**Prompt:**
```
Crea checklist completo para lanzamiento de versión mobile.

Ubicación: docs/MOBILE_LAUNCH_CHECKLIST.md

Requisitos:

# Mobile Launch Checklist - Collector Enterprise

## Pre-Desarrollo ✅

- [x] Requisitos funcionales definidos
- [x] Diseño UI/UX aprobado
- [x] Arquitectura técnica definida
- [x] Stack tecnológico seleccionado
- [x] Repositorio configurado
- [x] Entorno de desarrollo listo

## Funcionalidad Core 🔧

### Autenticación
- [ ] Login con email/password funcional
- [ ] Integración con Firebase
- [ ] Detección automática de dispositivo
- [ ] Redirección inteligente según rol
- [ ] Biometría (Face ID/Touch ID) funcional
- [ ] PIN de respaldo implementado
- [ ] Logout completo (limpia data local)

### Navegación
- [ ] MobileLayout implementado
- [ ] Bottom navigation funcional (4 tabs)
- [ ] Side drawer menu implementado
- [ ] Transiciones suaves entre páginas
- [ ] Back button funciona correctamente
- [ ] Deep linking funcional
- [ ] Route guards implementados

### Dashboard
- [ ] KPIs móviles mostrados
- [ ] Gráficos responsivos
- [ ] Pull-to-refresh funcional
- [ ] Accesos rápidos implementados
- [ ] Loading states apropiados
- [ ] Empty states diseñados

### Tareas/Asignaciones
- [ ] Lista de tareas carga correctamente
- [ ] Filtros y búsqueda funcionan
- [ ] Swipe gestures implementados
- [ ] Infinite scroll funcional
- [ ] Tap para abrir tarea funciona
- [ ] Estados visuales claros (pendiente, completado, vencido)

### Formularios
- [ ] Campos optimizados para mobile
- [ ] Validación en tiempo real
- [ ] Guardado automático funcional
- [ ] Navegación entre campos fluida
- [ ] Progress bar visible
- [ ] Resumen antes de enviar
- [ ] Confirmación de envío

### Captura de Medios
- [ ] Cámara accede correctamente
- [ ] Switch front/back funciona
- [ ] Flash control implementado
- [ ] Compresión de imágenes funcional
- [ ] Multi-captura permitida
- [ ] Preview antes de usar
- [ ] Firma digital funcional
- [ ] Canvas responsive

### Geolocalización
- [ ] Obtiene ubicación correctamente
- [ ] High accuracy mode funcional
- [ ] Reverse geocoding implementado
- [ ] Permisos manejados correctamente
- [ ] Retry logic funcional
- [ ] Indicador de precisión visible
- [ ] Fallback a manual si falla

## Offline & Sync 📡

- [ ] Service Worker registrado
- [ ] Cache de assets estáticos funcional
- [ ] Cache de API responses implementado
- [ ] IndexedDB storage configurado
- [ ] Datos guardan offline
- [ ] Sync automático al obtener conexión
- [ ] Sync queue funcional
- [ ] Retry logic implementado
- [ ] Conflict resolution manejado
- [ ] Indicadores de estado sync visibles
- [ ] Manual sync trigger funcional
- [ ] Background sync (si soportado)

## PWA Features 📱

- [ ] Manifest.json completo y válido
- [ ] Icons en todos los tamaños (72-512px)
- [ ] Maskable icons incluidos
- [ ] Screenshots para stores
- [ ] Splash screens generados (iOS)
- [ ] Meta tags apropiados
- [ ] Standalone mode funcional
- [ ] Safe area handled (notch, home indicator)
- [ ] Install prompt implementado
- [ ] iOS install guide visible
- [ ] Update notification funcional
- [ ] Shortcuts configurados

## UX/UI 🎨

### Diseño
- [ ] Mobile-first en toda la app
- [ ] Touch targets >= 44x44px
- [ ] Typography legible (min 16px)
- [ ] Contraste suficiente (WCAG AA)
- [ ] Espaciado generoso
- [ ] No hover states
- [ ] Focus visible para accesibilidad

### Interacciones
- [ ] Tap feedback visual
- [ ] Haptic feedback implementado
- [ ] Swipe gestures naturales
- [ ] Pull-to-refresh suave
- [ ] Long press donde aplica
- [ ] Loading states no bloquean UI
- [ ] Animaciones suaves (< 300ms)
- [ ] Respeta prefers-reduced-motion

### Navegación
- [ ] Breadcrumbs (si aplica)
- [ ] Back navigation clara
- [ ] Active state visible
- [ ] No dead ends
- [ ] Confirmaciones para acciones destructivas

## Performance ⚡

- [ ] Initial load < 3 segundos
- [ ] Time to Interactive < 5 segundos
- [ ] Lighthouse Performance > 90
- [ ] Bundle size < 300KB gzipped
- [ ] Code splitting implementado
- [ ] Lazy loading de rutas
- [ ] Lazy loading de imágenes
- [ ] Virtual scrolling en listas largas
- [ ] Debounce/throttle implementados
- [ ] No memory leaks detectados
- [ ] API responses < 500ms (p95)
- [ ] Images optimizadas (WebP)
- [ ] Fonts optimizados

## Seguridad 🔒

- [ ] HTTPS en toda comunicación
- [ ] Tokens seguros (no expuestos)
- [ ] Encriptación de datos sensibles
- [ ] Validación de inputs completa
- [ ] XSS prevention implementado
- [ ] CSRF protection activo
- [ ] Rate limiting en API
- [ ] Secure headers (CSP, etc)
- [ ] No secrets en código
- [ ] Audit logs funcionando
- [ ] Session timeout implementado
- [ ] Secure wipe funcional

## Accesibilidad ♿

- [ ] Keyboard navigation funcional
- [ ] Screen reader compatible
- [ ] ARIA labels apropiados
- [ ] Focus management correcto
- [ ] Color contrast suficiente
- [ ] Text scaling respetado
- [ ] Alt text en imágenes
- [ ] Form labels correctos
- [ ] Error messages accessible
- [ ] Skip links implementados

## Notificaciones 🔔

- [ ] Push notifications funcionan
- [ ] Permission request apropiado
- [ ] Tipos de notificaciones configurables
- [ ] Click en notif navega correcto
- [ ] Badge counter actualiza
- [ ] Silent hours respetado
- [ ] Unsubscribe funcional

## Reportes y Analytics 📊

- [ ] Dashboard personal funciona
- [ ] Gráficos mobile-friendly
- [ ] Filtros implementados
- [ ] Export a PDF funcional
- [ ] Export a Excel funcional
- [ ] Share funcional (Share API)
- [ ] Analytics tracking implementado
- [ ] Insights generados

## Testing 🧪

### Funcional
- [ ] Tests unitarios > 70% coverage
- [ ] Tests de componentes pasando
- [ ] Tests de hooks pasando
- [ ] Tests de integración pasando
- [ ] E2E críticos pasando

### Devices
- [ ] iPhone SE (320x568)
- [ ] iPhone 12/13 (390x844)
- [ ] iPhone 14 Pro Max (430x932)
- [ ] Samsung Galaxy S10 (360x760)
- [ ] Pixel 5 (393x851)
- [ ] iPad (768x1024)

### Browsers
- [ ] Safari iOS (últimas 2 versiones)
- [ ] Chrome Android (última)
- [ ] Samsung Internet (última)
- [ ] Firefox Android (última)

### Conexión
- [ ] WiFi rápido
- [ ] 4G
- [ ] 3G (lento)
- [ ] Offline completo
- [ ] Intermitente (flaky)

### Orientación
- [ ] Portrait (principal)
- [ ] Landscape (donde aplique)
- [ ] Rotation handling

## Documentación 📝

- [ ] README actualizado
- [ ] Documentación técnica completa (MOBILE.md)
- [ ] Guía de usuario (USER_GUIDE_MOBILE.md)
- [ ] API docs actualizadas
- [ ] Comentarios en código (español)
- [ ] JSDoc en funciones públicas
- [ ] Architecture diagrams actualizados

## Backend Support 🖥️

- [ ] Endpoints mobile-friendly (paginación, filtros)
- [ ] Batch endpoints para sync
- [ ] File upload optimizado (chunked, resumable)
- [ ] Push notification service configurado
- [ ] Audit logs capturando eventos mobile
- [ ] Error tracking (Sentry) configurado

## Monitoreo 📈

- [ ] Error tracking activo (Sentry)
- [ ] Analytics configurado
- [ ] Performance monitoring activo
- [ ] Uptime monitoring configurado
- [ ] Logs estructurados
- [ ] Alertas configuradas
- [ ] Dashboard de métricas

## Deployment 🚀

- [ ] CI/CD configurado
- [ ] Build de producción exitoso
- [ ] Environment variables correctas
- [ ] Service Worker building correctamente
- [ ] Assets optimizados y minificados
- [ ] Source maps generados
- [ ] Deploy a staging exitoso
- [ ] Smoke tests en staging pasados
- [ ] Deploy a producción exitoso
- [ ] DNS configurado correctamente
- [ ] SSL certificado válido

## Post-Launch 🎉

### Inmediato (Día 1)
- [ ] Smoke tests en producción
- [ ] Monitoring activo
- [ ] Error rate < 1%
- [ ] Performance metrics aceptables
- [ ] Feedback mechanism activo
- [ ] Support team briefed

### Primera Semana
- [ ] Revisar analytics diarios
- [ ] Monitorear error logs
- [ ] Responder feedback usuarios
- [ ] Fix bugs críticos
- [ ] Ajustes UX basados en uso real
- [ ] Performance tuning si necesario

### Primer Mes
- [ ] Análisis de adopción
- [ ] Survey de usuarios
- [ ] Identificar mejoras
- [ ] Planear roadmap v1.1
- [ ] Documentar learnings

## Mejoras Futuras 🔮

### Short-term (1-3 meses)
- [ ] Tutoriales interactivos mejorados
- [ ] Más tipos de campos
- [ ] Templates de formularios
- [ ] Compartir formularios
- [ ] Colaboración en tiempo real

### Mid-term (3-6 meses)
- [ ] Offline maps
- [ ] Voice commands
- [ ] Advanced search (NLP)
- [ ] ML insights
- [ ] Integración con cámaras IoT

### Long-term (6+ meses)
- [ ] AR features
- [ ] Computer vision (detección automática)
- [ ] Predictive analytics
- [ ] Multi-idioma completo
- [ ] Wear OS support

---

## Sign-off

**Product Owner:** _________________ Fecha: _______

**Tech Lead:** _________________ Fecha: _______

**QA Lead:** _________________ Fecha: _______

**DevOps:** _________________ Fecha: _______

---

**Status:** [DRAFT | IN PROGRESS | READY | LAUNCHED]

**Launch Date:** __________

**Version:** 1.0.0-mobile

Checklist en español para equipo hispanohablante.
```

### M12.5 - README Mobile

**Prompt:**
```
Actualiza el README principal con sección mobile.

Ubicación: README.md (actualización)

Requisitos:

# Collector Enterprise

Sistema de gestión de formularios dinámicos para Amaranto Constructora.

## 🚀 Versiones

- **Web Admin**: Panel administrativo completo para escritorio
- **Mobile PWA**: App móvil optimizada para operadores de campo ⭐ NUEVO

---

## 📱 Versión Mobile

### Características

✅ **Offline-First**
- Funciona completamente sin conexión
- Sincronización automática
- Data persistente local

✅ **Captura de Medios**
- Cámara integrada
- Firma digital táctil
- Geolocalización automática

✅ **PWA Completa**
- Instalable en iOS y Android
- Notificaciones push
- Actualización automática

✅ **UX Mobile-Native**
- Gestos táctiles naturales
- Animaciones fluidas
- Optimizada para una mano

### Quick Start Mobile

```bash
# 1. Clonar repo
git clone https://github.com/amaranto/collector-enterprise.git

# 2. Instalar dependencias
cd collector-enterprise/frontend
npm install

# 3. Configurar env mobile
cp .env.example .env
# Editar .env con tus credenciales

# 4. Ejecutar en dev
npm run dev

# 5. Abrir en móvil
# Abre http://localhost:5173 en Safari (iOS) o Chrome (Android)
# O usa túnel: npm run dev -- --host
```

### Estructura Mobile

```
frontend/src/
├── mobile/              # Código mobile-specific
│   ├── components/      # Componentes optimizados
│   ├── layouts/         # Layout mobile
│   ├── pages/           # Páginas mobile
│   ├── hooks/           # Hooks mobile
│   └── utils/           # Utilidades mobile
├── admin/               # Panel web (existente)
└── shared/              # Compartido
```

### Tecnologías Mobile

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **shadcn/ui** - Component library
- **Framer Motion** - Animations
- **Workbox** - Service Worker
- **IndexedDB** - Offline storage
- **Firebase** - Auth & Push

### Documentación Mobile

- [Guía Técnica](./docs/MOBILE.md)
- [Guía de Usuario](./docs/USER_GUIDE_MOBILE.md)
- [Launch Checklist](./docs/MOBILE_LAUNCH_CHECKLIST.md)

### Despliegue Mobile

```bash
# Build optimizado
npm run build

# Preview local
npm run preview

# Deploy (Vercel)
vercel --prod
```

---

## 💻 Versión Web Admin

[... contenido existente del README ...]

---

## 🤝 Contribuir

Ver [CONTRIBUTING.md](./CONTRIBUTING.md)

## 📄 Licencia

[Licencia del proyecto]

## 🐛 Reportar Issues

[Link a GitHub Issues]

## 📧 Contacto

- Email: dev@collector.amaranto.com
- Slack: #collector-dev

---

**Hecho con ❤️ por el equipo de Amaranto**

En español para equipo y usuarios hispanohablantes.
```

---

## ✅ Resumen Final y Próximos Pasos

### Completado en esta Guía 🎉

1. ✅ **Arquitectura Mobile-First**
   - Estructura separada `/mobile`
   - Code splitting y lazy loading
   - Routing inteligente según dispositivo y rol

2. ✅ **Componentes Mobile Optimizados**
   - Layout con bottom nav y drawer
   - Inputs touch-friendly
   - Gestos naturales (swipe, long-press)
   - Animaciones fluidas

3. ✅ **Funcionalidad Offline Completa**
   - IndexedDB storage
   - Service Worker avanzado
   - Sync automático e inteligente
   - Queue de acciones pendientes

4. ✅ **Captura de Medios**
   - Cámara con controles completos
   - Firma digital táctil
   - Geolocalización precisa
   - Compresión automática

5. ✅ **PWA Profesional**
   - Manifest completo
   - Install prompts
   - Update notifications
   - Push notifications

6. ✅ **UX Excelente**
   - Animaciones suaves
   - Feedback háptico
   - Loading states claros
   - Error handling robusto

7. ✅ **Performance Optimizado**
   - Virtual scrolling
   - Image lazy loading
   - Request batching
   - Memory management

8. ✅ **Seguridad Reforzada**
   - Biometría (Face ID/Touch ID)
   - Encriptación local
   - Secure wipe
   - Audit logs

9. ✅ **Accesibilidad**
   - WCAG 2.1 AA compliance
   - Screen reader support
   - Keyboard navigation
   - Touch target sizes apropiados

10. ✅ **Documentación Completa**
    - Guía técnica
    - Guía de usuario
    - Launch checklist
    - README actualizado

### Orden de Implementación Sugerido 📋

1. **Semana 1-2: Setup y Layout Base**
   - M1.1 a M1.5: Estructura y routing
   - M2.1 a M2.5: Dashboard y navegación

2. **Semana 3-4: Funcionalidad Core**
   - M3.1 a M3.5: Lista de tareas
   - M4.1 a M4.5: Formularios mobile

3. **Semana 5-6: Offline y Sync**
   - M5.1 a M5.5: Storage y sincronización

4. **Semana 7-8: Features Avanzadas**
   - M6.1 a M6.5: Perfil y configuración
   - M7.1 a M7.5: Animaciones y polish

5. **Semana 9-10: Búsqueda y Reportes**
   - M8.1 a M8.5: Búsqueda avanzada
   - M9.1 a M9.5: Reportes mobile

6. **Semana 11-12: Seguridad y Testing**
   - M10.1 a M10.5: Seguridad avanzada
   - M11.1 a M11.5: Optimización final

7. **Semana 13-14: Integración y Documentación**
   - M12.1 a M12.5: Integración final y docs

### Dependencias Importantes 📦

Instalar estas librerías adicionales:

```bash
# Gestos y animaciones
npm install framer-motion

# Virtualización
npm install @tanstack/react-virtual

# Utilities
npm install lz-string date-fns

# Testing adicional
npm install --save-dev jest-canvas-mock @testing-library/user-event
```

### Variables de Entorno Adicionales ⚙️

```env
# Mobile-specific
VITE_ENABLE_BIOMETRIC=true
VITE_ENABLE_PUSH_NOTIFICATIONS=true
VITE_OFFLINE_STORAGE_QUOTA=100 # MB
VITE_IMAGE_COMPRESSION_QUALITY=0.8
VITE_SYNC_INTERVAL=300000 # 5 minutos en ms
```

### Consideraciones Finales 💡

1. **Testing en Devices Reales**
   - Usa BrowserStack o dispositivos físicos
   - No confíes solo en simuladores

2. **Performance Budget**
   - Mantén bundle mobile < 300KB
   - Monitorea con Lighthouse periódicamente

3. **Feedback de Usuarios**
   - Beta testing con operadores reales
   - Iterar basado en feedback

4. **Monitoreo Continuo**
   - Error tracking activo
   - Analytics de uso
   - Performance monitoring

5. **Actualizaciones**
   - Plan de releases regulares
   - Comunicación de cambios
   - Backward compatibility

---

## 🎯 Meta Final

Al completar esta guía tendrás:

✨ **Una PWA mobile profesional** comparable a apps nativas

📱 **Funcionalidad offline completa** para trabajo en campo sin conexión

🚀 **Performance excelente** con Lighthouse score >90

🔒 **Seguridad robusta** con biometría y encriptación

♿ **Accesibilidad completa** WCAG AA

📚 **Documentación exhaustiva** para mantener y escalar

🎨 **UX de clase mundial** que usuarios amarán usar

---

**¡Éxito en el desarrollo de Collector Mobile! 📱✨**

Esta versión mobile complementa perfectamente tu sistema existente y lleva la productividad de los operadores al siguiente nivel.