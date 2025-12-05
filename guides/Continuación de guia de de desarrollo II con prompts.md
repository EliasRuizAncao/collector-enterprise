# 🚀 Guía de Prompts para Desarrollo - Collector Enterprise
## Continuación del Proyecto - Configuración Base y Pantallas Principales

---

## 📋 Índice de Fases

1. [Fase 1: Completar Backend Base](#fase-1-completar-backend-base)
2. [Fase 2: Configuración Firebase](#fase-2-configuración-firebase)
3. [Fase 3: Landing Page](#fase-3-landing-page)
4. [Fase 4: Sistema de Autenticación](#fase-4-sistema-de-autenticación)
5. [Fase 5: Panel Administrativo Base](#fase-5-panel-administrativo-base)
6. [Fase 6: Gestión de Usuarios](#fase-6-gestión-de-usuarios)
7. [Fase 7: Constructor de Formularios](#fase-7-constructor-de-formularios)

---

## 🎯 Fase 1: Completar Backend Base

### 1.1 - Configuración de Firebase Admin✅

**Prompt:**
```
Necesito crear el archivo de configuración de Firebase Admin SDK para el backend.

Ubicación: backend/src/config/firebase.ts

Requisitos:
- Importar firebase-admin
- Inicializar la app con credenciales desde variables de entorno
- Exportar la instancia de admin por defecto
- Usar las variables: FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL
- Manejar el caso donde ya esté inicializado (evitar múltiples inicializaciones)
- Agregar comentarios en español

Sigue las reglas de TypeScript y estructura del proyecto en .cursorrules
```

### 1.2 - Middleware de Error Handler✅

**Prompt:**
```
Crea el middleware de manejo de errores para Express.

Ubicación: backend/src/middleware/errorHandler.ts

Requisitos:
- Debe ser el último middleware de la cadena
- Capturar errores de Prisma, Zod, JWT y genéricos
- Integrar con Sentry para logging
- Retornar JSON con estructura: { error: string, details?: any }
- Status codes apropiados según tipo de error
- En desarrollo, incluir stack trace
- Tipar correctamente con ErrorRequestHandler de Express
- Comentarios en español

Usa las mejores prácticas de .cursorrules
```

### 1.3 - Rutas de Autenticación✅

**Prompt:**
```
Crea el archivo de rutas de autenticación.

Ubicación: backend/src/routes/auth.routes.ts

Requisitos:
- Usar Express Router
- Endpoints:
  POST /register - Registrar nuevo usuario
  POST /login - Login (verificar token Firebase)
  POST /logout - Logout
  GET /me - Obtener usuario actual (protegido)
- Importar controllers (crearemos después)
- Aplicar middleware de autenticación donde corresponda
- Exportar router por defecto
- Comentarios en español

Sigue estructura de .cursorrules
```

### 1.4 - Rutas de Formularios✅

**Prompt:**
```
Crea el archivo de rutas de formularios.

Ubicación: backend/src/routes/form.routes.ts

Requisitos:
- Usar Express Router
- Endpoints CRUD completo:
  GET / - Listar formularios (con paginación)
  GET /:id - Ver un formulario
  POST / - Crear formulario
  PUT /:id - Actualizar formulario
  DELETE /:id - Eliminar formulario
  POST /:id/publish - Publicar formulario
  POST /:id/archive - Archivar formulario
- TODAS las rutas protegidas con middleware authenticate
- Importar controllers (placeholder por ahora)
- Comentarios en español

Usa TypeScript estricto según .cursorrules
```

### 1.5 - Rutas de Usuarios✅

**Prompt:**
```
Crea el archivo de rutas de gestión de usuarios.

Ubicación: backend/src/routes/user.routes.ts

Requisitos:
- Usar Express Router
- Endpoints:
  GET / - Listar usuarios (paginado)
  GET /:id - Ver usuario específico
  POST / - Crear usuario (solo ADMIN)
  PUT /:id - Actualizar usuario
  DELETE /:id - Desactivar usuario (soft delete)
  PUT /:id/role - Cambiar rol (solo ADMIN)
- Proteger con authenticate y authorize según corresponda
- Importar middleware de auth
- Comentarios en español

Sigue las reglas de .cursorrules
```

### 1.6 - Rutas de Dashboard✅

**Prompt:**
```
Crea el archivo de rutas del dashboard.

Ubicación: backend/src/routes/dashboard.routes.ts

Requisitos:
- Usar Express Router
- Endpoints:
  GET /stats - Estadísticas generales (KPIs)
  GET /forms/completed - Formularios completados (con filtros)
  GET /forms/pending - Formularios pendientes
  GET /activity - Actividad reciente
- TODAS protegidas con authenticate
- Importar controllers (placeholder)
- Comentarios en español

Usa TypeScript según .cursorrules
```

### 1.7 - Controllers Placeholder✅

**Prompt:**
```
Crea controllers placeholder para que compile el backend.

Ubicaciones y archivos:
- backend/src/controllers/authController.ts
- backend/src/controllers/formController.ts
- backend/src/controllers/userController.ts
- backend/src/controllers/dashboardController.ts

Para cada uno:
- Importar Request, Response, NextFunction de Express
- Crear funciones async que respondan 501 (Not Implemented)
- Exportar todas las funciones
- Agregar comentario TODO: Implementar lógica
- Comentarios en español

Por ejemplo:
export const register = async (req: Request, res: Response) => {
  // TODO: Implementar registro
  res.status(501).json({ error: 'Not implemented yet' })
}

Crea los 4 archivos con sus respectivas funciones según las rutas definidas anteriormente.
```

### 1.8 - Verificar Compilación✅

**Prompt:**
```
Ahora que tenemos todos los archivos base, verifica que el backend compile correctamente.

Pasos:
1. Desde backend/, ejecuta: npm run build
2. Si hay errores TypeScript, identifícalos y corrígelos
3. Asegúrate de que todos los imports estén correctos
4. Verifica que tsconfig.json esté configurado correctamente
5. Reporta cualquier error y su solución

NO ejecutes el servidor todavía, solo verifica compilación.
```

---

## 🔥 Fase 2: Configuración Firebase 

### 2.1 - Crear Proyecto en Firebase Console ✅

**Instrucciones (NO es prompt para Cursor):**
1. Ve a https://console.firebase.google.com
2. Crea nuevo proyecto: "Collector Enterprise Amaranto"
3. Habilita Google Analytics (opcional)
4. En Authentication > Sign-in method, habilita Email/Password
5. En Project Settings > Service Accounts, genera nueva clave privada (JSON)
6. Guarda el JSON descargado de forma segura

### 2.2 - Configurar Variables de Entorno Backend ✅

**Prompt:**
```
Necesito configurar las variables de entorno de Firebase en el backend.

Tengo el archivo JSON de Service Account de Firebase. Ayúdame a:

1. Extraer los valores necesarios del JSON:
   - project_id
   - private_key (cuidado con saltos de línea)
   - client_email

2. Actualizar backend/.env con el formato correcto:
   FIREBASE_PROJECT_ID=
   FIREBASE_PRIVATE_KEY=
   FIREBASE_CLIENT_EMAIL=

3. Explicar cómo manejar el private_key que tiene \n

NO pegues credenciales reales, solo muéstrame el formato y estructura.
```

### 2.3 - Configurar Firebase Client en Frontend ✅

**Prompt:**
```
Crea la configuración de Firebase para el frontend.

Ubicación: frontend/src/lib/firebase.ts

Requisitos:
- Importar necesarios de firebase/app y firebase/auth
- Inicializar Firebase con config desde variables de entorno
- Exportar instancias de app y auth
- Variables a usar:
  VITE_FIREBASE_API_KEY
  VITE_FIREBASE_AUTH_DOMAIN
  VITE_FIREBASE_PROJECT_ID
  VITE_FIREBASE_STORAGE_BUCKET
  VITE_FIREBASE_MESSAGING_SENDER_ID
  VITE_FIREBASE_APP_ID
- Verificar que no esté ya inicializado
- Comentarios en español

Sigue .cursorrules para TypeScript
```

### 2.4 - Obtener Credenciales Frontend ✅

**Instrucciones (NO es prompt):**
1. En Firebase Console > Project Settings > General
2. En "Your apps", clic en "Web app" (ícono </>)
3. Registra la app: "Collector Web"
4. Copia el objeto firebaseConfig

### 2.5 - Configurar .env Frontend✅

**Prompt:**
```
Ayúdame a configurar el archivo frontend/.env con las credenciales de Firebase.

Tengo el objeto firebaseConfig de Firebase Console.

Muéstrame:
1. El formato exacto de las variables con prefijo VITE_
2. Cómo mapear cada campo del firebaseConfig a las variables
3. Agregar también VITE_API_URL para el backend

NO incluyas valores reales, solo la estructura.
```

---

## 🎨 Fase 3: Landing Page

### 3.1 - Layout Base Landing✅

**Prompt:**
```
Crea el layout base para las páginas públicas (Landing).

Ubicación: frontend/src/components/layout/LandingLayout.tsx

Requisitos:
- Componente funcional con TypeScript
- Usar Outlet de react-router-dom para nested routes
- Header con navegación:
  - Logo "Collector" a la izquierda
  - Links: Inicio, Nosotros, Contacto
  - Botón "Iniciar Sesión" a la derecha
- Footer simple con copyright y links básicos
- Responsive mobile-first con Tailwind
- Sticky header con scroll effect
- Usar componentes de shadcn/ui donde aplique
- Comentarios en español

Sigue diseño moderno según .cursorrules
```

### 3.2 - Hero Section✅

**Prompt:**
```
Crea la sección Hero para la Landing Page.

Ubicación: frontend/src/components/landing/HeroSection.tsx

Requisitos:
- Fondo con gradient moderno (slate-900 a blue-900)
- Título principal: "Transformamos la gestión de tus proyectos de construcción"
- Subtítulo con datos de Amaranto (10+ años, 50-150 trabajadores, 3-5 obras)
- 2 CTAs:
  - "Solicitar Demo" (primary, lleva a /contacto)
  - "Ver Features" (secondary, scroll a features)
- Imagen o ilustración a la derecha (placeholder por ahora)
- Animaciones sutiles con Tailwind animate
- Totalmente responsive
- Usar Button de shadcn/ui

Diseño wow-factor según .cursorrules
```

### 3.3 - Features Section✅

**Prompt:**
```
Crea la sección de Features/Características.

Ubicación: frontend/src/components/landing/FeaturesSection.tsx

Requisitos:
- Grid de 6 features (3x2 en desktop, 1 col en mobile)
- Cada feature card con:
  - Ícono (usar lucide-react)
  - Título
  - Descripción corta
- Features:
  1. Formularios Dinámicos (FormIcon)
  2. Dashboard en Tiempo Real (BarChartIcon)
  3. Gestión de Usuarios (UsersIcon)
  4. Reportes Automatizados (FileTextIcon)
  5. Firma Digital (PenToolIcon)
  6. App Móvil (SmartphoneIcon)
- Usar Card de shadcn/ui
- Hover effects
- Background sutil con pattern
- Comentarios en español

Sigue principios de diseño de .cursorrules
```

### 3.4 - Stats Section✅

**Prompt:**
```
Crea la sección de estadísticas/números.

Ubicación: frontend/src/components/landing/StatsSection.tsx

Requisitos:
- Grid de 4 stats (2x2 en mobile, 4 cols en desktop)
- Stats de Amaranto:
  - 10+ años en el mercado
  - 50-150 trabajadores gestionados
  - 3-5 obras simultáneas
  - 25.000 UF facturación anual promedio
- Cada stat con:
  - Número grande destacado
  - Label descriptivo
  - Ícono opcional
- Background diferente (ej: slate-50)
- Animación counter opcional (subir números)
- Totalmente responsive
- Comentarios en español

Diseño limpio y profesional
```

### 3.5 - CTA Section Final✅

**Prompt:**
```
Crea la sección CTA final antes del footer.

Ubicación: frontend/src/components/landing/CTASection.tsx

Requisitos:
- Background con gradient o color sólido destacado
- Título: "¿Listo para transformar tu obra?"
- Subtítulo motivacional
- Formulario de contacto rápido inline con campos:
  - Nombre
  - Email
  - Empresa
  - Botón "Solicitar Demo"
- Validación básica con React Hook Form + Zod
- Toast de confirmación al enviar (usar shadcn/ui toast)
- Por ahora solo console.log, implementaremos envío después
- Responsive
- Comentarios en español

Usa componentes Form de shadcn/ui
```

### 3.6 - Página Landing Principal ✅

**Prompt:**
```
Ensambla la página Landing principal.

Ubicación: frontend/src/pages/Landing.tsx

Requisitos:
- Importar todas las secciones creadas
- Estructura:
  <HeroSection />
  <FeaturesSection />
  <StatsSection />
  <CTASection />
- Espaciado adecuado entre secciones
- Scroll suave entre secciones
- Metadata para SEO (título, descripción)
- Comentarios en español

Componente limpio y simple
```

### 3.7 - Página Nosotros ✅

**Prompt:**
```
Crea la página "Nosotros" (Acerca de Amaranto).

Ubicación: frontend/src/pages/About.tsx

Requisitos:
- Hero pequeño con título "Acerca de Amaranto"
- Sección "Nuestra Historia":
  - Texto sobre 10+ años en el mercado
  - Especialización en edificación residencial y comercial
- Sección "Misión":
  - Texto: "Construir espacios que mejoren la calidad de vida..."
- Sección "Visión":
  - Usar tecnología y procesos innovadores
- Opcionalmente: galería de proyectos (placeholders)
- Diseño limpio con Cards de shadcn/ui
- Responsive
- Comentarios en español

Contenido inspirado en documento guía
```

### 3.8 - Página Contacto✅

**Prompt:**
```
Crea la página de Contacto.

Ubicación: frontend/src/pages/Contact.tsx

Requisitos:
- Layout 2 columnas (1 col en mobile):
  - Izquierda: Formulario de contacto
  - Derecha: Información de contacto (email, teléfono, dirección)
- Formulario con React Hook Form + Zod:
  - Nombre (requerido, min 2)
  - Email (requerido, formato email)
  - Empresa (requerido)
  - Teléfono (opcional)
  - Mensaje (requerido, min 10)
  - Botón "Enviar Mensaje"
- Validación completa
- Toast de confirmación
- Por ahora solo console.log al enviar
- Usar Form y Input de shadcn/ui
- Comentarios en español

Diseño profesional y accesible
```

### 3.9 - Configurar Rutas Landing✅

**Prompt:**
```
Actualiza el archivo de rutas para incluir las páginas Landing.

Ubicación: frontend/src/App.tsx

Requisitos:
- Importar LandingLayout, Landing, About, Contact
- Configurar rutas:
  - "/" -> Landing
  - "/nosotros" -> About
  - "/contacto" -> Contact
- Todas usan LandingLayout como wrapper
- Mantener estructura existente (no borrar admin routes placeholder)
- Comentarios en español

Usa React Router v6 según .cursorrules
```

### 3.10 - Probar Landing Pages✅

**Prompt:**
```
Ahora vamos a probar las landing pages.

Pasos:
1. Desde frontend/, ejecuta: npm run dev
2. Abre http://localhost:5173
3. Verifica:
   - Landing page carga correctamente
   - Navegación funciona (Inicio, Nosotros, Contacto)
   - Responsive en mobile (usa DevTools)
   - Formularios validan correctamente
   - Botones y links funcionan
4. Reporta cualquier error visual o de consola

Toma screenshots si es necesario para explicar problemas.
```

---

## 🔐 Fase 4: Sistema de Autenticación

### 4.1 - Auth Store con Zustand

**Prompt:**
```
Crea el store de autenticación con Zustand.

Ubicación: frontend/src/store/authStore.ts

Requisitos:
- Interface User con: id, email, name, role, firebaseUid
- Interface AuthState con:
  - user: User | null
  - token: string | null
  - isAuthenticated: boolean
  - isLoading: boolean
- Acciones:
  - setAuth(user, token)
  - logout()
  - setLoading(boolean)
- Usar persist middleware para persistir en localStorage
- Nombre storage: 'auth-storage'
- TypeScript estricto
- Comentarios en español

Sigue patrón Zustand de .cursorrules
```

### 4.2 - Página de Login✅

**Prompt:**
```
Crea la página de Login.

Ubicación: frontend/src/pages/Login.tsx

Requisitos:
- Layout centrado con Card de shadcn/ui
- Logo y título "Iniciar Sesión"
- Formulario con React Hook Form + Zod:
  - Email (requerido, formato email)
  - Password (requerido, min 6)
  - Checkbox "Recordarme" (opcional)
  - Botón "Iniciar Sesión"
- Link "¿Olvidaste tu contraseña?" (placeholder)
- Estado de loading mientras autentica
- Manejo de errores con Alert de shadcn/ui
- Por ahora NO implementes lógica de Firebase, solo UI
- Responsive
- Comentarios en español

Diseño limpio y profesional
```

### 4.3 - Servicio de Autenticación✅

**Prompt:**
```
Crea el servicio de autenticación que conecta Firebase con el backend.

Ubicación: frontend/src/services/authService.ts

Requisitos:
- Función login(email, password):
  1. Autenticar con Firebase (signInWithEmailAndPassword)
  2. Obtener idToken
  3. Llamar POST /api/auth/login con el token
  4. Retornar user y token del backend
- Función logout():
  1. Llamar POST /api/auth/logout
  2. Sign out de Firebase
- Función register(email, password, name):
  1. Crear user en Firebase
  2. Obtener token
  3. Llamar POST /api/auth/register
- Función getCurrentUser():
  1. Llamar GET /api/auth/me
- Manejo de errores completo
- TypeScript estricto
- Comentarios en español

Usa firebase/auth y api client de lib/
```

### 4.4 - Hook useAuth✅

**Prompt:**
```
Crea un custom hook para autenticación.

Ubicación: frontend/src/hooks/useAuth.ts

Requisitos:
- useAuth() retorna:
  - user
  - isAuthenticated
  - isLoading
  - login(email, password)
  - logout()
  - register(email, password, name)
- Usar authStore para state
- Usar authService para lógica
- Actualizar store después de cada operación
- Manejar errores y mostrar toast
- TypeScript estricto
- Comentarios en español

Sigue patrón de hooks de .cursorrules
```

### 4.5 - Integrar Login con Firebase✅

**Prompt:**
```
Integra la página Login con Firebase y el backend.

Actualizar: frontend/src/pages/Login.tsx

Requisitos:
- Importar useAuth hook
- Al submit del formulario:
  1. Llamar login(email, password)
  2. Mostrar loading
  3. Si success: redirect a /admin/dashboard
  4. Si error: mostrar Alert con mensaje
- Usar useNavigate para redirect
- Manejar diferentes tipos de errores:
  - Credenciales inválidas
  - Usuario no existe
  - Error de red
- Comentarios en español

Actualiza el componente existente
```

### 4.6 - Componente ProtectedRoute✅

**Prompt:**
```
Crea el componente para proteger rutas autenticadas.

Ubicación: frontend/src/components/auth/ProtectedRoute.tsx

Requisitos:
- Recibe children como prop
- Usar useAuth para verificar isAuthenticated
- Si NO autenticado: redirect a /login
- Si autenticado: renderizar children
- Mostrar loading state mientras verifica
- Opcionalmente verificar roles (para futuro)
- TypeScript con tipos correctos
- Comentarios en español

Componente reutilizable
```

### 4.7 - Implementar Backend Auth Controller✅

**Prompt:**
```
Implementa la lógica real del authController.

Ubicación: backend/src/controllers/authController.ts

Requisitos:
- login(req, res):
  1. Recibir idToken de Firebase en body
  2. Verificar token con Firebase Admin
  3. Buscar/crear usuario en Prisma
  4. Generar JWT propio (opcional, o usar idToken)
  5. Retornar user y token
- register(req, res):
  1. Recibir firebaseUid, email, name, role
  2. Crear usuario en Prisma
  3. Retornar usuario creado
- me(req, res):
  1. Usuario ya viene en req.user (middleware)
  2. Retornar datos del usuario
- logout(req, res):
  1. Por ahora solo status 200
  2. En futuro: invalidar token si usamos JWT
- Validación con Zod
- Manejo de errores completo
- TypeScript estricto
- Comentarios en español

Implementa lógica real sobre el placeholder
```

### 4.8 - Middleware de Autenticación Real✅

**Prompt:**
```
Actualiza el middleware de autenticación con lógica completa.

Ubicación: backend/src/middleware/auth.ts

Ya existe la estructura, ahora implementa:
- authenticate middleware:
  1. Extraer token del header Authorization
  2. Verificar con Firebase Admin
  3. Buscar usuario en Prisma
  4. Verificar isActive
  5. Adjuntar user a req.user
  6. Llamar next()
- authorize(...roles) middleware:
  1. Verificar que req.user exista
  2. Verificar que role esté en roles permitidos
  3. 403 si no autorizado
- Manejo de errores robusto
- Logging de intentos fallidos
- TypeScript estricto
- Comentarios en español

Mejora el código existente
```

### 4.9 - Probar Flujo de Autenticación✅

**Prompt:**
```
Vamos a probar el flujo completo de autenticación.

Pasos:
1. Levantar backend: cd backend && npm run dev
2. Levantar frontend: cd frontend && npm run dev
3. Crear usuario de prueba en Firebase Console (Authentication)
4. Intentar login en http://localhost:5173/login
5. Verificar:
   - Token se envía al backend
   - Usuario se crea/encuentra en DB
   - Redirect a dashboard
   - Token persiste en localStorage
   - Logout funciona
6. Reportar cualquier error

Usa Postman o Thunder Client para probar endpoints directamente si es necesario.
```

---

## 🏢 Fase 5: Panel Administrativo Base

### 5.1 - Layout Administrativo✅

**Prompt:**
```
Crea el layout base para el panel administrativo.

Ubicación: frontend/src/components/layout/AdminLayout.tsx

Requisitos:
- Sidebar izquierdo con navegación:
  - Logo arriba
  - Links: Dashboard, Formularios, Usuarios, Configuración
  - User menu abajo con nombre, rol, logout
- TopBar con:
  - Breadcrumbs
  - Notificaciones (ícono placeholder)
  - Theme toggle (dark/light)
  - Avatar con dropdown
- Contenido principal (Outlet)
- Sidebar colapsable en mobile (Sheet de shadcn/ui)
- Responsive mobile-first
- Usar componentes de shadcn/ui
- TypeScript estricto
- Comentarios en español

Diseño moderno y profesional según .cursorrules
```

### 5.2 - Página Dashboard Principal✅

**Prompt:**
```
Crea la página principal del Dashboard.

Ubicación: frontend/src/pages/admin/Dashboard.tsx

Requisitos:
- Header con título "Dashboard" y rango de fechas (selector)
- Grid de KPI Cards (4 cards):
  1. Total Formularios Activos
  2. Formularios Completados (hoy/semana)
  3. Usuarios Activos
  4. Tasa de Completitud (%)
- Cada card con:
  - Ícono
  - Número grande
  - Label
  - Cambio porcentual (vs periodo anterior)
  - Color según positivo/negativo
- Gráfico de línea: Formularios completados últimos 7 días
- Gráfico de barras: Formularios por tipo
- Tabla: Actividad reciente (últimas 10 acciones)
- Usar Card, Badge de shadcn/ui
- Usar Recharts para gráficos
- Datos dummy por ahora (hardcodeados)
- Responsive grid
- Comentarios en español

Diseño inspirado en dashboards modernos
```

### 5.3 - Componentes de KPI Cards✅

**Prompt:**
```
Crea componentes reutilizables para las KPI cards.

Ubicación: frontend/src/components/dashboard/KPICard.tsx

Requisitos:
- Props:
  - title: string
  - value: number | string
  - change?: number (porcentaje de cambio)
  - icon?: ReactNode
  - trend?: 'up' | 'down' | 'neutral'
- Diseño con Card de shadcn/ui
- Mostrar flecha arriba/abajo según trend
- Color verde/rojo según positivo/negativo
- Ícono a la izquierda
- Animación sutil en hover
- TypeScript con interfaces
- Comentarios en español

Componente reutilizable y flexible
```

### 5.4 - Componente de Gráficos con Recharts✅

**Prompt:**
```
Crea componentes wrapper para los gráficos.

Ubicación: frontend/src/components/dashboard/Charts.tsx

Requisitos:
- Exportar 2 componentes:
  1. LineChartCard: Gráfico de línea con título
  2. BarChartCard: Gráfico de barras con título
- Props:
  - title: string
  - data: any[]
  - dataKeys: string[]
  - colors?: string[]
- Usar Recharts: LineChart, BarChart, XAxis, YAxis, Tooltip, Legend
- Responsive con ResponsiveContainer
- Wrapper en Card de shadcn/ui
- Colores del theme de Tailwind
- TypeScript con interfaces
- Comentarios en español

Componentes configurables y reutilizables
```

### 5.5 - Tabla de Actividad Reciente✅

**Prompt:**
```
Crea el componente de tabla de actividad.

Ubicación: frontend/src/components/dashboard/ActivityTable.tsx

Requisitos:
- Props:
  - activities: Array<{ id, user, action, module, timestamp }>
- Usar Table de shadcn/ui
- Columnas:
  - Usuario (con avatar)
  - Acción
  - Módulo
  - Fecha (formato relativo: "hace 2 horas")
- Máximo 10 filas
- Link "Ver todas" que lleva a página de auditoría (futuro)
- Responsive: en mobile mostrar formato simplificado
- TypeScript estricto
- Comentarios en español

Tabla limpia y legible
```

### 5.6 - Probar Dashboard ✅

**Prompt:**
```
Vamos a probar el dashboard completo.

Pasos:
1. Asegúrate que estés autenticado (login)
2. Navega a /admin/dashboard
3. Verifica:
   - KPI cards se renderizan correctamente
   - Gráficos muestran datos dummy
   - Tabla de actividad aparece
   - Layout responsive funciona
   - Sidebar se colapsa en mobile
   - No hay errores en consola
4. Prueba navegación entre secciones del admin

Reporta cualquier problema visual o funcional.
```

---

## 👥 Fase 6: Gestión de Usuarios

### 6.1 - Página Lista de Usuarios ✅

**Prompt:**
```
Crea la página principal de gestión de usuarios.

Ubicación: frontend/src/pages/admin/Users.tsx

Requisitos:
- Header con:
  - Título "Usuarios"
  - Botón "Nuevo Usuario" (abre dialog)
  - Input de búsqueda (por nombre o email)
- Filtros:
  - Por rol (Select)
  - Por estado (Activo/Inactivo)
- Tabla con columnas:
  - Avatar + Nombre
  - Email
  - Rol (Badge con color)
  - Estado (Badge verde/rojo)
  - Última actividad
  - Acciones (editar, desactivar)
- Paginación (10 usuarios por página)
- Usar Table, Dialog, Select, Badge de shadcn/ui
- Datos dummy por ahora (array hardcodeado)
- Responsive
- TypeScript estricto
- Comentarios en español

Diseño limpio y funcional
```

### 6.2 - Dialog de Crear/Editar Usuario✅

**Prompt:**
```
Crea el dialog para crear/editar usuarios.

Ubicación: frontend/src/components/users/UserDialog.tsx

Requisitos:
- Props:
  - open: boolean
  - onClose: () => void
  - user?: User (si existe, es edición)
  - onSave: (data) => void
- Usar Dialog de shadcn/ui
- Formulario con React Hook Form + Zod:
  - Nombre (requerido, min 2)
  - Email (requerido, formato email)
  - Rol (Select: ADMIN, MANAGER, SUPERVISOR, OPERATOR)
  - Password (requerido solo en creación, min 6)
  - Estado (Switch: Activo/Inactivo)
- Validación completa
- Botones: Cancelar, Guardar
- Loading state en botón guardar
- Título dinámico: "Nuevo Usuario" o "Editar Usuario"
- TypeScript con interfaces
- Comentarios en español

Componente reutilizable para crear y editar
```

### 6.3 - Dialog de Confirmación ✅

**Prompt:**
```
Crea un dialog genérico de confirmación.

Ubicación: frontend/src/components/common/ConfirmDialog.tsx

Requisitos:
- Props:
  - open: boolean
  - onClose: () => void
  - onConfirm: () => void
  - title: string
  - description: string
  - confirmText?: string (default: "Confirmar")
  - cancelText?: string (default: "Cancelar")
  - variant?: 'default' | 'destructive'
- Usar AlertDialog de shadcn/ui
- Botón confirm color rojo si es destructive
- Loading state durante confirmación
- TypeScript estricto
- Comentarios en español

Dialog reutilizable en todo el proyecto
```

### 6.4 - Hook useUsers✅

**Prompt:**
```
Crea un custom hook para gestión de usuarios.

Ubicación: frontend/src/hooks/useUsers.ts

Requisitos:
- useUsers() retorna:
  - users: User[]
  - loading: boolean
  - error: string | null
  - fetchUsers(filters?)
  - createUser(data)
  - updateUser(id, data)
  - deleteUser(id)
  - toggleUserStatus(id)
- Usar api client de lib/
- Endpoints:
  - GET /api/users (con query params)
  - POST /api/users
  - PUT /api/users/:id
  - DELETE /api/users/:id
- Manejo de errores con toast
- TypeScript estricto
- Comentarios en español

Hook completo con todas las operaciones CRUD
```

### 6.5 - Integrar Gestión de Usuarios✅

**Prompt:**
```
Integra la página Users con el hook y dialog.

Actualizar: frontend/src/pages/admin/Users.tsx

Requisitos:
- Importar useUsers hook y UserDialog
- Implementar búsqueda (filtrar localmente por ahora)
- Implementar filtros de rol y estado
- Al hacer clic "Nuevo Usuario": abrir dialog en modo crear
- Al hacer clic "Editar": abrir dialog con datos del usuario
- Al hacer clic "Desactivar": mostrar ConfirmDialog y ejecutar
- Refresh de lista después de cada operación
- Mostrar loading skeletons mientras carga
- Manejar estados vacíos (sin usuarios)
- Comentarios en español

Funcionalidad completa de CRUD
```

### 6.6 - Implementar Backend User Controller✅

**Prompt:**
```
Implementa la lógica del userController.

Ubicación: backend/src/controllers/userController.ts

Requisitos:
- getUsers(req, res):
  1. Recibir query params: page, limit, role, isActive, search
  2. Construir query de Prisma con where y pagination
  3. Retornar users + total count
- getUser(req, res):
  1. Recibir id de params
  2. Buscar usuario con findUnique
  3. 404 si no existe
- createUser(req, res):
  1. Validar con Zod
  2. Verificar email único
  3. Crear en Prisma
  4. Crear audit log
  5. Retornar usuario creado
- updateUser(req, res):
  1. Validar datos
  2. Actualizar con Prisma
  3. Audit log
- deleteUser(req, res):
  1. Soft delete: actualizar isActive = false
  2. Audit log
- changeRole(req, res):
  1. Solo ADMIN puede
  2. Actualizar rol
  3. Audit log
- TypeScript estricto
- Comentarios en español

Implementación completa sobre el placeholder
```

### 6.7 - Validators de Usuario✅

**Prompt:**
```
Crea los validators Zod para usuarios.

Ubicación: backend/src/validators/userValidator.ts

Requisitos:
- createUserSchema:
  - email (email válido)
  - name (min 2, max 100)
  - role (enum: ADMIN, MANAGER, SUPERVISOR, OPERATOR)
  - firebaseUid (string)
- updateUserSchema:
  - Todos los campos opcionales excepto id
  - Mismas validaciones
- changeRoleSchema:
  - role (enum)
- Exportar schemas y types inferidos
- TypeScript estricto
- Comentarios en español

Schemas de validación reutilizables
```

### 6.8 - Service de Usuarios✅

**Prompt:**
```
Crea el service con lógica de negocio de usuarios.

Ubicación: backend/src/services/userService.ts

Requisitos:
- Funciones:
  - findUsers(filters): buscar con paginación
  - findUserById(id)
  - findUserByEmail(email)
  - createUser(data): validar y crear
  - updateUser(id, data)
  - deleteUser(id): soft delete
  - changeUserRole(id, role)
  - getUserStats(): retornar contadores
- Usar Prisma Client
- Manejar errores específicos (usuario no existe, email duplicado)
- Logging importante
- TypeScript estricto
- Comentarios en español

Lógica de negocio separada del controller
```

### 6.9 - Probar CRUD de Usuarios ✅

**Prompt:**
```
Vamos a probar la gestión completa de usuarios.

Pasos:
1. Desde el panel admin, ir a /admin/usuarios
2. Crear un usuario nuevo con rol OPERATOR
3. Verificar que aparece en la tabla
4. Editar el usuario (cambiar nombre)
5. Verificar actualización
6. Cambiar estado a Inactivo
7. Verificar que aparece como inactivo
8. Probar búsqueda por nombre
9. Probar filtros de rol y estado
10. Verificar que los datos persisten en la BD (Prisma Studio)

Reporta cualquier error o comportamiento inesperado.
```

---

## 📝 Fase 7: Constructor de Formularios

### 7.1 - Tipos de Campos de Formulario✅

**Prompt:**
```
Define los tipos TypeScript para el constructor de formularios.

Ubicación: frontend/src/types/formBuilder.ts

Requisitos:
- Enum FieldType con 15+ tipos:
  - TEXT, TEXTAREA, NUMBER
  - EMAIL, PHONE, URL
  - DATE, TIME, DATETIME
  - SELECT, MULTISELECT
  - RADIO, CHECKBOX
  - SIGNATURE, FILE, PHOTO
- Interface BaseField:
  - id: string
  - type: FieldType
  - label: string
  - placeholder?: string
  - required: boolean
  - order: number
  - validations?: objeto de validaciones
- Interfaces específicas que extienden BaseField:
  - TextField (maxLength, minLength)
  - SelectField (options: string[])
  - NumberField (min, max, step)
  - etc.
- Interface Form:
  - id, title, description
  - fields: Field[]
  - version, status, createdAt, etc.
- TypeScript estricto
- Comentarios en español

Tipos completos y bien estructurados
```

### 7.2 - Página Form Builder✅

**Prompt:**
```
Crea la página principal del constructor de formularios.

Ubicación: frontend/src/pages/admin/FormBuilder.tsx

Requisitos:
- Layout con 3 columnas:
  1. Sidebar izquierdo: Paleta de campos disponibles
  2. Centro: Canvas del formulario (drag & drop)
  3. Sidebar derecho: Propiedades del campo seleccionado
- Header con:
  - Input de título del formulario
  - Botones: Guardar, Vista previa, Publicar
- Paleta con cards de tipos de campo (draggables)
- Canvas con lista de campos añadidos (sorteable)
- Panel de propiedades edita el campo seleccionado
- Usar @dnd-kit para drag & drop
- Estado local del formulario
- Responsive (columnas se colapsan en mobile)
- TypeScript estricto
- Comentarios en español

Interface intuitiva de drag & drop
```

### 7.3 - Componente Field Palette✅

**Prompt:**
```
Crea el componente de paleta de campos.

Ubicación: frontend/src/components/formBuilder/FieldPalette.tsx

Requisitos:
- Grid de cards con todos los tipos de campo
- Cada card muestra:
  - Ícono representativo
  - Nombre del tipo
  - Descripción corta
- Draggable con @dnd-kit
- Categorías:
  - Texto (TEXT, TEXTAREA, EMAIL, PHONE, URL)
  - Números (NUMBER)
  - Fechas (DATE, TIME, DATETIME)
  - Selección (SELECT, MULTISELECT, RADIO, CHECKBOX)
  - Especiales (SIGNATURE, FILE, PHOTO)
- Usar Card de shadcn/ui
- Scroll en caso de muchos campos
- TypeScript estricto
- Comentarios en español

Paleta visual y organizada
```

### 7.4 - Componente Form Canvas✅

**Prompt:**
```
Crea el canvas donde se construye el formulario.

Ubicación: frontend/src/components/formBuilder/FormCanvas.tsx

Requisitos:
- Props:
  - fields: Field[]
  - onFieldsChange: (fields) => void
  - onFieldSelect: (field) => void
  - selectedFieldId?: string
- Área de drop para nuevos campos
- Lista de campos añadidos (sorteable con @dnd-kit)
- Cada campo muestra:
  - Ícono del tipo
  - Label
  - Preview del campo
  - Botones: editar (seleccionar), eliminar
- Highlight del campo seleccionado
- Mensaje cuando está vacío: "Arrastra campos aquí"
- Reordenar con drag & drop
- TypeScript estricto
- Comentarios en español

Canvas interactivo y visual
```

### 7.5 - Componente Field Properties Panel✅

**Prompt:**
```
Crea el panel de propiedades de campo.

Ubicación: frontend/src/components/formBuilder/FieldPropertiesPanel.tsx

Requisitos:
- Props:
  - field: Field | null
  - onFieldUpdate: (field) => void
- Si no hay campo seleccionado: mostrar mensaje
- Formulario dinámico según tipo de campo:
  - Propiedades comunes: label, placeholder, required
  - Propiedades específicas según tipo:
    - TEXT: maxLength, minLength
    - NUMBER: min, max, step
    - SELECT: lista de opciones (editable)
    - etc.
- Usar Form de shadcn/ui
- Updates en tiempo real
- Validación con React Hook Form + Zod
- Scroll si hay muchas propiedades
- TypeScript estricto
- Comentarios en español

Panel dinámico y completo
```

### 7.6 - Lógica de Drag & Drop✅

**Prompt:**
```
Implementa la lógica de drag & drop con @dnd-kit.

Ubicación: frontend/src/components/formBuilder/FormBuilder.tsx
(o integrar en FormBuilder page)

Requisitos:
- Usar DndContext de @dnd-kit
- Sensores: mouse y touch
- Drag desde paleta: crea nuevo campo
- Drag en canvas: reordena campos
- Drop en canvas: añade o reordena
- onDragEnd handler:
  - Detectar si viene de paleta o canvas
  - Si es nuevo: generar id único, añadir a fields
  - Si es reorder: actualizar order de fields
- Collision detection
- Drag overlay con preview del campo
- TypeScript estricto
- Comentarios en español

Drag & drop fluido y funcional
```

### 7.7 - Vista Previa del Formulario✅

**Prompt:**
```
Crea el componente de vista previa.

Ubicación: frontend/src/components/formBuilder/FormPreview.tsx

Requisitos:
- Props:
  - form: Form
- Renderizar formulario como se verá para el usuario final
- Cada campo según su tipo:
  - Input para TEXT, EMAIL, etc.
  - Textarea para TEXTAREA
  - Select para SELECT
  - Radio buttons para RADIO
  - etc.
- Mostrar validaciones (required, min, max)
- NO es funcional, solo preview visual
- Usar Sheet o Dialog de shadcn/ui
- Responsive (muestra vista mobile también)
- TypeScript estricto
- Comentarios en español

Preview fiel a cómo se verá el formulario
```

### 7.8 - Guardar y Cargar Formularios✅

**Prompt:**
```
Implementa la lógica para guardar y cargar formularios.

Ubicación: frontend/src/hooks/useFormBuilder.ts

Requisitos:
- useFormBuilder(formId?) retorna:
  - form: Form | null
  - loading: boolean
  - saveForm(data): guardar/actualizar
  - publishForm(id): cambiar status a PUBLISHED
  - loadForm(id): cargar formulario existente
- Usar api client
- Endpoints:
  - GET /api/forms/:id
  - POST /api/forms (crear)
  - PUT /api/forms/:id (actualizar)
  - POST /api/forms/:id/publish
- Auto-save cada 30 segundos (opcional)
- Manejo de errores con toast
- TypeScript estricto
- Comentarios en español

Hook completo para gestión del builder
```

### 7.9 - Implementar Backend Form Controller✅

**Prompt:**
```
Implementa el controlador de formularios en el backend.

Ubicación: backend/src/controllers/formController.ts

Requisitos:
- getForms(req, res):
  1. Query params: page, limit, status, search
  2. Retornar lista paginada
- getForm(req, res):
  1. Buscar por id con campos completos
  2. Incluir createdBy relation
- createForm(req, res):
  1. Validar estructura de campos
  2. Crear con version = 1
  3. Status = DRAFT
  4. Audit log
- updateForm(req, res):
  1. Validar permisos (solo creador o admin)
  2. Incrementar version
  3. Actualizar campos
  4. Audit log
- deleteForm(req, res):
  1. Soft delete: status = ARCHIVED
  2. Audit log
- publishForm(req, res):
  1. Validar que tenga al menos 1 campo
  2. Cambiar status a PUBLISHED
  3. Audit log
- TypeScript estricto
- Comentarios en español

Implementación completa del CRUD
```

### 7.10 - Validators de Formularios✅

**Prompt:**
```
Crea los validators para formularios.

Ubicación: backend/src/validators/formValidator.ts

Requisitos:
- fieldSchema: validar estructura de un campo
  - Tipo válido (enum)
  - Label no vacío
  - Propiedades según tipo
- createFormSchema:
  - title (min 2, max 200)
  - description (opcional, max 1000)
  - fields (array de fieldSchema, min 0)
- updateFormSchema:
  - Similar a create, campos opcionales
- Validar que options existan para SELECT
- Validar que validations sean coherentes (min < max)
- TypeScript estricto
- Comentarios en español

Validación exhaustiva de formularios
```

### 7.11 - Página Lista de Formularios✅

**Prompt:**
```
Crea la página de lista de formularios.

Ubicación: frontend/src/pages/admin/Forms.tsx

Requisitos:
- Header con:
  - Título "Formularios"
  - Botón "Nuevo Formulario" (navega a /admin/formularios/nuevo)
  - Filtros: Estado (Draft, Published, Archived)
  - Búsqueda por título
- Grid de cards (o tabla) con formularios:
  - Título
  - Descripción truncada
  - Badge de estado
  - Fecha de creación
  - Cantidad de campos
  - Acciones: Editar, Duplicar, Archivar, Ver respuestas
- Paginación
- Usar Card, Badge de shadcn/ui
- Loading states
- Estado vacío
- TypeScript estricto
- Comentarios en español

Lista clara y organizada
```

### 7.12 - Probar Constructor de Formularios✅

**Prompt:**
```
Vamos a probar el constructor completo de formularios.

Pasos:
1. Navegar a /admin/formularios/nuevo
2. Crear un formulario nuevo:
   - Título: "Inspección de Obra"
   - Arrastrar 5-7 campos diferentes
   - Configurar propiedades de cada campo
   - Reordenar campos
3. Guardar formulario
4. Ver vista previa
5. Verificar que se guardó en BD (Prisma Studio)
6. Editar el formulario (agregar campo)
7. Publicar formulario
8. Volver a lista y verificar que aparece

Reporta cualquier bug o mejora necesaria.
```

---

## 🎯 Fase 8: Asignación y Respuestas de Formularios

### 8.1 - Página de Asignaciones✅

**Prompt:**
```
Crea la página para asignar formularios a usuarios.

Ubicación: frontend/src/pages/admin/FormAssignments.tsx

Requisitos:
- Seleccionar formulario (Combobox de shadcn/ui)
- Seleccionar usuarios (MultiSelect)
- Configurar frecuencia:
  - DAILY, WEEKLY, BIWEEKLY, MONTHLY, ONCE
- Rango de fechas (inicio y fin)
- Tabla con asignaciones existentes:
  - Formulario
  - Usuario asignado
  - Frecuencia
  - Fechas
  - Estado (Completado/Pendiente)
  - Acciones: Ver, Editar, Eliminar
- Botón "Crear Asignación"
- Usar Form, Select, Calendar de shadcn/ui
- TypeScript estricto
- Comentarios en español

Interface completa de asignaciones
```

### 8.2 - Backend Assignment Controller✅

**Prompt:**
```
Implementa el controlador de asignaciones.

Ubicación: backend/src/controllers/assignmentController.ts
(crear archivo nuevo)

Requisitos:
- createAssignment(req, res):
  1. Validar formId, userId, frequency, dates
  2. Verificar que el formulario esté publicado
  3. Crear FormAssignment en Prisma
  4. Opcional: enviar notificación al usuario
  5. Audit log
- getAssignments(req, res):
  1. Filtros: userId, formId, isCompleted
  2. Incluir relations: form, user
  3. Paginación
- updateAssignment(req, res):
  1. Actualizar fechas o frecuencia
- deleteAssignment(req, res):
  1. Eliminar asignación
- markAsCompleted(req, res):
  1. Actualizar isCompleted = true
- TypeScript estricto
- Comentarios en español

CRUD completo de asignaciones
```

### 8.3 - Rutas de Asignaciones✅

**Prompt:**
```
Crea las rutas para asignaciones.

Ubicación: backend/src/routes/assignment.routes.ts
(crear archivo nuevo)

Requisitos:
- Endpoints:
  - GET /api/assignments
  - GET /api/assignments/:id
  - POST /api/assignments
  - PUT /api/assignments/:id
  - DELETE /api/assignments/:id
  - PUT /api/assignments/:id/complete
- Todas protegidas con authenticate
- POST y DELETE solo para ADMIN o MANAGER
- Importar assignmentController
- Comentarios en español

Registrar rutas en app.ts
```

### 8.4 - Vista de Formulario para Responder✅

**Prompt:**
```
Crea la vista donde el usuario responde el formulario.

Ubicación: frontend/src/pages/FormResponse.tsx

Requisitos:
- Recibir assignmentId por URL
- Cargar formulario y campos
- Renderizar cada campo según su tipo:
  - Inputs controlados con React Hook Form
  - Validaciones según propiedades del campo
  - Componentes de shadcn/ui
- Campo de geolocalización (capturar lat/long automáticamente)
- Botón "Enviar Respuesta"
- Confirmación antes de enviar
- Mostrar éxito y redirigir al dashboard
- Manejo de errores
- TypeScript estricto
- Comentarios en español

Formulario funcional y validado
```

### 8.5 - Captura de Geolocalización✅

**Prompt:**
```
Implementa la captura de geolocalización.

Ubicación: frontend/src/hooks/useGeolocation.ts

Requisitos:
- useGeolocation() retorna:
  - location: { latitude, longitude } | null
  - error: string | null
  - loading: boolean
  - requestLocation()
- Usar Geolocation API del browser
- Manejar permisos denegados
- Timeout de 10 segundos
- Guardar última ubicación en estado
- TypeScript estricto
- Comentarios en español

Hook reutilizable para geolocalización
```

### 8.6 - Envío de Respuestas ✅

**Prompt:**
```
Implementa el endpoint para enviar respuestas.

Ubicación: backend/src/controllers/responseController.ts
(crear archivo nuevo)

Requisitos:
- submitResponse(req, res):
  1. Recibir formId, userId (de auth), data, location
  2. Validar que el usuario tenga asignación activa
  3. Validar estructura de data contra schema del formulario
  4. Crear FormResponse en Prisma
  5. Marcar asignación como completada si es ONCE
  6. Audit log
  7. Opcional: notificar a supervisores
- getResponses(req, res):
  1. Filtros: formId, userId, dateRange
  2. Paginación
  3. Incluir datos del usuario
- getResponse(req, res):
  1. Ver respuesta específica
  2. Incluir geolocalización
- TypeScript estricto
- Comentarios en español

Controller para gestión de respuestas
```

### 8.7 - Rutas de Respuestas✅

**Prompt:**
```
Crea las rutas de respuestas.

Ubicación: backend/src/routes/response.routes.ts
(crear archivo nuevo)

Requisitos:
- Endpoints:
  - POST /api/responses (enviar respuesta)
  - GET /api/responses (listar, con filtros)
  - GET /api/responses/:id (ver una)
  - GET /api/forms/:formId/responses (respuestas de un formulario)
- Todas protegidas con authenticate
- GET puede ser filtrado por rol (supervisores ven solo su equipo)
- Comentarios en español

Registrar en app.ts
```

### 8.8 - Página de Ver Respuestas✅

**Prompt:**
```
Crea la página para ver respuestas de un formulario.

Ubicación: frontend/src/pages/admin/FormResponses.tsx

Requisitos:
- Recibir formId por URL o query
- Header con:
  - Título del formulario
  - Filtros de fecha
  - Exportar a Excel/PDF (placeholder)
- Tabla con respuestas:
  - Usuario que respondió
  - Fecha/hora de envío
  - Ubicación (link a mapa)
  - Botón "Ver detalle"
- Paginación
- Modal/Sheet para ver respuesta completa:
  - Todos los campos y sus respuestas
  - Mapa con ubicación (usar iframe de Google Maps)
- Usar Table, Sheet de shadcn/ui
- TypeScript estricto
- Comentarios en español

Vista completa de respuestas
```

### 8.9 - Probar Flujo de Asignación y Respuesta✅

**Prompt:**
```
Vamos a probar el flujo completo de asignación y respuesta.

Pasos:
1. Como ADMIN, crear una asignación:
   - Formulario: "Inspección de Obra"
   - Usuario: operador de prueba
   - Frecuencia: ONCE
   - Fecha i  nicio: hoy
2. Logout del admin
3. Login como el usuario operador
4. Ver dashboard, debe aparecer el formulario asignado
5. Abrir y responder el formulario
6. Verificar que captura geolocalización
7. Enviar respuesta
8. Logout del operador
9. Login como admin
10. Ver respuestas del formulario
11. Abrir detalle de la respuesta
12. Verificar datos y ubicación

Reporta cualquier error en el flujo.
```

---

## 📊 Fase 9: Dashboard Avanzado y Reportes

### 9.1 - Backend Dashboard Controller Real✅

**Prompt:**
```
Implementa la lógica real del dashboardController.

Ubicación: backend/src/controllers/dashboardController.ts

Requisitos:
- getStats(req, res):
  1. Calcular KPIs:
     - Total formularios activos (status PUBLISHED)
     - Formularios completados hoy/semana
     - Usuarios activos
     - Tasa de completitud (%)
  2. Comparar con periodo anterior
  3. Usar Prisma aggregations
- getFormsCompleted(req, res):
  1. Query params: startDate, endDate, userId
  2. Agrupar respuestas por fecha
  3. Retornar series para gráfico de línea
- getFormsByType(req, res):
  1. Agrupar formularios por algún criterio
  2. Retornar datos para gráfico de barras
- getRecentActivity(req, res):
  1. Últimas 10 acciones del AuditLog
  2. Incluir user relation
  3. Ordenar por fecha desc
- Optimizar queries (usar indexes)
- TypeScript estricto
- Comentarios en español

Dashboard con datos reales de la BD
```

### 9.2 - Integrar Dashboard con Datos Reales✅

**Prompt:**
```
Actualiza la página Dashboard para usar datos reales.

Actualizar: frontend/src/pages/admin/Dashboard.tsx

Requisitos:
- Crear hook useDashboard que llame a los endpoints
- Reemplazar datos dummy por datos del backend
- Agregar selector de rango de fechas:
  - Usar DatePicker de shadcn/ui
  - Al cambiar fecha, refetch datos
- Loading skeletons mientras carga
- Manejo de errores
- Refresh automático cada 30 segundos (opcional)
- Mostrar cambios porcentuales reales
- TypeScript estricto
- Comentarios en español

Dashboard funcional con datos en tiempo real
```

### 9.3 - Página de Reportes✅

**Prompt:**
```
Crea la página de generación de reportes.

Ubicación: frontend/src/pages/admin/Reports.tsx

Requisitos:
- Selector de tipo de reporte:
  - Formularios completados por usuario
  - Formularios por periodo
  - Resumen de obra (por formulario)
  - Reporte de cumplimiento
- Filtros:
  - Rango de fechas
  - Formulario específico
  - Usuario específico
  - Proyecto/Obra
- Botones de exportación:
  - Excel (XLSX)
  - PDF
  - Imprimir
- Preview del reporte en pantalla (tabla/gráficos)
- Usar Card, Select, DatePicker de shadcn/ui
- TypeScript estricto
- Comentarios en español

Interface completa de reportes
```

### 9.4 - Exportación a Excel✅

**Prompt:**
```
Implementa la exportación de reportes a Excel.

Ubicación: frontend/src/utils/exportToExcel.ts

Requisitos:
- Función exportToExcel(data, filename)
- Usar librería: xlsx (instalare si es necesario)
- Pasos:
  1. Crear workbook
  2. Convertir data a worksheet
  3. Aplicar estilos básicos (headers en bold)
  4. Descargar archivo
- Soportar arrays de objetos
- Formatear fechas correctamente
- Ancho de columnas automático
- TypeScript estricto
- Comentarios en español

Utility reutilizable para exportar Excel
```

### 9.5 - Backend Report Controller✅

**Prompt:**
```
Crea el controlador de reportes en el backend.

Ubicación: backend/src/controllers/reportController.ts
(crear archivo nuevo)

Requisitos:
- getCompletionReport(req, res):
  1. Query params: startDate, endDate, userId, formId
  2. Agregar respuestas por usuario/formulario
  3. Calcular tasas de completitud
  4. Retornar data estructurada
- getUserPerformanceReport(req, res):
  1. Rendimiento de usuarios (respuestas, tiempo promedio)
  2. Ranking de usuarios más activos
- getFormAnalyticsReport(req, res):
  1. Analíticas de un formulario específico
  2. Respuestas por campo (si es relevante)
  3. Tendencias temporales
- Queries optimizadas con Prisma
- Caché de reportes pesados (opcional)
- TypeScript estricto
- Comentarios en español

Reports con queries complejas optimizadas
```

### 9.6 - Rutas de Reportes✅

**Prompt:**
```
Crea las rutas de reportes.

Ubicación: backend/src/routes/report.routes.ts
(crear archivo nuevo)

Requisitos:
- Endpoints:
  - GET /api/reports/completion
  - GET /api/reports/user-performance
  - GET /api/reports/form-analytics/:formId
  - GET /api/reports/export/excel (genera y descarga Excel)
  - GET /api/reports/export/pdf (genera y descarga PDF)
- Protegidas con authenticate
- Solo ADMIN y MANAGER pueden acceder
- Comentarios en español

Registrar en app.ts
```

### 9.7 - Gráficos Avanzados‼️

**Prompt:**
```
Crea componentes de gráficos avanzados para reportes.

Ubicación: frontend/src/components/reports/AdvancedCharts.tsx

Requisitos:
- Exportar componentes:
  1. PieChartCard: Gráfico de torta (distribución)
  2. AreaChartCard: Gráfico de área (tendencias)
  3. ComposedChartCard: Combinado (barras + línea)
- Cada uno con props configurables:
  - title, data, colors, legends
- Usar Recharts con ResponsiveContainer
- Tooltips personalizados
- Leyendas interactivas
- Wrapper en Card de shadcn/ui
- Export a imagen (opcional)
- TypeScript con interfaces
- Comentarios en español

Gráficos profesionales y configurables
```

### 9.8 - Probar Sistema de Reportes✅

**Prompt:**
```
Vamos a probar el sistema de reportes completo.

Pasos:
1. Generar datos de prueba (crear varias respuestas con diferentes usuarios)
2. Ir a /admin/reportes
3. Seleccionar tipo de reporte: "Formularios completados por usuario"
4. Seleccionar rango de fechas: última semana
5. Ver preview del reporte en pantalla
6. Exportar a Excel
7. Abrir Excel y verificar datos
8. Probar otros tipos de reportes
9. Verificar que los filtros funcionen
10. Verificar gráficos en reportes

Reporta la calidad de los datos exportados y visualizaciones.
```

---

## 🔔 Fase 10: Notificaciones y Auditoría

### 10.1 - Sistema de Notificaciones Backend✅

**Prompt:**
```
Crea el servicio de notificaciones.

Ubicación: backend/src/services/notificationService.ts

Requisitos:
- Funciones:
  - notifyFormAssigned(userId, formId)
  - notifyFormCompleted(supervisorId, userId, formId)
  - notifyDeadlineApproaching(userId, assignmentId)
- Por ahora: solo crear notificación en tabla (crear modelo Notification)
- Futuro: integrar push notifications
- Estructura de notificación:
  - userId, title, message, type, read, createdAt
- Función markAsRead(notificationId)
- Función getUnreadCount(userId)
- TypeScript estricto
- Comentarios en español

Sistema base de notificaciones
```

### 10.2 - Modelo de Notificaciones en Prisma✅

**Prompt:**
```
Crea el modelo de Notificaciones en Prisma.

Ubicación: backend/prisma/schema.prisma

Requisitos:
- Agregar modelo Notification:
  - id (String, @id, @default(uuid()))
  - userId (String, relation con User)
  - title (String)
  - message (String)
  - type (Enum: FORM_ASSIGNED, FORM_COMPLETED, DEADLINE, SYSTEM)
  - read (Boolean, @default(false))
  - link (String?, para navegar)
  - createdAt (DateTime, @default(now()))
- Indexes: userId, read, createdAt
- Comentarios en español

Después de agregar, ejecutar: npx prisma migrate dev --name add_notifications
```

### 10.3 - Controller de Notificaciones✅

**Prompt:**
```
Crea el controlador de notificaciones.

Ubicación: backend/src/controllers/notificationController.ts
(crear archivo nuevo)

Requisitos:
- getNotifications(req, res):
  1. Obtener notificaciones del usuario autenticado
  2. Query param: read (true/false/all)
  3. Ordenar por fecha desc
  4. Paginación
- markAsRead(req, res):
  1. Actualizar read = true
  2. Solo el dueño puede marcar
- markAllAsRead(req, res):
  1. Marcar todas como leídas
- getUnreadCount(req, res):
  1. Contar no leídas del usuario
- deleteNotification(req, res):
  1. Eliminar notificación
- TypeScript estricto
- Comentarios en español

Controller completo de notificaciones
```

### 10.4 - Rutas de Notificaciones✅

**Prompt:**
```
Crea las rutas de notificaciones.

Ubicación: backend/src/routes/notification.routes.ts
(crear archivo nuevo)

Requisitos:
- Endpoints:
  - GET /api/notifications
  - GET /api/notifications/unread-count
  - PUT /api/notifications/:id/read
  - PUT /api/notifications/read-all
  - DELETE /api/notifications/:id
- Todas protegidas con authenticate
- Comentarios en español

Registrar en app.ts
```

### 10.5 - Componente Bell de Notificaciones✅

**Prompt:**
```
Crea el componente de campana de notificaciones en el header.

Ubicación: frontend/src/components/layout/NotificationBell.tsx

Requisitos:
- Ícono de campana (BellIcon de lucide-react)
- Badge con contador de no leídas
- Al hacer clic: abrir Popover con lista de notificaciones
- Cada notificación muestra:
  - Título
  - Mensaje (truncado)
  - Fecha relativa ("hace 2 horas")
  - Indicador de leída/no leída
  - Botón marcar como leída
  - Click lleva al link si existe
- Footer con "Marcar todas como leídas" y "Ver todas"
- Usar Popover, Badge de shadcn/ui
- Polling cada 30 segundos para actualizar
- TypeScript estricto
- Comentarios en español

Componente interactivo de notificaciones
```

### 10.6 - Hook useNotifications✅

**Prompt:**
```
Crea el hook para gestión de notificaciones.

Ubicación: frontend/src/hooks/useNotifications.ts

Requisitos:
- useNotifications() retorna:
  - notifications: Notification[]
  - unreadCount: number
  - loading: boolean
  - fetchNotifications()
  - markAsRead(id)
  - markAllAsRead()
  - deleteNotification(id)
- Polling automático cada 30 segundos
- Usar api client
- Actualizar estado local después de acciones
- TypeScript estricto
- Comentarios en español

Hook completo con polling
```

### 10.7 - Página de Auditoría✅

**Prompt:**
```
Crea la página de registro de auditoría (logs).

Ubicación: frontend/src/pages/admin/AuditLog.tsx

Requisitos:
- Solo accesible para ADMIN
- Filtros:
  - Usuario
  - Módulo (Auth, Forms, Users, etc.)
  - Acción
  - Rango de fechas
- Tabla con columnas:
  - Fecha/hora
  - Usuario (con avatar)
  - Módulo
  - Acción
  - Detalles (JSON expandible)
  - IP Address
- Paginación robusta (muchos logs)
- Export a CSV
- Usar Table, Select de shadcn/ui
- TypeScript estricto
- Comentarios en español

Vista completa de auditoría
```

### 10.8 - Backend Audit Log✅

**Prompt:**
```
Implementa el helper para crear audit logs automáticamente.

Ubicación: backend/src/utils/auditLog.ts

Requisitos:
- Función createAuditLog(params):
  - userId, action, module, details, req
- Extraer IP y User-Agent del request
- Guardar en Prisma (modelo AuditLog ya existe)
- Usar en todos los controllers importantes:
  - Después de crear/actualizar/eliminar
  - Login/logout
  - Cambios de rol
  - Publicar formularios
- Función middleware auditMiddleware(module, action):
  - Crea log automáticamente después de la acción
- TypeScript estricto
- Comentarios en español

Sistema automático de auditoría
```

### 10.9 - Integrar Audit Logs✅

**Prompt:**
```
Integra audit logs en todos los controllers existentes.

Ubicación: Actualizar controllers creados anteriormente

Requisitos:
- authController: login, register, logout
- userController: create, update, delete, changeRole
- formController: create, update, delete, publish
- assignmentController: create, delete
- responseController: submit
- Llamar createAuditLog después de cada operación exitosa
- Incluir detalles relevantes en el log
- Comentarios en español

Auditoría completa en todas las acciones
```

### 10.10 - Probar Notificaciones y Auditoría

**Prompt:**
```
Vamos a probar el sistema de notificaciones y auditoría.

Pasos:
1. Como ADMIN, asignar un formulario a un usuario
2. Verificar que el usuario recibe notificación
3. Login como ese usuario
4. Ver campana de notificaciones (debe tener badge)
5. Abrir notificaciones
6. Marcar como leída
7. Verificar que el badge se actualiza
8. Como ADMIN, ir a /admin/auditoria
9. Verificar que aparecen los logs:
   - Login
   - Asignación de formulario
   - Marcar notificación como leída
10. Probar filtros de auditoría

Reporta el funcionamiento del sistema de notificaciones y logs.
```

---

## 🎨 Fase 11: Mejoras de UX y PWA

### 11.1 - Dark Mode

**Prompt:**
```
Implementa dark mode en toda la aplicación.

Ubicación: frontend/src/components/theme/ThemeProvider.tsx

Requisitos:
- Crear ThemeProvider con Context
- Usar localStorage para persistir preferencia
- Detectar preferencia del sistema
- Toggle button en header (SunIcon/MoonIcon)
- Actualizar Tailwind config para dark mode
- Aplicar clases dark: en componentes clave
- Smooth transition entre themes
- TypeScript estricto
- Comentarios en español

Dark mode completo y persistente
```

### 11.2 - Loading States y Skeletons

**Prompt:**
```
Crea componentes de skeleton para loading states.

Ubicación: frontend/src/components/ui/skeletons.tsx

Requisitos:
- Componentes reutilizables:
  - TableSkeleton(rows, cols)
  - CardSkeleton()
  - FormSkeleton()
  - DashboardSkeleton()
- Usar Skeleton de shadcn/ui
- Imitar la estructura real del componente
- Animación pulse
- TypeScript con props opcionales
- Comentarios en español

Reemplazar loading spinners por skeletons en páginas clave.
```

### 11.3 - Error Boundaries

**Prompt:**
```
Implementa error boundaries para capturar errores de React.

Ubicación: frontend/src/components/ErrorBoundary.tsx

Requisitos:
- Class component con componentDidCatch
- Mostrar UI amigable cuando hay error
- Botón "Recargar página"
- Logging del error (console o Sentry)
- Envolver App completa
- Envolver secciones críticas individualmente
- TypeScript estricto
- Comentarios en español

Manejo robusto de errores de UI
```

### 11.4 - Página 404

**Prompt:**
```
Crea una página 404 personalizada.

Ubicación: frontend/src/pages/NotFound.tsx

Requisitos:
- Diseño limpio y friendly
- Mensaje: "Página no encontrada"
- Ilustración o imagen 404
- Links útiles:
  - Volver al inicio
  - Ir al dashboard (si está autenticado)
  - Contactar soporte
- Usar Button de shadcn/ui
- Responsive
- Comentarios en español

Agregar ruta catch-all en App.tsx
```

### 11.5 - Configuración de PWA

**Prompt:**
```
Verifica y mejora la configuración PWA.

Ubicación: frontend/vite.config.ts y public/manifest.json

Requisitos:
- Manifest completo:
  - name, short_name, description
  - icons (192x192, 512x512)
  - theme_color, background_color
  - display: standalone
  - start_url
- Service Worker configurado (vite-plugin-pwa)
- Estrategias de cache:
  - Network First para API
  - Cache First para assets
- Offline fallback page
- Actualización automática del SW
- Comentarios en español

PWA instalable y funcional offline
```

### 11.6 - Página Offline

**Prompt:**
```
Crea la página que se muestra cuando no hay conexión.

Ubicación: frontend/src/pages/Offline.tsx

Requisitos:
- Diseño simple con mensaje claro
- Ícono de sin conexión (WifiOffIcon)
- Mensaje: "Sin conexión a Internet"
- Explicar que se mostrará contenido en caché
- Botón "Reintentar conexión"
- Verificar navigator.onLine
- Usar Card, Button de shadcn/ui
- Comentarios en español

Página amigable para modo offline
```

### 11.7 - Optimización de Imágenes

**Prompt:**
```
Optimiza las imágenes de la landing page y aplicación.

Tareas:
1. Generar iconos PWA (192x192, 512x512) con diseño de Collector
2. Convertir imágenes grandes a WebP
3. Implementar lazy loading en imágenes
4. Agregar atributos width/height para evitar layout shift
5. Usar next-gen formats con fallback
6. Comprimir SVGs

Ubicación: frontend/public/icons/ y frontend/public/images/

Herramientas sugeridas: squoosh.app, svgomg.net
```

### 11.8 - Breadcrumbs Dinámicos

**Prompt:**
```
Implementa breadcrumbs dinámicos en el admin layout.

Ubicación: frontend/src/components/layout/Breadcrumbs.tsx

Requisitos:
- Usar useLocation de react-router-dom
- Generar breadcrumbs basados en la ruta actual
- Mapeo de rutas a nombres legibles:
  - /admin/dashboard -> "Dashboard"
  - /admin/formularios -> "Formularios"
  - /admin/usuarios -> "Usuarios"
- Links clickeables (excepto el último)
- Usar Breadcrumb de shadcn/ui
- TypeScript estricto
- Comentarios en español

Integrar en AdminLayout
```

### 11.9 - Tooltips y Ayudas Contextuales

**Prompt:**
```
Agrega tooltips y ayudas contextuales en la UI.

Ubicación: Actualizar componentes existentes

Requisitos:
- Agregar Tooltip de shadcn/ui en:
  - Íconos de acción (editar, eliminar, etc.)
  - Badges de estado
  - Campos de formulario complejos
- Agregar HoverCard con más info en:
  - KPI cards (explicar qué representa)
  - Tipos de campo en form builder
- Usar InfoIcon donde sea necesario explicar algo
- Textos claros y concisos
- Comentarios en español

UI más intuitiva con ayudas visuales
```

### 11.10 - Probar UX y PWA

**Prompt:**
```
Vamos a probar las mejoras de UX y PWA.

Pasos:
1. Probar dark mode:
   - Toggle entre light/dark
   - Verificar que persiste al recargar
   - Verificar todos los componentes se ven bien
2. Probar loading states:
   - Ver skeletons al cargar páginas
   - Verificar que no hay flashes de contenido
3. Probar error handling:
   - Forzar error en componente
   - Verificar error boundary
   - Recargar y recuperarse
4. Probar 404:
   - Navegar a ruta inexistente
   - Verificar página personalizada
5. Probar PWA:
   - Instalar app desde browser
   - Usar en modo standalone
   - Desconectar red
   - Verificar página offline
   - Reconectar y verificar funcionamiento
6. Probar breadcrumbs y tooltips

Reporta la experiencia general de usuario.
```

---

## 🔍 Fase 12: Testing y Calidad

### 12.1 - Setup de Testing en Frontend

**Prompt:**
```
Configura el entorno de testing en el frontend.

Ubicación: frontend/jest.config.js y frontend/src/setupTests.ts

Requisitos:
- Instalar (si no están): jest, @testing-library/react, @testing-library/jest-dom, @testing-library/user-event
- Configurar Jest para TypeScript y JSX
- Configurar Testing Library
- Mocks de:
  - react-router-dom
  - Firebase
  - API client
- Script en package.json: "test": "jest"
- Comentarios en español

Entorno de testing funcional
```

### 12.2 - Tests de Componentes UI

**Prompt:**
```
Crea tests para componentes UI clave.

Ubicación: frontend/src/components/__tests__/

Requisitos:
- Archivos de test:
  - Button.test.tsx
  - Card.test.tsx
  - UserDialog.test.tsx
  - ConfirmDialog.test.tsx
  - NotificationBell.test.tsx
- Probar:
  - Renderizado correcto
  - Props funcionan
  - Eventos (clicks, submit)
  - Estados (loading, error)
- Usar render, screen, fireEvent, waitFor
- Coverage mínimo 70%
- TypeScript estricto
- Comentarios en español

Tests robustos de componentes
```

### 12.3 - Tests de Hooks

**Prompt:**
```
Crea tests para custom hooks.

Ubicación: frontend/src/hooks/__tests__/

Requisitos:
- Archivos de test:
  - useAuth.test.ts
  - useUsers.test.ts
  - useNotifications.test.ts
- Usar renderHook de @testing-library/react
- Mockear API calls
- Probar:
  - Estado inicial
  - Actualización de estado
  - Manejo de errores
  - Side effects
- TypeScript estricto
- Comentarios en español

Tests de hooks con mocks
```

### 12.4 - Tests de Utils

**Prompt:**
```
Crea tests para funciones utility.

Ubicación: frontend/src/utils/__tests__/

Requisitos:
- Archivos de test:
  - exportToExcel.test.ts
  - dateUtils.test.ts (si existe)
  - validators.test.ts (si existe)
- Tests unitarios puros (sin mocks)
- Casos edge:
  - Inputs vacíos
  - Inputs inválidos
  - Inputs límite
- Coverage 100% en utilities
- TypeScript estricto
- Comentarios en español

Tests exhaustivos de utilities
```

### 12.5 - Setup de Testing en Backend

**Prompt:**
```
Configura el entorno de testing en el backend.

Ubicación: backend/jest.config.js y backend/src/setupTests.ts

Requisitos:
- Instalar (si no están): jest, supertest, @types/supertest
- Configurar Jest para TypeScript
- Test database (separada de dev):
  - DATABASE_URL_TEST en .env
  - Script para crear/limpiar DB de test
- Mock de Prisma Client
- Mock de Firebase Admin
- Scripts en package.json:
  - "test": "jest"
  - "test:watch": "jest --watch"
- Comentarios en español

Entorno de testing backend completo
```

### 12.6 - Tests de API Endpoints

**Prompt:**
```
Crea tests de integración para endpoints principales.

Ubicación: backend/src/__tests__/integration/

Requisitos:
- Archivos de test:
  - auth.test.ts (login, register)
  - users.test.ts (CRUD)
  - forms.test.ts (CRUD, publish)
  - responses.test.ts (submit, get)
- Usar supertest
- Mockear Firebase auth
- Usar test database
- Probar:
  - Happy paths
  - Validaciones (errores 400)
  - Autenticación (errores 401/403)
  - No encontrado (404)
- Limpiar DB entre tests
- TypeScript estricto
- Comentarios en español

Tests de integración completos
```

### 12.7 - Tests Unitarios de Services

**Prompt:**
```
Crea tests unitarios para services del backend.

Ubicación: backend/src/services/__tests__/

Requisitos:
- Archivos de test:
  - userService.test.ts
  - formService.test.ts (si existe)
  - notificationService.test.ts
- Mockear Prisma Client completamente
- Probar lógica de negocio aislada
- Casos edge y errores
- Coverage mínimo 80%
- TypeScript estricto
- Comentarios en español

Tests unitarios de lógica de negocio
```

### 12.8 - Linting y Formatting

**Prompt:**
```
Configura ESLint y Prettier en ambos proyectos.

Ubicación: .eslintrc.json y .prettierrc en frontend/ y backend/

Requisitos:
- ESLint con reglas TypeScript estrictas
- Prettier con configuración consistente:
  - Semi: true
  - Single quotes: true
  - Tab width: 2
  - Trailing comma: es5
- Scripts en package.json:
  - "lint": "eslint . --ext .ts,.tsx"
  - "lint:fix": "eslint . --ext .ts,.tsx --fix"
  - "format": "prettier --write \"src/**/*.{ts,tsx}\""
- Pre-commit hook con husky (opcional)
- Comentarios en español

Código consistente y sin errores de estilo
```

### 12.9 - Ejecutar Suite de Tests

**Prompt:**
```
Vamos a ejecutar toda la suite de tests.

Pasos:
1. Frontend tests:
   cd frontend && npm test
2. Verificar coverage:
   npm test -- --coverage
3. Backend tests:
   cd backend && npm test
4. Verificar coverage backend
5. Corregir tests que fallen
6. Alcanzar mínimo:
   - Frontend: 70% coverage
   - Backend: 80% coverage
7. Generar reporte HTML de coverage

Reporta resultados y tests que necesiten mejoras.
```

### 12.10 - CI/CD con GitHub Actions

**Prompt:**
```
Crea workflows de CI/CD para el proyecto.

Ubicación: .github/workflows/

Requisitos:
- Archivo ci.yml:
  - Trigger: push y pull request a develop y main
  - Jobs:
    1. frontend-test: instalar deps, lint, test
    2. backend-test: instalar deps, lint, test, migrations
  - Usar cache para node_modules
  - Reportar coverage
- Archivo deploy.yml:
  - Trigger: push a main
  - Jobs:
    1. deploy-backend: Railway (auto-deploy)
    2. deploy-frontend: Vercel (auto-deploy)
- Usar secrets para env vars
- Notificaciones de fallo (opcional)
- Comentarios en español

CI/CD automatizado completo
```

---

## 📱 Fase 13: Optimización y Performance

### 13.1 - Code Splitting

**Prompt:**
```
Implementa code splitting en el frontend.

Ubicación: frontend/src/App.tsx y rutas

Requisitos:
- Usar React.lazy() para lazy load páginas:
  - Admin pages (Dashboard, Forms, Users, etc.)
  - Landing pages si son grandes
- Suspense con fallback:
  - Loading spinner o skeleton
- Prefetch de rutas críticas
- Analizar bundle con: npm run build && npx vite-bundle-visualizer
- Objetivo: Initial bundle < 200KB gzipped
- Comentarios en español

Bundle optimizado con lazy loading
```

### 13.2 - Optimización de Queries Prisma

**Prompt:**
```
Optimiza las queries de Prisma en el backend.

Ubicación: Revisar todos los controllers y services

Requisitos:
- Usar select para traer solo campos necesarios
- Agregar include solo cuando sea necesario
- Usar findFirst en lugar de findMany cuando se espera uno
- Implementar paginación en todas las listas
- Indexes en schema.prisma para queries frecuentes:
  - User: email, firebaseUid
  - Form: status, createdAt
  - FormResponse: formId + submittedAt, userId + submittedAt
  - AuditLog: userId + createdAt, module + createdAt
- Usar Prisma Studio para verificar query performance
- Comentarios en español

Queries optimizadas y performantes
```

### 13.3 - Implementar Caché

**Prompt:**
```
Implementa caché en endpoints críticos del backend.

Ubicación: backend/src/middleware/cache.ts (crear)

Requisitos:
- Middleware de caché simple:
  - Usar Map o librería node-cache
  - TTL configurable
  - Invalidar caché al update/delete
- Aplicar caché en:
  - GET /api/forms (5 min)
  - GET /api/dashboard/stats (1 min)
  - GET /api/users (2 min)
- Headers de cache-control apropiados
- No cachear datos de usuario específico
- TypeScript estricto
- Comentarios en español

Caché para reducir queries a DB
```

### 13.4 - Optimización de Imágenes y Assets

**Prompt:**
```
Optimiza todos los assets del frontend.

Tareas:
1. Comprimir todas las imágenes (TinyPNG, Squoosh)
2. Generar versiones WebP con fallback
3. Usar srcset para responsive images
4. Lazy loading de imágenes below the fold
5. Preload de assets críticos (fonts, hero image)
6. Minificar SVGs
7. Eliminar assets no usados
8. Verificar con Lighthouse

Objetivo: Performance score > 90
```

### 13.5 - Database Indexing

**Prompt:**
```
Revisa y mejora los indexes de la base de datos.

Ubicación: backend/prisma/schema.prisma

Requisitos:
- Agregar @@index donde sea necesario:
  - Campos usados en WHERE frecuentemente
  - Campos usados en ORDER BY
  - Foreign keys (Prisma los crea automáticamente)
- Composite indexes para queries con múltiples condiciones
- Usar @@unique para constraints
- Evitar over-indexing (penaliza writes)
- Documentar por qué cada index existe
- Comentarios en español

Después, ejecutar: npx prisma migrate dev --name add_indexes
```

### 13.6 - Reducir Rerenders en React

**Prompt:**
```
Optimiza componentes React para reducir rerenders.

Ubicación: Componentes clave del frontend

Requisitos:
- Usar React.memo en:
  - Components que reciben props complejas
  - List items
  - Componentes pesados (gráficos)
- Usar useMemo para:
  - Cálculos costosos
  - Filtrado/mapeo de arrays grandes
  - Objects/arrays como props
- Usar useCallback para:
  - Callbacks pasados a componentes hijos
  - Event handlers en loops
- Instalar React DevTools Profiler
- Identificar componentes que renderizan mucho
- Comentarios en español

React optimizado y performante
```

### 13.7 - Compresión y Minificación

**Prompt:**
```
Configura compresión y minificación en producción.

Ubicación: backend/src/app.ts y vite.config.ts

Requisitos Backend:
- Instalar compression middleware
- Aplicar en producción
- Gzip para responses grandes
- Configurar nginx (Railway) para compression

Requisitos Frontend:
- Vite ya minifica en build
- Verificar que terser está optimizado
- Configurar brotli compression si es posible
- Eliminar console.logs en prod
- Tree shaking habilitado

Verificar con Chrome DevTools Network tab
```

### 13.8 - Lighthouse y Web Vitals

**Prompt:**
```
Ejecuta auditorías de Lighthouse y mejora Web Vitals.

Pasos:
1. Abrir Chrome DevTools > Lighthouse
2. Auditar Landing Page (modo Desktop y Mobile)
3. Auditar Admin Dashboard
4. Enfocarse en:
   - Performance (objetivo > 90)
   - Accessibility (objetivo > 95)
   - Best Practices (objetivo > 90)
   - SEO (objetivo > 90)
5. Implementar mejoras sugeridas:
   - LCP (Largest Contentful Paint < 2.5s)
   - FID (First Input Delay < 100ms)
   - CLS (Cumulative Layout Shift < 0.1)
6. Repetir auditoría

Reporta scores antes y después de optimizaciones.
```

### 13.9 - Monitoreo con Sentry

**Prompt:**
```
Configura Sentry para monitoreo en producción.

Ubicación: backend/src/config/sentry.ts y frontend/src/lib/sentry.ts

Requisitos:
- Crear cuenta en Sentry
- Crear proyectos separados: frontend y backend
- Backend:
  - Capturar excepciones no manejadas
  - Contexto: userId, route, request info
- Frontend:
  - Capturar errores de React
  - ErrorBoundary integrado con Sentry
  - Breadcrumbs de navegación y API calls
- Source maps para debugging
- Release tracking
- Comentarios en español

Monitoreo y alertas en producción
```

### 13.10 - Load Testing

**Prompt:**
```
Realiza load testing del backend.

Herramienta: Apache Bench (ab) o Artillery

Pasos:
1. Instalar artillery: npm install -g artillery
2. Crear scenario: artillery/scenarios.yml
3. Escenarios de test:
   - Login (POST /api/auth/login)
   - Listar formularios (GET /api/forms)
   - Dashboard stats (GET /api/dashboard/stats)
   - Crear respuesta (POST /api/responses)
4. Ejecutar con carga incremental:
   - 10 usuarios/segundo por 1 minuto
   - 50 usuarios/segundo por 1 minuto
   - 100 usuarios/segundo por 30 segundos
5. Métricas a observar:
   - Response time (p95 < 500ms)
   - Error rate (< 1%)
   - Throughput (requests/sec)
6. Identificar bottlenecks

Reporta resultados y áreas de mejora.
```

---

## 🚀 Fase 14: Deploy y Configuración de Producción

### 14.1 - Preparar Backend para Producción

**Prompt:**
```
Prepara el backend para deploy en Railway.

Ubicación: backend/

Requisitos:
- Verificar package.json scripts:
  - "start": "node dist/server.js"
  - "build": "tsc && npx prisma generate"
- Crear railway.json (si es necesario):
  - Build command
  - Start command
  - Health check endpoint
- Variables de entorno en Railway:
  - NODE_ENV=production
  - DATABASE_URL (auto-generada)
  - Todas las vars de Firebase
  - JWT_SECRET (generar uno fuerte)
  - SENTRY_DSN
  - FRONTEND_URL (URL de Vercel)
- Configurar domain personalizado (opcional)
- Comentarios en español

Backend listo para producción
```

### 14.2 - Preparar Frontend para Producción

**Prompt:**
```
Prepara el frontend para deploy en Vercel.

Ubicación: frontend/

Requisitos:
- Verificar package.json scripts:
  - "build": "tsc && vite build"
  - "preview": "vite preview"
- Crear vercel.json:
  - rewrites para SPA routing
  - headers de seguridad
- Variables de entorno en Vercel:
  - Todas las vars VITE_*
  - VITE_API_URL (URL de Railway)
- Configurar domain personalizado
- Preview deployments en PRs
- Comentarios en español

Frontend listo para producción
```

### 14.3 - SSL y HTTPS

**Prompt:**
```
Configura SSL/HTTPS en ambos servicios.

Railway:
- SSL automático, verificar que funcione
- Forzar HTTPS (redirect de HTTP)
- Helmet middleware configurado correctamente

Vercel:
- SSL automático
- Headers de seguridad en vercel.json:
  - X-Frame-Options
  - X-Content-Type-Options
  - Strict-Transport-Security
  - Content-Security-Policy

Verificar con ssllabs.com/ssltest/
```

### 14.4 - Environment Variables Management

**Prompt:**
```
Documenta y organiza las variables de entorno.

Ubicación: Crear .env.example.production

Requisitos:
- Listar TODAS las variables necesarias
- Separar por servicio (backend/frontend)
- Agregar comentarios explicativos
- NO incluir valores reales
- Incluir valores de ejemplo
- Documentar cuáles son opcionales
- Indicar dónde obtener cada valor
- Comentarios en español

Guía completa de configuración
```

### 14.5 - Database Migrations en Producción

**Prompt:**
```
Configura el proceso de migraciones en producción.

Ubicación: backend/

Requisitos:
- Script de deploy que ejecute migraciones:
  - npx prisma migrate deploy
- Railway ejecuta esto en build
- Backup de BD antes de migrar (Railway Pro)
- Rollback strategy:
  - Documentar cómo revertir migración
  - Mantener migraciones backwards compatible
- Seed de datos iniciales si es necesario
- Verificar que todas las migraciones se ejecuten
- Comentarios en español

Migraciones seguras en producción
```

### 14.6 - Health Checks y Monitoring

**Prompt:**
```
Implementa health checks y monitoring.

Ubicación: backend/src/routes/health.routes.ts

Requisitos:
- Endpoint GET /health:
  - Status: ok/error
  - Timestamp
  - Version de la app
  - Check DB connection (Prisma)
  - Uptime
- Endpoint GET /health/ready:
  - Verifica que todos los servicios estén listos
  - Firebase, DB, etc.
- Integrar con Railway health checks
- Logging de health checks fallidos
- TypeScript estricto
- Comentarios en español

Sistema de health checks robusto
```

### 14.7 - Logging en Producción

**Prompt:**
```
Configura logging apropiado para producción.

Ubicación: backend/src/utils/logger.ts

Requisitos:
- Usar librería winston
- Niveles: error, warn, info, debug
- En producción: solo error y warn
- En desarrollo: todos los niveles
- Formato JSON para mejor parsing
- Timestamp en cada log
- Context (userId, requestId, etc.)
- No loggear información sensible
- Integrar con Sentry para errores
- Rotación de logs (si es local)
- TypeScript estricto
- Comentarios en español

Sistema de logging profesional
```

### 14.8 - Backup Strategy

**Prompt:**
```
Define y documenta estrategia de backups.

Ubicación: Documentación (README o docs/BACKUP.md)

Requisitos:
- Database backups:
  - Railway Pro: backups automáticos diarios
  - Alternativa: script de backup manual
  - Retention: 30 días
- Restore procedure:
  - Pasos para restaurar desde backup
  - Testing de restore periódico
- Code backups:
  - Git como source of truth
  - Tags para releases
- Media/uploads (si existieran):
  - Backup de archivos subidos
- Schedule de backups
- Comentarios en español

Plan de backups documentado
```

### 14.9 - Security Hardening

**Prompt:**
```
Aplica hardening de seguridad en producción.

Ubicación: backend/src/app.ts y configuraciones

Requisitos Backend:
- Rate limiting más estricto (50 req/15min)
- CORS solo dominios específicos
- Helmet con todas las opciones
- Deshabilitar X-Powered-By
- Sanitización de inputs
- Validación estricta con Zod
- JWT con expiración corta (1h)
- Refresh token mechanism (opcional)

Requisitos Frontend:
- CSP headers estrictos
- No exponer keys sensibles
- Sanitizar outputs (prevenir XSS)
- HTTPS only cookies
- SameSite cookies

Verificar con: securityheaders.com
```

### 14.10 - Smoke Tests Post-Deploy

**Prompt:**
```
Ejecuta smoke tests después del deploy.

Pasos:
1. Deploy a producción
2. Verificar URLs accesibles:
   - https://collector.example.com (frontend)
   - https://api.collector.example.com/health (backend)
3. Smoke tests manuales:
   - Landing page carga correctamente
   - Login funciona
   - Dashboard carga datos
   - Crear usuario
   - Crear formulario
   - Asignar formulario
   - Responder formulario
   - Ver reportes
   - Notificaciones funcionan
4. Verificar en diferentes browsers:
   - Chrome, Firefox, Safari
   - Mobile browsers
5. Verificar PWA se puede instalar
6. Check performance con Lighthouse

Reporta cualquier issue encontrado en producción.
```

---

## 📚 Fase 15: Documentación Final

### 15.1 - README Principal

**Prompt:**
```
Actualiza el README.md del proyecto.

Ubicación: README.md (raíz)

Requisitos:
- Badge de build status (GitHub Actions)
- Descripción del proyecto
- Screenshots o demo GIF
- Features principales
- Stack tecnológico
- Quick start:
  - Prerequisitos
  - Instalación
  - Configuración
  - Desarrollo
- Scripts disponibles
- Links a documentación detallada
- Contributing guidelines
- Licencia
- Contacto
- En español e inglés (secciones separadas)

README profesional y completo
```

### 15.2 - Documentación de API

**Prompt:**
```
Genera documentación de la API REST.

Ubicación: docs/API.md

Requisitos:
- Usar formato OpenAPI/Swagger (opcional)
- Listar todos los endpoints:
  - Método, path, descripción
  - Request body (JSON schema)
  - Response (ejemplos)
  - Status codes
  - Headers necesarios
- Autenticación:
  - Cómo obtener token
  - Cómo incluir token
- Rate limiting
- Errores comunes
- Ejemplos con cURL
- Postman collection (exportar)
- En español

Documentación completa de la API
```

### 15.3 - Guía de Usuario

**Prompt:**
```
Crea una guía de usuario final.

Ubicación: docs/USER_GUIDE.md

Requisitos:
- Secciones:
  1. Introducción a Collector
  2. Primeros pasos
  3. Gestión de usuarios (para admins)
  4. Constructor de formularios (paso a paso)
  5. Asignación de formularios
  6. Responder formularios (para operadores)
  7. Dashboard y reportes
  8. Notificaciones
  9. Instalación PWA en móvil
  10. Preguntas frecuentes (FAQ)
- Screenshots en cada sección
- Casos de uso reales
- Tips y mejores prácticas
- En español

Guía completa para usuarios no técnicos
```

### 15.4 - Documentación Técnica

**Prompt:**
```
Crea documentación técnica para desarrolladores.

Ubicación: docs/TECHNICAL.md

Requisitos:
- Arquitectura del sistema (diagrama)
- Estructura de carpetas explicada
- Flujo de datos
- Patrones de diseño usados
- Decisiones técnicas importantes
- Database schema (diagrama ERD)
- Autenticación y autorización (flujo)
- Testing strategy
- Performance considerations
- Security measures
- Troubleshooting común
- Cómo contribuir al código
- En español e inglés

Documentación para developers futuros
```

### 15.5 - Changelog

**Prompt:**
```
Inicia el CHANGELOG del proyecto.

Ubicación: CHANGELOG.md

Requisitos:
- Formato Keep a Changelog
- Versión 1.0.0 (primera release)
- Secciones:
  - Added (features nuevas)
  - Changed (cambios en features existentes)
  - Deprecated (features a deprecar)
  - Removed (features removidas)
  - Fixed (bugs arreglados)
  - Security (fixes de seguridad)
- Fecha de release
- Links a issues/PRs si aplica
- Semantic versioning
- En español

Mantener actualizado con cada release
```

### 15.6 - Deployment Guide

**Prompt:**
```
Crea guía completa de deployment.

Ubicación: docs/DEPLOYMENT.md

Requisitos:
- Prerequisites:
  - Cuentas necesarias (Railway, Vercel, Firebase)
  - Herramientas (Node, Git, etc.)
- Paso a paso para Railway (backend):
  - Crear proyecto
  - Conectar repositorio
  - Configurar vars de entorno
  - Deploy inicial
- Paso a paso para Vercel (frontend):
  - Importar proyecto
  - Configurar vars
  - Deploy
- Configurar Firebase Auth
- Configurar dominios personalizados
- CI/CD setup
- Rollback procedure
- Monitoring setup
- En español

Guía completa de 0 a producción
```

### 15.7 - Contributing Guidelines

**Prompt:**
```
Define guidelines para contribuidores.

Ubicación: CONTRIBUTING.md

Requisitos:
- Cómo reportar bugs (template)
- Cómo sugerir features (template)
- Workflow de contribución:
  - Fork del repo
  - Crear branch
  - Commits (conventional commits)
  - Tests
  - PR process
- Code style (lint, format)
- Testing requirements
- Documentación necesaria
- Code review process
- Código de conducta
- En español e inglés

Guidelines claras para contribuidores
```

### 15.8 - Security Policy

**Prompt:**
```
Define política de seguridad.

Ubicación: SECURITY.md

Requisitos:
- Versiones soportadas
- Cómo reportar vulnerabilidades:
  - Canal privado (email)
  - No crear issues públicos
  - Response time esperado
- Security best practices:
  - Mantener dependencias actualizadas
  - Revisar code antes de merge
  - Auditorías periódicas
- Disclosure policy
- Hall of fame (opcional)
- En español e inglés

Política de seguridad clara
```

### 15.9 - Diagramas de Arquitectura

**Prompt:**
```
Crea diagramas de arquitectura del sistema.

Ubicación: docs/diagrams/

Requisitos:
- Usar herramienta: draw.io, Mermaid, o Excalidraw
- Diagramas a crear:
  1. Arquitectura general (frontend, backend, DB, Firebase)
  2. Flujo de autenticación
  3. ERD de la base de datos
  4. Flujo de creación de formulario
  5. Flujo de respuesta a formulario
  6. Arquitectura de componentes frontend
  7. Estructura de carpetas visualizada
- Exportar en PNG y SVG
- Incluir en documentación
- Comentarios en español

Diagramas claros y profesionales
```

### 15.10 - Video Demo (Opcional)

**Prompt:**
```
Graba video demo de la aplicación.

Requisitos:
- Duración: 5-10 minutos
- Secciones:
  1. Intro: qué es Collector (30 seg)
  2. Landing page y features (1 min)
  3. Login y dashboard (1 min)
  4. Crear formulario con drag & drop (2 min)
  5. Asignar formulario (1 min)
  6. Responder formulario (1 min)
  7. Ver respuestas y reportes (2 min)
  8. Features adicionales (1 min)
  9. Instalación PWA (30 seg)
  10. Conclusión (30 seg)
- Calidad HD (1080p)
- Audio claro en español
- Música de fondo sutil
- Subir a YouTube (unlisted o public)
- Agregar link en README

Demo profesional para mostrar el proyecto
```

---

## 🎉 Fase 16: Launch y Post-Launch

### 16.1 - Pre-Launch Checklist

**Prompt:**
```
Crea checklist completo pre-lanzamiento.

Ubicación: docs/PRE_LAUNCH_CHECKLIST.md

Requisitos:
- Funcionalidad:
  - [ ] Todos los features funcionan en prod
  - [ ] Tests pasan (frontend y backend)
  - [ ] No hay errores en consola
  - [ ] Forms validan correctamente
  - [ ] Drag & drop funciona
  - [ ] Notificaciones llegan
  - [ ] Reportes generan
  - [ ] PWA se instala
- Performance:
  - [ ] Lighthouse score > 90
  - [ ] Load time < 3s
  - [ ] No memory leaks
  - [ ] API responses < 500ms
- Seguridad:
  - [ ] HTTPS configurado
  - [ ] Headers de seguridad
  - [ ] Rate limiting activo
  - [ ] Validaciones funcionan
  - [ ] No secrets expuestos
- Documentación:
  - [ ] README actualizado
  - [ ] API docs completos
  - [ ] User guide listo
  - [ ] Deployment guide listo
- Monitoreo:
  - [ ] Sentry configurado
  - [ ] Health checks activos
  - [ ] Logs funcionan
  - [ ] Backups configurados

Verificar TODOS los items antes de launch
```

### 16.2 - Crear Primera Release

**Prompt:**
```
Crea la primera release oficial (v1.0.0).

Pasos:
1. Merge de develop a main
2. Crear tag en Git:
   git tag -a v1.0.0 -m "First production release"
   git push origin v1.0.0
3. Crear Release en GitHub:
   - Título: v1.0.0 - First Production Release
   - Descripción:
     - Features incluidos
     - Breaking changes (ninguno)
     - Known issues
     - Upgrade instructions
   - Adjuntar assets (opcional)
4. Actualizar CHANGELOG.md
5. Deploy automático a producción
6. Anunciar en README con badge de versión

Primera release oficial lista
```

### 16.3 - Configurar Analytics

**Prompt:**
```
Integra analytics para medir uso.

Opciones:
- Google Analytics 4 (GA4)
- Plausible Analytics (privacy-friendly)
- Mixpanel (product analytics)

Ubicación: frontend/src/lib/analytics.ts

Requisitos:
- Respetar privacidad (GDPR)
- Trackear eventos:
  - Page views
  - Login/logout
  - Formulario creado
  - Formulario completado
  - Reporte generado
  - Errores
- No trackear PII
- Opt-out disponible
- Dashboard de métricas
- TypeScript estricto
- Comentarios en español

Analytics para medir éxito del producto
```

### 16.4 - User Feedback System

**Prompt:**
```
Implementa sistema de feedback de usuarios.

Ubicación: frontend/src/components/feedback/FeedbackWidget.tsx

Requisitos:
- Widget flotante (esquina inferior derecha)
- Formulario simple:
  - Tipo: Bug, Feature Request, Pregunta, Otro
  - Descripción (textarea)
  - Email (opcional)
  - Screenshot automático
- Enviar a backend o servicio tercero (Typeform, Google Forms)
- Toast de confirmación
- Usar Sheet o Dialog de shadcn/ui
- TypeScript estricto
- Comentarios en español

Sistema para recoger feedback
```

### 16.5 - Onboarding para Nuevos Usuarios

**Prompt:**
```
Crea flow de onboarding para usuarios nuevos.

Ubicación: frontend/src/components/onboarding/OnboardingTour.tsx

Requisitos:
- Usar librería: react-joyride o crear custom
- Tour guiado en primera visita:
  - Paso 1: Bienvenida
  - Paso 2: Navegación del dashboard
  - Paso 3: Cómo crear formulario
  - Paso 4: Cómo asignar
  - Paso 5: Dónde ver respuestas
- Skip tour option
- Volver a ver tour desde configuración
- Guardar progreso en localStorage
- Tooltips posicionados correctamente
- TypeScript estricto
- Comentarios en español

Onboarding para reducir curva de aprendizaje
```

### 16.6 - Feature Flags

**Prompt:**
```
Implementa sistema de feature flags.

Ubicación: backend/src/utils/featureFlags.ts y frontend

Requisitos:
- Servicio simple de feature flags:
  - Usar variables de entorno inicialmente
  - Futuro: integrar con LaunchDarkly o similar
- Flags a implementar:
  - ENABLE_NOTIFICATIONS (on/off)
  - ENABLE_REPORTS (on/off)
  - ENABLE_DARK_MODE (on/off)
  - ENABLE_NEW_FEATURE (para A/B testing)
- Hook useFeatureFlag(flag) en frontend
- Ocultar features deshabilitadas
- Backend también valida flags
- TypeScript estricto
- Comentarios en español

Feature flags para rollouts graduales
```

### 16.7 - Maintenance Mode

**Prompt:**
```
Implementa modo de mantenimiento.

Ubicación: frontend/src/pages/Maintenance.tsx

Requisitos:
- Página de mantenimiento:
  - Mensaje claro
  - Tiempo estimado de vuelta
  - Status updates (link a status page)
  - Contacto de soporte
- Toggle con variable de entorno:
  - VITE_MAINTENANCE_MODE=true
- Bypass para admins (secret query param)
- Backend retorna 503 si está en mantenimiento
- Usar Card de shadcn/ui
- TypeScript estricto
- Comentarios en español

Modo mantenimiento para deploys mayores
```

### 16.8 - Status Page

**Prompt:**
```
Crea status page pública.

Opciones:
- Usar servicio: statuspage.io, instatus.com
- O crear página estática simple

Ubicación: status.collector.com (subdomain)

Requisitos:
- Status actual: Operational, Degraded, Down
- Componentes monitoreados:
  - Frontend
  - Backend API
  - Base de Datos
  - Autenticación (Firebase)
- Historial de incidentes
- Scheduled maintenance
- Subscribe a updates (email/RSS)
- Auto-update con health checks

Transparencia en el status del sistema
```

### 16.9 - Marketing y Lanzamiento

**Prompt:**
```
Prepara materiales de marketing.

Ubicación: docs/marketing/

Requisitos:
- Landing page optimizada:
  - SEO (meta tags, schema.org)
  - Open Graph para shares
  - Twitter cards
- Materiales gráficos:
  - Logo en diferentes formatos
  - Screenshots para prensa
  - Social media assets
- Comunicado de prensa (opcional)
- Post para blog de Amaranto
- LinkedIn post
- Email a stakeholders
- En español

Materiales para anunciar el lanzamiento
```

### 16.10 - Post-Launch Monitoring

**Prompt:**
```
Monitorea métricas post-lanzamiento.

Métricas a observar (primera semana):
1. Usuarios:
   - Registros
   - Logins diarios
   - Retención día 1, 7
2. Uso:
   - Formularios creados
   - Formularios respondidos
   - Reportes generados
3. Performance:
   - Response times
   - Error rate
   - Uptime
4. Bugs:
   - Errores en Sentry
   - Issues reportados
5. Feedback:
   - Comentarios de usuarios
   - Feature requests

Configurar alertas para métricas críticas.
Reunión diaria de equipo primera semana.

Reporta métricas y insights semanalmente.
```

---

## 🔄 Fase 17: Iteración y Mejoras Continuas

### 17.1 - Roadmap de Producto

**Prompt:**
```
Define roadmap de producto a 3-6 meses.

Ubicación: docs/ROADMAP.md

Requisitos:
- Versión 1.1 (1 mes):
  - [ ] Firma digital mejorada
  - [ ] Export PDF de formularios
  - [ ] Multi-idioma (inglés)
  - [ ] Mejoras de UX sugeridas
- Versión 1.2 (3 meses):
  - [ ] App móvil nativa (opcional)
  - [ ] Integración con sistemas externos
  - [ ] Workflows automáticos
  - [ ] Reportes avanzados (BI)
- Versión 2.0 (6 meses):
  - [ ] Multi-tenant (varias empresas)
  - [ ] Marketplace de plantillas
  - [ ] API pública para integraciones
  - [ ] Machine learning (predictivo)
- Backlog de features
- Criterios de priorización

Roadmap claro y compartido
```

### 17.2 - Recopilar y Priorizar Feedback

**Prompt:**
```
Establece proceso de gestión de feedback.

Sistema:
- Herramienta: GitHub Issues, Linear, o Notion
- Labels:
  - bug, enhancement, question
  - priority: low, medium, high, critical
  - status: triage, accepted, in-progress, done
- Proceso:
  1. User reporta via widget o email
  2. Equipo hace triage semanal
  3. Priorizar usando framework (RICE, MoSCoW)
  4. Asignar a sprint
  5. Implementar y release
  6. Notificar al usuario
- Templates para issues y PRs

Proceso estructurado de mejora continua
```

### 17.3 - A/B Testing Framework

**Prompt:**
```
Implementa framework para A/B testing.

Ubicación: frontend/src/lib/abTesting.ts

Requisitos:
- Sistema simple de variantes:
  - Definir experimentos
  - Asignar usuarios a variantes
  - Persistir asignación
- Ejemplo de experimento:
  - CTA button color (blue vs green)
  - Onboarding flow (con tour vs sin tour)
- Tracking de métricas por variante
- Hook useExperiment(experimentName)
- Integrar con analytics
- TypeScript estricto
- Comentarios en español

Framework para optimización basada en datos
```

### 17.4 - Internacionalización (i18n)

**Prompt:**
```
Prepara la app para múltiples idiomas.

Ubicación: frontend/src/i18n/

Requisitos:
- Instalar react-i18next
- Archivos de traducción:
  - es.json (español, default)
  - en.json (inglés)
- Traducir:
  - UI strings
  - Mensajes de error
  - Emails/notificaciones
  - Documentación clave
- Selector de idioma en settings
- Detectar idioma del browser
- Persistir preferencia
- Backend también preparado para i18n
- TypeScript estricto
- Comentarios en español

App preparada para expansión internacional
```

### 17.5 - Mobile App (Opcional)

**Prompt:**
```
Explora opciones para app móvil nativa.

Opciones:
1. PWA (ya implementado)
   - Pros: sin desarrollo adicional, funciona ya
   - Contras: limitaciones vs app nativa
2. React Native
   - Pros: código compartido con web
   - Contras: requiere desarrollo y mantenimiento
3. Capacitor (Ionic)
   - Pros: reutiliza código web, más fácil
   - Contras: performance menor que nativa

Decisión:
- Empezar con PWA
- Si usuarios piden app, evaluar Capacitor
- Roadmap para v2.0

Documentar decisión y justificación
```

### 17.6 - Performance Budget

**Prompt:**
```
Define y monitorea performance budget.

Ubicación: docs/PERFORMANCE_BUDGET.md

Requisitos:
- Métricas y límites:
  - Initial Load: < 3s
  - Time to Interactive: < 5s
  - First Contentful Paint: < 1.5s
  - Largest Contentful Paint: < 2.5s
  - Total Bundle Size: < 300KB (gzipped)
  - API Response Time (p95): < 500ms
- Monitoreo continuo:
  - CI/CD fails si se exceden límites
  - Lighthouse CI en cada PR
  - RUM (Real User Monitoring) en prod
- Alertas si se degrada performance

Performance como prioridad constante
```

### 17.7 - Accessibility Audit

**Prompt:**
```
Realiza auditoría completa de accesibilidad.

Herramientas:
- axe DevTools
- WAVE
- Lighthouse Accessibility

Checklist WCAG 2.1 AA:
- [ ] Keyboard navigation funciona en toda la app
- [ ] Screen readers pueden usar la app
- [ ] Contraste de colores suficiente
- [ ] Formularios con labels apropiados
- [ ] Imágenes con alt text
- [ ] Focus indicators visibles
- [ ] No solo color para información
- [ ] Formularios accesibles
- [ ] Tablas con headers
- [ ] Skip links

Corregir issues encontrados
Documentar mejoras de accesibilidad
```

### 17.8 - Dependency Updates

**Prompt:**
```
Establece proceso de actualización de dependencias.

Proceso:
1. Renovate Bot o Dependabot (GitHub)
   - Auto-PR para updates menores
   - Revisión manual para updates mayores
2. Schedule:
   - Security patches: inmediato
   - Minor updates: semanal
   - Major updates: mensual (con testing)
3. Testing antes de merge:
   - Tests automatizados pasan
   - Smoke tests manuales
   - No breaking changes
4. Mantener changelog de deps

Configurar Dependabot en .github/dependabot.yml

Dependencias siempre actualizadas y seguras
```

### 17.9 - Technical Debt Management

**Prompt:**
```
Identifica y prioriza technical debt.

Ubicación: docs/TECHNICAL_DEBT.md

Requisitos:
- Listar deuda técnica actual:
  - TODOs en código
  - Workarounds temporales
  - Tests faltantes
  - Refactors necesarios
  - Performance bottlenecks
  - Security concerns
- Priorizar usando matriz impacto/esfuerzo
- Asignar a sprints (20% del tiempo)
- Revisar y actualizar mensualmente
- No acumular más deuda

Gestión proactiva de deuda técnica
```

### 17.10 - Knowledge Transfer

**Prompt:**
```
Prepara materiales para transfer de conocimiento.

Ubicación: docs/KNOWLEDGE_TRANSFER.md

Requisitos:
- Arquitectura explicada (diagramas)
- Patrones de código importantes
- Decisiones técnicas y por qué
- Áreas complejas del código
- Setup de desarrollo paso a paso
- Troubleshooting común
- Contactos y recursos
- Video walkthrough del código (opcional)

Para que nuevos developers puedan contribuir rápido
```

---

## ✅ Checklist Final del Proyecto

```markdown
## Funcionalidad Core
- [ ] Landing page completa y atractiva
- [ ] Sistema de autenticación con Firebase
- [ ] Panel administrativo funcional
- [ ] CRUD de usuarios con roles
- [ ] Constructor de formularios drag & drop (15+ tipos de campo)
- [ ] Sistema de asignaciones de formularios
- [ ] Respuesta a formularios con geolocalización
- [ ] Dashboard con KPIs y gráficos en tiempo real
- [ ] Sistema de reportes con export Excel
- [ ] Notificaciones en tiempo real
- [ ] Registro de auditoría completo

## UX/UI
- [ ] Diseño responsive mobile-first
- [ ] Dark mode implementado
- [ ] Loading states con skeletons
- [ ] Error boundaries y manejo de errores
- [ ] Tooltips y ayudas contextuales
- [ ] Breadcrumbs dinámicos
- [ ] Página 404 personalizada
- [ ] Onboarding para nuevos usuarios

## Performance
- [ ] Code splitting implementado
- [ ] Lazy loading de rutas
- [ ] Imágenes optimizadas (WebP)
- [ ] Bundle < 300KB gzipped
- [ ] Lighthouse score > 90
- [ ] API responses < 500ms
- [ ] Queries Prisma optimizadas
- [ ] Cache implementado
- [ ] Database indexes apropiados

## PWA
- [ ] Service Worker configurado
- [ ] Manifest.json completo
- [ ] Iconos 192x192 y 512x512
- [ ] Offline fallback page
- [ ] Instalable en mobile
- [ ] Update strategy (auto-update)

## Backend
- [ ] API REST completa
- [ ] Validación con Zod en todos los endpoints
- [ ] Autenticación con Firebase Admin
- [ ] Autorización por roles
- [ ] Rate limiting
- [ ] CORS configurado
- [ ] Helmet security headers
- [ ] Error handling robusto
- [ ] Logging con winston
- [ ] Health checks

## Database
- [ ] Prisma schema completo
- [ ] Migraciones aplicadas
- [ ] Seed data
- [ ] Indexes optimizados
- [ ] Backup strategy definida
- [ ] Connection pooling

## Testing
- [ ] Tests unitarios frontend (70%+ coverage)
- [ ] Tests de componentes UI
- [ ] Tests de hooks
- [ ] Tests unitarios backend (80%+ coverage)
- [ ] Tests de integración API
- [ ] Tests de services
- [ ] E2E tests críticos (opcional)
- [ ] Load testing realizado

## Seguridad
- [ ] HTTPS configurado
- [ ] SSL/TLS certificates
- [ ] Security headers
- [ ] Rate limiting activo
- [ ] Input validation completa
- [ ] XSS prevention
- [ ] CSRF protection
- [ ] SQL injection prevention (Prisma)
- [ ] Secrets no expuestos
- [ ] Audit logs de acciones críticas

## Deploy
- [ ] Backend en Railway
- [ ] Frontend en Vercel
- [ ] Database en Railway
- [ ] Firebase configurado
- [ ] Variables de entorno en producción
- [ ] Dominios personalizados (opcional)
- [ ] SSL certificates activos
- [ ] CI/CD con GitHub Actions
- [ ] Auto-deploy en push a main

## Monitoreo
- [ ] Sentry configurado (frontend y backend)
- [ ] Health checks activos
- [ ] Logging en producción
- [ ] Analytics configurado
- [ ] Performance monitoring
- [ ] Error tracking
- [ ] Uptime monitoring
- [ ] Backup automático

## Documentación
- [ ] README completo
- [ ] API documentation
- [ ] User guide
- [ ] Technical documentation
- [ ] Deployment guide
- [ ] CHANGELOG iniciado
- [ ] Contributing guidelines
- [ ] Security policy
- [ ] Diagramas de arquitectura
- [ ] Code comments en español

## Calidad de Código
- [ ] ESLint configurado
- [ ] Prettier configurado
- [ ] TypeScript estricto sin any
- [ ] No console.logs en producción
- [ ] Code review realizado
- [ ] Technical debt documentado
- [ ] Refactoring necesario completado

## Accesibilidad
- [ ] WCAG 2.1 AA compliance
- [ ] Keyboard navigation completa
- [ ] Screen reader compatible
- [ ] Contraste de colores adecuado
- [ ] Alt text en imágenes
- [ ] Labels en formularios
- [ ] Focus indicators visibles

## Legal y Compliance
- [ ] Política de privacidad (si aplica)
- [ ] Términos de servicio (si aplica)
- [ ] GDPR compliance (si aplica)
- [ ] Cookie consent (si aplica)
- [ ] Licencia definida

## Post-Launch
- [ ] Smoke tests en producción pasados
- [ ] Feedback system implementado
- [ ] Analytics configurado
- [ ] Status page configurada
- [ ] Materiales de marketing listos
- [ ] Roadmap de producto definido
- [ ] Proceso de mejora continua establecido
```

---

## 🎓 Apéndice: Tips y Mejores Prácticas

### A1 - Convenciones de Código

**Nombres:**
- Componentes: PascalCase (`UserDialog.tsx`)
- Archivos utils: camelCase (`exportToExcel.ts`)
- Constantes: UPPER_SNAKE_CASE (`MAX_FILE_SIZE`)
- Variables/funciones: camelCase (`getUserById`)
- Interfaces/Types: PascalCase con I prefix opcional (`IUser` o `User`)

**Organización:**
- Agrupar imports: externos, internos, relativos
- Un componente por archivo
- Colocar types/interfaces al inicio del archivo
- Hooks personalizados en carpeta `/hooks`
- Utils puros en carpeta `/utils`

**Comentarios:**
- JSDoc para funciones públicas
- TODO: para trabajo pendiente
- FIXME: para bugs conocidos
- Explicar "por qué" no "qué" hace el código

### A2 - Git Workflow

**Branches:**
```
main (producción)
  └── develop (desarrollo principal)
       ├── feature/user-crud
       ├── feature/form-builder
       ├── fix/login-error
       └── hotfix/critical-bug
```

**Commits:**
```
feat: agregar constructor de formularios
fix: corregir validación de email en login
docs: actualizar README con instrucciones
style: formatear código con prettier
refactor: simplificar lógica de authService
test: agregar tests para userController
chore: actualizar dependencias
```

**Pull Requests:**
- Título descriptivo
- Descripción con contexto
- Screenshots si es UI
- Checklist de testing
- Link a issue relacionado
- Solicitar review a 1-2 personas

### A3 - Debugging Tips

**Frontend:**
- React DevTools para inspeccionar state
- Redux DevTools si usas Redux (no aplica aquí)
- Network tab para ver API calls
- Console para logs temporales (remover después)
- Breakpoints en Chrome DevTools
- React Error Boundary para capturar crashes

**Backend:**
- Console.log estratégico (remover en producción)
- Debugger de VSCode con breakpoints
- Prisma Studio para ver data
- Postman/Thunder Client para probar endpoints
- Logs estructurados con winston
- Sentry para errores en producción

**Database:**
- Prisma Studio visual interface
- SQL queries directas (cuidado en prod)
- Explain analyze para optimizar queries
- Logs de Prisma (habilitar en dev)

### A4 - Performance Tips

**Frontend:**
- Lazy load rutas no críticas
- Memoizar componentes pesados
- Virtualizar listas largas (react-window)
- Debounce de inputs de búsqueda
- Throttle de event handlers (scroll, resize)
- Usar imágenes WebP con fallback
- Preload de assets críticos
- Code splitting por ruta

**Backend:**
- Usar select para traer solo campos necesarios
- Implementar paginación en listas
- Cache de queries frecuentes
- Indexes en campos de búsqueda
- Connection pooling (Prisma lo hace)
- Comprimir responses grandes
- Rate limiting para prevenir abuse

**Database:**
- Indexes en foreign keys
- Indexes en campos de WHERE y ORDER BY
- Evitar N+1 queries (usar include)
- Batch inserts cuando sea posible
- Vacuum y analyze periódico (Postgres)

### A5 - Security Checklist

**Siempre:**
- ✅ Validar todos los inputs
- ✅ Sanitizar outputs (XSS)
- ✅ Usar prepared statements (Prisma lo hace)
- ✅ Rate limiting en APIs
- ✅ HTTPS en producción
- ✅ Strong passwords (min 8, mix chars)
- ✅ JWT con expiración
- ✅ CORS restrictivo
- ✅ Headers de seguridad (Helmet)
- ✅ Logging de acciones críticas

**Nunca:**
- ❌ Confiar en datos del cliente
- ❌ Exponer secrets en código
- ❌ Loggear passwords o tokens
- ❌ Usar eval() o Function()
- ❌ Permitir SQL injection
- ❌ Exponer stack traces en prod
- ❌ Deshabilitar CORS completamente
- ❌ Usar dependencias con vulnerabilidades

### A6 - Troubleshooting Común

**Error: "Cannot find module '@/...'"**
- Verificar tsconfig.json tiene paths configurados
- Verificar vite.config.ts tiene alias
- Reiniciar TS server en VSCode

**Error: Prisma Client no generado**
```bash
cd backend
npx prisma generate
```

**Error: CORS blocked**
- Verificar FRONTEND_URL en backend/.env
- Verificar origin en app.use(cors())
- Incluir credentials: true si usas cookies

**Error: Firebase Auth**
- Verificar credenciales en .env
- Verificar dominio autorizado en Firebase Console
- Verificar APIs habilitadas

**Build falla en Vercel/Railway**
- Verificar todas las env vars están configuradas
- Verificar que package.json tiene scripts correctos
- Ver logs detallados en dashboard

**Tests fallan**
- Verificar mocks están configurados
- Limpiar cache: npm test -- --clearCache
- Verificar imports están correctos

### A7 - Recursos Adicionales

**Documentación Oficial:**
- React: https://react.dev
- TypeScript: https://www.typescriptlang.org/docs
- Prisma: https://www.prisma.io/docs
- Firebase: https://firebase.google.com/docs
- Tailwind: https://tailwindcss.com/docs
- shadcn/ui: https://ui.shadcn.com

**Herramientas Útiles:**
- Excalidraw: diagramas rápidos
- Figma: diseño UI/UX
- Postman: testing de API
- Prisma Studio: visualizar DB
- React DevTools: debugging React
- Lighthouse: performance audit

**Comunidades:**
- Stack Overflow: preguntas técnicas
- Reddit r/reactjs, r/typescript
- Discord de Prisma
- GitHub Discussions

**Cursos (opcional):**
- React: https://react.dev/learn
- TypeScript: https://www.typescriptlang.org/docs/handbook/intro.html
- Node.js: https://nodejs.org/en/docs/guides

### A8 - Mantenimiento Regular

**Diario:**
- Revisar errores en Sentry
- Verificar uptime
- Responder issues urgentes

**Semanal:**
- Revisar PRs pendientes
- Actualizar dependencias menores
- Revisar métricas de uso
- Triage de issues nuevos

**Mensual:**
- Auditoría de seguridad
- Performance review
- Actualizar dependencias mayores
- Revisar technical debt
- Reunión de roadmap

**Trimestral:**
- Backup testing (restore)
- Disaster recovery drill
- Security audit completo
- Revisión de documentación

### A9 - Escalabilidad Futura

**Cuando crecer:**
- Más usuarios: considerar load balancer
- Más data: considerar database sharding
- Más features: considerar microservices
- Más tráfico: considerar CDN
- Más equipos: considerar monorepo tools (Turborepo)

**Optimizaciones avanzadas:**
- Redis para caching
- ElasticSearch para búsquedas
- Queue system (Bull, RabbitMQ)
- CDN para assets (Cloudflare)
- Database read replicas
- Serverless functions para tareas específicas

### A10 - Métricas de Éxito

**Técnicas:**
- Uptime > 99.9%
- P95 response time < 500ms
- Error rate < 0.1%
- Test coverage > 75%
- Lighthouse score > 90
- Zero vulnerabilities críticas

**Producto:**
- DAU/MAU ratio (engagement)
- Feature adoption rate
- User retention D1, D7, D30
- NPS (Net Promoter Score)
- Tiempo de onboarding
- Support tickets resolved

**Negocio:**
- Reducción de tiempo en gestión
- Formularios completados vs asignados
- Satisfacción de usuarios (surveys)
- ROI del sistema

---

## 🎯 Conclusión y Próximos Pasos

Has completado el desarrollo de **Collector Enterprise**, un sistema robusto y profesional de gestión de formularios dinámicos para Amaranto Constructora. 

### Stack Implementado:
- ✅ Frontend: React 18 + TypeScript + Vite + shadcn/ui + Tailwind
- ✅ Backend: Node.js + Express + TypeScript + Prisma
- ✅ Database: PostgreSQL en Railway
- ✅ Auth: Firebase Authentication
- ✅ Deploy: Vercel (Frontend) + Railway (Backend)
- ✅ PWA: Instalable y funcional offline

### Features Principales:
1. **Landing Page** atractiva con información de Amaranto
2. **Autenticación** segura con Firebase
3. **Panel Administrativo** completo con dashboard interactivo
4. **Gestión de Usuarios** con roles y permisos
5. **Constructor de Formularios** drag & drop con 15+ tipos de campo
6. **Sistema de Asignaciones** con frecuencias configurables
7. **Respuesta a Formularios** con geolocalización
8. **Reportes y Analytics** con exportación a Excel
9. **Notificaciones** en tiempo real
10. **Auditoría** completa de acciones

### Calidad y Seguridad:
- Tests con cobertura >75%
- TypeScript estricto en todo el proyecto
- Seguridad con HTTPS, rate limiting, validaciones
- Monitoreo con Sentry
- CI/CD automatizado con GitHub Actions
- Documentación completa

### Próximos Pasos Recomendados:

1. **Semana 1-2 Post-Launch:**
   - Monitorear métricas intensivamente
   - Recoger feedback de usuarios iniciales
   - Fix de bugs urgentes
   - Ajustes de UX basados en uso real

2. **Mes 1-3:**
   - Implementar features de roadmap v1.1
   - Optimizaciones de performance
   - Mejoras de UX
   - Expandir documentación

3. **Mes 3-6:**
   - Features avanzadas (v1.2)
   - Integraciones con sistemas externos
   - Multi-idioma si es necesario
   - Considerar app móvil nativa

4. **Largo Plazo:**
   - Evaluar multi-tenant para otras empresas
   - API pública para integraciones
   - Machine learning para insights
   - Marketplace de plantillas

### Recursos de Soporte:
- 📖 Documentación: `/docs`
- 🐛 Issues: GitHub Issues
- 💬 Soporte: support@amaranto.cl
- 📊 Status: status.collector.com

### Contacto del Equipo:
- **Tech Lead**: [Tu nombre]
- **Product Owner**: [Nombre]
- **Stakeholder**: Amaranto Constructora

---

**¡Felicitaciones por completar este proyecto! 🎉**

El sistema está listo para transformar la gestión operativa de Amaranto y escalar junto con la empresa. Mantén el código limpio, la documentación actualizada, y siempre prioriza la experiencia del usuario.

*"El mejor momento para plantar un árbol fue hace 20 años. El segundo mejor momento es ahora."*

**Happy coding! 🚀**

---

## 📝 Notas Finales sobre esta Guía

Esta guía de prompts ha sido diseñada para:
- ✅ Seguir un flujo lógico y progresivo
- ✅ Ser específica y accionable
- ✅ Incluir todos los detalles técnicos necesarios
- ✅ Respetar las reglas de .cursorrules
- ✅ Estar completamente en español
- ✅ No incluir outputs esperados (solo instrucciones)
- ✅ Ser meticulosa y profesional

**Uso de esta guía:**
1. Sigue los prompts en orden
2. Copia cada prompt a Cursor AI
3. Revisa el código generado
4. Ejecuta tests y verifica funcionamiento
5. Continúa con el siguiente prompt

**Importante:**
- No saltes fases críticas
- Prueba cada feature antes de continuar
- Commitea frecuentemente
- Mantén la documentación actualizada

**Estructura mantenida:**
Cada prompt incluye:
- Ubicación exacta del archivo
- Requisitos técnicos específicos
- Tecnologías a usar
- Patrones a seguir
- Comentarios en español

Esta guía te llevará desde el punto donde el entorno Docker está levantado hasta un producto completo en producción, listo para usuarios reales.

**¡Éxito en el desarrollo de Collector Enterprise!** 🎯# 🚀 Guía de Prompts para Desarrollo - Collector Enterprise
