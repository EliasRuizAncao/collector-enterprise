import { Request, Response, NextFunction } from 'express'
import { PrismaClient, Permission } from '@prisma/client'
import { z } from 'zod'

import { AuthRequest } from '@/middleware/auth'
import { createAuditLog } from '@/utils/auditLog'

const prisma = new PrismaClient()

// Schemas de validación
const createRoleSchema = z.object({
  name: z.string().min(1).max(50),
  displayName: z.string().min(1).max(100),
  description: z.string().optional(),
  permissions: z.array(z.nativeEnum(Permission)),
})

const updateRoleSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  permissions: z.array(z.nativeEnum(Permission)).optional(),
})

/**
 * Listar todos los roles
 */
export const getRoles = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const roles = await prisma.role.findMany({
      include: {
        _count: {
          select: {
            users: true,
          },
        },
      },
      orderBy: [
        { isSystem: 'desc' }, // Roles del sistema primero
        { displayName: 'asc' },
      ],
    })

    return res.status(200).json(roles)
  } catch (error) {
    console.error('getRoles error:', error)
    next(error)
  }
}

/**
 * Obtener un rol por ID
 */
export const getRole = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params

    const role = await prisma.role.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
          },
        },
      },
    })

    if (!role) {
      return res.status(404).json({ error: 'Rol no encontrado' })
    }

    return res.status(200).json(role)
  } catch (error) {
    console.error('getRole error:', error)
    next(error)
  }
}

/**
 * Crear un nuevo rol
 */
export const createRole = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' })
    }

    const data = createRoleSchema.parse(req.body)

    // Verificar que el nombre no exista
    const existingRole = await prisma.role.findUnique({
      where: { name: data.name },
    })

    if (existingRole) {
      return res.status(400).json({ error: 'Ya existe un rol con ese nombre' })
    }

    const role = await prisma.role.create({
      data: {
        name: data.name,
        displayName: data.displayName,
        description: data.description,
        permissions: {
          set: data.permissions,
        },
        isSystem: false,
      },
    })

    await createAuditLog(
      userId,
      'ROLE_CREATED',
      {
        roleId: role.id,
        roleName: role.name,
        permissions: data.permissions,
      },
      req,
    )

    return res.status(201).json(role)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Datos inválidos', details: error.errors })
    }
    console.error('createRole error:', error)
    next(error)
  }
}

/**
 * Actualizar un rol
 */
export const updateRole = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' })
    }

    const { id } = req.params
    const data = updateRoleSchema.parse(req.body)

    const existingRole = await prisma.role.findUnique({
      where: { id },
    })

    if (!existingRole) {
      return res.status(404).json({ error: 'Rol no encontrado' })
    }

    // No permitir modificar roles del sistema (excepto permisos)
    if (existingRole.isSystem && data.displayName && data.displayName !== existingRole.displayName) {
      return res.status(400).json({ error: 'No se puede modificar el nombre de un rol del sistema' })
    }

    const updateData: any = {}
    if (data.displayName) updateData.displayName = data.displayName
    if (data.description !== undefined) updateData.description = data.description
    if (data.permissions) {
      updateData.permissions = { set: data.permissions }
    }

    const role = await prisma.role.update({
      where: { id },
      data: updateData,
    })

    await createAuditLog(
      userId,
      'ROLE_UPDATED',
      {
        roleId: role.id,
        roleName: role.name,
        changes: data,
      },
      req,
    )

    return res.status(200).json(role)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Datos inválidos', details: error.errors })
    }
    console.error('updateRole error:', error)
    next(error)
  }
}

/**
 * Eliminar un rol
 */
export const deleteRole = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' })
    }

    const { id } = req.params

    const existingRole = await prisma.role.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
          },
        },
      },
    })

    if (!existingRole) {
      return res.status(404).json({ error: 'Rol no encontrado' })
    }

    // No permitir eliminar roles del sistema
    if (existingRole.isSystem) {
      return res.status(400).json({ error: 'No se puede eliminar un rol del sistema' })
    }

    // No permitir eliminar si tiene usuarios asignados
    if (existingRole._count.users > 0) {
      return res.status(400).json({
        error: 'No se puede eliminar un rol que tiene usuarios asignados',
        userCount: existingRole._count.users,
      })
    }

    await prisma.role.delete({
      where: { id },
    })

    await createAuditLog(
      userId,
      'ROLE_DELETED',
      {
        roleId: id,
        roleName: existingRole.name,
      },
      req,
    )

    return res.status(200).json({ message: 'Rol eliminado correctamente' })
  } catch (error) {
    console.error('deleteRole error:', error)
    next(error)
  }
}

/**
 * Obtener todos los permisos disponibles
 */
export const getPermissions = async (req: Request, res: Response) => {
  try {
    const permissions = Object.values(Permission)
    return res.status(200).json(permissions)
  } catch (error) {
    console.error('getPermissions error:', error)
    return res.status(500).json({ error: 'Error al obtener permisos' })
  }
}

