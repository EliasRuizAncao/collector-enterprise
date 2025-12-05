import { Request, Response, NextFunction } from 'express'
import { PrismaClient, Prisma, FormStatus, AssignmentFrequency } from '@prisma/client'
import { z } from 'zod'

import { AuthRequest } from '@/middleware/auth'
import {
  createAssignmentsSchema,
  updateAssignmentSchema,
  listAssignmentsQuerySchema,
} from '@/validators/assignmentValidator'

const prisma = new PrismaClient()
const ASSIGNMENTS_MODULE = 'ASSIGNMENTS'

/**
 * Helper para obtener user agent de forma segura
 */
const safeUserAgent = (req: Request) => {
  const header = req.headers['user-agent']
  return Array.isArray(header) ? header.join(',') : header ?? undefined
}

/**
 * Crea un registro de auditoría para acciones de asignaciones
 */
const createAuditLog = async (
  actorId: string | undefined,
  action: string,
  details: Prisma.InputJsonValue | undefined,
  req: Request,
) => {
  if (!actorId) {
    return
  }

  try {
    await prisma.auditLog.create({
      data: {
        userId: actorId,
        action,
        module: ASSIGNMENTS_MODULE,
        details,
        ipAddress: req.ip,
        userAgent: safeUserAgent(req),
      },
    })
  } catch (error) {
    // No fallar la operación principal si el audit log falla
    console.error('[audit] Error al crear log de auditoría:', error)
  }
}

/**
 * Construye filtros para búsqueda de asignaciones
 */
const buildFilters = (
  userId?: string,
  formId?: string,
  isCompleted?: boolean,
): Prisma.FormAssignmentWhereInput => {
  const where: Prisma.FormAssignmentWhereInput = {}

  if (userId) {
    where.userId = userId
  }

  if (formId) {
    where.formId = formId
  }

  if (isCompleted !== undefined) {
    where.isCompleted = isCompleted
  }

  return where
}

/**
 * GET /api/form-assignments
 * Lista asignaciones con paginación y filtros
 */
export const getAssignments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = listAssignmentsQuerySchema.parse(req.query)
    const page = parsed.page ?? 1
    const limit = parsed.limit ?? 10

    const authReq = req as AuthRequest
    const currentUserId = authReq.user?.id
    const isAdmin = authReq.user?.role === 'ADMIN'

    // Si no es admin, solo mostrar sus propias asignaciones
    const effectiveUserId = isAdmin ? parsed.userId : currentUserId

    const where = buildFilters(effectiveUserId, parsed.formId, parsed.isCompleted)

    const [assignments, total] = await prisma.$transaction([
      prisma.formAssignment.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          form: {
            select: {
              id: true,
              title: true,
              description: true,
              status: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      prisma.formAssignment.count({ where }),
    ])

    return res.status(200).json({
      data: assignments.map((assignment) => ({
        id: assignment.id,
        formId: assignment.formId,
        formTitle: assignment.form.title,
        userId: assignment.userId,
        userName: assignment.user.name,
        frequency: assignment.frequency,
        startDate: assignment.startDate.toISOString(),
        endDate: assignment.endDate?.toISOString(),
        isCompleted: assignment.isCompleted,
        createdAt: assignment.createdAt.toISOString(),
        updatedAt: assignment.updatedAt.toISOString(),
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('getAssignments error:', error)
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Parámetros inválidos', details: error.flatten() })
    }
    next(error)
  }
}

/**
 * GET /api/form-assignments/:id
 * Obtiene una asignación por su ID
 */
export const getAssignmentById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const authReq = req as AuthRequest
    const currentUserId = authReq.user?.id
    const isAdmin = authReq.user?.role === 'ADMIN'

    const assignment = await prisma.formAssignment.findUnique({
      where: { id },
      include: {
        form: {
          select: {
            id: true,
            title: true,
            description: true,
            status: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    if (!assignment) {
      return res.status(404).json({ error: 'Asignación no encontrada' })
    }

    // Verificar permisos: solo el usuario asignado o admin puede ver
    if (!isAdmin && assignment.userId !== currentUserId) {
      return res.status(403).json({ error: 'No tienes permisos para ver esta asignación' })
    }

    return res.status(200).json({
      id: assignment.id,
      formId: assignment.formId,
      formTitle: assignment.form.title,
      userId: assignment.userId,
      userName: assignment.user.name,
      frequency: assignment.frequency,
      startDate: assignment.startDate.toISOString(),
      endDate: assignment.endDate?.toISOString(),
      isCompleted: assignment.isCompleted,
      createdAt: assignment.createdAt.toISOString(),
      updatedAt: assignment.updatedAt.toISOString(),
    })
  } catch (error) {
    console.error('getAssignmentById error:', error)
    next(error)
  }
}

/**
 * POST /api/form-assignments
 * Crea una o múltiples asignaciones (una por cada usuario en userIds)
 */
export const createAssignments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = createAssignmentsSchema.parse(req.body)
    const authReq = req as AuthRequest
    const userId = authReq.user?.id

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' })
    }

    // Verificar que el formulario existe y está publicado
    const form = await prisma.form.findUnique({
      where: { id: payload.formId },
      select: { id: true, title: true, status: true },
    })

    if (!form) {
      return res.status(404).json({ error: 'Formulario no encontrado' })
    }

    if (form.status !== FormStatus.PUBLISHED) {
      return res.status(400).json({
        error: 'El formulario debe estar publicado para poder asignarlo',
        details: `El formulario "${form.title}" tiene estado ${form.status}`,
      })
    }

    // Verificar que todos los usuarios existen y están activos
    const users = await prisma.user.findMany({
      where: {
        id: { in: payload.userIds },
        isActive: true,
      },
      select: { id: true, name: true, email: true },
    })

    if (users.length !== payload.userIds.length) {
      const foundIds = new Set(users.map((u) => u.id))
      const missingIds = payload.userIds.filter((id) => !foundIds.has(id))
      return res.status(400).json({
        error: 'Algunos usuarios no existen o no están activos',
        details: `IDs no válidos: ${missingIds.join(', ')}`,
      })
    }

    // Validar fechas
    const startDate = new Date(payload.startDate)
    const endDate = payload.endDate ? new Date(payload.endDate) : null

    if (endDate && endDate <= startDate) {
      return res.status(400).json({
        error: 'La fecha de fin debe ser posterior a la fecha de inicio',
      })
    }

    // Crear asignaciones (una por cada usuario)
    const assignments = await prisma.$transaction(
      payload.userIds.map((userId) =>
        prisma.formAssignment.create({
          data: {
            formId: payload.formId,
            userId,
            frequency: payload.frequency,
            startDate,
            endDate,
            isCompleted: false,
          },
          include: {
            form: {
              select: {
                id: true,
                title: true,
              },
            },
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        }),
      ),
    )

    // Crear audit log
    await createAuditLog(
      userId,
      'ASSIGNMENTS_CREATED',
      {
        count: assignments.length,
        formId: payload.formId,
        formTitle: form.title,
        userIds: payload.userIds,
        frequency: payload.frequency,
        startDate: payload.startDate,
        endDate: payload.endDate,
      },
      req,
    )

    // TODO: Enviar notificaciones a los usuarios asignados
    // await notificationService.sendAssignmentNotifications(assignments)

    return res.status(201).json(
      assignments.map((assignment) => ({
        id: assignment.id,
        formId: assignment.formId,
        formTitle: assignment.form.title,
        userId: assignment.userId,
        userName: assignment.user.name,
        frequency: assignment.frequency,
        startDate: assignment.startDate.toISOString(),
        endDate: assignment.endDate?.toISOString(),
        isCompleted: assignment.isCompleted,
        createdAt: assignment.createdAt.toISOString(),
        updatedAt: assignment.updatedAt.toISOString(),
      })),
    )
  } catch (error) {
    console.error('createAssignments error:', error)
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Datos inválidos', details: error.flatten() })
    }

    // Manejar error de constraint único (misma asignación duplicada)
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return res.status(409).json({
        error: 'Ya existe una asignación con estos parámetros',
        details: 'No se pueden crear asignaciones duplicadas para el mismo formulario, usuario y fecha de inicio',
      })
    }

    next(error)
  }
}

/**
 * PUT /api/form-assignments/:id
 * Actualiza una asignación existente
 */
export const updateAssignment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const payload = updateAssignmentSchema.parse(req.body)
    const authReq = req as AuthRequest
    const userId = authReq.user?.id
    const isAdmin = authReq.user?.role === 'ADMIN'

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' })
    }

    // Buscar asignación existente
    const existingAssignment = await prisma.formAssignment.findUnique({
      where: { id },
      include: {
        form: {
          select: {
            id: true,
            title: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    if (!existingAssignment) {
      return res.status(404).json({ error: 'Asignación no encontrada' })
    }

    // Validar permisos: solo el usuario asignado o admin puede actualizar
    if (!isAdmin && existingAssignment.userId !== userId) {
      return res.status(403).json({ error: 'No tienes permisos para actualizar esta asignación' })
    }

    // Preparar datos de actualización
    const updateData: Prisma.FormAssignmentUpdateInput = {}

    if (payload.frequency !== undefined) {
      updateData.frequency = payload.frequency
    }

    if (payload.startDate !== undefined) {
      updateData.startDate = new Date(payload.startDate)
    }

    if (payload.endDate !== undefined) {
      updateData.endDate = payload.endDate === null ? null : new Date(payload.endDate)
    }

    if (payload.isCompleted !== undefined) {
      updateData.isCompleted = payload.isCompleted
    }

    // Validar fechas si ambas están presentes
    const startDate = payload.startDate ? new Date(payload.startDate) : existingAssignment.startDate
    const endDate =
      payload.endDate !== undefined
        ? payload.endDate === null
          ? null
          : new Date(payload.endDate)
        : existingAssignment.endDate

    if (endDate && endDate <= startDate) {
      return res.status(400).json({
        error: 'La fecha de fin debe ser posterior a la fecha de inicio',
      })
    }

    // Actualizar asignación
    const updatedAssignment = await prisma.formAssignment.update({
      where: { id },
      data: updateData,
      include: {
        form: {
          select: {
            id: true,
            title: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    // Crear audit log
    await createAuditLog(
      userId,
      'ASSIGNMENT_UPDATED',
      {
        assignmentId: updatedAssignment.id,
        formId: updatedAssignment.formId,
        userId: updatedAssignment.userId,
        changes: Object.keys(payload),
      },
      req,
    )

    return res.status(200).json({
      id: updatedAssignment.id,
      formId: updatedAssignment.formId,
      formTitle: updatedAssignment.form.title,
      userId: updatedAssignment.userId,
      userName: updatedAssignment.user.name,
      frequency: updatedAssignment.frequency,
      startDate: updatedAssignment.startDate.toISOString(),
      endDate: updatedAssignment.endDate?.toISOString(),
      isCompleted: updatedAssignment.isCompleted,
      createdAt: updatedAssignment.createdAt.toISOString(),
      updatedAt: updatedAssignment.updatedAt.toISOString(),
    })
  } catch (error) {
    console.error('updateAssignment error:', error)
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Datos inválidos', details: error.flatten() })
    }
    next(error)
  }
}

/**
 * DELETE /api/form-assignments/:id
 * Elimina una asignación
 */
export const deleteAssignment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const authReq = req as AuthRequest
    const userId = authReq.user?.id
    const isAdmin = authReq.user?.role === 'ADMIN'

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' })
    }

    // Buscar asignación existente
    const existingAssignment = await prisma.formAssignment.findUnique({
      where: { id },
      include: {
        form: {
          select: {
            id: true,
            title: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    if (!existingAssignment) {
      return res.status(404).json({ error: 'Asignación no encontrada' })
    }

    // Validar permisos: solo admin o manager puede eliminar asignaciones
    // (El middleware authorize ya valida esto, pero lo dejamos como doble verificación)
    if (!isAdmin && authReq.user?.role !== 'MANAGER') {
      return res.status(403).json({ error: 'Solo los administradores y managers pueden eliminar asignaciones' })
    }

    // Eliminar asignación
    await prisma.formAssignment.delete({
      where: { id },
    })

    // Crear audit log
    await createAuditLog(
      userId,
      'ASSIGNMENT_DELETED',
      {
        assignmentId: existingAssignment.id,
        formId: existingAssignment.formId,
        formTitle: existingAssignment.form.title,
        userId: existingAssignment.userId,
        userName: existingAssignment.user.name,
      },
      req,
    )

    return res.status(200).json({
      message: 'Asignación eliminada correctamente',
      id: existingAssignment.id,
    })
  } catch (error) {
    console.error('deleteAssignment error:', error)
    next(error)
  }
}

/**
 * GET /api/assignments/today
 * Obtiene las asignaciones del día de hoy para el usuario actual
 */
export const getTodayAssignments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest
    const userId = authReq.user?.id

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' })
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const assignments = await prisma.formAssignment.findMany({
      where: {
        userId,
        isCompleted: false,
        OR: [
          {
            startDate: {
              lte: tomorrow,
            },
            endDate: {
              gte: today,
            },
          },
          {
            endDate: null,
            startDate: {
              lte: tomorrow,
            },
          },
        ],
      },
      include: {
        form: {
          select: {
            id: true,
            title: true,
            description: true,
            status: true,
          },
        },
      },
      orderBy: {
        startDate: 'asc',
      },
    })

    const tasks = assignments.map((assignment) => ({
      id: assignment.id,
      formId: assignment.form.id,
      formName: assignment.form.title,
      dueDate: assignment.endDate?.toISOString() || assignment.startDate.toISOString(),
      priority: 'normal' as const,
      status: assignment.isCompleted ? ('completed' as const) : ('pending' as const),
    }))

    const stats = {
      pending: assignments.filter((a) => !a.isCompleted).length,
      completedToday: 0, // Se puede calcular si es necesario
    }

    return res.status(200).json({
      tasks,
      stats,
    })
  } catch (error) {
    console.error('getTodayAssignments error:', error)
    next(error)
  }
}

/**
 * GET /api/assignments/stats
 * Obtiene estadísticas de asignaciones para el usuario actual
 */
export const getAssignmentStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest
    const userId = authReq.user?.id

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' })
    }

    const [pending, completed] = await prisma.$transaction([
      prisma.formAssignment.count({
        where: {
          userId,
          isCompleted: false,
        },
      }),
      prisma.formAssignment.count({
        where: {
          userId,
          isCompleted: true,
        },
      }),
    ])

    return res.status(200).json({
      pending,
      completed,
      notifications: false, // Se puede implementar lógica de notificaciones aquí
    })
  } catch (error) {
    console.error('getAssignmentStats error:', error)
    next(error)
  }
}

/**
 * PUT /api/assignments/:id/complete
 * Marca una asignación como completada
 */
export const markAsCompleted = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const authReq = req as AuthRequest
    const userId = authReq.user?.id

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' })
    }

    // Buscar asignación existente
    const existingAssignment = await prisma.formAssignment.findUnique({
      where: { id },
      include: {
        form: {
          select: {
            id: true,
            title: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    if (!existingAssignment) {
      return res.status(404).json({ error: 'Asignación no encontrada' })
    }

    // Validar permisos: solo el usuario asignado puede marcar como completada
    if (existingAssignment.userId !== userId) {
      return res.status(403).json({
        error: 'Solo puedes marcar como completadas tus propias asignaciones',
      })
    }

    // Verificar que no esté ya completada
    if (existingAssignment.isCompleted) {
      return res.status(400).json({
        error: 'La asignación ya está marcada como completada',
      })
    }

    // Actualizar asignación
    const updatedAssignment = await prisma.formAssignment.update({
      where: { id },
      data: {
        isCompleted: true,
      },
      include: {
        form: {
          select: {
            id: true,
            title: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    // Crear audit log
    await createAuditLog(
      userId,
      'ASSIGNMENT_COMPLETED',
      {
        assignmentId: updatedAssignment.id,
        formId: updatedAssignment.formId,
        formTitle: updatedAssignment.form.title,
      },
      req,
    )

    return res.status(200).json({
      id: updatedAssignment.id,
      formId: updatedAssignment.formId,
      formTitle: updatedAssignment.form.title,
      userId: updatedAssignment.userId,
      userName: updatedAssignment.user.name,
      frequency: updatedAssignment.frequency,
      startDate: updatedAssignment.startDate.toISOString(),
      endDate: updatedAssignment.endDate?.toISOString(),
      isCompleted: updatedAssignment.isCompleted,
      createdAt: updatedAssignment.createdAt.toISOString(),
      updatedAt: updatedAssignment.updatedAt.toISOString(),
    })
  } catch (error) {
    console.error('markAsCompleted error:', error)
    next(error)
  }
}

export default {
  getAssignments,
  getAssignmentById,
  createAssignments,
  updateAssignment,
  deleteAssignment,
  markAsCompleted,
  getTodayAssignments,
  getAssignmentStats,
}

