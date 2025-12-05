import { Response, NextFunction } from 'express'
import { Permission } from '@prisma/client'

import { AuthRequest } from './auth'
import { PermissionService } from '@/services/permissionService'

/**
 * Middleware para verificar permisos
 * Uso: checkPermission(Permission.FORMS_CREATE)
 */
export const checkPermission = (permission: Permission) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'No autenticado' })
      }

      const hasPermission = await PermissionService.hasPermission(req.user.id, permission)

      if (!hasPermission) {
        console.warn(
          '[permission] Acceso denegado',
          req.user.email,
          'permiso requerido:',
          permission,
        )
        return res.status(403).json({
          error: 'No tienes permisos para realizar esta acción',
          requiredPermission: permission,
        })
      }

      return next()
    } catch (error) {
      console.error('[permission] Error verificando permiso:', error)
      return res.status(500).json({ error: 'Error al verificar permisos' })
    }
  }
}

/**
 * Middleware para verificar que el usuario tenga al menos uno de los permisos
 * Uso: checkAnyPermission([Permission.FORMS_CREATE, Permission.FORMS_EDIT])
 */
export const checkAnyPermission = (permissions: Permission[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'No autenticado' })
      }

      const hasPermission = await PermissionService.hasAnyPermission(req.user.id, permissions)

      if (!hasPermission) {
        console.warn(
          '[permission] Acceso denegado',
          req.user.email,
          'permisos requeridos (cualquiera):',
          permissions,
        )
        return res.status(403).json({
          error: 'No tienes permisos para realizar esta acción',
          requiredPermissions: permissions,
        })
      }

      return next()
    } catch (error) {
      console.error('[permission] Error verificando permisos:', error)
      return res.status(500).json({ error: 'Error al verificar permisos' })
    }
  }
}

/**
 * Middleware para verificar que el usuario tenga todos los permisos
 * Uso: checkAllPermissions([Permission.FORMS_CREATE, Permission.FORMS_EDIT])
 */
export const checkAllPermissions = (permissions: Permission[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'No autenticado' })
      }

      const hasPermission = await PermissionService.hasAllPermissions(req.user.id, permissions)

      if (!hasPermission) {
        console.warn(
          '[permission] Acceso denegado',
          req.user.email,
          'permisos requeridos (todos):',
          permissions,
        )
        return res.status(403).json({
          error: 'No tienes permisos para realizar esta acción',
          requiredPermissions: permissions,
        })
      }

      return next()
    } catch (error) {
      console.error('[permission] Error verificando permisos:', error)
      return res.status(500).json({ error: 'Error al verificar permisos' })
    }
  }
}

