import { Router } from 'express'

import { authenticate, authorize } from '../middleware/auth'
import {
  listUsers,
  getUserById,
  createUser,
  updateUser,
  deactivateUser,
  changeUserRole,
} from '../controllers/userController'

// Rutas protegidas para la administración de usuarios
const router = Router()

// Listar usuarios con paginación
router.get('/', authenticate, authorize('ADMIN', 'MANAGER'), listUsers)

// Obtener detalle de un usuario específico
router.get('/:id', authenticate, authorize('ADMIN', 'MANAGER'), getUserById)

// Crear un nuevo usuario (solo ADMIN)
router.post('/', authenticate, authorize('ADMIN'), createUser)

// Actualizar datos de un usuario
router.put('/:id', authenticate, authorize('ADMIN', 'MANAGER'), updateUser)

// Desactivar usuario (soft delete)
router.delete('/:id', authenticate, authorize('ADMIN'), deactivateUser)

// Cambiar rol de un usuario (solo ADMIN)
router.put('/:id/role', authenticate, authorize('ADMIN'), changeUserRole)

export default router

