import { Response, NextFunction } from 'express'
import { z } from 'zod'
import { PrismaClient } from '@prisma/client'

import { AuthRequest } from '@/middleware/auth'
import { createAuditLog } from '@/utils/auditLog'
import { AUDIT_MODULES } from '@/utils/auditLog'

const prisma = new PrismaClient()

const userIdSchema = z.object({
  id: z.string().uuid('ID de usuario inválido'),
})

const assignSupervisorSchema = z.object({
  supervisorId: z.string().uuid('ID de supervisor inválido'),
})

const removeSupervisorSchema = z.object({
  supervisorId: z.string().uuid('ID de supervisor inválido'),
})

/**
 * Obtiene los superiores de un usuario
 * GET /api/users/:id/supervisors
 */
export const getUserSupervisors = async (req: AuthRequest, res: Response, _next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuario no autenticado' })
    }

    const params = userIdSchema.parse(req.params)

    const supervisors = await prisma.userSupervisor.findMany({
      where: { userId: params.id },
      include: {
        supervisor: {
          select: {
            id: true,
            name: true,
            email: true,
            role: {
              select: {
                id: true,
                name: true,
                displayName: true,
              },
            },
          },
        },
      },
    })

    return res.status(200).json({
      success: true,
      data: supervisors.map((s: { supervisor: any }) => s.supervisor),
    })
  } catch (error) {
    console.error('[userSupervisorController] error in getUserSupervisors', error)

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'ID de usuario inválido',
        details: error.issues,
      })
    }

    return res.status(500).json({
      error: 'Error al obtener superiores',
    })
  }
}

/**
 * Obtiene los subordinados de un usuario
 * GET /api/users/:id/subordinates
 */
export const getUserSubordinates = async (
  req: AuthRequest,
  res: Response,
  _next: NextFunction,
) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuario no autenticado' })
    }

    const params = userIdSchema.parse(req.params)

    const subordinates = await prisma.userSupervisor.findMany({
      where: { supervisorId: params.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: {
              select: {
                id: true,
                name: true,
                displayName: true,
              },
            },
          },
        },
      },
    })

    return res.status(200).json({
      success: true,
      data: subordinates.map((s: { user: any }) => s.user),
    })
  } catch (error) {
    console.error('[userSupervisorController] error in getUserSubordinates', error)

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'ID de usuario inválido',
        details: error.issues,
      })
    }

    return res.status(500).json({
      error: 'Error al obtener subordinados',
    })
  }
}

/**
 * Asigna un superior a un usuario
 * POST /api/users/:id/supervisors
 */
export const assignSupervisor = async (req: AuthRequest, res: Response, _next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuario no autenticado' })
    }

    const params = userIdSchema.parse(req.params)
    const body = assignSupervisorSchema.parse(req.body)

    // Verificar que ambos usuarios existen
    const [user, supervisor] = await Promise.all([
      prisma.user.findUnique({ where: { id: params.id } }),
      prisma.user.findUnique({ where: { id: body.supervisorId } }),
    ])

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' })
    }

    if (!supervisor) {
      return res.status(404).json({ error: 'Supervisor no encontrado' })
    }

    // Verificar que no se está asignando a sí mismo
    if (params.id === body.supervisorId) {
      return res.status(400).json({ error: 'Un usuario no puede ser su propio superior' })
    }

    // Verificar que la relación no existe ya
    const existing = await prisma.userSupervisor.findUnique({
      where: {
        userId_supervisorId: {
          userId: params.id,
          supervisorId: body.supervisorId,
        },
      },
    })

    if (existing) {
      return res.status(400).json({ error: 'El supervisor ya está asignado a este usuario' })
    }

    // Crear la relación
    const relation = await prisma.userSupervisor.create({
      data: {
        userId: params.id,
        supervisorId: body.supervisorId,
      },
      include: {
        supervisor: {
          select: {
            id: true,
            name: true,
            email: true,
            role: {
              select: {
                id: true,
                name: true,
                displayName: true,
              },
            },
          },
        },
      },
    })

    await createAuditLog({
      userId: req.user.id,
      action: 'SUPERVISOR_ASSIGNED',
      module: AUDIT_MODULES.USERS,
      details: {
        userId: params.id,
        supervisorId: body.supervisorId,
      },
      req,
    })

    return res.status(201).json({
      success: true,
      data: relation.supervisor,
      message: 'Superior asignado correctamente',
    })
  } catch (error) {
    console.error('[userSupervisorController] error in assignSupervisor', error)

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Datos inválidos',
        details: error.issues,
      })
    }

    return res.status(500).json({
      error: 'Error al asignar superior',
    })
  }
}

/**
 * Elimina un superior de un usuario
 * DELETE /api/users/:id/supervisors/:supervisorId
 */
export const removeSupervisor = async (req: AuthRequest, res: Response, _next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuario no autenticado' })
    }

    const params = userIdSchema.parse(req.params)
    const supervisorId = z.string().uuid().parse(req.params.supervisorId)

    // Verificar que la relación existe
    const relation = await prisma.userSupervisor.findUnique({
      where: {
        userId_supervisorId: {
          userId: params.id,
          supervisorId,
        },
      },
    })

    if (!relation) {
      return res.status(404).json({ error: 'La relación no existe' })
    }

    // Eliminar la relación
    await prisma.userSupervisor.delete({
      where: {
        userId_supervisorId: {
          userId: params.id,
          supervisorId,
        },
      },
    })

    await createAuditLog({
      userId: req.user.id,
      action: 'SUPERVISOR_REMOVED',
      module: AUDIT_MODULES.USERS,
      details: {
        userId: params.id,
        supervisorId,
      },
      req,
    })

    return res.status(200).json({
      success: true,
      message: 'Superior eliminado correctamente',
    })
  } catch (error) {
    console.error('[userSupervisorController] error in removeSupervisor', error)

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Datos inválidos',
        details: error.issues,
      })
    }

    return res.status(500).json({
      error: 'Error al eliminar superior',
    })
  }
}

