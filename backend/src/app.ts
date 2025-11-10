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