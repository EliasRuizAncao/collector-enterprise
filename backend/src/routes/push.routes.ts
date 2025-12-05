import { Router } from 'express'
import { authenticate } from '../middleware/auth'
import { subscribeToPush, unsubscribeFromPush } from '../controllers/pushController'

// Rutas para notificaciones push (FCM)
const router = Router()

// Suscribirse a notificaciones push
router.post('/subscribe', authenticate, subscribeToPush)

// Desuscribirse de notificaciones push
router.post('/unsubscribe', authenticate, unsubscribeFromPush)

export default router

