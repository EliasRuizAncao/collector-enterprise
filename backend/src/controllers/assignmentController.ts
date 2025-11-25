import { Request, Response, NextFunction } from 'express'
import { PrismaClient, Prisma, FormStatus, Role, AssignmentFrequency } from '@prisma/client'
import { z } from 'zod'

import { AuthRequest } from '@/middleware/auth'
import {
  createAssignmentsSchema,
  updateAssignmentSchema,
  listAssignmentsQuerySchema,
} from '@/validators/assignmentValidator'
import { notifyFormAssigned } from '@/services/notificationService'
import { notifyFormCompleted } from '@/services/notificationService'
import { submitResponseSchema } from '@/validators/responseValidator'
import type { Field, FieldType } from '@/types/formBuilder'
import { createAuditLog, AUDIT_MODULES } from '@/utils/auditLog'

const prisma = new PrismaClient()

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
    const isAdmin = authReq.user?.role === Role.ADMIN

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
    const isAdmin = authReq.user?.role === Role.ADMIN

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
    await createAuditLog({
      userId,
      action: 'ASSIGNMENTS_CREATED',
      module: AUDIT_MODULES.ASSIGNMENTS,
      details: {
        count: assignments.length,
        formId: payload.formId,
        formTitle: form.title,
        userIds: payload.userIds,
        frequency: payload.frequency,
        startDate: payload.startDate,
        endDate: payload.endDate,
      },
      req,
    })

    // Notificar a cada usuario sobre su nueva asignación
    // No bloquear la respuesta si alguna notificación falla
    for (const assignment of assignments) {
      notifyFormAssigned(assignment.userId, payload.formId).catch((err) => {
        console.error(
          `[createAssignments] Error al notificar usuario ${assignment.userId}:`,
          err,
        )
        // No fallar la operación principal si la notificación falla
      })
    }

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
    const isAdmin = authReq.user?.role === Role.ADMIN

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
    await createAuditLog({
      userId,
      action: 'ASSIGNMENT_UPDATED',
      module: AUDIT_MODULES.ASSIGNMENTS,
      details: {
        assignmentId: updatedAssignment.id,
        formId: updatedAssignment.formId,
        userId: updatedAssignment.userId,
        changes: Object.keys(payload),
      },
      req,
    })

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
    const isAdmin = authReq.user?.role === Role.ADMIN

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
    if (!isAdmin && authReq.user?.role !== Role.MANAGER) {
      return res.status(403).json({ error: 'Solo los administradores y managers pueden eliminar asignaciones' })
    }

    // Eliminar asignación
    await prisma.formAssignment.delete({
      where: { id },
    })

    // Crear audit log
    await createAuditLog({
      userId,
      action: 'ASSIGNMENT_DELETED',
      module: AUDIT_MODULES.ASSIGNMENTS,
      details: {
        assignmentId: existingAssignment.id,
        formId: existingAssignment.formId,
        formTitle: existingAssignment.form.title,
        userId: existingAssignment.userId,
        userName: existingAssignment.user.name,
      },
      req,
    })

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
 * Valida que los datos de la respuesta cumplan con el schema del formulario
 * (Reutilizada de responseController para mantener consistencia)
 */
const validateResponseData = (
  formFields: Field[],
  responseData: Record<string, unknown>,
): { valid: boolean; errors: string[] } => {
  const errors: string[] = []
  const fieldMap = new Map<string, Field>()

  // Crear mapa de campos por ID
  formFields.forEach((field) => {
    fieldMap.set(field.id, field)
  })

  // Validar que todos los campos requeridos estén presentes
  formFields.forEach((field) => {
    if (field.hidden) return

    if (field.required) {
      const value = responseData[field.id]
      if (Array.isArray(value)) {
        if (value.length === 0) {
          errors.push(`El campo "${field.label}" es obligatorio`)
        }
      } else if (
        !(field.id in responseData) ||
        value === undefined ||
        value === null ||
        value === ''
      ) {
        errors.push(`El campo "${field.label}" es obligatorio`)
      }
    }
  })

  // Validar que todos los valores en responseData correspondan a campos del formulario
  Object.keys(responseData).forEach((fieldId) => {
    const field = fieldMap.get(fieldId)
    if (!field) {
      errors.push(`Campo desconocido: ${fieldId}`)
      return
    }

    if (field.hidden) {
      errors.push(`No se puede enviar un valor para el campo oculto: ${field.label}`)
      return
    }

    const value = responseData[fieldId]
    const fieldType = field.type as FieldType

    // Validaciones básicas por tipo (simplificadas para mantener el código conciso)
    if (
      ['TEXT', 'TEXTAREA', 'EMAIL', 'PHONE', 'URL'].includes(fieldType) &&
      typeof value !== 'string'
    ) {
      errors.push(`El campo "${field.label}" debe ser texto`)
    } else if (fieldType === 'NUMBER' && typeof value !== 'number' && isNaN(Number(value))) {
      errors.push(`El campo "${field.label}" debe ser un número`)
    }
  })

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * POST /api/assignments/:id/submit
 * Envía una respuesta de formulario desde una asignación (usado por mobile)
 */
export const submitAssignmentResponse = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id: assignmentId } = req.params
    const authReq = req as AuthRequest
    const userId = authReq.user?.id

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' })
    }

    // Validar payload (sin formId, se obtiene de la asignación)
    const payloadSchema = submitResponseSchema.omit({ formId: true })
    const validationResult = payloadSchema.safeParse(req.body)

    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Datos de entrada inválidos',
        details: validationResult.error.issues,
      })
    }

    const payload = validationResult.data

    // Validar que los datos no estén vacíos
    if (!payload.data || Object.keys(payload.data).length === 0) {
      return res.status(400).json({
        error: 'Los datos de la respuesta no pueden estar vacíos',
      })
    }

    // Obtener la asignación y validar que pertenece al usuario
    const assignment = await prisma.formAssignment.findUnique({
      where: { id: assignmentId },
      include: {
        form: {
          select: {
            id: true,
            title: true,
            fields: true,
            status: true,
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

    if (!assignment) {
      return res.status(404).json({ error: 'Asignación no encontrada' })
    }

    // Validar que la asignación pertenece al usuario autenticado
    if (assignment.userId !== userId) {
      return res.status(403).json({
        error: 'No tienes permiso para enviar respuestas de esta asignación',
      })
    }

    // Validar que el formulario esté publicado
    if (assignment.form.status !== FormStatus.PUBLISHED) {
      return res.status(400).json({
        error: 'El formulario no está publicado',
        details: `El formulario "${assignment.form.title}" tiene estado ${assignment.form.status}`,
      })
    }

    // Validar que la asignación esté activa
    const now = new Date()
    if (assignment.startDate > now) {
      return res.status(400).json({
        error: 'La asignación aún no ha comenzado',
      })
    }

    if (assignment.endDate && assignment.endDate < now) {
      return res.status(400).json({
        error: 'La asignación ha expirado',
      })
    }

    // Validar estructura de datos contra el schema del formulario
    const formFields = (assignment.form.fields as unknown) as Field[]
    const validation = validateResponseData(formFields, payload.data)

    if (!validation.valid) {
      return res.status(400).json({
        error: 'Los datos de la respuesta no son válidos',
        details: validation.errors,
      })
    }

    // Crear la respuesta
    const response = await prisma.formResponse.create({
      data: {
        formId: assignment.formId,
        userId,
        data: payload.data as Prisma.InputJsonValue,
        latitude: payload.latitude ?? null,
        longitude: payload.longitude ?? null,
      },
    })

    // Si la frecuencia es ONCE, marcar la asignación como completada
    if (assignment.frequency === AssignmentFrequency.ONCE) {
      await prisma.formAssignment.update({
        where: { id: assignmentId },
        data: { isCompleted: true },
      })
    }

    // Crear audit log (no bloqueante)
    void createAuditLog({
      userId,
      action: 'RESPONSE_SUBMITTED',
      module: AUDIT_MODULES.RESPONSES,
      details: {
        responseId: response.id,
        formId: assignment.formId,
        formTitle: assignment.form.title,
        assignmentId,
        hasLocation: !!(payload.latitude && payload.longitude),
      },
      req,
    }).catch((err) => {
      console.error('[submitAssignmentResponse] Error al crear audit log (no crítico):', err)
    })

    // Notificar a supervisores sobre la respuesta completada
    try {
      const supervisors = await prisma.user.findMany({
        where: {
          role: { in: [Role.MANAGER, Role.SUPERVISOR] },
          isActive: true,
        },
        select: { id: true },
      })

      // Notificar a cada supervisor (no bloquear si falla)
      for (const supervisor of supervisors) {
        notifyFormCompleted(supervisor.id, userId, assignment.formId).catch((err) => {
          console.error(
            `[submitAssignmentResponse] Error al notificar supervisor ${supervisor.id}:`,
            err,
          )
        })
      }
    } catch (err) {
      console.error('[submitAssignmentResponse] Error al buscar supervisores para notificar:', err)
    }

    return res.status(201).json({
      id: response.id,
      formId: response.formId,
      formTitle: assignment.form.title,
      submittedAt: response.submittedAt.toISOString(),
      message: 'Respuesta enviada correctamente',
    })
  } catch (error) {
    console.error('submitAssignmentResponse error:', error)
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Datos inválidos', details: error.flatten() })
    }
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
    await createAuditLog({
      userId,
      action: 'ASSIGNMENT_COMPLETED',
      module: AUDIT_MODULES.ASSIGNMENTS,
      details: {
        assignmentId: updatedAssignment.id,
        formId: updatedAssignment.formId,
        formTitle: updatedAssignment.form.title,
      },
      req,
    })

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
  submitAssignmentResponse,
}

