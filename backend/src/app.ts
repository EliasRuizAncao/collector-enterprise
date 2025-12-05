import express from 'express'
import cors, { type CorsOptions } from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'
import * as Sentry from '@sentry/node'
import rateLimit from 'express-rate-limit'

import authRoutes from './routes/auth.routes'
import formRoutes from './routes/form.routes'
import userRoutes from './routes/user.routes'
import dashboardRoutes from './routes/dashboard.routes'
import assignmentRoutes from './routes/assignment.routes'
import responseRoutes from './routes/response.routes'
import searchRoutes from './routes/search.routes'
import eppRoutes from './routes/epp.routes'
import structureRoutes from './routes/structure.routes'
import reportRoutes from './routes/report.routes'
import notificationRoutes from './routes/notification.routes'
import auditLogRoutes from './routes/auditLog.routes'
import roleRoutes from './routes/role.routes'
import warehouseRoutes from './routes/warehouse.routes'
import pushRoutes from './routes/push.routes'

import { errorHandler } from './middleware/errorHandler'
import path from 'path'

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
app.use(helmet({
  crossOriginResourcePolicy: false,
}))
const allowedOrigins = (process.env.FRONTEND_URLS ?? process.env.FRONTEND_URL ?? 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

// Ensure localhost:5173 and 5174 are always allowed for development
const devOrigins = ['http://localhost:5173', 'http://localhost:5174']
devOrigins.forEach(origin => {
  if (!allowedOrigins.includes(origin)) {
    allowedOrigins.push(origin)
  }
})

// En desarrollo, permitir orígenes de la red local (IPs privadas)
const isDevelopment = process.env.NODE_ENV !== 'production'
const localNetworkPattern = /^http:\/\/(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|localhost)/i

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      callback(null, true)
      return
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true)
      return
    }

    // En desarrollo, permitir cualquier origen de la red local
    if (isDevelopment && localNetworkPattern.test(origin)) {
      callback(null, true)
      return
    }

    callback(new Error(`Origin ${origin} is not allowed by CORS`))
  },
  credentials: true,
}

app.use(cors(corsOptions))

// Rate limiting general
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 1000, // 1000 requests por IP (aumentado para desarrollo)
})

// Rate limiting específico para EPP (más permisivo para monitoreo en tiempo real)
const eppLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 120, // 120 requests por minuto (permite polling cada 0.5 segundos)
  message: 'Demasiadas solicitudes al sistema de monitoreo EPP, por favor intente más tarde'
})

app.use('/api', limiter)

// Body parsing
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
// NOTA: No usar express.raw() aquí para /api/v1/epp/analyze
// Lo manejamos manualmente en las rutas para responder inmediatamente

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Servir archivos estáticos de imágenes procesadas
// Usamos path.resolve con __dirname para ser más robustos
const uploadsDir = path.join(__dirname, '..', 'uploads')
const deteccionesDir = path.join(__dirname, '..', 'reconocimiento', 'recibidos', 'detecciones')
const structureDeteccionesDir = path.join(__dirname, '..', 'reconocimiento', 'recibidos', 'detecciones_structure')

console.log('[app] Serving static files from:', uploadsDir)
console.log('[app] Serving static files from:', deteccionesDir)

app.use('/static/epp-images', express.static(deteccionesDir))
app.use('/static/epp-images', express.static(uploadsDir))
app.use('/static/structure-images', express.static(structureDeteccionesDir))
app.use('/static/uploads', express.static(uploadsDir))

// Rutas API
app.use('/api/auth', authRoutes)
app.use('/api/forms', formRoutes)
app.use('/api/users', userRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/assignments', assignmentRoutes)
app.use('/api/responses', responseRoutes) // Ruta principal para respuestas
app.use('/api/form-responses', responseRoutes) // Mantener compatibilidad
app.use('/api/search', searchRoutes) // Búsqueda global
app.use('/api/reports', reportRoutes) // Reportes (solo ADMIN y MANAGER)
app.use('/api/v1/epp', eppLimiter, eppRoutes) // Rutas de EPP con rate limiter específico
app.use('/api/v1/structure', structureRoutes) // Rutas de Estructura
app.use('/api/notifications', notificationRoutes) // Notificaciones
app.use('/api/audit-logs', auditLogRoutes) // Logs de auditoría (solo ADMIN)
app.use('/api', roleRoutes) // Gestión de roles y permisos
app.use('/api/warehouse', warehouseRoutes) // Gestión de bodega y solicitudes
app.use('/api/push', pushRoutes) // Notificaciones push (FCM)

// Error handler (debe ser el último middleware)
app.use(errorHandler)

export default app