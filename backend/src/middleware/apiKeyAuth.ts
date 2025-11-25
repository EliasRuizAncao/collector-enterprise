import { Request, Response, NextFunction } from 'express'

/**
 * Middleware de autenticación por API Key para dispositivos IoT (ESP32-CAM)
 * Verifica que el header x-api-key coincida con la variable de entorno AMARANTO_IOT_SECRET
 */
export const apiKeyAuth = (req: Request, res: Response, next: NextFunction) => {
  // Obtener API Key del header (case-insensitive)
  const apiKey = req.headers['x-api-key'] || req.headers['X-API-Key'] || req.headers['X-Api-Key']
  const secretKey = process.env.AMARANTO_IOT_SECRET

  // Verificar que la variable de entorno esté configurada
  if (!secretKey) {
    console.error('[apiKeyAuth] AMARANTO_IOT_SECRET no está configurada en las variables de entorno')
    return res.status(500).json({ 
      error: 'Configuración del servidor incompleta',
      message: 'La autenticación por API Key no está configurada correctamente'
    })
  }

  // Verificar que se proporcionó la API Key
  if (!apiKey) {
    return res.status(401).json({ 
      error: 'API Key no proporcionada',
      message: 'Se requiere el header x-api-key para autenticación'
    })
  }

  // Verificar que la API Key coincida
  if (apiKey !== secretKey) {
    console.warn('[apiKeyAuth] Intento de acceso con API Key inválida desde IP:', req.ip)
    return res.status(403).json({ 
      error: 'API Key inválida',
      message: 'La API Key proporcionada no es válida'
    })
  }

  // Autenticación exitosa
  return next()
}

