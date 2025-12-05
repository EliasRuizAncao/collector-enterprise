import { Router } from 'express'

import { authenticate } from '../middleware/auth'
import { checkPermission } from '../middleware/permission'
import { Permission } from '@prisma/client'
import {
  getRoles,
  getRole,
  createRole,
  updateRole,
  deleteRole,
  getPermissions,
} from '../controllers/roleController'
import {
  getUserPermissions,
  updateUserPermissions,
} from '../controllers/userPermissionController'

const router = Router()

// Todas las rutas requieren autenticación
router.use(authenticate)

// Obtener todos los permisos disponibles (cualquier usuario autenticado puede verlos)
router.get('/permissions', getPermissions)

// Rutas de roles - Solo usuarios con permisos de gestión de roles
router.get(
  '/roles',
  checkPermission(Permission.ROLES_VIEW),
  getRoles,
)

router.get(
  '/roles/:id',
  checkPermission(Permission.ROLES_VIEW),
  getRole,
)

router.post(
  '/roles',
  checkPermission(Permission.ROLES_CREATE),
  createRole,
)

router.put(
  '/roles/:id',
  checkPermission(Permission.ROLES_EDIT),
  updateRole,
)

router.delete(
  '/roles/:id',
  checkPermission(Permission.ROLES_DELETE),
  deleteRole,
)

// Rutas de permisos de usuario - Solo usuarios con permisos de gestión de permisos
router.get(
  '/users/:userId/permissions',
  checkPermission(Permission.PERMISSIONS_MANAGE),
  getUserPermissions,
)

router.put(
  '/users/:userId/permissions',
  checkPermission(Permission.PERMISSIONS_MANAGE),
  updateUserPermissions,
)

export default router

