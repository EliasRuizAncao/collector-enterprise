# 🏗️ Guía de Desarrollo - Collector Enterprise
## Sistema de Gestión para Amaranto Constructora

---

## 📋 Tabla de Contenidos
1. [Stack Tecnológico](#stack-tecnológico)
2. [Estructura del Proyecto](#estructura-del-proyecto)
3. [Setup Inicial](#setup-inicial)
4. [Base de Datos](#base-de-datos)
5. [Backend](#backend)
6. [Frontend](#frontend)
7. [Docker](#docker)
8. [Variables de Entorno](#variables-de-entorno)
9. [Desarrollo Local](#desarrollo-local)
10. [Deploy](#deploy)

---

## 🚀 Stack Tecnológico

### Frontend
- **Framework**: React 18 + TypeScript + Vite
- **UI Components**: shadcn/ui + Tailwind CSS
- **State Management**: Zustand
- **Routing**: React Router v6
- **Forms**: React Hook Form + Zod
- **Drag & Drop**: dnd-kit
- **Charts**: Recharts
- **Auth**: Firebase Auth
- **PWA**: vite-plugin-pwa
- **HTTP Client**: Axios
- **Testing**: Jest + Testing Library

### Backend
- **Runtime**: Node.js 20+ + TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL (Railway)
- **ORM**: Prisma
- **Validation**: Zod
- **Auth**: Firebase Admin + JWT
- **Error Monitoring**: Sentry
- **Testing**: Jest + Supertest

### DevOps
- **Containerization**: Docker + Docker Compose
- **CI/CD**: GitHub Actions
- **Version Control**: Git + GitFlow
- **Deploy**: Vercel (Frontend) + Railway (Backend + DB)

---

## 📁 Estructura del Proyecto

```
collector-enterprise/
├── .github/
│   └── workflows/
│       ├── frontend-ci.yml
│       ├── backend-ci.yml
│       └── deploy.yml
│
├── frontend/
│   ├── public/
│   │   ├── icons/
│   │   ├── images/
│   │   └── manifest.json
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── ui/              # shadcn components
│   │   │   ├── layout/
│   │   │   ├── forms/
│   │   │   └── dashboard/
│   │   ├── features/
│   │   │   ├── auth/
│   │   │   ├── forms/
│   │   │   ├── users/
│   │   │   ├── dashboard/
│   │   │   └── landing/
│   │   ├── lib/
│   │   │   ├── api.ts
│   │   │   ├── firebase.ts
│   │   │   └── utils.ts
│   │   ├── store/
│   │   │   ├── authStore.ts
│   │   │   ├── formStore.ts
│   │   │   └── userStore.ts
│   │   ├── types/
│   │   ├── hooks/
│   │   ├── pages/
│   │   │   ├── Landing.tsx
│   │   │   ├── About.tsx
│   │   │   ├── Contact.tsx
│   │   │   ├── Login.tsx
│   │   │   └── admin/
│   │   │       ├── Dashboard.tsx
│   │   │       ├── Forms.tsx
│   │   │       ├── FormBuilder.tsx
│   │   │       └── Users.tsx
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── vite-env.d.ts
│   ├── .env.example
│   ├── .eslintrc.json
│   ├── components.json          # shadcn config
│   ├── Dockerfile
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── backend/
│   ├── prisma/
│   │   ├── migrations/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.ts
│   │   │   ├── firebase.ts
│   │   │   └── sentry.ts
│   │   ├── controllers/
│   │   │   ├── authController.ts
│   │   │   ├── formController.ts
│   │   │   ├── userController.ts
│   │   │   └── dashboardController.ts
│   │   ├── middleware/
│   │   │   ├── auth.ts
│   │   │   ├── errorHandler.ts
│   │   │   ├── rateLimiter.ts
│   │   │   └── validator.ts
│   │   ├── routes/
│   │   │   ├── auth.routes.ts
│   │   │   ├── form.routes.ts
│   │   │   ├── user.routes.ts
│   │   │   └── dashboard.routes.ts
│   │   ├── services/
│   │   │   ├── authService.ts
│   │   │   ├── formService.ts
│   │   │   ├── userService.ts
│   │   │   └── notificationService.ts
│   │   ├── types/
│   │   ├── utils/
│   │   ├── validators/
│   │   │   ├── authValidator.ts
│   │   │   ├── formValidator.ts
│   │   │   └── userValidator.ts
│   │   ├── app.ts
│   │   └── server.ts
│   ├── .env.example
│   ├── .eslintrc.json
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
│
├── shared/                      # Tipos compartidos (opcional)
│   ├── types/
│   └── validators/
│
├── .dockerignore
├── .gitignore
├── docker-compose.yml
├── package.json                 # Root package.json
├── README.md
└── turbo.json                   # Si usas Turborepo (opcional)
```

---

## 🔧 Setup Inicial

### 1. Crear el Proyecto

```bash
# Crear carpeta raíz
mkdir collector-enterprise
cd collector-enterprise

# Inicializar Git
git init
git flow init  # Acepta defaults

# Crear package.json raíz
npm init -y
```

### 2. Crear Frontend (Vite + React + TypeScript)

```bash
# Crear app de Vite
npm create vite@latest frontend -- --template react-ts

cd frontend

# Instalar dependencias base
npm install

# Instalar shadcn/ui y Tailwind
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Instalar shadcn/ui CLI
npx shadcn-ui@latest init

# Instalar dependencias principales
npm install \
  react-router-dom \
  zustand \
  react-hook-form \
  @hookform/resolvers \
  zod \
  axios \
  firebase \
  @dnd-kit/core \
  @dnd-kit/sortable \
  recharts \
  lucide-react \
  date-fns \
  clsx \
  tailwind-merge

# Instalar dependencias de desarrollo
npm install -D \
  @types/node \
  vite-plugin-pwa \
  workbox-window \
  @vitejs/plugin-react \
  eslint \
  @typescript-eslint/eslint-plugin \
  @typescript-eslint/parser \
  prettier

# Volver a raíz
cd ..
```

### 3. Crear Backend (Express + TypeScript + Prisma)

```bash
mkdir backend
cd backend

# Inicializar package.json
npm init -y

# Instalar dependencias principales
npm install \
  express \
  cors \
  dotenv \
  helmet \
  express-rate-limit \
  @prisma/client \
  firebase-admin \
  jsonwebtoken \
  bcrypt \
  zod \
  @sentry/node

# Instalar dependencias de desarrollo
npm install -D \
  @types/express \
  @types/cors \
  @types/node \
  @types/jsonwebtoken \
  @types/bcrypt \
  typescript \
  ts-node \
  ts-node-dev \
  prisma \
  eslint \
  @typescript-eslint/eslint-plugin \
  @typescript-eslint/parser \
  jest \
  @types/jest \
  ts-jest \
  supertest \
  @types/supertest

# Inicializar TypeScript
npx tsc --init

# Inicializar Prisma
npx prisma init

cd ..
```

### 4. Configurar Root Package.json

```json
{
  "name": "collector-enterprise",
  "version": "1.0.0",
  "private": true,
  "workspaces": [
    "frontend",
    "backend"
  ],
  "scripts": {
    "dev": "concurrently \"npm run dev:frontend\" \"npm run dev:backend\"",
    "dev:frontend": "cd frontend && npm run dev",
    "dev:backend": "cd backend && npm run dev",
    "build": "npm run build:frontend && npm run build:backend",
    "build:frontend": "cd frontend && npm run build",
    "build:backend": "cd backend && npm run build",
    "docker:up": "docker-compose up -d",
    "docker:down": "docker-compose down",
    "prisma:migrate": "cd backend && npx prisma migrate dev",
    "prisma:studio": "cd backend && npx prisma studio",
    "test": "npm run test:frontend && npm run test:backend",
    "test:frontend": "cd frontend && npm run test",
    "test:backend": "cd backend && npm run test"
  },
  "devDependencies": {
    "concurrently": "^8.2.2"
  }
}
```

---

## 🗄️ Base de Datos

### Prisma Schema (`backend/prisma/schema.prisma`)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  ADMIN
  MANAGER
  SUPERVISOR
  OPERATOR
}

enum FormStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}

enum AssignmentFrequency {
  DAILY
  WEEKLY
  BIWEEKLY
  MONTHLY
  ONCE
}

model User {
  id            String   @id @default(uuid())
  firebaseUid   String   @unique
  email         String   @unique
  name          String
  role          Role     @default(OPERATOR)
  isActive      Boolean  @default(true)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  createdForms  Form[]   @relation("FormCreator")
  assignments   FormAssignment[]
  auditLogs     AuditLog[]
}

model Form {
  id          String     @id @default(uuid())
  title       String
  description String?
  fields      Json       // Array de campos dinámicos
  version     Int        @default(1)
  status      FormStatus @default(DRAFT)
  
  createdById String
  createdBy   User       @relation("FormCreator", fields: [createdById], references: [id])
  
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
  
  assignments FormAssignment[]
  responses   FormResponse[]
  
  @@index([status, createdAt])
}

model FormAssignment {
  id          String              @id @default(uuid())
  formId      String
  userId      String
  frequency   AssignmentFrequency
  startDate   DateTime
  endDate     DateTime?
  isCompleted Boolean             @default(false)
  
  form        Form                @relation(fields: [formId], references: [id], onDelete: Cascade)
  user        User                @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  createdAt   DateTime            @default(now())
  updatedAt   DateTime            @updatedAt
  
  @@unique([formId, userId, startDate])
  @@index([userId, isCompleted])
}

model FormResponse {
  id          String   @id @default(uuid())
  formId      String
  userId      String
  data        Json     // Respuestas del formulario
  latitude    Float?
  longitude   Float?
  submittedAt DateTime @default(now())
  
  form        Form     @relation(fields: [formId], references: [id])
  
  @@index([formId, submittedAt])
  @@index([userId, submittedAt])
}

model AuditLog {
  id          String   @id @default(uuid())
  userId      String
  action      String
  module      String
  details     Json?
  ipAddress   String?
  userAgent   String?
  createdAt   DateTime @default(now())
  
  user        User     @relation(fields: [userId], references: [id])
  
  @@index([userId, createdAt])
  @@index([module, createdAt])
}
```

### Migración Inicial

```bash
cd backend
npx prisma migrate dev --name init
npx prisma generate
```

### Seed Data (`backend/prisma/seed.ts`)

```typescript
import { PrismaClient, Role } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Crear usuario admin por defecto
  const admin = await prisma.user.upsert({
    where: { email: 'admin@amaranto.cl' },
    update: {},
    create: {
      email: 'admin@amaranto.cl',
      firebaseUid: 'admin-seed-uid',
      name: 'Administrador Amaranto',
      role: Role.ADMIN,
    },
  })

  console.log('✅ Admin creado:', admin)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
```

Ejecutar seed:
```bash
cd backend
npx prisma db seed
```

---

## 🔙 Backend

### Configuración TypeScript (`backend/tsconfig.json`)

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### Configuración Principal (`backend/src/app.ts`)

```typescript
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'
import * as Sentry from '@sentry/node'
import rateLimit from 'express-rate-limit'

import authRoutes from './routes/auth.routes'
import formRoutes from './routes/form.routes'
import userRoutes from './routes/user.routes'
import dashboardRoutes from './routes/dashboard.routes'

import { errorHandler } from './middleware/errorHandler'

dotenv.config()

const app = express()

// Sentry (monitoreo de errores)
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
  })
}

// Middleware de seguridad
app.use(helmet())
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}))

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 requests por IP
})
app.use('/api', limiter)

// Body parsing
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Rutas API
app.use('/api/auth', authRoutes)
app.use('/api/forms', formRoutes)
app.use('/api/users', userRoutes)
app.use('/api/dashboard', dashboardRoutes)

// Error handler (debe ser el último middleware)
app.use(errorHandler)

export default app
```

### Server (`backend/src/server.ts`)

```typescript
import app from './app'

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`)
})
```

### Middleware de Autenticación (`backend/src/middleware/auth.ts`)

```typescript
import { Request, Response, NextFunction } from 'express'
import admin from '../config/firebase'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export interface AuthRequest extends Request {
  user?: {
    id: string
    firebaseUid: string
    email: string
    role: string
  }
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.split('Bearer ')[1]

    if (!token) {
      return res.status(401).json({ error: 'No token provided' })
    }

    // Verificar token con Firebase
    const decodedToken = await admin.auth().verifyIdToken(token)

    // Buscar usuario en DB
    const user = await prisma.user.findUnique({
      where: { firebaseUid: decodedToken.uid },
      select: { id: true, firebaseUid: true, email: true, role: true, isActive: true },
    })

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'User not found or inactive' })
    }

    req.user = user
    next()
  } catch (error) {
    console.error('Auth error:', error)
    res.status(401).json({ error: 'Invalid token' })
  }
}

// Middleware para verificar roles
export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    next()
  }
}
```

### Scripts de Package.json (`backend/package.json`)

```json
{
  "scripts": {
    "dev": "ts-node-dev --respawn --transpile-only src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:studio": "prisma studio",
    "prisma:seed": "ts-node prisma/seed.ts",
    "test": "jest",
    "test:watch": "jest --watch",
    "lint": "eslint . --ext .ts"
  }
}
```

---

## 🎨 Frontend

### Configuración Vite (`frontend/vite.config.ts`)

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', 'icons/*.png'],
      manifest: {
        name: 'Collector Enterprise - Amaranto',
        short_name: 'Collector',
        description: 'Sistema de gestión y formularios dinámicos para Amaranto Constructora',
        theme_color: '#0f172a',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: '/icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 300, // 5 minutos
              },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
```

### Configuración Tailwind (`frontend/tailwind.config.js`)

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: 0 },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: 0 },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
```

### Store de Auth con Zustand (`frontend/src/store/authStore.ts`)

```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: string
  email: string
  name: string
  role: string
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  setAuth: (user: User, token: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      setAuth: (user, token) =>
        set({ user, token, isAuthenticated: true }),
      logout: () =>
        set({ user: null, token: null, isAuthenticated: false }),
    }),
    {
      name: 'auth-storage',
    }
  )
)
```

### API Client (`frontend/src/lib/api.ts`)

```typescript
import axios from 'axios'
import { useAuthStore } from '@/store/authStore'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Interceptor para añadir token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Interceptor para manejar errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
```

### Routing Principal (`frontend/src/App.tsx`)

```typescript
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

// Landing Pages
import Landing from '@/pages/Landing'
import About from '@/pages/About'
import Contact from '@/pages/Contact'
import Login from '@/pages/Login'

// Admin Pages
import Dashboard from '@/pages/admin/Dashboard'
import Forms from '@/pages/admin/Forms'
import FormBuilder from '@/pages/admin/FormBuilder'
import Users from '@/pages/admin/Users'

// Layouts
import LandingLayout from '@/components/layout/LandingLayout'
import AdminLayout from '@/components/layout/AdminLayout'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Landing Routes */}
        <Route element={<LandingLayout />}>
          <Route path="/" element={<Landing />} />
          <Route path="/nosotros" element={<About />} />
          <Route path="/contacto" element={<Contact />} />
        </Route>

        {/* Auth Routes */}
        <Route path="/login" element={<Login />} />

        {/* Admin Routes */}
        <Route
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/admin" element={<Navigate to="/admin/dashboard" />} />
          <Route path="/admin/dashboard" element={<Dashboard />} />
          <Route path="/admin/formularios" element={<Forms />} />
          <Route path="/admin/formularios/nuevo" element={<FormBuilder />} />
          <Route path="/admin/formularios/:id" element={<FormBuilder />} />
          <Route path="/admin/usuarios" element={<Users />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
```

---

## 🐳 Docker

### Dockerfile Frontend (`frontend/Dockerfile`)

```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### Nginx Config (`frontend/nginx.conf`)

```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

### Dockerfile Backend (`backend/Dockerfile`)

```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci
RUN npx prisma generate

COPY . .
RUN npm run build

FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY package*.json ./

EXPOSE 3000

CMD ["npm", "start"]
```

### Docker Compose (`docker-compose.yml`)

```yaml
version: '3.8'

services:
  # PostgreSQL (solo para desarrollo local)
  postgres:
    image: postgres:16-alpine
    container_name: collector-db
    restart: unless-stopped
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: collector_dev
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - collector-network

  # Backend
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: collector-backend
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: development
      PORT: 3000
      DATABASE_URL: postgresql://postgres:postgres@postgres:5432/collector_dev
      FRONTEND_URL: http://localhost:5173
    depends_on:
      - postgres
    volumes:
      - ./backend:/app
      - /app/node_modules
    networks:
      - collector-network
    command: npm run dev

  # Frontend
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: collector-frontend
    restart: unless-stopped
    ports:
      - "5173:80"
    environment:
      VITE_API_URL: http://localhost:3000/api
    depends_on:
      - backend
    networks:
      - collector-network

volumes:
  postgres_data:

networks:
  collector-network:
    driver: bridge
```

### .dockerignore (Raíz)

```
node_modules
npm-debug.log
.git
.gitignore
.env
.env.local
dist
build
coverage
.vscode
.idea
*.log
```

---

## 🔐 Variables de Entorno

### Backend `.env.example`

```env
# Server
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:5173

# Database (Railway en producción)
DATABASE_URL=postgresql://user:password@containers-us-west-xxx.railway.app:5432/railway

# Firebase Admin SDK
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-Key-Here\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# Sentry (Monitoreo de errores)
SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx

# Email (opcional, para notificaciones)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=notificaciones@amaranto.cl
SMTP_PASSWORD=your-email-password
```

### Frontend `.env.example`

```env
# API Backend
VITE_API_URL=http://localhost:3000/api

# Firebase Client
VITE_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:xxxxxxxxxxxxx

# App Config
VITE_APP_NAME=Collector Enterprise
VITE_APP_VERSION=1.0.0
```

---

## 💻 Desarrollo Local

### Opción 1: Sin Docker

```bash
# Terminal 1 - Backend
cd backend
npm install
cp .env.example .env
# Editar .env con tus credenciales
npx prisma migrate dev
npx prisma generate
npm run dev

# Terminal 2 - Frontend
cd frontend
npm install
cp .env.example .env
# Editar .env con tus credenciales
npm run dev

# Terminal 3 - Prisma Studio (opcional)
cd backend
npx prisma studio
```

Acceder a:
- Frontend: http://localhost:5173
- Backend: http://localhost:3000
- Prisma Studio: http://localhost:5555

### Opción 2: Con Docker

```bash
# Desde la raíz del proyecto
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Editar los .env

# Levantar todo
docker-compose up -d

# Ver logs
docker-compose logs -f

# Detener todo
docker-compose down
```

### Comandos Útiles

```bash
# Instalar dependencias en todos los proyectos
npm install

# Desarrollo (frontend + backend simultáneos)
npm run dev

# Build de producción
npm run build

# Migraciones de Prisma
npm run prisma:migrate

# Prisma Studio
npm run prisma:studio

# Tests
npm run test

# Docker
npm run docker:up
npm run docker:down

# Linting
cd frontend && npm run lint
cd backend && npm run lint
```

---

## 🚀 Deploy

### Railway (Backend + PostgreSQL)

1. **Crear proyecto en Railway**
   - Conectar con GitHub
   - Importar repositorio `backend/`

2. **PostgreSQL**
   - Añadir servicio "PostgreSQL"
   - Railway genera automáticamente `DATABASE_URL`

3. **Configurar Backend**
   - Root Directory: `backend`
   - Build Command: `npm run build && npx prisma migrate deploy`
   - Start Command: `npm start`

4. **Variables de Entorno**
   Añadir todas las de `.env.example` en Railway Dashboard

### Vercel (Frontend)

1. **Importar proyecto**
   - Conectar con GitHub
   - Root Directory: `frontend`

2. **Build Settings**
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`

3. **Variables de Entorno**
   Añadir todas las de `.env.example` en Vercel Dashboard
   - `VITE_API_URL`: URL del backend en Railway

### GitHub Actions (`.github/workflows/deploy.yml`)

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Railway
        run: |
          echo "Railway auto-deploys on push to main"

  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Vercel
        run: |
          echo "Vercel auto-deploys on push to main"
```

---

## 📦 Componentes shadcn/ui a Instalar

```bash
cd frontend

# Componentes esenciales
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add input
npx shadcn-ui@latest add label
npx shadcn-ui@latest add select
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add table
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add toast
npx shadcn-ui@latest add form
npx shadcn-ui@latest add checkbox
npx shadcn-ui@latest add radio-group
npx shadcn-ui@latest add switch
npx shadcn-ui@latest add textarea
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add alert
npx shadcn-ui@latest add avatar
npx shadcn-ui@latest add calendar
npx shadcn-ui@latest add sheet
npx shadcn-ui@latest add separator
```

---

## 🎨 Estructura de Landing Page

### Página Principal (`frontend/src/pages/Landing.tsx`)

**Secciones:**
1. **Hero Section**
   - Título: "Digitaliza la gestión de tu obra"
   - Subtítulo: "Sistema integral de formularios y reportes para constructoras"
   - CTA: "Solicitar Demo" + "Ver Features"
   - Background: Gradient moderno + imagen de obra

2. **Features Section**
   - Formularios Dinámicos
   - Dashboard en Tiempo Real
   - Gestión de Usuarios
   - Reportes Automatizados
   - Firma Digital
   - App Móvil Integrada

3. **Stats Section**
   - 50-150 trabajadores soportados
   - 3-5 obras simultáneas
   - 10+ años de experiencia (Amaranto)
   - 99.9% uptime

4. **CTA Final**
   - "¿Listo para transformar tu obra?"
   - Formulario de contacto rápido

### Página Nosotros (`frontend/src/pages/About.tsx`)

**Contenido:**
- Historia de Amaranto (10+ años)
- Misión y Visión
- Equipo (opcional)
- Certificaciones y Proyectos destacados

### Página Contacto (`frontend/src/pages/Contact.tsx`)

**Formulario:**
- Nombre
- Email
- Empresa
- Teléfono
- Mensaje
- Integrar con EmailJS o backend para envío

---

## 🔒 Seguridad

### Checklist de Seguridad

**Backend:**
- ✅ Helmet.js para headers de seguridad
- ✅ Rate limiting (100 req/15min)
- ✅ CORS configurado correctamente
- ✅ Validación con Zod en todos los endpoints
- ✅ TLS 1.3 en producción (Railway/Vercel lo manejan)
- ✅ Variables de entorno NUNCA en el código
- ✅ JWT con expiración
- ✅ Sanitización de inputs

**Frontend:**
- ✅ Firebase Auth con reglas de seguridad
- ✅ Token storage en Zustand (persist)
- ✅ Validación client-side con React Hook Form + Zod
- ✅ CSP headers configurados
- ✅ No exponer API keys en el bundle

---

## 🧪 Testing

### Backend Tests (`backend/src/__tests__/auth.test.ts`)

```typescript
import request from 'supertest'
import app from '../app'

describe('Auth API', () => {
  it('should reject request without token', async () => {
    const res = await request(app)
      .get('/api/users')
      .expect(401)
    
    expect(res.body.error).toBe('No token provided')
  })
})
```

### Frontend Tests (`frontend/src/__tests__/Login.test.tsx`)

```typescript
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Login from '@/pages/Login'

describe('Login Page', () => {
  it('should render login form', () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    )
    
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
  })
})
```

---

## 📊 Roadmap de Desarrollo

### Fase 1: Setup (Semana 1)
- ✅ Inicializar proyecto monorepo
- ✅ Configurar Docker
- ✅ Setup Base de Datos en Railway
- ✅ Configurar Firebase Auth
- ✅ Estructura de carpetas
- ✅ CI/CD básico

### Fase 2: Landing + Auth (Semana 2)
- 🎨 Diseño de Landing Page (Hero, Features, Contact)
- 🔐 Login con Firebase
- 📄 Página Nosotros
- 📧 Página Contacto
- 🎨 Responsive design

### Fase 3: Panel Admin Base (Semana 3)
- 📊 Dashboard básico con KPIs dummy
- 👥 CRUD de Usuarios
- 🎨 Layout administrativo
- 🔒 Protección de rutas
- 🎨 Componentes shadcn/ui

### Fase 4: Formularios Dinámicos (Semanas 4-5)
- 🏗️ Constructor drag-and-drop
- 📝 15+ tipos de campos
- 💾 Guardado y versionado
- 📱 Asignación de formularios
- 🔔 Notificaciones push

### Fase 5: Dashboard y Reportes (Semana 6)
- 📊 Dashboard interactivo con Recharts
- 📈 KPIs en tiempo real
- 📑 Generación de reportes
- 📥 Export a PDF/Excel
- ✍️ Firma digital

### Fase 6: Testing y Deploy (Semana 7)
- 🧪 Tests unitarios
- 🧪 Tests de integración
- 🚀 Deploy a producción
- 📊 Monitoreo con Sentry
- 📱 PWA optimizado

---

## 🆘 Troubleshooting

### Error: "Prisma Client not generated"
```bash
cd backend
npx prisma generate
```

### Error: "Module not found: @/..."
Verificar `tsconfig.json` tiene:
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### Error: "CORS blocked"
Verificar en `backend/src/app.ts`:
```typescript
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}))
```

### Error: Firebase Auth
- Verificar credenciales en `.env`
- Verificar que el dominio está autorizado en Firebase Console
- Verificar que las APIs están habilitadas

### Docker no levanta
```bash
# Limpiar todo
docker-compose down -v
docker system prune -a

# Rebuild
docker-compose up --build
```

---

## 📚 Recursos y Documentación

- **React**: https://react.dev
- **TypeScript**: https://www.typescriptlang.org/docs
- **Vite**: https://vitejs.dev
- **shadcn/ui**: https://ui.shadcn.com
- **Tailwind CSS**: https://tailwindcss.com/docs
- **Zustand**: https://docs.pmnd.rs/zustand
- **React Router**: https://reactrouter.com
- **React Hook Form**: https://react-hook-form.com
- **Recharts**: https://recharts.org
- **Prisma**: https://www.prisma.io/docs
- **Express**: https://expressjs.com
- **Firebase**: https://firebase.google.com/docs
- **Railway**: https://docs.railway.app
- **Vercel**: https://vercel.com/docs

---

## 🎯 Datos de Amaranto para el Landing

### Hero Section
**Título:** "Transformamos la gestión de tus proyectos de construcción"

**Subtítulo:** "Con 10+ años de experiencia en el rubro, Amaranto digitaliza la operación de constructoras medianas, optimizando el control de 3 a 5 obras simultáneas con 50-150 trabajadores."

### Stats
- **10+ años** en el mercado
- **50-150** trabajadores gestionados
- **3-5** obras simultáneas
- **25.000 UF** facturación anual promedio

### Nosotros
**Acerca de Amaranto:**
"Amaranto es una constructora mediana especializada en proyectos de edificación residencial y comercial. Con más de una década de experiencia en la región, nos enfocamos en entregar proyectos de calidad, manteniendo altos estándares de seguridad y eficiencia operacional."

**Nuestra Misión:**
"Construir espacios que mejoren la calidad de vida de las personas, utilizando tecnología y procesos innovadores para optimizar cada etapa de nuestros proyectos."

---

## ✅ Checklist Final

### Backend
- [ ] Prisma schema completo
- [ ] Migraciones aplicadas
- [ ] Seed data ejecutado
- [ ] Middleware de auth funcionando
- [ ] CRUD de usuarios
- [ ] CRUD de formularios
- [ ] API de dashboard
- [ ] Error handling con Sentry
- [ ] Tests unitarios
- [ ] Variables de entorno configuradas

### Frontend
- [ ] Landing page (Hero, Features, Stats, CTA)
- [ ] Página Nosotros
- [ ] Página Contacto
- [ ] Login con Firebase
- [ ] Dashboard administrativo
- [ ] CRUD de usuarios (UI)
- [ ] Constructor de formularios drag-and-drop
- [ ] Gestión de formularios
- [ ] Gráficos con Recharts
- [ ] PWA configurado
- [ ] Responsive design
- [ ] Tests unitarios

### DevOps
- [ ] Docker Compose funcionando
- [ ] PostgreSQL en Railway
- [ ] Backend en Railway
- [ ] Frontend en Vercel
- [ ] CI/CD con GitHub Actions
- [ ] Monitoreo con Sentry
- [ ] Variables de entorno en producción

---

**¡Listo para empezar a construir! 🚀**