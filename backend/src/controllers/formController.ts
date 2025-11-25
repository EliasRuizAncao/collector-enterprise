import { Request, Response, NextFunction } from 'express'
import { PrismaClient, Prisma, FormStatus, Role } from '@prisma/client'
import { z } from 'zod'

import { AuthRequest } from '@/middleware/auth'
import {
  createFormSchema,
  updateFormSchema,
  listFormsQuerySchema,
} from '@/validators/formValidator'
import { createAuditLog, AUDIT_MODULES } from '@/utils/auditLog'

const prisma = new PrismaClient()

/**
 * Construye filtros para búsqueda de formularios
 */
const buildFilters = (
  status?: FormStatus,
  search?: string,
  createdById?: string,
): Prisma.FormWhereInput => {
  const where: Prisma.FormWhereInput = {}

  if (status) {
    where.status = status
  }

  if (search && search.trim().length > 0) {
    where.OR = [
      { title: { contains: search.trim(), mode: 'insensitive' } },
      { description: { contains: search.trim(), mode: 'insensitive' } },
    ]
  }

  // Si se proporciona createdById, filtrar por creador
  if (createdById) {
    where.createdById = createdById
  }

  return where
}

/**
 * GET /api/forms
 * Lista formularios con paginación y filtros
 */
export const listForms = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = listFormsQuerySchema.parse(req.query)
    const page = parsed.page ?? 1
    const limit = parsed.limit ?? 10

    // Si el usuario no es ADMIN, solo mostrar sus propios formularios
    const authReq = req as AuthRequest
    const userId = authReq.user?.id
    const isAdmin = authReq.user?.role === Role.ADMIN

    const where = buildFilters(parsed.status, parsed.search, isAdmin ? undefined : userId)

    const [forms, total] = await prisma.$transaction([
      prisma.form.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      prisma.form.count({ where }),
    ])

    return res.status(200).json({
      data: forms.map((form) => ({
        id: form.id,
        title: form.title,
        description: form.description,
        fields: form.fields,
        version: form.version,
        status: form.status,
        createdById: form.createdById,
        createdByName: form.createdBy.name,
        createdAt: form.createdAt.toISOString(),
        updatedAt: form.updatedAt.toISOString(),
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('listForms error:', error)
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Parámetros inválidos', details: error.flatten() })
    }
    next(error)
  }
}

/**
 * GET /api/forms/:id
 * Obtiene un formulario por su ID con todos sus campos
 */
export const getFormById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const authReq = req as AuthRequest
    const userId = authReq.user?.id
    const isAdmin = authReq.user?.role === Role.ADMIN

    const form = await prisma.form.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    if (!form) {
      return res.status(404).json({ error: 'Formulario no encontrado' })
    }

    // Verificar permisos: el creador, admin, o usuarios con asignación activa pueden ver el formulario
    if (!isAdmin && form.createdById !== userId) {
      // Verificar si el usuario tiene una asignación activa para este formulario
      const activeAssignment = await prisma.formAssignment.findFirst({
        where: {
          formId: id,
          userId: userId,
          isCompleted: false,
          startDate: { lte: new Date() },
          OR: [
            { endDate: null },
            { endDate: { gte: new Date() } },
          ],
        },
      })

      if (!activeAssignment) {
        return res.status(403).json({ error: 'No tienes permisos para ver este formulario' })
      }
    }

    return res.status(200).json({
      id: form.id,
      title: form.title,
      description: form.description,
      fields: form.fields,
      version: form.version,
      status: form.status,
      createdById: form.createdById,
      createdByName: form.createdBy.name,
      createdAt: form.createdAt.toISOString(),
      updatedAt: form.updatedAt.toISOString(),
    })
  } catch (error) {
    console.error('getFormById error:', error)
    next(error)
  }
}

/**
 * POST /api/forms
 * Crea un nuevo formulario
 */
export const createForm = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = createFormSchema.parse(req.body)
    const authReq = req as AuthRequest
    const userId = authReq.user?.id

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' })
    }

    // Validar estructura de campos
    if (!Array.isArray(payload.fields)) {
      return res.status(400).json({ error: 'Los campos deben ser un array' })
    }

    // Crear formulario con version 1 y status DRAFT
    const createdForm = await prisma.form.create({
      data: {
        title: payload.title,
        description: payload.description,
        fields: payload.fields as Prisma.InputJsonValue,
        version: 1,
        status: FormStatus.DRAFT,
        createdById: userId,
      },
      include: {
        createdBy: {
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
      action: 'FORM_CREATED',
      module: AUDIT_MODULES.FORMS,
      details: {
        formId: createdForm.id,
        title: createdForm.title,
        fieldsCount: payload.fields.length,
      },
      req,
    })

    return res.status(201).json({
      id: createdForm.id,
      title: createdForm.title,
      description: createdForm.description,
      fields: createdForm.fields,
      version: createdForm.version,
      status: createdForm.status,
      createdById: createdForm.createdById,
      createdByName: createdForm.createdBy.name,
      createdAt: createdForm.createdAt.toISOString(),
      updatedAt: createdForm.updatedAt.toISOString(),
    })
  } catch (error) {
    console.error('createForm error:', error)
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Datos inválidos', details: error.flatten() })
    }
    next(error)
  }
}

/**
 * PUT /api/forms/:id
 * Actualiza un formulario existente
 */
export const updateForm = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const payload = updateFormSchema.parse(req.body)
    const authReq = req as AuthRequest
    const userId = authReq.user?.id
    const isAdmin = authReq.user?.role === Role.ADMIN

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' })
    }

    // Buscar formulario existente
    const existingForm = await prisma.form.findUnique({
      where: { id },
    })

    if (!existingForm) {
      return res.status(404).json({ error: 'Formulario no encontrado' })
    }

    // Validar permisos: solo el creador o admin puede actualizar
    if (!isAdmin && existingForm.createdById !== userId) {
      return res.status(403).json({ error: 'No tienes permisos para actualizar este formulario' })
    }

    // Preparar datos de actualización
    const updateData: Prisma.FormUpdateInput = {}

    if (payload.title !== undefined) {
      updateData.title = payload.title
    }

    if (payload.description !== undefined) {
      updateData.description = payload.description
    }

    if (payload.fields !== undefined) {
      if (!Array.isArray(payload.fields)) {
        return res.status(400).json({ error: 'Los campos deben ser un array' })
      }
      updateData.fields = payload.fields as Prisma.InputJsonValue
    }

    // Incrementar versión si se solicita o si hay cambios en campos
    const shouldIncrementVersion = payload.incrementVersion || payload.fields !== undefined
    if (shouldIncrementVersion) {
      updateData.version = { increment: 1 }
    }

    // Actualizar formulario
    const updatedForm = await prisma.form.update({
      where: { id },
      data: updateData,
      include: {
        createdBy: {
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
      action: 'FORM_UPDATED',
      module: AUDIT_MODULES.FORMS,
      details: {
        formId: updatedForm.id,
        title: updatedForm.title,
        version: updatedForm.version,
        changes: Object.keys(payload),
      },
      req,
    })

    return res.status(200).json({
      id: updatedForm.id,
      title: updatedForm.title,
      description: updatedForm.description,
      fields: updatedForm.fields,
      version: updatedForm.version,
      status: updatedForm.status,
      createdById: updatedForm.createdById,
      createdByName: updatedForm.createdBy.name,
      createdAt: updatedForm.createdAt.toISOString(),
      updatedAt: updatedForm.updatedAt.toISOString(),
    })
  } catch (error) {
    console.error('updateForm error:', error)
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Datos inválidos', details: error.flatten() })
    }
    next(error)
  }
}

/**
 * DELETE /api/forms/:id
 * Elimina un formulario (soft delete: cambia status a ARCHIVED)
 */
export const deleteForm = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const authReq = req as AuthRequest
    const userId = authReq.user?.id
    const isAdmin = authReq.user?.role === Role.ADMIN

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' })
    }

    // Buscar formulario existente
    const existingForm = await prisma.form.findUnique({
      where: { id },
    })

    if (!existingForm) {
      return res.status(404).json({ error: 'Formulario no encontrado' })
    }

    // Validar permisos: solo el creador o admin puede eliminar
    if (!isAdmin && existingForm.createdById !== userId) {
      return res.status(403).json({ error: 'No tienes permisos para eliminar este formulario' })
    }

    // Soft delete: cambiar status a ARCHIVED
    const archivedForm = await prisma.form.update({
      where: { id },
      data: {
        status: FormStatus.ARCHIVED,
      },
      include: {
        createdBy: {
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
      action: 'FORM_DELETED',
      module: AUDIT_MODULES.FORMS,
      details: {
        formId: archivedForm.id,
        title: archivedForm.title,
      },
      req,
    })

    return res.status(200).json({
      id: archivedForm.id,
      title: archivedForm.title,
      description: archivedForm.description,
      fields: archivedForm.fields,
      version: archivedForm.version,
      status: archivedForm.status,
      createdById: archivedForm.createdById,
      createdByName: archivedForm.createdBy.name,
      createdAt: archivedForm.createdAt.toISOString(),
      updatedAt: archivedForm.updatedAt.toISOString(),
    })
  } catch (error) {
    console.error('deleteForm error:', error)
    next(error)
  }
}

/**
 * POST /api/forms/:id/publish
 * Publica un formulario (cambia status a PUBLISHED)
 */
export const publishForm = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const authReq = req as AuthRequest
    const userId = authReq.user?.id
    const isAdmin = authReq.user?.role === Role.ADMIN

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' })
    }

    // Buscar formulario existente
    const existingForm = await prisma.form.findUnique({
      where: { id },
    })

    if (!existingForm) {
      return res.status(404).json({ error: 'Formulario no encontrado' })
    }

    // Validar permisos: solo el creador o admin puede publicar
    if (!isAdmin && existingForm.createdById !== userId) {
      return res.status(403).json({ error: 'No tienes permisos para publicar este formulario' })
    }

    // Validar que tenga al menos 1 campo
    const fields = existingForm.fields as Array<unknown>
    if (!Array.isArray(fields) || fields.length === 0) {
      return res.status(400).json({ error: 'El formulario debe tener al menos un campo para ser publicado' })
    }

    // Cambiar status a PUBLISHED
    const publishedForm = await prisma.form.update({
      where: { id },
      data: {
        status: FormStatus.PUBLISHED,
      },
      include: {
        createdBy: {
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
      action: 'FORM_PUBLISHED',
      module: AUDIT_MODULES.FORMS,
      details: {
        formId: publishedForm.id,
        title: publishedForm.title,
        version: publishedForm.version,
      },
      req,
    })

    return res.status(200).json({
      id: publishedForm.id,
      title: publishedForm.title,
      description: publishedForm.description,
      fields: publishedForm.fields,
      version: publishedForm.version,
      status: publishedForm.status,
      createdById: publishedForm.createdById,
      createdByName: publishedForm.createdBy.name,
      createdAt: publishedForm.createdAt.toISOString(),
      updatedAt: publishedForm.updatedAt.toISOString(),
    })
  } catch (error) {
    console.error('publishForm error:', error)
    next(error)
  }
}

/**
 * POST /api/forms/:id/archive
 * Archiva un formulario (cambia status a ARCHIVED)
 * Similar a delete pero con endpoint separado para claridad
 */
export const archiveForm = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const authReq = req as AuthRequest
    const userId = authReq.user?.id
    const isAdmin = authReq.user?.role === Role.ADMIN

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' })
    }

    // Buscar formulario existente
    const existingForm = await prisma.form.findUnique({
      where: { id },
    })

    if (!existingForm) {
      return res.status(404).json({ error: 'Formulario no encontrado' })
    }

    // Validar permisos: solo el creador o admin puede archivar
    if (!isAdmin && existingForm.createdById !== userId) {
      return res.status(403).json({ error: 'No tienes permisos para archivar este formulario' })
    }

    // Cambiar status a ARCHIVED
    const archivedForm = await prisma.form.update({
      where: { id },
      data: {
        status: FormStatus.ARCHIVED,
      },
      include: {
        createdBy: {
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
      action: 'FORM_ARCHIVED',
      module: AUDIT_MODULES.FORMS,
      details: {
        formId: archivedForm.id,
        title: archivedForm.title,
      },
      req,
    })

    return res.status(200).json({
      id: archivedForm.id,
      title: archivedForm.title,
      description: archivedForm.description,
      fields: archivedForm.fields,
      version: archivedForm.version,
      status: archivedForm.status,
      createdById: archivedForm.createdById,
      createdByName: archivedForm.createdBy.name,
      createdAt: archivedForm.createdAt.toISOString(),
      updatedAt: archivedForm.updatedAt.toISOString(),
    })
  } catch (error) {
    console.error('archiveForm error:', error)
    next(error)
  }
}

export default {
  listForms,
  getFormById,
  createForm,
  updateForm,
  deleteForm,
  publishForm,
  archiveForm,
}
