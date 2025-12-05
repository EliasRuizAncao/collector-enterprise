import { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { AuthRequest } from '@/middleware/auth'

const subscribeSchema = z.object({
  token: z.string().min(1, 'Token es requerido'),
  platform: z.enum(['ios', 'android', 'web']).optional(),
  userAgent: z.string().optional(),
})

/**
 * POST /api/push/subscribe
 * Suscribe un usuario a notificaciones push
 * Guarda el token FCM asociado al usuario
 */
export const subscribeToPush = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest
    const userId = authReq.user?.id

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' })
    }

    const parsed = subscribeSchema.parse(req.body)

    // TODO: Guardar el token en la base de datos cuando se implemente completamente
    // Por ahora, solo respondemos OK para evitar errores 404
    // En el futuro, se puede crear una tabla PushToken o agregar un campo al modelo User

    console.log(`[push] Usuario ${userId} suscrito a push notifications (${parsed.platform || 'unknown'})`)

    return res.status(200).json({
      message: 'Suscripción a notificaciones push exitosa',
      userId,
      platform: parsed.platform,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Datos inválidos',
        details: error.flatten(),
      })
    }
    console.error('subscribeToPush error:', error)
    next(error)
  }
}

/**
 * POST /api/push/unsubscribe
 * Desuscribe un usuario de notificaciones push
 */
export const unsubscribeFromPush = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest
    const userId = authReq.user?.id

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' })
    }

    // TODO: Eliminar el token de la base de datos cuando se implemente completamente

    console.log(`[push] Usuario ${userId} desuscrito de push notifications`)

    return res.status(200).json({
      message: 'Desuscripción de notificaciones push exitosa',
      userId,
    })
  } catch (error) {
    console.error('unsubscribeFromPush error:', error)
    next(error)
  }
}

