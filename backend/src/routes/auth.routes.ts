import { Router } from 'express'

import {
  loginUser,
  logoutUser,
  registerUser,
  getCurrentUser,
} from '../controllers/authController'
import { authenticate } from '../middleware/auth'

// Rutas de autenticación para manejar registro, login y sesión de usuarios
const router = Router()

// Registrar un nuevo usuario en la plataforma
router.post('/register', registerUser)

// Iniciar sesión validando el token de Firebase
router.post('/login', loginUser)

// Cerrar sesión (requiere que el usuario esté autenticado)
router.post('/logout', authenticate, logoutUser)

// Obtener información del usuario autenticado
router.get('/me', authenticate, getCurrentUser)

export default router

