import { Router } from 'express'

import { authenticate } from '../middleware/auth'
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadNotificationsCount,
  deleteNotificationById,
} from '../controllers/notificationController'

// Rutas protegidas para notificaciones
// Todas requieren autenticación
const router = Router()

// IMPORTANTE: Las rutas específicas deben ir antes de las rutas con parámetros dinámicos
// para evitar que Express interprete "unread-count" o "read-all" como IDs

// Obtener conteo de notificaciones no leídas
// GET /api/notifications/unread-count
router.get('/unread-count', authenticate, getUnreadNotificationsCount)

// Marcar todas las notificaciones como leídas
// PUT /api/notifications/read-all
router.put('/read-all', authenticate, markAllNotificationsAsRead)

// Obtener notificaciones del usuario autenticado
// GET /api/notifications?page=1&limit=20&read=true|false|all&type=FORM_ASSIGNED
router.get('/', authenticate, getNotifications)

// Marcar una notificación como leída
// PUT /api/notifications/:id/read
router.put('/:id/read', authenticate, markNotificationAsRead)

// Eliminar una notificación
// DELETE /api/notifications/:id
router.delete('/:id', authenticate, deleteNotificationById)

export default router

