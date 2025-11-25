import { Response, NextFunction } from 'express'
import { z } from 'zod'
import { NotificationType } from '@prisma/client'

import { AuthRequest } from '@/middleware/auth'
import {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  deleteNotification,
} from '@/services/notificationService'

// Schema de validación para query params de getNotifications
const getNotificationsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  read: z
    .enum(['true', 'false', 'all'])
    .optional()
    .default('all')
    .transform((value) => {
      if (value === 'true') return true
      if (value === 'false') return false
      return undefined // 'all' o undefined
    }),
  type: z.nativeEnum(NotificationType).optional(),
})

// Schema de validación para parámetros de ruta
const notificationIdSchema = z.object({
  id: z.string().uuid('ID de notificación inválido'),
})

/**
 * Obtiene las notificaciones del usuario autenticado
 * GET /api/notifications
 * Query params: page, limit, read (true/false/all), type
 */
export const getNotifications = async (
  req: AuthRequest,
  res: Response,
  _next: NextFunction,
) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuario no autenticado' })
    }

    // Validar query params
    const query = getNotificationsQuerySchema.parse(req.query)

    // Obtener notificaciones del servicio
    const result = await getUserNotifications(req.user.id, {
      page: query.page,
      limit: query.limit,
      read: query.read,
      type: query.type,
    })

    return res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    })
  } catch (error) {
    console.error('[notificationController] error in getNotifications', error)

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Parámetros inválidos',
        details: error.errors,
      })
    }

    return res.status(500).json({
      error: 'Error al obtener notificaciones',
    })
  }
}

/**
 * Marca una notificación como leída
 * PUT /api/notifications/:id/read
 * Solo el dueño puede marcar su notificación como leída
 */
export const markNotificationAsRead = async (
  req: AuthRequest,
  res: Response,
  _next: NextFunction,
) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuario no autenticado' })
    }

    // Validar parámetros de ruta
    const params = notificationIdSchema.parse(req.params)

    // Marcar como leída (el servicio verifica existencia y propiedad)
    const updated = await markAsRead(params.id, req.user.id)

  } catch (error) {
    console.error('[notificationController] error in markNotificationAsRead', error)

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'ID de notificación inválido',
        details: error.errors,
      })
    }

    if (error instanceof Error) {
      if (error.message === 'NOTIFICATION_NOT_FOUND') {
        return res.status(404).json({
          error: 'Notificación no encontrada',
        })
      }

      if (error.message === 'NOTIFICATION_NOT_BELONGS_TO_USER') {
        return res.status(403).json({
          error: 'No tienes permiso para marcar esta notificación como leída',
        })
      }
    }

    return res.status(500).json({
      error: 'Error al marcar notificación como leída',
    })
  }
}

/**
 * Marca todas las notificaciones del usuario como leídas
 * PUT /api/notifications/read-all
 */
export const markAllNotificationsAsRead = async (
  req: AuthRequest,
  res: Response,
  _next: NextFunction,
) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuario no autenticado' })
    }

    // Marcar todas como leídas
    const result = await markAllAsRead(req.user.id)

    return res.status(200).json({
      success: true,
      message: `${result.count} notificación${result.count !== 1 ? 'es' : ''} marcada${result.count !== 1 ? 's' : ''} como leída${result.count !== 1 ? 's' : ''}`,
      count: result.count,
    })
  } catch (error) {
    console.error('[notificationController] error in markAllNotificationsAsRead', error)

    if (error instanceof Error) {
      if (error.message === 'USER_NOT_FOUND') {
        return res.status(404).json({
          error: 'Usuario no encontrado',
        })
      }
    }

    return res.status(500).json({
      error: 'Error al marcar todas las notificaciones como leídas',
    })
  }
}

/**
 * Obtiene el conteo de notificaciones no leídas del usuario
 * GET /api/notifications/unread-count
 */
export const getUnreadNotificationsCount = async (
  req: AuthRequest,
  res: Response,
  _next: NextFunction,
) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuario no autenticado' })
    }

    // Obtener conteo de no leídas
    const count = await getUnreadCount(req.user.id)

    return res.status(200).json({
      success: true,
      count,
    })
  } catch (error) {
    console.error('[notificationController] error in getUnreadNotificationsCount', error)

    if (error instanceof Error) {
      if (error.message === 'USER_NOT_FOUND') {
        return res.status(404).json({
          error: 'Usuario no encontrado',
        })
      }
    }

    return res.status(500).json({
      error: 'Error al obtener conteo de notificaciones no leídas',
    })
  }
}

/**
 * Elimina una notificación
 * DELETE /api/notifications/:id
 * Solo el dueño puede eliminar su notificación
 */
export const deleteNotificationById = async (
  req: AuthRequest,
  res: Response,
  _next: NextFunction,
) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuario no autenticado' })
    }

    // Validar parámetros de ruta
    const params = notificationIdSchema.parse(req.params)

    // Eliminar notificación (el servicio verifica que pertenezca al usuario)
    await deleteNotification(params.id, req.user.id)

    return res.status(200).json({
      success: true,
      message: 'Notificación eliminada correctamente',
    })
  } catch (error) {
    console.error('[notificationController] error in deleteNotificationById', error)

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'ID de notificación inválido',
        details: error.errors,
      })
    }

    if (error instanceof Error) {
      if (error.message === 'NOTIFICATION_NOT_FOUND') {
        return res.status(404).json({
          error: 'Notificación no encontrada',
        })
      }

      if (error.message === 'NOTIFICATION_NOT_BELONGS_TO_USER') {
        return res.status(403).json({
          error: 'No tienes permiso para eliminar esta notificación',
        })
      }
    }

    return res.status(500).json({
      error: 'Error al eliminar notificación',
    })
  }
}

