import { Request, Response, NextFunction } from 'express'
import { Permission } from '@prisma/client'
import { z } from 'zod'

import { AuthRequest } from '@/middleware/auth'
import { PermissionService } from '@/services/permissionService'
import { createAuditLog } from '@/utils/auditLog'

// Schema de validación
const updateUserPermissionsSchema = z.object({
  permissions: z.array(z.nativeEnum(Permission)),
})

/**
 * Obtener permisos de un usuario
 */
export const getUserPermissions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params

    const permissions = await PermissionService.getUserPermissions(userId)

    return res.status(200).json({ permissions })
  } catch (error) {
    console.error('getUserPermissions error:', error)
    next(error)
  }
}

/**
 * Actualizar permisos personalizados de un usuario
 */
export const updateUserPermissions = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const adminUserId = req.user?.id
    if (!adminUserId) {
      return res.status(401).json({ error: 'Usuario no autenticado' })
    }

    const { userId } = req.params
    const data = updateUserPermissionsSchema.parse(req.body)

    await PermissionService.setCustomPermissions(userId, data.permissions)

    await createAuditLog(
      adminUserId,
      'USER_PERMISSIONS_UPDATED',
      {
        targetUserId: userId,
        permissions: data.permissions,
      },
      req,
    )

    const updatedPermissions = await PermissionService.getUserPermissions(userId)

    return res.status(200).json({
      message: 'Permisos actualizados correctamente',
      permissions: updatedPermissions,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Datos inválidos', details: error.errors })
    }
    console.error('updateUserPermissions error:', error)
    next(error)
  }
}

