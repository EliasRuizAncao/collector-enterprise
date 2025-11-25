import { Router } from 'express'
import multer from 'multer'
import { authenticate } from '../middleware/auth'
import { apiKeyAuth } from '../middleware/apiKeyAuth'
import { analyzeEPP, getEPPStatus } from '../controllers/eppController'

const router = Router()

// Configurar multer para recibir imágenes
// El ESP32-CAM puede enviar como multipart/form-data o raw binary
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB máximo
  },
  fileFilter: (req, file, cb) => {
    // Aceptar cualquier tipo de archivo (el ESP32 puede enviar sin Content-Type correcto)
    cb(null, true)
  },
})

// Middleware para manejar raw binary de forma asíncrona
// Lee el stream y responde inmediatamente
const rawImageHandler = (req: any, res: any, next: any) => {
  // Si no es una imagen raw, pasar al siguiente middleware
  const contentType = req.headers['content-type'] || ''
  if (!contentType.includes('image/') && !contentType.includes('application/octet-stream')) {
    return next()
  }

  // Leer el body como stream
  const chunks: Buffer[] = []
  let totalSize = 0
  const maxSize = 10 * 1024 * 1024 // 10MB

  req.on('data', (chunk: Buffer) => {
    totalSize += chunk.length
    if (totalSize > maxSize) {
      req.destroy()
      return res.status(413).json({ error: 'Imagen demasiado grande (máximo 10MB)' })
    }
    chunks.push(chunk)
  })

  req.on('end', () => {
    req.body = Buffer.concat(chunks)
    next()
  })

  req.on('error', (error: Error) => {
    console.error('[epp] Error al leer stream:', error)
    if (!res.headersSent) {
      res.status(400).json({ error: 'Error al recibir imagen' })
    }
  })
}

// POST /api/v1/epp/analyze
// Acepta tanto multipart/form-data como raw binary
// Usa autenticación por API Key (para ESP32-CAM) en lugar de Firebase Auth
// IMPORTANTE: Responde 202 inmediatamente para evitar timeouts
router.post(
  '/analyze',
  apiKeyAuth, // Middleware de API Key en lugar de authenticate
  (req, res, next) => {
    const contentType = req.headers['content-type'] || ''
    
    // Si viene como multipart, usar multer
    if (contentType.includes('multipart/form-data')) {
      return upload.single('image')(req, res, next)
    }
    
    // Para raw binary, responder inmediatamente y leer en background
    if (contentType.includes('image/') || contentType.includes('application/octet-stream')) {
      // Responder 202 inmediatamente (antes de leer todo el body)
      res.status(202).json({
        success: true,
        message: 'Imagen recibida y en proceso de análisis',
        timestamp: new Date().toISOString(),
        note: 'El análisis puede tardar varios segundos. Consulta /api/v1/epp/status para ver los resultados.',
      })

      // Ahora leer el body en background
      const chunks: Buffer[] = []
      let totalSize = 0
      const maxSize = 10 * 1024 * 1024 // 10MB

      req.on('data', (chunk: Buffer) => {
        totalSize += chunk.length
        if (totalSize > maxSize) {
          req.destroy()
          console.error('[epp] Imagen demasiado grande')
          return
        }
        chunks.push(chunk)
      })

      req.on('end', () => {
        req.body = Buffer.concat(chunks)
        // Llamar al controller para procesar
        analyzeEPP(req, res, next).catch((error) => {
          console.error('[epp] Error después de leer body:', error)
        })
      })

      req.on('error', (error: Error) => {
        console.error('[epp] Error al leer stream:', error)
      })

      return // No llamar next() - ya respondimos
    }
    
    // Para otros tipos, usar handler normal
    return rawImageHandler(req, res, next)
  },
  analyzeEPP, // Solo se ejecuta si no es raw binary
)

// GET /api/v1/epp/status
// Mantiene autenticación Firebase para el panel administrativo
router.get('/status', authenticate, getEPPStatus)

export default router

